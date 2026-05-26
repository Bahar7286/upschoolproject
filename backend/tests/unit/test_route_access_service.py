import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.purchase_model import Purchase
from app.models.route_model import Route
from app.models.user_model import User
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.stop_schema import StopResponse
from app.services.route_access_service import RouteAccessService

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_free_route_grants_access(db_session: AsyncSession) -> None:
    route = Route(
        title='Free',
        city='Istanbul',
        estimated_minutes=30,
        price=0,
        tags='history',
        guide_id=1,
    )
    db_session.add(route)
    await db_session.commit()
    await db_session.refresh(route)

    service = RouteAccessService(
        PurchaseRepository(db_session),
        RouteRepository(db_session),
        UserRepository(db_session),
    )
    assert await service.has_full_route_access(None, route.route_id) is True


@pytest.mark.asyncio
async def test_confirmed_purchase_grants_access(db_session: AsyncSession) -> None:
    user = User(
        full_name='Buyer',
        email='buyer@test.com',
        role='tourist',
        password_hash='x',
    )
    route = Route(
        title='Paid',
        city='Istanbul',
        estimated_minutes=60,
        price=10,
        tags='art',
        guide_id=1,
    )
    db_session.add_all([user, route])
    await db_session.commit()
    await db_session.refresh(user)
    await db_session.refresh(route)

    purchase = Purchase(
        user_id=user.user_id,
        route_id=route.route_id,
        amount=10,
        currency='USD',
        status='confirmed',
    )
    db_session.add(purchase)
    await db_session.commit()

    service = RouteAccessService(
        PurchaseRepository(db_session),
        RouteRepository(db_session),
        UserRepository(db_session),
    )
    assert await service.has_full_route_access(user.user_id, route.route_id) is True


def test_mask_stops_for_preview() -> None:
    stops = [
        StopResponse(
            stop_id=1,
            route_id=1,
            title='A',
            description='full a',
            latitude=41.0,
            longitude=29.0,
            order_index=0,
            audio_url='http://a',
        ),
        StopResponse(
            stop_id=2,
            route_id=1,
            title='B',
            description='full b',
            latitude=41.1,
            longitude=29.1,
            order_index=1,
            audio_url=None,
        ),
        StopResponse(
            stop_id=3,
            route_id=1,
            title='C',
            description='hidden',
            latitude=41.2,
            longitude=29.2,
            order_index=2,
            audio_url='http://c',
        ),
    ]
    masked = RouteAccessService.mask_stops_for_preview(stops)
    assert masked[2].description == ''
    assert masked[2].audio_url is None
    assert masked[0].description == 'full a'
