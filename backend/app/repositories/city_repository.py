from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.city_model import City
from app.repositories.base import BaseRepository


class CityRepository(BaseRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_all(self) -> list[City]:
        result = await self.db.execute(select(City).order_by(City.plate_code.asc()))
        return list(result.scalars().all())

    async def get_by_id(self, city_id: int) -> City | None:
        return await self.db.get(City, city_id)

