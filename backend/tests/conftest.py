import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.connection import Base, get_db
from app.main import app


@pytest.fixture
def client() -> TestClient:
    test_database_url = 'sqlite+aiosqlite:///./test_historial_go.db'
    os.environ['DATABASE_URL'] = test_database_url

    test_engine = create_async_engine(test_database_url, echo=False, future=True)
    test_session_local = async_sessionmaker(bind=test_engine, expire_on_commit=False, class_=AsyncSession)

    async def override_get_db():
        async with test_session_local() as session:
            yield session

    async def setup() -> None:
        async with test_engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
            await connection.run_sync(Base.metadata.create_all)

    import asyncio

    asyncio.run(setup())

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
