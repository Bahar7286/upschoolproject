import os

# Test DB — entegrasyon / test_api (unit testleri test_unit.db kullanır)
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./test_historial_go.db'
os.environ['ENVIRONMENT'] = 'development'
os.environ['TESTING'] = '1'

import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.bootstrap import seed_initial_data
from app.db.connection import Base, get_db
from app.main import app

TEST_DATABASE_URL = os.environ['DATABASE_URL']


@pytest.fixture(scope='function')
def client() -> TestClient:
    """Her test için izole şema + seed."""
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
    test_session_local = async_sessionmaker(bind=test_engine, expire_on_commit=False, class_=AsyncSession)

    async def override_get_db():
        async with test_session_local() as session:
            yield session

    async def setup() -> None:
        async with test_engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
            await connection.run_sync(Base.metadata.create_all)
        async with test_session_local() as session:
            await seed_initial_data(session)

    asyncio.run(setup())

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    asyncio.run(test_engine.dispose())
