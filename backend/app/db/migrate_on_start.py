"""Deploy-time Alembic: fresh DB upgrade, or heal legacy / drifted schema then upgrade."""

from __future__ import annotations

import asyncio
import subprocess
import sys

from sqlalchemy import text

from app.db.connection import engine

REVISION_BASELINE = 'b03b7a457a90'
REVISION_LIFECYCLE = 'cea7936f46e5'
REVISION_PREFERRED_CITY = 'd4e8f1a2b3c4'
REVISION_IMAGES = 'e7f8a9b0c1d2'
REVISION_PLACE_VISITS = 'f2b3c4d5e6a7'
HEAD_REVISION = 'g3c4d5e6a7b8'


async def _table_exists(name: str) -> bool:
    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                'SELECT EXISTS ('
                'SELECT 1 FROM information_schema.tables '
                "WHERE table_schema = 'public' AND table_name = :name"
                ')'
            ),
            {'name': name},
        )
        return bool(result.scalar())


async def _column_exists(table: str, column: str) -> bool:
    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                'SELECT EXISTS ('
                'SELECT 1 FROM information_schema.columns '
                "WHERE table_schema = 'public' AND table_name = :t AND column_name = :c"
                ')'
            ),
            {'t': table, 'c': column},
        )
        return bool(result.scalar())


async def _current_revision() -> str | None:
    if not await _table_exists('alembic_version'):
        return None
    async with engine.connect() as conn:
        row = (await conn.execute(text('SELECT version_num FROM alembic_version LIMIT 1'))).fetchone()
        return str(row[0]) if row else None


def _run_alembic(*args: str) -> int:
    from pathlib import Path

    ini = Path('/app/alembic.ini') if Path('/app/alembic.ini').is_file() else Path('alembic.ini')
    return subprocess.call([sys.executable, '-m', 'alembic', '-c', str(ini), *args])


async def _stamp_for_legacy_schema() -> None:
    """Match alembic_version to columns that already exist — never skip lifecycle DDL."""
    if await _column_exists('cities', 'image_url'):
        if await _table_exists('premium_requests'):
            print(f'Legacy schema at head; stamping {HEAD_REVISION}…', flush=True)
            _run_alembic('stamp', HEAD_REVISION)
        elif await _table_exists('place_visits'):
            print(f'Legacy schema with place_visits; stamping {REVISION_PLACE_VISITS}…', flush=True)
            _run_alembic('stamp', REVISION_PLACE_VISITS)
        else:
            print(f'Legacy schema with image_url; stamping {REVISION_IMAGES}…', flush=True)
            _run_alembic('stamp', REVISION_IMAGES)
        return

    if await _column_exists('users', 'preferred_city') and await _column_exists('routes', 'status'):
        print(f'Legacy schema with preferred_city; stamping {REVISION_PREFERRED_CITY}…', flush=True)
        _run_alembic('stamp', REVISION_PREFERRED_CITY)
        return

    if await _column_exists('routes', 'status'):
        print(f'Legacy schema with routes.status; stamping {REVISION_LIFECYCLE}…', flush=True)
        _run_alembic('stamp', REVISION_LIFECYCLE)
        return

    print(
        f'Legacy schema without routes.status; stamping {REVISION_BASELINE} then upgrading…',
        flush=True,
    )
    _run_alembic('stamp', REVISION_BASELINE)


_REPAIR_ROUTES_LIFECYCLE_SQL = (
    "ALTER TABLE routes ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'published'",
    "ALTER TABLE routes ADD COLUMN IF NOT EXISTS seo_description TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE routes ADD COLUMN IF NOT EXISTS moderation_note TEXT NOT NULL DEFAULT ''",
    'ALTER TABLE routes ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP',
    'ALTER TABLE routes ADD COLUMN IF NOT EXISTS published_at TIMESTAMP',
    'CREATE INDEX IF NOT EXISTS ix_routes_status ON routes (status)',
)


async def _repair_routes_lifecycle_columns() -> None:
    """Fix drift without re-running lifecycle migration (avoids duplicate-table crash)."""
    if await _column_exists('routes', 'status'):
        return
    if not await _table_exists('routes'):
        return

    current = await _current_revision()
    if 'postgresql' not in str(engine.url):
        print(
            f'DRIFT: routes.status missing (alembic={current or "none"}); '
            f'running alembic upgrade on non-Postgres…',
            flush=True,
        )
        _run_alembic('stamp', REVISION_BASELINE)
        _run_alembic('upgrade', 'head')
        return

    print(
        f'DRIFT: routes.status missing (alembic={current or "none"}); repairing via SQL…',
        flush=True,
    )
    async with engine.begin() as conn:
        for stmt in _REPAIR_ROUTES_LIFECYCLE_SQL:
            await conn.execute(text(stmt))
    print('routes lifecycle columns repaired.', flush=True)


async def _heal_schema_drift() -> None:
    """Align alembic_version when columns exist from create_all or partial upgrades."""
    has_cities = await _table_exists('cities')
    if not has_cities:
        return

    current = await _current_revision()

    if current is None:
        await _stamp_for_legacy_schema()
        return

    if await _column_exists('users', 'preferred_city') and await _column_exists('routes', 'status'):
        if current == REVISION_LIFECYCLE:
            print(f'preferred_city exists; stamping {REVISION_PREFERRED_CITY}…', flush=True)
            _run_alembic('stamp', REVISION_PREFERRED_CITY)
            current = REVISION_PREFERRED_CITY

    if await _column_exists('cities', 'image_url'):
        if current in (REVISION_LIFECYCLE, REVISION_PREFERRED_CITY):
            print(f'image_url exists; stamping {REVISION_IMAGES}…', flush=True)
            _run_alembic('stamp', REVISION_IMAGES)
            current = REVISION_IMAGES

        if current == REVISION_IMAGES and await _table_exists('place_visits'):
            print(f'place_visits exists; stamping {REVISION_PLACE_VISITS}…', flush=True)
            _run_alembic('stamp', REVISION_PLACE_VISITS)

        if current == REVISION_PLACE_VISITS and await _table_exists('premium_requests'):
            print(f'premium_requests exists; stamping {HEAD_REVISION}…', flush=True)
            _run_alembic('stamp', HEAD_REVISION)


async def _ensure_image_columns() -> None:
    """If alembic_version is at head but e7f8 DDL never ran, re-run upgrade from d4e8."""
    if await _column_exists('cities', 'image_url'):
        return
    current = await _current_revision()
    if current not in (REVISION_IMAGES, REVISION_PLACE_VISITS, HEAD_REVISION):
        return
    print(
        f'Alembic at {current} but image_url missing; '
        f're-stamping {REVISION_PREFERRED_CITY} and upgrading…',
        flush=True,
    )
    _run_alembic('stamp', REVISION_PREFERRED_CITY)
    _run_alembic('upgrade', 'head')


async def ensure_migrations() -> int:
    has_cities = await _table_exists('cities')
    has_alembic = await _table_exists('alembic_version')

    if has_cities and not has_alembic:
        print('Legacy schema detected (cities exists, no alembic_version).', flush=True)
        await _stamp_for_legacy_schema()

    await _repair_routes_lifecycle_columns()
    await _heal_schema_drift()

    print('Running alembic upgrade head…', flush=True)
    code = _run_alembic('upgrade', 'head')
    if code != 0:
        print(f'alembic upgrade head failed with exit code {code}', flush=True)
        return code

    await _repair_routes_lifecycle_columns()
    await _ensure_image_columns()

    final = await _current_revision()
    print(f'Alembic at revision: {final or "unknown"}', flush=True)
    return 0


def main() -> None:
    raise SystemExit(asyncio.run(ensure_migrations()))


if __name__ == '__main__':
    main()
