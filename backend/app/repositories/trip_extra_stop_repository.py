from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trip_extra_stop_model import TripExtraStop
from app.repositories.base import BaseRepository


class TripExtraStopRepository(BaseRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_for_user_route(self, user_id: int, route_id: int) -> list[TripExtraStop]:
        stmt = (
            select(TripExtraStop)
            .where(TripExtraStop.user_id == user_id, TripExtraStop.route_id == route_id)
            .order_by(TripExtraStop.order_index.asc(), TripExtraStop.extra_stop_id.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_for_user(self, user_id: int, route_id: int, extra_stop_id: int) -> TripExtraStop | None:
        stmt = select(TripExtraStop).where(
            TripExtraStop.user_id == user_id,
            TripExtraStop.route_id == route_id,
            TripExtraStop.extra_stop_id == extra_stop_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def max_order_index(self, user_id: int, route_id: int) -> int:
        rows = await self.list_for_user_route(user_id, route_id)
        if not rows:
            return 0
        return max(r.order_index for r in rows)

    async def create(self, row: TripExtraStop) -> TripExtraStop:
        self.db.add(row)
        await self.db.flush()
        await self.db.refresh(row)
        return row

    async def delete(self, row: TripExtraStop) -> None:
        await self.db.delete(row)
        await self.db.flush()

    async def delete_all_for_route(self, user_id: int, route_id: int) -> int:
        stmt = delete(TripExtraStop).where(
            TripExtraStop.user_id == user_id,
            TripExtraStop.route_id == route_id,
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return int(result.rowcount or 0)
