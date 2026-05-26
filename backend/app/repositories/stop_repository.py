from sqlalchemy import select

from app.models.stop_model import Stop
from app.repositories.base import BaseRepository, apply_update


class StopRepository(BaseRepository):
    async def list_by_route(self, route_id: int) -> list[Stop]:
        result = await self.db.execute(
            select(Stop)
            .where(Stop.route_id == route_id)
            .order_by(Stop.order_index.asc(), Stop.stop_id.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, stop_id: int) -> Stop | None:
        return await self.db.get(Stop, stop_id)

    async def get_for_route(self, route_id: int, stop_id: int) -> Stop | None:
        stop = await self.get_by_id(stop_id)
        if not stop or stop.route_id != route_id:
            return None
        return stop

    async def create(self, stop: Stop) -> Stop:
        self.db.add(stop)
        return await self._commit_refresh(stop)

    async def save(self, stop: Stop) -> Stop:
        return await self._commit_refresh(stop)

    async def update_fields(self, stop: Stop, data: dict) -> Stop:
        apply_update(stop, data)
        return await self.save(stop)

    async def delete(self, stop: Stop) -> None:
        await self.db.delete(stop)
        await self.db.commit()
