from app.core.exceptions import PlanNotFoundError
from app.models.plan_model import RoutePlan
from app.repositories.plan_repository import PlanRepository
from app.schemas.plan_schema import PlanCreate, PlanResponse, PlanUpdate


class PlanService:
    def __init__(self, repository: PlanRepository) -> None:
        self.repository = repository

    @staticmethod
    def _to_response(plan: RoutePlan) -> PlanResponse:
        return PlanResponse(
            plan_id=plan.plan_id,
            user_id=plan.user_id,
            route_id=plan.route_id,
            title=plan.title,
            planned_date=plan.planned_date,
            planned_time=plan.planned_time,
            duration_minutes=plan.duration_minutes,
            memo=plan.memo,
            status=plan.status,
            created_at=plan.created_at.isoformat(),
        )

    async def list_plans(self, user_id: int, *, month: str | None = None) -> list[PlanResponse]:
        plans = await self.repository.list_by_user(user_id, month=month)
        return [self._to_response(p) for p in plans]

    async def get_plan(self, plan_id: int, user_id: int) -> PlanResponse:
        plan = await self.repository.get_for_user(plan_id, user_id)
        if not plan:
            raise PlanNotFoundError(plan_id)
        return self._to_response(plan)

    async def create_plan(self, user_id: int, payload: PlanCreate) -> PlanResponse:
        plan = RoutePlan(
            user_id=user_id,
            route_id=payload.route_id,
            title=payload.title,
            planned_date=payload.planned_date,
            planned_time=payload.planned_time,
            duration_minutes=payload.duration_minutes,
            memo=payload.memo,
        )
        created = await self.repository.create(plan)
        return self._to_response(created)

    async def update_plan(self, plan_id: int, user_id: int, payload: PlanUpdate) -> PlanResponse:
        plan = await self.repository.get_for_user(plan_id, user_id)
        if not plan:
            raise PlanNotFoundError(plan_id)

        data = payload.model_dump(exclude_unset=True)
        if not data:
            return self._to_response(plan)

        updated = await self.repository.update_fields(plan, data)
        return self._to_response(updated)

    async def delete_plan(self, plan_id: int, user_id: int) -> None:
        plan = await self.repository.get_for_user(plan_id, user_id)
        if not plan:
            raise PlanNotFoundError(plan_id)
        await self.repository.delete(plan)
