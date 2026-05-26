from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession


class BaseRepository:
    """Tüm repository'ler için ortak oturum."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _commit_refresh(self, entity: Any) -> Any:
        await self.db.commit()
        await self.db.refresh(entity)
        return entity


def apply_update(entity: Any, data: dict[str, Any]) -> None:
    """Kısmi güncelleme — yalnızca gönderilen alanları yazar."""
    for key, value in data.items():
        setattr(entity, key, value)
