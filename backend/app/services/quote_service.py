from datetime import datetime, timezone

from app.core.exceptions import GuideNotFoundError, GuideNotVerifiedError, QuoteNotFoundError
from app.models.quote_request_model import QuoteRequest
from app.repositories.guide_profile_repository import GuideProfileRepository
from app.repositories.quote_repository import QuoteRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.quote_schema import QuoteCreate, QuoteRespond, QuoteResponse

_PLATFORM_FEE_RATE = 0.15


class QuoteService:
    def __init__(
        self,
        quote_repo: QuoteRepository,
        user_repo: UserRepository,
        guide_profile_repo: GuideProfileRepository,
        route_repo: RouteRepository,
    ) -> None:
        self.quotes = quote_repo
        self.users = user_repo
        self.profiles = guide_profile_repo
        self.routes = route_repo

    async def _to_response(self, quote: QuoteRequest) -> QuoteResponse:
        tourist = await self.users.get_by_id(quote.tourist_id)
        guide = await self.users.get_by_id(quote.guide_id)
        route_title = None
        if quote.route_id:
            route = await self.routes.get_by_id(quote.route_id)
            route_title = route.title if route else None
        return QuoteResponse(
            quote_id=quote.quote_id,
            tourist_id=quote.tourist_id,
            tourist_name=tourist.full_name if tourist else '',
            guide_id=quote.guide_id,
            guide_name=guide.full_name if guide else '',
            route_id=quote.route_id,
            route_title=route_title,
            group_size=quote.group_size,
            preferred_date=quote.preferred_date,
            preferred_language=quote.preferred_language,
            message=quote.message,
            status=quote.status,
            guide_reply=quote.guide_reply,
            quoted_total=quote.quoted_total,
            quoted_per_person=quote.quoted_per_person,
            created_at=quote.created_at.isoformat(),
            updated_at=quote.updated_at.isoformat(),
        )

    async def create_quote(self, tourist_id: int, payload: QuoteCreate) -> QuoteResponse:
        guide = await self.users.get_by_id(payload.guide_id)
        if not guide or guide.role != 'guide':
            raise GuideNotFoundError(payload.guide_id)
        profile = await self.profiles.get_by_user_id(payload.guide_id)
        if not profile or profile.verification_status != 'verified':
            raise GuideNotVerifiedError(payload.guide_id)
        if payload.group_size > profile.max_group_size or payload.group_size < profile.min_group_size:
            raise ValueError(
                f'Grup boyutu {profile.min_group_size}-{profile.max_group_size} arasında olmalı'
            )

        quote = QuoteRequest(
            tourist_id=tourist_id,
            guide_id=payload.guide_id,
            route_id=payload.route_id,
            group_size=payload.group_size,
            preferred_date=payload.preferred_date,
            preferred_language=payload.preferred_language,
            message=payload.message.strip(),
            status='pending',
        )
        created = await self.quotes.create(quote)
        return await self._to_response(created)

    async def list_sent(self, tourist_id: int) -> list[QuoteResponse]:
        quotes = await self.quotes.list_by_tourist(tourist_id)
        return [await self._to_response(q) for q in quotes]

    async def list_inbox(self, guide_id: int) -> list[QuoteResponse]:
        quotes = await self.quotes.list_by_guide(guide_id)
        return [await self._to_response(q) for q in quotes]

    async def respond(self, guide_id: int, quote_id: int, payload: QuoteRespond) -> QuoteResponse:
        quote = await self.quotes.get_by_id(quote_id)
        if not quote or quote.guide_id != guide_id:
            raise QuoteNotFoundError(quote_id)

        quote.guide_reply = payload.guide_reply.strip()
        quote.status = payload.status
        quote.updated_at = datetime.now(timezone.utc)

        if payload.status == 'quoted':
            gross = payload.quoted_total
            quote.quoted_total = round(gross, 2)
            quote.quoted_per_person = round(gross / max(quote.group_size, 1), 2)
            platform_fee = round(gross * _PLATFORM_FEE_RATE, 2)
            quote.guide_reply = (
                f'{payload.guide_reply.strip()}\n\n'
                f'[Platform] Toplam ₺{gross:.2f} (kişi başı ₺{quote.quoted_per_person:.2f}). '
                f'Platform komisyonu %15 (₺{platform_fee:.2f}); rehber net ~₺{gross - platform_fee:.2f}.'
            )
        else:
            quote.quoted_total = None
            quote.quoted_per_person = None

        saved = await self.quotes.save(quote)
        return await self._to_response(saved)
