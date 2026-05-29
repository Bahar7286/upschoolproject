import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import RouteNotFoundError
from app.repositories.route_repository import RouteRepository
from app.schemas.route_schema import RouteCreate
from app.services.route_service import RouteService

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_guide_can_fetch_own_draft_route(db_session: AsyncSession) -> None:
    service = RouteService(RouteRepository(db_session))
    created = await service.create_route(
        RouteCreate(
            title='Draft Route',
            city='Istanbul',
            estimated_minutes=90,
            price=10.0,
            tags=['history'],
            guide_id=2,
        )
    )
    assert created.status == 'draft'

    with pytest.raises(RouteNotFoundError):
        await service.get_route_by_id(created.route_id)

    as_guide = await service.get_route_by_id(
        created.route_id,
        viewer_user_id=2,
        viewer_role='guide',
    )
    assert as_guide.title == 'Draft Route'
