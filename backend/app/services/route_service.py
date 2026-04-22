from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.route_model import Route
from app.schemas.route_schema import RouteCreate, RouteRequest, RouteResponse, RouteUpdate

class RouteService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _to_response(route: Route) -> RouteResponse:
        tags = [tag.strip() for tag in route.tags.split(',') if tag.strip()]
        return RouteResponse(
            route_id=route.route_id,
            title=route.title,
            city=route.city,
            estimated_minutes=route.estimated_minutes,
            price=route.price,
            tags=tags,
        )

    async def list_routes(self) -> list[RouteResponse]:
        result = await self.db.execute(select(Route).order_by(Route.route_id.asc()))
        return [self._to_response(route) for route in result.scalars().all()]

    async def get_route_by_id(self, route_id: int) -> RouteResponse | None:
        route = await self.db.get(Route, route_id)
        return self._to_response(route) if route else None

    async def create_route(self, payload: RouteCreate) -> RouteResponse:
        route = Route(
            title=payload.title,
            city=payload.city,
            estimated_minutes=payload.estimated_minutes,
            price=payload.price,
            tags=','.join(payload.tags),
            guide_id=payload.guide_id,
        )
        self.db.add(route)
        await self.db.commit()
        await self.db.refresh(route)
        return self._to_response(route)

    async def update_route(self, route_id: int, payload: RouteUpdate) -> RouteResponse | None:
        route = await self.db.get(Route, route_id)
        if not route:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return self._to_response(route)

        if 'title' in update_data:
            route.title = update_data['title']
        if 'city' in update_data:
            route.city = update_data['city']
        if 'estimated_minutes' in update_data:
            route.estimated_minutes = update_data['estimated_minutes']
        if 'price' in update_data:
            route.price = update_data['price']
        if 'tags' in update_data:
            route.tags = ','.join(update_data['tags'])
        if 'guide_id' in update_data:
            route.guide_id = update_data['guide_id']

        await self.db.commit()
        await self.db.refresh(route)
        return self._to_response(route)

    async def delete_route(self, route_id: int) -> bool:
        route = await self.db.get(Route, route_id)
        if not route:
            return False

        await self.db.delete(route)
        await self.db.commit()
        return True

    async def recommend_routes(self, payload: RouteRequest) -> list[RouteResponse]:
        normalized_interests = {interest.lower() for interest in payload.interests}
        if not normalized_interests:
            return []

        routes = await self.list_routes()
        matched = [
            route
            for route in routes
            if normalized_interests.intersection({tag.lower() for tag in route.tags})
        ]
        return sorted(matched, key=lambda route: route.price)[:5]
