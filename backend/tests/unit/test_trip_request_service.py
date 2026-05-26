import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import GuideNotVerifiedError, OfferNotFoundError, TripRequestNotFoundError
from app.repositories.guide_offer_repository import GuideOfferRepository
from app.repositories.guide_profile_repository import GuideProfileRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.trip_request_repository import TripRequestRepository
from app.repositories.user_repository import UserRepository
from app.schemas.trip_request_schema import (
    GuideOfferCreate,
    PlannedStop,
    TripRequestCreate,
    TripRequestUpdate,
)
from app.services.trip_request_service import TripRequestService
from tests.unit.helpers import create_guide_user

pytestmark = pytest.mark.unit


def _trip_service(session: AsyncSession) -> TripRequestService:
    return TripRequestService(
        request_repo=TripRequestRepository(session),
        offer_repo=GuideOfferRepository(session),
        user_repo=UserRepository(session),
        profile_repo=GuideProfileRepository(session),
        route_repo=RouteRepository(session),
    )


def _custom_request_payload() -> TripRequestCreate:
    return TripRequestCreate(
        title='Unit test gezi',
        city='Istanbul',
        interests=['history'],
        route_mode='custom',
        planned_stops=[
            PlannedStop(place_id=1, name='Durak A', order=1),
            PlannedStop(place_id=2, name='Durak B', order=2),
        ],
        group_size=4,
        preferred_date='2026-08-01',
        duration_minutes=120,
        budget=400,
        preferred_language='tr',
        message='Test talep',
    )


@pytest.mark.asyncio
async def test_tr_u01_create_request_open(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    result = await service.create_request(tourist.user_id, _custom_request_payload())
    assert result.status == 'open'
    assert result.request_id >= 1


@pytest.mark.asyncio
async def test_tr_u02_cancel_request(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    assert tourist
    created = await service.create_request(tourist.user_id, _custom_request_payload())
    updated = await service.update_request(
        tourist.user_id,
        created.request_id,
        TripRequestUpdate(status='cancelled'),
    )
    assert updated.status == 'cancelled'


@pytest.mark.asyncio
async def test_tr_u03_guide_creates_pending_offer(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    assert tourist and guide
    req = await service.create_request(tourist.user_id, _custom_request_payload())
    offer = await service.create_offer(
        guide.user_id,
        req.request_id,
        GuideOfferCreate(base_total=400.0, message='Teklif mesajı'),
    )
    assert offer.status == 'pending'
    assert offer.offered_total > 0


@pytest.mark.asyncio
async def test_tr_u04_duplicate_pending_offer_rejected(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    req = await service.create_request(tourist.user_id, _custom_request_payload())
    await service.create_offer(
        guide.user_id,
        req.request_id,
        GuideOfferCreate(base_total=300.0, message='İlk teklif'),
    )
    with pytest.raises(ValueError, match='zaten teklif'):
        await service.create_offer(
            guide.user_id,
            req.request_id,
            GuideOfferCreate(base_total=350.0, message='İkinci teklif'),
        )


@pytest.mark.asyncio
async def test_tr_u05_withdraw_offer(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    req = await service.create_request(tourist.user_id, _custom_request_payload())
    offer = await service.create_offer(
        guide.user_id,
        req.request_id,
        GuideOfferCreate(base_total=250.0, message='Geri çekilecek'),
    )
    withdrawn = await service.withdraw_offer(guide.user_id, req.request_id, offer.offer_id)
    assert withdrawn.status == 'withdrawn'


@pytest.mark.asyncio
async def test_tr_accept_offer_awards_request(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    req = await service.create_request(tourist.user_id, _custom_request_payload())
    offer = await service.create_offer(
        guide.user_id,
        req.request_id,
        GuideOfferCreate(base_total=400.0, message='Kabul edilecek teklif'),
    )
    awarded = await service.accept_offer(tourist.user_id, req.request_id, offer.offer_id)
    assert awarded.status == 'awarded'
    assert any(o.status == 'accepted' for o in awarded.offers)


@pytest.mark.asyncio
async def test_tr_list_open_and_my_requests(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    await service.create_request(tourist.user_id, _custom_request_payload())
    mine = await service.list_my_requests(tourist.user_id)
    assert len(mine) >= 1
    open_list = await service.list_open_for_guides(city='Istanbul')
    assert isinstance(open_list, list)


@pytest.mark.asyncio
async def test_tr_list_offers_by_viewer(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    req = await service.create_request(tourist.user_id, _custom_request_payload())
    await service.create_offer(
        guide.user_id,
        req.request_id,
        GuideOfferCreate(base_total=200.0, message='Liste test'),
    )
    offers = await service.list_request_offers(req.request_id, tourist.user_id)
    assert len(offers) >= 1
    guide_offers = await service.list_guide_offers(guide.user_id)
    assert len(guide_offers) >= 1


@pytest.mark.asyncio
async def test_tr_custom_route_requires_two_stops(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    payload = _custom_request_payload()
    payload.planned_stops = [PlannedStop(place_id=1, name='Only', order=1)]
    with pytest.raises(ValueError, match='en az 2 durak'):
        await service.create_request(tourist.user_id, payload)


@pytest.mark.asyncio
async def test_tr_get_request_not_found(db_session: AsyncSession) -> None:
    with pytest.raises(TripRequestNotFoundError):
        await _trip_service(db_session).get_request(999_999)


@pytest.mark.asyncio
async def test_tr_unverified_guide_cannot_offer(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    new_guide = await create_guide_user(db_session, email='no.verify@example.com')
    req = await service.create_request(tourist.user_id, _custom_request_payload())
    with pytest.raises(GuideNotVerifiedError):
        await service.create_offer(
            new_guide.user_id,
            req.request_id,
            GuideOfferCreate(base_total=100.0, message='Onaysız rehber teklifi'),
        )


@pytest.mark.asyncio
async def test_tr_withdraw_non_pending_raises(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    guide = await UserRepository(db_session).get_by_email('guide@example.com')
    req = await service.create_request(tourist.user_id, _custom_request_payload())
    offer = await service.create_offer(
        guide.user_id,
        req.request_id,
        GuideOfferCreate(base_total=200.0, message='Kabul sonrası teklif'),
    )
    await service.accept_offer(tourist.user_id, req.request_id, offer.offer_id)
    with pytest.raises(ValueError, match='bekleyen'):
        await service.withdraw_offer(guide.user_id, req.request_id, offer.offer_id)


@pytest.mark.asyncio
async def test_tr_accept_wrong_offer_raises(db_session: AsyncSession) -> None:
    service = _trip_service(db_session)
    tourist = await UserRepository(db_session).get_by_email('tourist@example.com')
    req = await service.create_request(tourist.user_id, _custom_request_payload())
    with pytest.raises(OfferNotFoundError):
        await service.accept_offer(tourist.user_id, req.request_id, 999_999)
