import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PlanNotFoundError
from app.repositories.plan_repository import PlanRepository
from app.repositories.user_repository import UserRepository
from app.schemas.plan_schema import PlanCreate, PlanUpdate
from app.services.plan_service import PlanService

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_plan_crud(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    service = PlanService(PlanRepository(db_session))
    created = await service.create_plan(
        tourist.user_id,
        PlanCreate(
            route_id=1,
            title='Weekend Plan',
            planned_date='2026-10-01',
            planned_time='10:00',
            duration_minutes=90,
            memo='Test',
        ),
    )
    listed = await service.list_plans(tourist.user_id)
    assert any(p.plan_id == created.plan_id for p in listed)

    fetched = await service.get_plan(created.plan_id, tourist.user_id)
    assert fetched.title == 'Weekend Plan'

    updated = await service.update_plan(
        created.plan_id,
        tourist.user_id,
        PlanUpdate(memo='Updated memo'),
    )
    assert updated.memo == 'Updated memo'

    await service.delete_plan(created.plan_id, tourist.user_id)
    with pytest.raises(PlanNotFoundError):
        await service.get_plan(created.plan_id, tourist.user_id)
