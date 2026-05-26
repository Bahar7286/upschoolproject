import os
from collections.abc import AsyncGenerator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# backend/.env dosyasını yükle (uvicorn backend klasöründen çalıştırılmalı)
load_dotenv(Path(__file__).resolve().parents[2] / '.env')


class Base(DeclarativeBase):
    pass


def _normalize_database_url(url: str) -> str:
    if url.startswith('postgres://'):
        return url.replace('postgres://', 'postgresql+asyncpg://', 1)
    if url.startswith('postgresql://') and '+asyncpg' not in url:
        return url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    return url


DATABASE_URL = _normalize_database_url(
    os.getenv('DATABASE_URL', 'sqlite+aiosqlite:///./historial_go.db')
)

_engine_kwargs: dict = {'echo': False, 'future': True}
if DATABASE_URL.startswith('postgresql'):
    _engine_kwargs['pool_pre_ping'] = True

engine = create_async_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
