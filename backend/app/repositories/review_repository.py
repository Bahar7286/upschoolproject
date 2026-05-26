from sqlalchemy import func, select

from app.models.review_model import RouteReview
from app.repositories.base import BaseRepository, apply_update


class ReviewRepository(BaseRepository):
    async def list_by_route(self, route_id: int) -> list[RouteReview]:
        result = await self.db.execute(
            select(RouteReview)
            .where(RouteReview.route_id == route_id)
            .order_by(RouteReview.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, review_id: int) -> RouteReview | None:
        return await self.db.get(RouteReview, review_id)

    async def get_by_user_route(self, user_id: int, route_id: int) -> RouteReview | None:
        result = await self.db.execute(
            select(RouteReview).where(
                RouteReview.user_id == user_id,
                RouteReview.route_id == route_id,
            )
        )
        return result.scalar_one_or_none()

    async def summary(self, route_id: int) -> tuple[float, int]:
        result = await self.db.execute(
            select(func.avg(RouteReview.rating), func.count(RouteReview.review_id)).where(
                RouteReview.route_id == route_id
            )
        )
        avg_rating, count = result.one()
        return float(avg_rating or 0), int(count or 0)

    async def create(self, review: RouteReview) -> RouteReview:
        self.db.add(review)
        return await self._commit_refresh(review)

    async def save(self, review: RouteReview) -> RouteReview:
        return await self._commit_refresh(review)

    async def update_fields(self, review: RouteReview, data: dict) -> RouteReview:
        apply_update(review, data)
        return await self.save(review)

    async def delete(self, review: RouteReview) -> None:
        await self.db.delete(review)
        await self.db.commit()
