"""Deploy-time Alembic: fresh DB upgrade, or heal legacy / drifted schema then upgrade."""

from __future__ import annotations

import asyncio
import subprocess
import sys

from sqlalchemy import text

from app.db.connection import engine

# Last revision before preferred_city; matches partial / create_all legacy DBs.
LEGACY_STAMP_REVISION = 'cea7936f46e5'
REVISION_PREFERRED_CITY = 'd4e8f1a2b3c4'
REVISION_IMAGES = 'e7f8a9b0c1d2'
HEAD_REVISION = REVISION_IMAGES


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


async def _heal_schema_drift() -> None:
    """Align alembic_version when columns exist from create_all or partial upgrades."""
    has_cities = await _table_exists('cities')
    if not has_cities:
        return

    current = await _current_revision()

    if current is None:
        print(f'No alembic_version; stamping {LEGACY_STAMP_REVISION}…', flush=True)
        _run_alembic('stamp', LEGACY_STAMP_REVISION)
        current = LEGACY_STAMP_REVISION

    if await _column_exists('users', 'preferred_city'):
        if current in (None, LEGACY_STAMP_REVISION):
            print(
                f'preferred_city already exists; stamping {REVISION_PREFERRED_CITY}…',
                flush=True,
            )
            _run_alembic('stamp', REVISION_PREFERRED_CITY)
            current = REVISION_PREFERRED_CITY

    # Only stamp images revision when columns exist (trip_extra_stops alone is not enough).
    if await _column_exists('cities', 'image_url'):
        if current in (None, LEGACY_STAMP_REVISION, REVISION_PREFERRED_CITY):
            print(f'image_url columns exist; stamping {REVISION_IMAGES}…', flush=True)
            _run_alembic('stamp', REVISION_IMAGES)


async def _ensure_image_columns() -> None:
    """If alembic_version is at head but e7f8 DDL never ran, re-run upgrade from d4e8."""
    if await _column_exists('cities', 'image_url'):
        return
    current = await _current_revision()
    if current != REVISION_IMAGES:
        return
    print(
        f'Alembic at {REVISION_IMAGES} but image_url missing; '
        f're-stamping {REVISION_PREFERRED_CITY} and upgrading…',
        flush=True,
    )
    _run_alembic('stamp', REVISION_PREFERRED_CITY)
    _run_alembic('upgrade', 'head')


async def ensure_migrations() -> int:
    has_cities = await _table_exists('cities')
    has_alembic = await _table_exists('alembic_version')

    if has_cities and not has_alembic:
        print(
            f'Legacy schema detected (cities exists, no alembic_version). '
            f'Stamping {LEGACY_STAMP_REVISION}…',
            flush=True,
        )
        if _run_alembic('stamp', LEGACY_STAMP_REVISION) != 0:
            return 1

    await _heal_schema_drift()

    print('Running alembic upgrade head…', flush=True)
    code = _run_alembic('upgrade', 'head')
    if code != 0:
        print(f'alembic upgrade head failed with exit code {code}', flush=True)
        return code

    await _ensure_image_columns()

    final = await _current_revision()
    print(f'Alembic at revision: {final or "unknown"}', flush=True)
    return 0


def main() -> None:
    raise SystemExit(asyncio.run(ensure_migrations()))


if __name__ == '__main__':
    main()
