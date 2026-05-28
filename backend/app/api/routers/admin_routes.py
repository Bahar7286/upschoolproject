from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import (
    get_guide_profile_service,
    get_image_sync_service,
    get_poi_sync_service,
    get_user_repository,
)
from app.core.exceptions import GuideNotFoundError
from app.repositories.user_repository import UserRepository
from app.api.dependencies import get_moderation_service
from app.schemas.moderation_schema import (
    AdminPendingRoute,
    ContentReportResolve,
    ContentReportResponse,
    RouteModerationDecision,
)
from app.services.guide_profile_service import GuideProfileService
from app.services.moderation_service import ModerationService
from app.services.poi_sync_service import PoiSyncService
from app.core.exceptions import RouteNotFoundError
from app.schemas.route_schema import RouteResponse

router = APIRouter()


class AdminGuideAction(BaseModel):
    action: str = Field(pattern='^(verify|reject)$')
    rejection_reason: str = Field(default='', max_length=500)


class AdminPendingGuide(BaseModel):
    guide_id: int
    full_name: str
    email: str
    verification_status: str
    license_number: str
    university: str
    department: str
    document_path: str
    document_summary: str
    submitted_at: str | None


class PoiSyncResponse(BaseModel):
    fetched: int
    created: int
    skipped_duplicates: int


class ImageSyncResponse(BaseModel):
    cities_updated: int = 0
    districts_updated: int = 0
    places_updated: int = 0
    cities_failed: int = 0
    districts_failed: int = 0
    places_failed: int = 0


class PremiumToggle(BaseModel):
    is_premium: bool


async def _require_admin(user_id: int, user_repo: UserRepository) -> None:
    user = await user_repo.get_by_id(user_id)
    if not user or user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')


@router.get('/guides/pending', response_model=list[AdminPendingGuide])
async def list_pending_guides(
    user_id: int = Depends(get_current_user_id),
    service: GuideProfileService = Depends(get_guide_profile_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[AdminPendingGuide]:
    await _require_admin(user_id, user_repo)
    rows = await service.list_pending_for_admin()
    return [AdminPendingGuide(**row) for row in rows]


@router.patch('/guides/{guide_id}/verification', response_model=dict[str, str])
async def moderate_guide(
    guide_id: int,
    payload: AdminGuideAction,
    user_id: int = Depends(get_current_user_id),
    service: GuideProfileService = Depends(get_guide_profile_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> dict[str, str]:
    await _require_admin(user_id, user_repo)
    try:
        status_value = await service.moderate_verification(
            guide_id,
            action=payload.action,
            rejection_reason=payload.rejection_reason,
        )
        return {'status': status_value}
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc


@router.post('/poi/sync', response_model=PoiSyncResponse)
async def sync_poi(
    city_id: int | None = None,
    district_id: int | None = None,
    user_id: int = Depends(get_current_user_id),
    service: PoiSyncService = Depends(get_poi_sync_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> PoiSyncResponse:
    await _require_admin(user_id, user_repo)
    if not city_id and not district_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='city_id or district_id required')
    if city_id and district_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Provide only one of city_id or district_id')
    try:
        if city_id:
            result = await service.sync_city(city_id=city_id)
        else:
            result = await service.sync_district(district_id=int(district_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return PoiSyncResponse(
        fetched=result.fetched,
        created=result.created,
        skipped_duplicates=result.skipped_duplicates,
    )


@router.post('/images/sync', response_model=ImageSyncResponse)
async def sync_images(
    scope: str = 'all',
    city_id: int | None = None,
    force: bool = False,
    places_limit: int = 200,
    user_id: int = Depends(get_current_user_id),
    service=Depends(get_image_sync_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ImageSyncResponse:
    """Wikipedia küçük resimlerini cities/districts/places.image_url alanına yazar."""
    await _require_admin(user_id, user_repo)
    if scope == 'cities':
        r = await service.sync_cities(force=force)
        return ImageSyncResponse(cities_updated=r.updated, cities_failed=r.failed)
    if scope == 'districts':
        r = await service.sync_districts(city_id=city_id, force=force)
        return ImageSyncResponse(districts_updated=r.updated, districts_failed=r.failed)
    if scope == 'places':
        r = await service.sync_places(limit=places_limit, force=force)
        return ImageSyncResponse(places_updated=r.updated, places_failed=r.failed)
    stats = await service.sync_all(city_id=city_id, places_limit=places_limit, force=force)
    return ImageSyncResponse(**stats)


@router.get('/routes/pending', response_model=list[AdminPendingRoute])
async def list_pending_routes(
    user_id: int = Depends(get_current_user_id),
    service: ModerationService = Depends(get_moderation_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[AdminPendingRoute]:
    await _require_admin(user_id, user_repo)
    return await service.list_pending_routes()


@router.post('/moderation/routes/{route_id}/decision', response_model=RouteResponse)
async def moderate_route_decision(
    route_id: int,
    payload: RouteModerationDecision,
    user_id: int = Depends(get_current_user_id),
    service: ModerationService = Depends(get_moderation_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> RouteResponse:
    await _require_admin(user_id, user_repo)
    try:
        return await service.moderate_route(route_id, user_id, payload)
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get('/reports', response_model=list[ContentReportResponse])
async def list_content_reports(
    user_id: int = Depends(get_current_user_id),
    service: ModerationService = Depends(get_moderation_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[ContentReportResponse]:
    await _require_admin(user_id, user_repo)
    return await service.list_open_reports()


@router.patch('/reports/{report_id}', response_model=ContentReportResponse)
async def resolve_content_report(
    report_id: int,
    payload: ContentReportResolve,
    user_id: int = Depends(get_current_user_id),
    service: ModerationService = Depends(get_moderation_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ContentReportResponse:
    await _require_admin(user_id, user_repo)
    try:
        return await service.resolve_report(report_id, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch('/users/{target_user_id}/premium', response_model=dict[str, str])
async def set_user_premium(
    target_user_id: int,
    payload: PremiumToggle,
    user_id: int = Depends(get_current_user_id),
    user_repo: UserRepository = Depends(get_user_repository),
) -> dict[str, str]:
    await _require_admin(user_id, user_repo)
    if target_user_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid user id')
    user = await user_repo.get_by_id(target_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    user.is_premium = payload.is_premium
    await user_repo.save(user)
    return {'status': 'ok'}
