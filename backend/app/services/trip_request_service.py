import json
from datetime import datetime, timezone

from app.core.exceptions import GuideNotVerifiedError, GuideNotFoundError, TripRequestNotFoundError, OfferNotFoundError
from app.core.pricing import apply_group_discount, platform_fee
from app.models.guide_offer_model import GuideOffer
from app.models.trip_request_model import TripRequest
from app.repositories.guide_offer_repository import GuideOfferRepository
from app.repositories.guide_profile_repository import GuideProfileRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.trip_request_repository import TripRequestRepository
from app.repositories.user_repository import UserRepository
from app.schemas.trip_request_schema import (
    GuideOfferCreate,
    GuideOfferResponse,
    PlannedStop,
    TripRequestCreate,
    TripRequestResponse,
    TripRequestUpdate,
)
from app.services.profile_service import award_xp_to_user


def _split_csv(value: str) -> list[str]:
    if not value:
        return []
    return [p.strip() for p in value.split(',') if p.strip()]


def _join_csv(values: list[str]) -> str:
    return ','.join(dict.fromkeys(v.strip() for v in values if v.strip()))


def _parse_stops(raw: str) -> list[PlannedStop]:
    if not raw or raw == '[]':
        return []
    try:
        data = json.loads(raw)
        return [PlannedStop.model_validate(item) for item in data]
    except (json.JSONDecodeError, ValueError):
        return []


def _serialize_stops(stops: list[PlannedStop]) -> str:
    if not stops:
        return '[]'
    ordered = sorted(stops, key=lambda s: s.order)
    return json.dumps([s.model_dump() for s in ordered], ensure_ascii=False)


class TripRequestService:
    def __init__(
        self,
        request_repo: TripRequestRepository,
        offer_repo: GuideOfferRepository,
        user_repo: UserRepository,
        profile_repo: GuideProfileRepository,
        route_repo: RouteRepository,
    ) -> None:
        self.requests = request_repo
        self.offers = offer_repo
        self.users = user_repo
        self.profiles = profile_repo
        self.routes = route_repo

    async def _offer_response(self, offer: GuideOffer) -> GuideOfferResponse:
        guide = await self.users.get_by_id(offer.guide_id)
        profile = await self.profiles.get_by_user_id(offer.guide_id)
        fee = platform_fee(offer.offered_total)
        req = await self.requests.get_by_id(offer.request_id)
        group_size = req.group_size if req else 1
        _, _, label = apply_group_discount(offer.base_total, group_size)
        return GuideOfferResponse(
            offer_id=offer.offer_id,
            request_id=offer.request_id,
            guide_id=offer.guide_id,
            guide_name=guide.full_name if guide else '',
            is_verified_guide=profile.verification_status == 'verified' if profile else False,
            message=offer.message,
            base_total=offer.base_total,
            discount_rate=offer.discount_rate,
            discount_label=label if offer.discount_rate else 'Grup indirimi uygulanmadı',
            offered_total=offer.offered_total,
            offered_per_person=offer.offered_per_person,
            platform_fee=fee,
            guide_net_estimate=round(offer.offered_total - fee, 2),
            status=offer.status,
            created_at=offer.created_at.isoformat(),
        )

    async def _request_response(
        self, req: TripRequest, *, include_offers: bool = False
    ) -> TripRequestResponse:
        tourist = await self.users.get_by_id(req.tourist_id)
        route_title = None
        if req.route_id:
            route = await self.routes.get_by_id(req.route_id)
            route_title = route.title if route else None
        offers: list[GuideOfferResponse] = []
        offer_count = await self.offers.count_by_request(req.request_id)
        if include_offers:
            for o in await self.offers.list_by_request(req.request_id):
                offers.append(await self._offer_response(o))
        return TripRequestResponse(
            request_id=req.request_id,
            tourist_id=req.tourist_id,
            tourist_name=tourist.full_name if tourist else '',
            route_id=req.route_id,
            route_title=route_title,
            route_mode=req.route_mode,
            planned_stops=_parse_stops(req.planned_stops),
            title=req.title,
            city=req.city,
            interests=_split_csv(req.interests),
            group_size=req.group_size,
            preferred_date=req.preferred_date,
            duration_minutes=req.duration_minutes,
            budget=req.budget,
            preferred_language=req.preferred_language,
            message=req.message,
            status=req.status,
            offer_count=offer_count,
            offers=offers,
            created_at=req.created_at.isoformat(),
        )

    async def create_request(self, tourist_id: int, payload: TripRequestCreate) -> TripRequestResponse:
        mode = payload.route_mode
        stops = sorted(payload.planned_stops, key=lambda s: s.order)
        if mode == 'custom' and len(stops) < 2:
            raise ValueError('Özel rota için en az 2 durak seçin')
        if mode == 'existing' and not payload.route_id and len(stops) < 2:
            raise ValueError('Mevcut rota seçin veya özel durak ekleyin')

        req = TripRequest(
            tourist_id=tourist_id,
            route_id=payload.route_id,
            route_mode=mode,
            planned_stops=_serialize_stops(stops),
            title=payload.title.strip(),
            city=payload.city.strip(),
            interests=_join_csv(payload.interests),
            group_size=payload.group_size,
            preferred_date=payload.preferred_date,
            duration_minutes=payload.duration_minutes,
            budget=payload.budget,
            preferred_language=payload.preferred_language,
            message=payload.message.strip(),
            status='open',
        )
        created = await self.requests.create(req)
        tourist = await self.users.get_by_id(tourist_id)
        if tourist:
            await award_xp_to_user(self.users, tourist, 'trip_request', 40)
        return await self._request_response(created)

    async def list_my_requests(self, tourist_id: int) -> list[TripRequestResponse]:
        rows = await self.requests.list_by_tourist(tourist_id)
        return [await self._request_response(r, include_offers=True) for r in rows]

    async def list_open_for_guides(self, *, city: str | None = 'Istanbul') -> list[TripRequestResponse]:
        rows = await self.requests.list_open(city=city)
        return [await self._request_response(r) for r in rows]

    async def get_request(self, request_id: int, *, viewer_id: int | None = None) -> TripRequestResponse:
        req = await self.requests.get_by_id(request_id)
        if not req:
            raise TripRequestNotFoundError(request_id)
        include = req.tourist_id == viewer_id if viewer_id else False
        return await self._request_response(req, include_offers=include or req.status == 'open')

    async def create_offer(
        self, guide_id: int, request_id: int, payload: GuideOfferCreate
    ) -> GuideOfferResponse:
        profile = await self.profiles.get_by_user_id(guide_id)
        if not profile or profile.verification_status != 'verified':
            raise GuideNotVerifiedError(guide_id)

        req = await self.requests.get_by_id(request_id)
        if not req or req.status != 'open':
            raise TripRequestNotFoundError(request_id)

        existing = await self.offers.get_by_guide_request(guide_id, request_id)
        if existing and existing.status == 'pending':
            raise ValueError('Bu talebe zaten teklif verdiniz')

        discounted, rate, label = apply_group_discount(payload.base_total, req.group_size)
        offer = GuideOffer(
            request_id=request_id,
            guide_id=guide_id,
            message=f'{payload.message.strip()}\n\n[{label}]',
            base_total=payload.base_total,
            discount_rate=rate,
            offered_total=discounted,
            offered_per_person=round(discounted / max(req.group_size, 1), 2),
            status='pending',
        )
        created = await self.offers.create(offer)
        return await self._offer_response(created)

    async def accept_offer(self, tourist_id: int, request_id: int, offer_id: int) -> TripRequestResponse:
        req = await self.requests.get_by_id(request_id)
        if not req or req.tourist_id != tourist_id:
            raise TripRequestNotFoundError(request_id)
        offer = await self.offers.get_by_id(offer_id)
        if not offer or offer.request_id != request_id:
            raise OfferNotFoundError(offer_id)

        offer.status = 'accepted'
        offer.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.offers.save(offer)

        for o in await self.offers.list_by_request(request_id):
            if o.offer_id != offer_id and o.status == 'pending':
                o.status = 'declined'
                o.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
                await self.offers.save(o)

        req.status = 'awarded'
        req.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.requests.save(req)
        return await self._request_response(req, include_offers=True)

    async def update_request(
        self, tourist_id: int, request_id: int, payload: TripRequestUpdate
    ) -> TripRequestResponse:
        req = await self.requests.get_by_id(request_id)
        if not req or req.tourist_id != tourist_id:
            raise TripRequestNotFoundError(request_id)
        if payload.status == 'cancelled':
            if req.status not in ('open',):
                raise ValueError('Yalnızca açık talepler iptal edilebilir')
            req.status = 'cancelled'
            req.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            await self.requests.save(req)
        return await self._request_response(req, include_offers=True)

    async def list_request_offers(self, request_id: int, viewer_id: int) -> list[GuideOfferResponse]:
        req = await self.requests.get_by_id(request_id)
        if not req:
            raise TripRequestNotFoundError(request_id)
        viewer = await self.users.get_by_id(viewer_id)
        if not viewer:
            raise TripRequestNotFoundError(request_id)
        if req.tourist_id != viewer_id and viewer.role != 'guide':
            raise TripRequestNotFoundError(request_id)
        if req.tourist_id != viewer_id and req.status != 'open':
            raise TripRequestNotFoundError(request_id)
        offers = await self.offers.list_by_request(request_id)
        return [await self._offer_response(o) for o in offers]

    async def list_guide_offers(self, guide_id: int) -> list[GuideOfferResponse]:
        rows = await self.offers.list_by_guide(guide_id)
        return [await self._offer_response(o) for o in rows]

    async def withdraw_offer(self, guide_id: int, request_id: int, offer_id: int) -> GuideOfferResponse:
        offer = await self.offers.get_by_id(offer_id)
        if not offer or offer.guide_id != guide_id or offer.request_id != request_id:
            raise OfferNotFoundError(offer_id)
        if offer.status != 'pending':
            raise ValueError('Yalnızca bekleyen teklifler geri çekilebilir')
        offer.status = 'withdrawn'
        offer.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.offers.save(offer)
        return await self._offer_response(offer)
