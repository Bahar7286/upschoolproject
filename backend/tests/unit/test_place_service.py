import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import PlaceNotFoundError
from app.repositories.place_repository import PlaceRepository
from app.schemas.place_schema import PlaceCreate, PlaceUpdate
from app.services.place_service import PlaceService

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_place_list_and_nearby(db_session: AsyncSession) -> None:
    service = PlaceService(PlaceRepository(db_session))
    places = await service.list_places(city='Istanbul', limit=5)
    assert isinstance(places, list)
    stats = await service.category_stats(city='Istanbul')
    assert isinstance(stats, list)

    nearby = await service.nearby(lat=41.0086, lng=28.9802, radius_m=5000, limit=5)
    assert isinstance(nearby, list)


@pytest.mark.asyncio
async def test_place_crud(db_session: AsyncSession) -> None:
    service = PlaceService(PlaceRepository(db_session))
    created = await service.create_place(
        PlaceCreate(
            name='Unit Museum',
            category='museum',
            city='Istanbul',
            district='Fatih',
            latitude=41.01,
            longitude=28.97,
            description='Test place',
            tags=['history'],
            is_partner=False,
        )
    )
    fetched = await service.get_place(created.place_id)
    assert fetched.name == 'Unit Museum'

    updated = await service.update_place(
        created.place_id,
        PlaceUpdate(name='Unit Museum Updated'),
    )
    assert updated.name == 'Unit Museum Updated'

    await service.delete_place(created.place_id)
    with pytest.raises(PlaceNotFoundError):
        await service.get_place(created.place_id)


@pytest.mark.asyncio
async def test_place_update_all_fields(db_session: AsyncSession) -> None:
    service = PlaceService(PlaceRepository(db_session))
    created = await service.create_place(
        PlaceCreate(
            name='Full Update',
            category='museum',
            city='Istanbul',
            district='Fatih',
            latitude=41.0,
            longitude=28.9,
            description='old',
            tags=['a'],
            is_partner=False,
        )
    )
    updated = await service.update_place(
        created.place_id,
        PlaceUpdate(
            name='New Name',
            category='mosque',
            city='Bursa',
            district='Osmangazi',
            latitude=40.2,
            longitude=29.0,
            description='new desc',
            tags=['b', 'c'],
            is_partner=True,
        ),
    )
    assert updated.name == 'New Name'
    assert updated.is_partner is True


@pytest.mark.asyncio
async def test_place_invalid_category(db_session: AsyncSession) -> None:
    with pytest.raises(ValueError, match='Invalid category'):
        await PlaceService(PlaceRepository(db_session)).create_place(
            PlaceCreate(
                name='Bad',
                category='invalid_cat',
                city='Istanbul',
                district='Fatih',
                latitude=41.0,
                longitude=28.9,
                description='x',
                tags=[],
                is_partner=False,
            )
        )
