from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth_deps import get_current_user_id
from app.db.connection import get_db
from app.repositories.guide_offer_repository import GuideOfferRepository
from app.repositories.guide_profile_repository import GuideProfileRepository
from app.repositories.guide_repository import GuideRepository
from app.repositories.note_repository import NoteRepository
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.plan_repository import PlanRepository
from app.repositories.place_repository import PlaceRepository
from app.repositories.city_repository import CityRepository
from app.repositories.district_repository import DistrictRepository
from app.repositories.quote_repository import QuoteRepository
from app.repositories.review_repository import ReviewRepository
from app.repositories.route_repository import RouteRepository
from app.repositories.trip_request_repository import TripRequestRepository
from app.repositories.stop_repository import StopRepository
from app.repositories.user_repository import UserRepository
from app.services.ai_service import AIService
from app.services.guide_profile_service import GuideProfileService
from app.services.guide_service import GuideService
from app.services.note_service import NoteService
from app.services.payment_service import PaymentService
from app.services.place_service import PlaceService
from app.services.city_service import CityService
from app.services.district_service import DistrictService
from app.services.plan_service import PlanService
from app.services.quote_service import QuoteService
from app.services.review_service import ReviewService
from app.services.route_service import RouteService
from app.services.trip_request_service import TripRequestService
from app.services.stop_service import StopService
from app.services.password_reset_service import PasswordResetService
from app.services.route_access_service import RouteAccessService
from app.services.user_service import UserService


def get_route_repository(db: AsyncSession = Depends(get_db)) -> RouteRepository:
    return RouteRepository(db=db)


def get_stop_repository(db: AsyncSession = Depends(get_db)) -> StopRepository:
    return StopRepository(db=db)


def get_purchase_repository(db: AsyncSession = Depends(get_db)) -> PurchaseRepository:
    return PurchaseRepository(db=db)


def get_plan_repository(db: AsyncSession = Depends(get_db)) -> PlanRepository:
    return PlanRepository(db=db)


def get_note_repository(db: AsyncSession = Depends(get_db)) -> NoteRepository:
    return NoteRepository(db=db)


def get_review_repository(db: AsyncSession = Depends(get_db)) -> ReviewRepository:
    return ReviewRepository(db=db)


def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db=db)


def get_place_repository(db: AsyncSession = Depends(get_db)) -> PlaceRepository:
    return PlaceRepository(db=db)


def get_city_repository(db: AsyncSession = Depends(get_db)) -> CityRepository:
    return CityRepository(db=db)


def get_district_repository(db: AsyncSession = Depends(get_db)) -> DistrictRepository:
    return DistrictRepository(db=db)


def get_route_service(repo: RouteRepository = Depends(get_route_repository)) -> RouteService:
    return RouteService(repository=repo)


def get_stop_service(
    stop_repo: StopRepository = Depends(get_stop_repository),
    route_repo: RouteRepository = Depends(get_route_repository),
) -> StopService:
    return StopService(stop_repository=stop_repo, route_repository=route_repo)


def get_payment_service(
    purchase_repo: PurchaseRepository = Depends(get_purchase_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    route_repo: RouteRepository = Depends(get_route_repository),
) -> PaymentService:
    return PaymentService(
        purchase_repository=purchase_repo,
        user_repository=user_repo,
        route_repository=route_repo,
    )


def get_plan_service(repo: PlanRepository = Depends(get_plan_repository)) -> PlanService:
    return PlanService(repository=repo)


def get_note_service(repo: NoteRepository = Depends(get_note_repository)) -> NoteService:
    return NoteService(repository=repo)


def get_review_service(
    review_repo: ReviewRepository = Depends(get_review_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ReviewService:
    return ReviewService(review_repository=review_repo, user_repository=user_repo)


def get_place_service(repo: PlaceRepository = Depends(get_place_repository)) -> PlaceService:
    return PlaceService(repository=repo)


def get_city_service(repo: CityRepository = Depends(get_city_repository)) -> CityService:
    return CityService(repository=repo)


def get_district_service(repo: DistrictRepository = Depends(get_district_repository)) -> DistrictService:
    return DistrictService(repository=repo)


def get_user_service(repo: UserRepository = Depends(get_user_repository)) -> UserService:
    return UserService(repository=repo)


def get_password_reset_service(
    repo: UserRepository = Depends(get_user_repository),
) -> PasswordResetService:
    return PasswordResetService(user_repository=repo)


def get_guide_repository(db: AsyncSession = Depends(get_db)) -> GuideRepository:
    return GuideRepository(db=db)


def get_guide_offer_repository(db: AsyncSession = Depends(get_db)) -> GuideOfferRepository:
    return GuideOfferRepository(db=db)


def get_guide_service(
    user_repo: UserRepository = Depends(get_user_repository),
    route_repo: RouteRepository = Depends(get_route_repository),
    guide_repo: GuideRepository = Depends(get_guide_repository),
    offer_repo: GuideOfferRepository = Depends(get_guide_offer_repository),
) -> GuideService:
    return GuideService(
        user_repository=user_repo,
        route_repository=route_repo,
        guide_repository=guide_repo,
        offer_repository=offer_repo,
    )


def get_guide_profile_repository(db: AsyncSession = Depends(get_db)) -> GuideProfileRepository:
    return GuideProfileRepository(db=db)


def get_quote_repository(db: AsyncSession = Depends(get_db)) -> QuoteRepository:
    return QuoteRepository(db=db)


def get_guide_profile_service(
    profile_repo: GuideProfileRepository = Depends(get_guide_profile_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    guide_repo: GuideRepository = Depends(get_guide_repository),
) -> GuideProfileService:
    return GuideProfileService(
        profile_repo=profile_repo,
        user_repo=user_repo,
        guide_repo=guide_repo,
    )


def get_quote_service(
    quote_repo: QuoteRepository = Depends(get_quote_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    profile_repo: GuideProfileRepository = Depends(get_guide_profile_repository),
    route_repo: RouteRepository = Depends(get_route_repository),
) -> QuoteService:
    return QuoteService(
        quote_repo=quote_repo,
        user_repo=user_repo,
        guide_profile_repo=profile_repo,
        route_repo=route_repo,
    )


def get_trip_request_repository(db: AsyncSession = Depends(get_db)) -> TripRequestRepository:
    return TripRequestRepository(db=db)


def get_trip_request_service(
    request_repo: TripRequestRepository = Depends(get_trip_request_repository),
    offer_repo: GuideOfferRepository = Depends(get_guide_offer_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    profile_repo: GuideProfileRepository = Depends(get_guide_profile_repository),
    route_repo: RouteRepository = Depends(get_route_repository),
) -> TripRequestService:
    return TripRequestService(
        request_repo=request_repo,
        offer_repo=offer_repo,
        user_repo=user_repo,
        profile_repo=profile_repo,
        route_repo=route_repo,
    )


def get_ai_service(
    route_service: RouteService = Depends(get_route_service),
    stop_service: StopService = Depends(get_stop_service),
) -> AIService:
    return AIService(route_service=route_service, stop_service=stop_service)


async def require_admin(
    user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository),
) -> int:
    user = await user_repo.get_by_id(user_id)
    if not user or user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return user_id


async def require_self_or_admin(
    target_user_id: int,
    user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository),
) -> int:
    if user_id == target_user_id:
        return user_id
    user = await user_repo.get_by_id(user_id)
    if user and user.role == 'admin':
        return user_id
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Access denied')


def get_route_access_service(
    purchase_repo: PurchaseRepository = Depends(get_purchase_repository),
    route_repo: RouteRepository = Depends(get_route_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> RouteAccessService:
    return RouteAccessService(
        purchase_repository=purchase_repo,
        route_repository=route_repo,
        user_repository=user_repo,
    )


async def require_guide_or_admin(
    user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository),
) -> int:
    user = await user_repo.get_by_id(user_id)
    if not user or user.role not in ('guide', 'admin'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Guide access required')
    return user_id


async def require_route_owner_or_admin(
    route_id: int,
    user_id: int = Depends(get_current_user_id),
    route_repo: RouteRepository = Depends(get_route_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> int:
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Access denied')
    if user.role == 'admin':
        return user_id
    route = await route_repo.get_by_id(route_id)
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found')
    if user.role == 'guide' and route.guide_id == user_id:
        return user_id
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Guide access required')
