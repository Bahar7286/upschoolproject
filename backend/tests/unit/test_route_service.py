import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import RouteNotFoundError
from app.repositories.route_repository import RouteRepository
from app.schemas.route_schema import RouteCreate, RouteRequest, RouteUpdate
from app.services.route_service import RouteService

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_route_crud_and_recommend(db_session: AsyncSession) -> None:
    service = RouteService(RouteRepository(db_session))
    routes = await service.list_routes()
    assert len(routes) >= 1

    created = await service.create_route(
        RouteCreate(
            title='Unit Route',
            city='Istanbul',
            estimated_minutes=60,
            price=5.0,
            tags=['history', 'museum'],
            guide_id=2,
        )
    )
    fetched = await service.get_route_by_id(created.route_id)
    assert fetched.title == 'Unit Route'
    assert await service.route_exists(created.route_id)

    updated = await service.update_route(
        created.route_id,
        RouteUpdate(title='Unit Route Updated', price=6.0),
    )
    assert updated.title == 'Unit Route Updated'

    recs = await service.recommend_routes(
        RouteRequest(interests=['history'], budget=20.0, duration_minutes=120)
    )
    assert len(recs) >= 1

    empty = await service.recommend_routes(
        RouteRequest(interests=[], budget=100.0, duration_minutes=60)
    )
    assert empty == []

    await service.delete_route(created.route_id)
    with pytest.raises(RouteNotFoundError):
        await service.get_route_by_id(created.route_id)
