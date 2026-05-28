from app.core.exceptions import (
    EmailAlreadyExistsError,
    GuideNotFoundError,
    RouteNotFoundError,
)
from app.core.security import hash_password
from app.models.user_model import User
from app.repositories.guide_offer_repository import GuideOfferRepository
from app.repositories.guide_repository import GuideRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.user_repository import UserRepository
from app.schemas.guide_schema import (
    GuideAnalyticsResponse,
    GuideCreate,
    GuideEarningsResponse,
    GuideListResponse,
    GuidePayoutRequest,
    GuidePayoutResponse,
    GuideResponse,
    GuideRouteCreate,
    GuideRouteListResponse,
    GuideRouteStat,
    GuideUpdate,
)
from app.schemas.route_schema import RouteCreate, RouteResponse, RouteUpdate
from app.services.profile_service import apply_welcome_bonus_to_user, _split_csv
from app.services.route_service import RouteService


class GuideService:
    """Rehber profili, rotaları, kazanç ve ödeme iş mantığı."""

    def __init__(
        self,
        user_repository: UserRepository,
        route_repository: RouteRepository,
        guide_repository: GuideRepository,
        offer_repository: GuideOfferRepository | None = None,
    ) -> None:
        self.users = user_repository
        self.routes = route_repository
        self.guides = guide_repository
        self.offers = offer_repository
        self._route_service = RouteService(repository=route_repository)

    async def _get_guide_user(self, guide_id: int) -> User:
        user = await self.users.get_by_id(guide_id)
        if not user or user.role != 'guide':
            raise GuideNotFoundError(guide_id)
        return user

    async def _to_guide_response(self, user: User) -> GuideResponse:
        route_count = await self.guides.route_count(user.user_id)
        return GuideResponse(
            guide_id=user.user_id,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            route_count=route_count,
            xp=user.xp,
            badges=_split_csv(user.badges),
        )

    async def list_guides(self, *, offset: int = 0, limit: int = 100) -> GuideListResponse:
        users = await self.users.list_users(role='guide', offset=offset, limit=limit)
        total = await self.users.count_users(role='guide')
        items = [await self._to_guide_response(u) for u in users]
        return GuideListResponse(items=items, total=total)

    async def create_guide(self, payload: GuideCreate) -> GuideResponse:
        email = str(payload.email).lower()
        if await self.users.get_by_email(email):
            raise EmailAlreadyExistsError(email)

        user = User(
            full_name=payload.full_name.strip(),
            email=email,
            role='guide',
            password_hash=hash_password(payload.password),
        )
        created = await self.users.create(user)
        apply_welcome_bonus_to_user(created)
        await self.users.save(created)
        return await self._to_guide_response(created)

    async def get_guide(self, guide_id: int) -> GuideResponse:
        user = await self._get_guide_user(guide_id)
        return await self._to_guide_response(user)

    async def update_guide(self, guide_id: int, payload: GuideUpdate) -> GuideResponse:
        user = await self._get_guide_user(guide_id)
        data = payload.model_dump(exclude_unset=True)
        if 'email' in data and data['email'] is not None:
            new_email = str(data['email']).lower()
            existing = await self.users.get_by_email(new_email)
            if existing and existing.user_id != guide_id:
                raise EmailAlreadyExistsError(new_email)
            user.email = new_email
        if 'full_name' in data and data['full_name'] is not None:
            user.full_name = data['full_name'].strip()
        if 'password' in data and data['password'] is not None:
            user.password_hash = hash_password(data['password'])
        updated = await self.users.save(user)
        return await self._to_guide_response(updated)

    async def delete_guide(self, guide_id: int) -> None:
        user = await self._get_guide_user(guide_id)
        await self.users.delete(user)

    async def list_guide_routes(self, guide_id: int) -> GuideRouteListResponse:
        await self._get_guide_user(guide_id)
        routes = await self.routes.list_all(guide_id=guide_id)
        items = [self._route_service._to_response(r, include_moderation=True) for r in routes]
        return GuideRouteListResponse(guide_id=guide_id, items=items, total=len(items))

    async def create_guide_route(self, guide_id: int, payload: GuideRouteCreate) -> RouteResponse:
        await self._get_guide_user(guide_id)
        route_payload = RouteCreate(
            title=payload.title,
            city=payload.city,
            estimated_minutes=payload.estimated_minutes,
            price=payload.price,
            tags=payload.tags,
            guide_id=guide_id,
        )
        return await self._route_service.create_route(route_payload)

    async def get_guide_route(self, guide_id: int, route_id: int) -> RouteResponse:
        await self._get_guide_user(guide_id)
        route = await self.routes.get_by_id(route_id)
        if not route or route.guide_id != guide_id:
            raise RouteNotFoundError(route_id)
        return self._route_service._to_response(route, include_moderation=True)

    async def update_guide_route(
        self,
        guide_id: int,
        route_id: int,
        payload: RouteUpdate,
    ) -> RouteResponse:
        await self._get_guide_user(guide_id)
        route = await self.routes.get_by_id(route_id)
        if not route or route.guide_id != guide_id:
            raise RouteNotFoundError(route_id)
        if route.status not in ('draft', 'changes_requested'):
            raise ValueError('Published routes cannot be edited; unpublish or request changes first')
        return await self._route_service.update_route(route_id, payload)

    async def delete_guide_route(self, guide_id: int, route_id: int) -> None:
        await self._get_guide_user(guide_id)
        route = await self.routes.get_by_id(route_id)
        if not route or route.guide_id != guide_id:
            raise RouteNotFoundError(route_id)
        await self._route_service.delete_route(route_id)

    async def get_earnings(self, guide_id: int) -> GuideEarningsResponse:
        await self._get_guide_user(guide_id)
        sales, gross = await self.guides.earnings(guide_id)
        return GuideEarningsResponse(
            guide_id=guide_id,
            monthly_earnings=round(gross * 0.85, 2),
            route_sales=sales,
        )

    async def get_analytics(self, guide_id: int) -> GuideAnalyticsResponse:
        await self._get_guide_user(guide_id)
        sales, gross = await self.guides.earnings(guide_id)
        route_count = await self.guides.route_count(guide_id)
        breakdown = await self.guides.route_sales_breakdown(guide_id)
        top_routes = [
            GuideRouteStat(
                route_id=route_id,
                title=title,
                sales_count=count,
                gross_revenue=round(rev, 2),
                guide_net=round(rev * 0.85, 2),
            )
            for route_id, title, count, rev in breakdown
        ]
        pending = accepted = 0
        if self.offers:
            pending = await self.offers.count_for_guide(guide_id, status='pending')
            accepted = await self.offers.count_for_guide(guide_id, status='accepted')
        return GuideAnalyticsResponse(
            guide_id=guide_id,
            route_count=route_count,
            route_sales=sales,
            gross_revenue=round(gross, 2),
            guide_net=round(gross * 0.85, 2),
            pending_offers=pending,
            accepted_offers=accepted,
            top_routes=top_routes,
        )

    async def request_payout(self, payload: GuidePayoutRequest) -> GuidePayoutResponse:
        earnings = await self.get_earnings(payload.guide_id)
        if payload.amount > earnings.monthly_earnings:
            return GuidePayoutResponse(
                status='rejected',
                message=(
                    f'Talep edilen tutar (₺{payload.amount:.2f}) mevcut bakiyeyi '
                    f'(₺{earnings.monthly_earnings:.2f}) aşıyor.'
                ),
            )
        return GuidePayoutResponse(
            status='queued',
            message=f'₺{payload.amount:.2f} ödeme talebi alındı. 3–5 iş günü içinde işlenecek.',
        )
