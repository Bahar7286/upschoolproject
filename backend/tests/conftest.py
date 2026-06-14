import os

# Test DB — entegrasyon / test_api (unit testleri test_unit.db kullanır)
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./test_historial_go.db'
os.environ['ENVIRONMENT'] = 'development'
os.environ['TESTING'] = '1'

import asyncio
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.db.bootstrap import seed_full_geo_data, seed_minimal_data
from app.db.connection import Base, get_db
from app.main import app

TEST_DATABASE_URL = os.environ['DATABASE_URL']


@pytest.fixture(scope='session')
def integration_engine() -> Iterator[AsyncEngine]:
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)

    async def init_schema() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    asyncio.run(init_schema())
    yield engine
    asyncio.run(engine.dispose())


def _make_client(engine: AsyncEngine, *, full_geo: bool = False) -> Iterator[TestClient]:
    session_local = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

    async def override_get_db():
        async with session_local() as session:
            yield session

    async def setup() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
            await connection.run_sync(Base.metadata.create_all)
        async with session_local() as session:
            await seed_minimal_data(session)
            if full_geo:
                await seed_full_geo_data(session)

    asyncio.run(setup())

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope='function')
def client(integration_engine: AsyncEngine) -> Iterator[TestClient]:
    """Her test için izole şema + minimal seed (geo bulk yok)."""
    yield from _make_client(integration_engine, full_geo=False)


@pytest.fixture(scope='function')
def client_full_geo(integration_engine: AsyncEngine) -> Iterator[TestClient]:
    """81 il / ilçe geo testleri için tam geo seed."""
    yield from _make_client(integration_engine, full_geo=True)
