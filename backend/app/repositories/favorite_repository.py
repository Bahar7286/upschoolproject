from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.favorite_model import Favorite
from app.repositories.base import BaseRepository


class FavoriteRepository(BaseRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_by_user(self, user_id: int) -> list[Favorite]:
        result = await self.db.execute(
            select(Favorite)
            .where(Favorite.user_id == user_id)
            .order_by(Favorite.created_at.desc())
        )
        return list(result.scalars().all())

    async def exists(self, *, user_id: int, entity_type: str, entity_id: int) -> bool:
        result = await self.db.execute(
            select(Favorite.favorite_id).where(
                Favorite.user_id == user_id,
                Favorite.entity_type == entity_type,
                Favorite.entity_id == entity_id,
            )
        )
        return result.first() is not None

    async def create(self, favorite: Favorite) -> Favorite:
        self.db.add(favorite)
        return await self._commit_refresh(favorite)

    async def delete_one(self, *, user_id: int, entity_type: str, entity_id: int) -> bool:
        result = await self.db.execute(
            select(Favorite).where(
                Favorite.user_id == user_id,
                Favorite.entity_type == entity_type,
                Favorite.entity_id == entity_id,
            )
        )
        fav = result.scalars().first()
        if not fav:
            return False
        await self.db.delete(fav)
        await self.db.commit()
        return True

