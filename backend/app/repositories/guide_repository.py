from sqlalchemy import func, select

from app.models.purchase_model import Purchase
from app.models.route_model import Route
from app.repositories.base import BaseRepository


class GuideRepository(BaseRepository):
    async def earnings(self, guide_id: int) -> tuple[int, float]:
        result = await self.db.execute(
            select(
                func.count(Purchase.purchase_id),
                func.coalesce(func.sum(Purchase.amount), 0.0),
            )
            .join(Route, Route.route_id == Purchase.route_id)
            .where(Route.guide_id == guide_id, Purchase.status == 'confirmed')
        )
        row = result.one()
        return int(row[0] or 0), float(row[1] or 0.0)

    async def route_count(self, guide_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Route.route_id)).where(Route.guide_id == guide_id)
        )
        return int(result.scalar_one())

    async def route_sales_breakdown(self, guide_id: int, *, limit: int = 10) -> list[tuple[int, str, int, float]]:
        result = await self.db.execute(
            select(
                Route.route_id,
                Route.title,
                func.count(Purchase.purchase_id),
                func.coalesce(func.sum(Purchase.amount), 0.0),
            )
            .join(Purchase, Purchase.route_id == Route.route_id)
            .where(Route.guide_id == guide_id, Purchase.status == 'confirmed')
            .group_by(Route.route_id, Route.title)
            .order_by(func.count(Purchase.purchase_id).desc())
            .limit(limit)
        )
        return [(int(r[0]), str(r[1]), int(r[2] or 0), float(r[3] or 0.0)) for r in result.all()]
