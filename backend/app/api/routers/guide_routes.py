from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_guide_profile_service, get_guide_service
from app.core.config import settings
from app.core.exceptions import (
    EmailAlreadyExistsError,
    GuideNotFoundError,
    GuideNotVerifiedError,
    GuideProfileExistsError,
    RouteNotFoundError,
)
from app.schemas.guide_profile_schema import (
    GuideMarketplaceListResponse,
    GuideProfileResponse,
    GuideVerificationSubmit,
)
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
    GuideUpdate,
)
from app.schemas.route_schema import RouteResponse, RouteUpdate
from app.services.guide_profile_service import GuideProfileService
from app.services.guide_service import GuideService

router = APIRouter()


@router.get('/marketplace', response_model=GuideMarketplaceListResponse)
async def list_verified_guides_marketplace(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    service: GuideProfileService = Depends(get_guide_profile_service),
) -> GuideMarketplaceListResponse:
    """Turistler için yalnızca doğrulanmış (kokartlı) rehberler."""
    return await service.list_marketplace(offset=offset, limit=limit)


@router.get('/me/analytics', response_model=GuideAnalyticsResponse)
async def read_my_guide_analytics(
    user_id: int = Depends(get_current_user_id),
    service: GuideService = Depends(get_guide_service),
) -> GuideAnalyticsResponse:
    try:
        return await service.get_analytics(user_id)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc


@router.get('/me/earnings', response_model=GuideEarningsResponse)
async def read_my_guide_earnings(
    user_id: int = Depends(get_current_user_id),
    service: GuideService = Depends(get_guide_service),
) -> GuideEarningsResponse:
    try:
        return await service.get_earnings(user_id)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc


@router.post('/me/verification', response_model=GuideProfileResponse, status_code=status.HTTP_201_CREATED)
async def submit_guide_verification(
    payload: GuideVerificationSubmit,
    user_id: int = Depends(get_current_user_id),
    service: GuideProfileService = Depends(get_guide_profile_service),
) -> GuideProfileResponse:
    try:
        return await service.submit_verification(user_id, payload)
    except GuideProfileExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get('/me/verification', response_model=GuideProfileResponse | None)
async def get_my_guide_verification(
    user_id: int = Depends(get_current_user_id),
    service: GuideProfileService = Depends(get_guide_profile_service),
) -> GuideProfileResponse | None:
    return await service.get_my_profile(user_id)


_UPLOAD_ROOT = settings.upload_dir / 'licenses'
_ALLOWED_DOC_SUFFIX = {'.pdf', '.jpg', '.jpeg', '.png'}


@router.post('/me/verification/document', response_model=GuideProfileResponse)
async def upload_verification_document(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    service: GuideProfileService = Depends(get_guide_profile_service),
) -> GuideProfileResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Dosya adı gerekli')
    suffix = Path(file.filename).suffix.lower()
    if suffix not in _ALLOWED_DOC_SUFFIX:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Yalnızca PDF veya görsel (jpg, png) yüklenebilir',
        )
    _UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    safe_name = f'guide_{user_id}{suffix}'
    target = _UPLOAD_ROOT / safe_name
    content = await file.read()
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Dosya 8 MB sınırını aşıyor')
    target.write_bytes(content)
    public_path = f'/uploads/licenses/{safe_name}'
    return await service.save_document_path(user_id, public_path)


@router.get('/{guide_id}/public', response_model=GuideProfileResponse)
async def get_verified_guide_public(
    guide_id: int,
    service: GuideProfileService = Depends(get_guide_profile_service),
) -> GuideProfileResponse:
    if guide_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid guide id')
    try:
        return await service.get_public_profile(guide_id)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc
    except GuideNotVerifiedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Guide is not verified for public listing',
        ) from exc


@router.get('', response_model=GuideListResponse)
async def list_guides(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    service: GuideService = Depends(get_guide_service),
) -> GuideListResponse:
    return await service.list_guides(offset=offset, limit=limit)


@router.post('', response_model=GuideResponse, status_code=status.HTTP_201_CREATED)
async def create_guide(
    payload: GuideCreate,
    service: GuideService = Depends(get_guide_service),
) -> GuideResponse:
    try:
        return await service.create_guide(payload)
    except EmailAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered') from exc


@router.post('/payout', response_model=GuidePayoutResponse)
async def request_payout(
    payload: GuidePayoutRequest,
    service: GuideService = Depends(get_guide_service),
) -> GuidePayoutResponse:
    try:
        return await service.request_payout(payload)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc


@router.get('/{guide_id}', response_model=GuideResponse)
async def get_guide(
    guide_id: int,
    service: GuideService = Depends(get_guide_service),
) -> GuideResponse:
    if guide_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid guide id')
    try:
        return await service.get_guide(guide_id)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc


@router.patch('/{guide_id}', response_model=GuideResponse)
async def update_guide(
    guide_id: int,
    payload: GuideUpdate,
    service: GuideService = Depends(get_guide_service),
) -> GuideResponse:
    if guide_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid guide id')
    try:
        return await service.update_guide(guide_id, payload)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc
    except EmailAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered') from exc


@router.delete('/{guide_id}', response_model=dict[str, str])
async def delete_guide(
    guide_id: int,
    service: GuideService = Depends(get_guide_service),
) -> dict[str, str]:
    if guide_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid guide id')
    try:
        await service.delete_guide(guide_id)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc
    return {'status': 'deleted'}


@router.get('/{guide_id}/earnings', response_model=GuideEarningsResponse)
async def get_earnings(
    guide_id: int,
    service: GuideService = Depends(get_guide_service),
) -> GuideEarningsResponse:
    if guide_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid guide id')
    try:
        return await service.get_earnings(guide_id)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc


@router.get('/{guide_id}/routes', response_model=GuideRouteListResponse)
async def list_guide_routes(
    guide_id: int,
    service: GuideService = Depends(get_guide_service),
) -> GuideRouteListResponse:
    if guide_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid guide id')
    try:
        return await service.list_guide_routes(guide_id)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc


@router.post('/{guide_id}/routes', response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
async def create_guide_route(
    guide_id: int,
    payload: GuideRouteCreate,
    service: GuideService = Depends(get_guide_service),
) -> RouteResponse:
    if guide_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid guide id')
    try:
        return await service.create_guide_route(guide_id, payload)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc


@router.get('/{guide_id}/routes/{route_id}', response_model=RouteResponse)
async def get_guide_route(
    guide_id: int,
    route_id: int,
    service: GuideService = Depends(get_guide_service),
) -> RouteResponse:
    if guide_id <= 0 or route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid id')
    try:
        return await service.get_guide_route(guide_id, route_id)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc


@router.patch('/{guide_id}/routes/{route_id}', response_model=RouteResponse)
async def update_guide_route(
    guide_id: int,
    route_id: int,
    payload: RouteUpdate,
    service: GuideService = Depends(get_guide_service),
) -> RouteResponse:
    if guide_id <= 0 or route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid id')
    try:
        return await service.update_guide_route(guide_id, route_id, payload)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc


@router.delete('/{guide_id}/routes/{route_id}', response_model=dict[str, str])
async def delete_guide_route(
    guide_id: int,
    route_id: int,
    service: GuideService = Depends(get_guide_service),
) -> dict[str, str]:
    if guide_id <= 0 or route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid id')
    try:
        await service.delete_guide_route(guide_id, route_id)
    except GuideNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Guide not found') from exc
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc
    return {'status': 'deleted'}
