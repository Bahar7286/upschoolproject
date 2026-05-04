from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.route_model import Route
from app.models.stop_model import Stop
from app.schemas.stop_schema import StopCreate, StopResponse, StopUpdate


class StopService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def route_exists(self, route_id: int) -> bool:
        route = await self.db.get(Route, route_id)
        return route is not None

    async def list_stops(self, route_id: int) -> list[StopResponse]:
        result = await self.db.execute(
            select(Stop)
            .where(Stop.route_id == route_id)
            .order_by(Stop.order_index.asc(), Stop.stop_id.asc()),
        )
        return [StopResponse.model_validate(s) for s in result.scalars().all()]

    async def get_stop(self, route_id: int, stop_id: int) -> StopResponse | None:
        stop = await self.db.get(Stop, stop_id)
        if not stop or stop.route_id != route_id:
            return None
        return StopResponse.model_validate(stop)

    async def create_stop(self, route_id: int, payload: StopCreate) -> StopResponse | None:
        if not await self.route_exists(route_id):
            return None

        stop = Stop(
            route_id=route_id,
            title=payload.title,
            description=payload.description,
            latitude=payload.latitude,
            longitude=payload.longitude,
            order_index=payload.order_index,
            audio_url=payload.audio_url,
        )
        self.db.add(stop)
        await self.db.commit()
        await self.db.refresh(stop)
        return StopResponse.model_validate(stop)

    async def update_stop(self, route_id: int, stop_id: int, payload: StopUpdate) -> StopResponse | None:
        stop = await self.db.get(Stop, stop_id)
        if not stop or stop.route_id != route_id:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return StopResponse.model_validate(stop)

        if 'title' in update_data:
            stop.title = update_data['title']
        if 'description' in update_data:
            stop.description = update_data['description']
        if 'latitude' in update_data:
            stop.latitude = update_data['latitude']
        if 'longitude' in update_data:
            stop.longitude = update_data['longitude']
        if 'order_index' in update_data:
            stop.order_index = update_data['order_index']
        if 'audio_url' in update_data:
            stop.audio_url = update_data['audio_url']

        await self.db.commit()
        await self.db.refresh(stop)
        return StopResponse.model_validate(stop)

    async def delete_stop(self, route_id: int, stop_id: int) -> bool:
        stop = await self.db.get(Stop, stop_id)
        if not stop or stop.route_id != route_id:
            return False

        await self.db.delete(stop)
        await self.db.commit()
        return True
