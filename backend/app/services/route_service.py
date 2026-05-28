from app.core.exceptions import RouteNotFoundError
from app.models.route_model import Route
from app.repositories.route_repository import RouteRepository
from app.schemas.route_schema import RouteCreate, RouteRequest, RouteResponse, RouteUpdate


class RouteService:
    def __init__(self, repository: RouteRepository) -> None:
        self.repository = repository

    @staticmethod
    def _to_response(route: Route, *, include_moderation: bool = False) -> RouteResponse:
        tags = [tag.strip() for tag in route.tags.split(',') if tag.strip()]
        return RouteResponse(
            route_id=route.route_id,
            title=route.title,
            city=route.city,
            estimated_minutes=route.estimated_minutes,
            price=route.price,
            tags=tags,
            guide_id=route.guide_id,
            status=route.status,
            seo_description=route.seo_description or '',
            moderation_note=route.moderation_note if include_moderation else '',
        )

    async def list_routes(self, *, published_only: bool = True) -> list[RouteResponse]:
        routes = await self.repository.list_all(published_only=published_only)
        return [self._to_response(r) for r in routes]

    async def get_route_by_id(
        self,
        route_id: int,
        *,
        allow_unpublished: bool = False,
        include_moderation: bool = False,
    ) -> RouteResponse:
        route = await self.repository.get_by_id(route_id)
        if not route:
            raise RouteNotFoundError(route_id)
        if not allow_unpublished and route.status != 'published':
            raise RouteNotFoundError(route_id)
        return self._to_response(route, include_moderation=include_moderation)

    async def route_exists(self, route_id: int) -> bool:
        route = await self.repository.get_by_id(route_id)
        return route is not None

    async def create_route(self, payload: RouteCreate) -> RouteResponse:
        route = Route(
            title=payload.title,
            city=payload.city,
            estimated_minutes=payload.estimated_minutes,
            price=payload.price,
            tags=','.join(payload.tags),
            guide_id=payload.guide_id,
            status='draft',
        )
        created = await self.repository.create(route)
        return self._to_response(created)

    async def update_route(self, route_id: int, payload: RouteUpdate) -> RouteResponse:
        route = await self.repository.get_by_id(route_id)
        if not route:
            raise RouteNotFoundError(route_id)

        data = payload.model_dump(exclude_unset=True)
        if not data:
            return self._to_response(route)

        updated = await self.repository.update_fields(route, data)
        return self._to_response(updated)

    async def delete_route(self, route_id: int) -> None:
        route = await self.repository.get_by_id(route_id)
        if not route:
            raise RouteNotFoundError(route_id)
        await self.repository.delete(route)

    async def recommend_routes(self, payload: RouteRequest) -> list[RouteResponse]:
        normalized_interests = {interest.lower() for interest in payload.interests}
        if not normalized_interests:
            return []

        routes = await self.list_routes(published_only=True)
        matched = [
            route
            for route in routes
            if normalized_interests.intersection({tag.lower() for tag in route.tags})
        ]

        def score(route) -> float:
            tag_hits = len(normalized_interests.intersection({tag.lower() for tag in route.tags}))
            budget_ok = 1.0 if route.price <= payload.budget else 0.3
            dur_diff = abs(route.estimated_minutes - payload.duration_minutes)
            duration_ok = 1.0 if dur_diff <= 60 else max(0.2, 1 - dur_diff / 240)
            return tag_hits * budget_ok * duration_ok

        return sorted(matched, key=score, reverse=True)[:10]
