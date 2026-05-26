import os

# Entegrasyon testleri ile aynı SQLite dosyasını paylaşmayın (drop_all çakışması).
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./test_unit.db'

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.bootstrap import seed_initial_data
from app.db.connection import Base

TEST_DATABASE_URL = os.environ['DATABASE_URL']


@pytest.fixture
async def db_session() -> AsyncSession:
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        await seed_initial_data(session)
        yield session

    await engine.dispose()
