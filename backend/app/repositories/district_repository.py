from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.district_model import District
from app.repositories.base import BaseRepository


class DistrictRepository(BaseRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_by_city_id(self, city_id: int) -> list[District]:
        result = await self.db.execute(
            select(District).where(District.city_id == city_id).order_by(District.name_tr.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, district_id: int) -> District | None:
        return await self.db.get(District, district_id)

