from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_trip_request_service, get_user_repository
from app.core.exceptions import (
    GuideNotVerifiedError,
    OfferNotFoundError,
    TripRequestNotFoundError,
)
from app.repositories.user_repository import UserRepository
from app.schemas.trip_request_schema import (
    GuideOfferCreate,
    GuideOfferResponse,
    TripRequestCreate,
    TripRequestResponse,
    TripRequestUpdate,
)
from app.services.trip_request_service import TripRequestService

router = APIRouter()


async def _require_tourist(user_id: int, user_repo: UserRepository) -> None:
    user = await user_repo.get_by_id(user_id)
    if not user or user.role not in ('tourist', 'admin'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Tourist account required')


async def _require_guide(user_id: int, user_repo: UserRepository) -> None:
    user = await user_repo.get_by_id(user_id)
    if not user or user.role != 'guide':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Guide account required')


@router.post('', response_model=TripRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_trip_request(
    payload: TripRequestCreate,
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> TripRequestResponse:
    await _require_tourist(user_id, user_repo)
    return await service.create_request(user_id, payload)


@router.get('/mine', response_model=list[TripRequestResponse])
async def list_my_trip_requests(
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[TripRequestResponse]:
    await _require_tourist(user_id, user_repo)
    return await service.list_my_requests(user_id)


@router.get('/open', response_model=list[TripRequestResponse])
async def list_open_trip_requests(
    city: str = Query(default='Istanbul'),
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[TripRequestResponse]:
    await _require_guide(user_id, user_repo)
    return await service.list_open_for_guides(city=city)


@router.get('/offers/mine', response_model=list[GuideOfferResponse])
async def list_my_guide_offers(
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> list[GuideOfferResponse]:
    await _require_guide(user_id, user_repo)
    return await service.list_guide_offers(user_id)


@router.get('/{request_id}/offers', response_model=list[GuideOfferResponse])
async def list_trip_request_offers(
    request_id: int,
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
) -> list[GuideOfferResponse]:
    if request_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid request id')
    try:
        return await service.list_request_offers(request_id, user_id)
    except TripRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Request not found') from exc


@router.patch('/{request_id}', response_model=TripRequestResponse)
async def update_trip_request(
    request_id: int,
    payload: TripRequestUpdate,
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> TripRequestResponse:
    await _require_tourist(user_id, user_repo)
    if request_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid request id')
    try:
        return await service.update_request(user_id, request_id, payload)
    except TripRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Request not found') from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.delete('/{request_id}/offers/{offer_id}', response_model=GuideOfferResponse)
async def withdraw_guide_offer(
    request_id: int,
    offer_id: int,
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> GuideOfferResponse:
    await _require_guide(user_id, user_repo)
    try:
        return await service.withdraw_offer(user_id, request_id, offer_id)
    except OfferNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Offer not found') from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get('/{request_id}', response_model=TripRequestResponse)
async def get_trip_request(
    request_id: int,
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
) -> TripRequestResponse:
    if request_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid request id')
    try:
        return await service.get_request(request_id, viewer_id=user_id)
    except TripRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Request not found') from exc


@router.post('/{request_id}/offers', response_model=GuideOfferResponse, status_code=status.HTTP_201_CREATED)
async def submit_guide_offer(
    request_id: int,
    payload: GuideOfferCreate,
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> GuideOfferResponse:
    await _require_guide(user_id, user_repo)
    try:
        return await service.create_offer(user_id, request_id, payload)
    except TripRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Request not found or closed') from exc
    except GuideNotVerifiedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Guide not verified') from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post('/{request_id}/offers/{offer_id}/accept', response_model=TripRequestResponse)
async def accept_guide_offer(
    request_id: int,
    offer_id: int,
    user_id: int = Depends(get_current_user_id),
    service: TripRequestService = Depends(get_trip_request_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> TripRequestResponse:
    await _require_tourist(user_id, user_repo)
    try:
        return await service.accept_offer(user_id, request_id, offer_id)
    except TripRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Request not found') from exc
    except OfferNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Offer not found') from exc
