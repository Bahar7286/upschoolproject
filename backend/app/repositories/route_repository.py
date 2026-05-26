from sqlalchemy import func, select

from app.models.route_model import Route
from app.repositories.base import BaseRepository, apply_update


class RouteRepository(BaseRepository):
    async def list_all(
        self,
        *,
        city: str | None = None,
        guide_id: int | None = None,
        offset: int = 0,
        limit: int = 500,
    ) -> list[Route]:
        stmt = select(Route).order_by(Route.route_id.asc()).offset(offset).limit(limit)
        if city:
            stmt = stmt.where(func.lower(Route.city) == city.lower())
        if guide_id is not None:
            stmt = stmt.where(Route.guide_id == guide_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, route_id: int) -> Route | None:
        return await self.db.get(Route, route_id)

    async def create(self, route: Route) -> Route:
        self.db.add(route)
        return await self._commit_refresh(route)

    async def save(self, route: Route) -> Route:
        return await self._commit_refresh(route)

    async def update_fields(self, route: Route, data: dict) -> Route:
        if 'tags' in data and isinstance(data['tags'], list):
            data = {**data, 'tags': ','.join(data['tags'])}
        apply_update(route, data)
        return await self.save(route)

    async def delete(self, route: Route) -> None:
        await self.db.delete(route)
        await self.db.commit()
