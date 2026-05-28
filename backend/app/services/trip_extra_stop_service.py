from app.core.exceptions import RouteNotFoundError
from app.models.trip_extra_stop_model import TripExtraStop
from app.repositories.route_repository import RouteRepository
from app.repositories.stop_repository import StopRepository
from app.repositories.trip_extra_stop_repository import TripExtraStopRepository
from app.schemas.trip_extra_stop_schema import TripExtraStopCreate, TripExtraStopResponse
from app.services.route_access_service import RouteAccessService


class TripExtraStopService:
    def __init__(
        self,
        extra_repo: TripExtraStopRepository,
        route_repo: RouteRepository,
        stop_repo: StopRepository,
        access: RouteAccessService,
    ) -> None:
        self.extras = extra_repo
        self.routes = route_repo
        self.stops = stop_repo
        self.access = access

    async def _compute_order_index(
        self,
        route_id: int,
        user_id: int,
        insert_after: int | None,
    ) -> int:
        base_stops = await self.stops.list_by_route(route_id)
        extras = await self.extras.list_for_user_route(user_id, route_id)
        all_orders = [s.order_index for s in base_stops] + [e.order_index for e in extras]
        if insert_after is None:
            return (max(all_orders) if all_orders else 0) + 100
        higher = [o for o in all_orders if o > insert_after]
        if not higher:
            return insert_after + 100
        next_order = min(higher)
        gap = next_order - insert_after
        if gap > 1:
            return insert_after + gap // 2
        return insert_after + 1

    async def list_mine(self, user_id: int, route_id: int) -> list[TripExtraStopResponse]:
        if not await self.routes.get_by_id(route_id):
            raise RouteNotFoundError(route_id)
        if not await self.access.has_full_route_access(user_id, route_id):
            return []
        rows = await self.extras.list_for_user_route(user_id, route_id)
        return [TripExtraStopResponse.model_validate(r) for r in rows]

    async def add_stop(
        self,
        user_id: int,
        route_id: int,
        payload: TripExtraStopCreate,
    ) -> TripExtraStopResponse:
        if not await self.routes.get_by_id(route_id):
            raise RouteNotFoundError(route_id)
        if not await self.access.has_full_route_access(user_id, route_id):
            raise PermissionError('Bu rotaya durak eklemek için erişiminiz yok')

        order_index = await self._compute_order_index(
            route_id,
            user_id,
            payload.insert_after_order_index,
        )
        row = TripExtraStop(
            user_id=user_id,
            route_id=route_id,
            title=payload.title,
            description=payload.description,
            latitude=payload.latitude,
            longitude=payload.longitude,
            order_index=order_index,
            place_id=payload.place_id,
            google_place_id=payload.google_place_id,
        )
        created = await self.extras.create(row)
        await self.extras._commit_refresh(created)
        return TripExtraStopResponse.model_validate(created)

    async def remove_stop(self, user_id: int, route_id: int, extra_stop_id: int) -> None:
        row = await self.extras.get_for_user(user_id, route_id, extra_stop_id)
        if not row:
            return
        await self.extras.delete(row)
        await self.extras.db.commit()
