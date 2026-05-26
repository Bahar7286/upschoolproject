from sqlalchemy import func, select

from app.models.trip_request_model import TripRequest
from app.repositories.base import BaseRepository


class TripRequestRepository(BaseRepository):
    async def get_by_id(self, request_id: int) -> TripRequest | None:
        return await self.db.get(TripRequest, request_id)

    async def list_by_tourist(self, tourist_id: int) -> list[TripRequest]:
        result = await self.db.execute(
            select(TripRequest)
            .where(TripRequest.tourist_id == tourist_id)
            .order_by(TripRequest.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_open(self, *, city: str | None = None, limit: int = 50) -> list[TripRequest]:
        stmt = (
            select(TripRequest)
            .where(TripRequest.status == 'open')
            .order_by(TripRequest.created_at.desc())
            .limit(limit)
        )
        if city:
            stmt = stmt.where(func.lower(TripRequest.city) == city.lower())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, request: TripRequest) -> TripRequest:
        self.db.add(request)
        return await self._commit_refresh(request)

    async def save(self, request: TripRequest) -> TripRequest:
        return await self._commit_refresh(request)
