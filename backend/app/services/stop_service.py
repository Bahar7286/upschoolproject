from app.core.exceptions import RouteNotFoundError, StopNotFoundError
from app.models.stop_model import Stop
from app.repositories.route_repository import RouteRepository
from app.repositories.stop_repository import StopRepository
from app.schemas.stop_schema import StopCreate, StopResponse, StopUpdate


class StopService:
    def __init__(self, stop_repository: StopRepository, route_repository: RouteRepository) -> None:
        self.stops = stop_repository
        self.routes = route_repository

    async def route_exists(self, route_id: int) -> bool:
        return await self.routes.get_by_id(route_id) is not None

    async def list_stops(self, route_id: int) -> list[StopResponse]:
        if not await self.route_exists(route_id):
            raise RouteNotFoundError(route_id)
        stops = await self.stops.list_by_route(route_id)
        return [StopResponse.model_validate(s) for s in stops]

    async def get_stop(self, route_id: int, stop_id: int) -> StopResponse:
        stop = await self.stops.get_for_route(route_id, stop_id)
        if not stop:
            raise StopNotFoundError(stop_id, route_id)
        return StopResponse.model_validate(stop)

    async def create_stop(self, route_id: int, payload: StopCreate) -> StopResponse:
        if not await self.route_exists(route_id):
            raise RouteNotFoundError(route_id)

        stop = Stop(
            route_id=route_id,
            title=payload.title,
            description=payload.description,
            latitude=payload.latitude,
            longitude=payload.longitude,
            order_index=payload.order_index,
            audio_url=payload.audio_url,
        )
        created = await self.stops.create(stop)
        return StopResponse.model_validate(created)

    async def update_stop(self, route_id: int, stop_id: int, payload: StopUpdate) -> StopResponse:
        stop = await self.stops.get_for_route(route_id, stop_id)
        if not stop:
            raise StopNotFoundError(stop_id, route_id)

        data = payload.model_dump(exclude_unset=True)
        if not data:
            return StopResponse.model_validate(stop)

        updated = await self.stops.update_fields(stop, data)
        return StopResponse.model_validate(updated)

    async def delete_stop(self, route_id: int, stop_id: int) -> None:
        stop = await self.stops.get_for_route(route_id, stop_id)
        if not stop:
            raise StopNotFoundError(stop_id, route_id)
        await self.stops.delete(stop)
