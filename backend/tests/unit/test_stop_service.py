import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import RouteNotFoundError, StopNotFoundError
from app.repositories.route_repository import RouteRepository
from app.repositories.stop_repository import StopRepository
from app.schemas.stop_schema import StopCreate, StopUpdate
from app.services.stop_service import StopService

pytestmark = pytest.mark.unit


def _service(session: AsyncSession) -> StopService:
    return StopService(StopRepository(session), RouteRepository(session))


@pytest.mark.asyncio
async def test_stop_crud_on_route(db_session: AsyncSession) -> None:
    service = _service(db_session)
    route_id = 1
    created = await service.create_stop(
        route_id,
        StopCreate(
            title='Test Stop',
            description='Desc',
            latitude=41.01,
            longitude=28.98,
            order_index=99,
            audio_url=None,
        ),
    )
    listed = await service.list_stops(route_id)
    assert any(s.stop_id == created.stop_id for s in listed)

    fetched = await service.get_stop(route_id, created.stop_id)
    assert fetched.title == 'Test Stop'

    updated = await service.update_stop(
        route_id,
        created.stop_id,
        StopUpdate(title='Updated Stop'),
    )
    assert updated.title == 'Updated Stop'

    await service.delete_stop(route_id, created.stop_id)
    with pytest.raises(StopNotFoundError):
        await service.get_stop(route_id, created.stop_id)


@pytest.mark.asyncio
async def test_stop_invalid_route_raises(db_session: AsyncSession) -> None:
    with pytest.raises(RouteNotFoundError):
        await _service(db_session).list_stops(999_999)
