from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.stop_schema import StopResponse


class RouteAccessService:
    def __init__(
        self,
        purchase_repository: PurchaseRepository,
        route_repository: RouteRepository,
        user_repository: UserRepository,
    ) -> None:
        self.purchases = purchase_repository
        self.routes = route_repository
        self.users = user_repository

    async def has_full_route_access(self, user_id: int | None, route_id: int) -> bool:
        route = await self.routes.get_by_id(route_id)
        if route is None:
            return False
        if route.price is not None and route.price <= 0:
            return True
        if user_id is None:
            return False
        user = await self.users.get_by_id(user_id)
        if user is None:
            return False
        if user.role == 'admin':
            return True
        if user.role == 'guide' and route.guide_id == user_id:
            return True
        return await self.purchases.has_confirmed_purchase(user_id, route_id)

    @staticmethod
    def mask_stops_for_preview(stops: list[StopResponse]) -> list[StopResponse]:
        ordered = sorted(stops, key=lambda s: s.order_index)
        masked: list[StopResponse] = []
        for index, stop in enumerate(ordered):
            if index < 2:
                masked.append(stop)
            else:
                masked.append(
                    stop.model_copy(
                        update={
                            'description': '',
                            'audio_url': None,
                        },
                    ),
                )
        return masked
