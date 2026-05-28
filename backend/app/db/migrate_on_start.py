"""Deploy-time Alembic: fresh DB upgrade, or stamp legacy schema then upgrade."""

from __future__ import annotations

import asyncio
import subprocess
import sys

from sqlalchemy import text

from app.db.connection import engine

# Last revision before preferred_city; matches partial / create_all legacy DBs.
LEGACY_STAMP_REVISION = 'cea7936f46e5'


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


def _run_alembic(*args: str) -> int:
    from pathlib import Path

    ini = Path('/app/alembic.ini') if Path('/app/alembic.ini').is_file() else Path('alembic.ini')
    return subprocess.call([sys.executable, '-m', 'alembic', '-c', str(ini), *args])


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

    print('Running alembic upgrade head…', flush=True)
    code = _run_alembic('upgrade', 'head')
    if code != 0 and has_cities:
        print('Retry after stamp…', flush=True)
        _run_alembic('stamp', LEGACY_STAMP_REVISION)
        code = _run_alembic('upgrade', 'head')
    return code


def main() -> None:
    raise SystemExit(asyncio.run(ensure_migrations()))


if __name__ == '__main__':
    main()
