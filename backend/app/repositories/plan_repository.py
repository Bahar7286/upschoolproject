from sqlalchemy import select

from app.models.plan_model import RoutePlan
from app.repositories.base import BaseRepository, apply_update


class PlanRepository(BaseRepository):
    async def list_by_user(self, user_id: int, *, month: str | None = None) -> list[RoutePlan]:
        stmt = select(RoutePlan).where(RoutePlan.user_id == user_id)
        if month:
            stmt = stmt.where(RoutePlan.planned_date.like(f'{month}%'))
        stmt = stmt.order_by(RoutePlan.planned_date.asc(), RoutePlan.planned_time.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, plan_id: int) -> RoutePlan | None:
        return await self.db.get(RoutePlan, plan_id)

    async def get_for_user(self, plan_id: int, user_id: int) -> RoutePlan | None:
        plan = await self.get_by_id(plan_id)
        if not plan or plan.user_id != user_id:
            return None
        return plan

    async def create(self, plan: RoutePlan) -> RoutePlan:
        self.db.add(plan)
        return await self._commit_refresh(plan)

    async def save(self, plan: RoutePlan) -> RoutePlan:
        return await self._commit_refresh(plan)

    async def update_fields(self, plan: RoutePlan, data: dict) -> RoutePlan:
        apply_update(plan, data)
        return await self.save(plan)

    async def delete(self, plan: RoutePlan) -> None:
        await self.db.delete(plan)
        await self.db.commit()
