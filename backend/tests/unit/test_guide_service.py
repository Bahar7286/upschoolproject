import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmailAlreadyExistsError, GuideNotFoundError, RouteNotFoundError
from app.repositories.guide_offer_repository import GuideOfferRepository
from app.repositories.guide_repository import GuideRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.guide_schema import GuideCreate, GuidePayoutRequest, GuideRouteCreate, GuideUpdate
from app.schemas.route_schema import RouteUpdate
from app.services.guide_service import GuideService

pytestmark = pytest.mark.unit


def _service(session: AsyncSession) -> GuideService:
    return GuideService(
        UserRepository(session),
        RouteRepository(session),
        GuideRepository(session),
        GuideOfferRepository(session),
    )


@pytest.mark.asyncio
async def test_list_and_get_guide(db_session: AsyncSession) -> None:
    service = _service(db_session)
    listing = await service.list_guides(limit=5)
    assert listing.total >= 1
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    assert guide
    detail = await service.get_guide(guide.user_id)
    assert detail.route_count >= 1


@pytest.mark.asyncio
async def test_create_guide_and_routes(db_session: AsyncSession) -> None:
    service = _service(db_session)
    created = await service.create_guide(
        GuideCreate(
            full_name='Extra Guide',
            email='extra.guide@example.com',
            password='guidepass1',
        )
    )
    route = await service.create_guide_route(
        created.guide_id,
        GuideRouteCreate(
            title='Guide Own Route',
            city='Istanbul',
            estimated_minutes=45,
            price=11.0,
            tags=['art'],
        ),
    )
    routes = await service.list_guide_routes(created.guide_id)
    assert routes.total >= 1

    fetched = await service.get_guide_route(created.guide_id, route.route_id)
    assert fetched.title == 'Guide Own Route'

    updated = await service.update_guide_route(
        created.guide_id,
        route.route_id,
        RouteUpdate(price=12.0),
    )
    assert updated.price == 12.0

    await service.delete_guide_route(created.guide_id, route.route_id)
    with pytest.raises(RouteNotFoundError):
        await service.get_guide_route(created.guide_id, route.route_id)


@pytest.mark.asyncio
async def test_earnings_analytics_payout(db_session: AsyncSession) -> None:
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    assert guide
    service = _service(db_session)
    earnings = await service.get_earnings(guide.user_id)
    assert earnings.route_sales >= 0
    analytics = await service.get_analytics(guide.user_id)
    assert analytics.route_count >= 1

    rejected = await service.request_payout(
        GuidePayoutRequest(guide_id=guide.user_id, amount=999_999.0)
    )
    assert rejected.status == 'rejected'

    if earnings.monthly_earnings > 0:
        queued = await service.request_payout(
            GuidePayoutRequest(
                guide_id=guide.user_id,
                amount=min(1.0, earnings.monthly_earnings),
            )
        )
        assert queued.status == 'queued'


@pytest.mark.asyncio
async def test_update_guide_duplicate_email(db_session: AsyncSession) -> None:
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert guide and tourist
    with pytest.raises(EmailAlreadyExistsError):
        await _service(db_session).update_guide(
            guide.user_id,
            GuideUpdate(email=tourist.email),
        )


@pytest.mark.asyncio
async def test_delete_guide(db_session: AsyncSession) -> None:
    created = await _service(db_session).create_guide(
        GuideCreate(
            full_name='Delete Me',
            email='delete.guide@example.com',
            password='guidepass9',
        )
    )
    await _service(db_session).delete_guide(created.guide_id)
    with pytest.raises(GuideNotFoundError):
        await _service(db_session).get_guide(created.guide_id)


@pytest.mark.asyncio
async def test_tourist_is_not_guide(db_session: AsyncSession) -> None:
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    with pytest.raises(GuideNotFoundError):
        await _service(db_session).get_guide(tourist.user_id)
