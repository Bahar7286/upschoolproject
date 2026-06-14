import os
import subprocess
import sys
from pathlib import Path

# Entegrasyon testleri ile aynı SQLite dosyasını paylaşmayın (drop_all çakışması).
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./test_unit.db'
os.environ['ENVIRONMENT'] = 'development'
os.environ['TESTING'] = '1'

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.bootstrap import seed_minimal_data

TEST_DATABASE_URL = os.environ['DATABASE_URL']
_BACKEND_ROOT = Path(__file__).resolve().parents[2]


def _migrate_test_db() -> None:
    db_path = _BACKEND_ROOT / 'test_unit.db'
    if db_path.exists():
        db_path.unlink()
    subprocess.run(
        [sys.executable, '-m', 'alembic', 'upgrade', 'head'],
        cwd=_BACKEND_ROOT,
        env={**os.environ, 'DATABASE_URL': TEST_DATABASE_URL},
        check=True,
        capture_output=True,
    )


@pytest.fixture
async def db_session() -> AsyncSession:
    _migrate_test_db()
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    async with session_factory() as session:
        await seed_minimal_data(session)
        yield session

    await engine.dispose()
