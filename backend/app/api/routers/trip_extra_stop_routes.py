from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_trip_extra_stop_service
from app.core.exceptions import RouteNotFoundError
from app.schemas.trip_extra_stop_schema import TripExtraStopCreate, TripExtraStopResponse
from app.services.trip_extra_stop_service import TripExtraStopService

router = APIRouter(prefix='/routes/{route_id}/my-extra-stops', tags=['trip'])


@router.get('', response_model=list[TripExtraStopResponse])
async def list_my_extra_stops(
    route_id: int,
    user_id: int = Depends(get_current_user_id),
    service: TripExtraStopService = Depends(get_trip_extra_stop_service),
) -> list[TripExtraStopResponse]:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        return await service.list_mine(user_id, route_id)
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc


@router.post('', response_model=TripExtraStopResponse, status_code=status.HTTP_201_CREATED)
async def add_my_extra_stop(
    route_id: int,
    payload: TripExtraStopCreate,
    user_id: int = Depends(get_current_user_id),
    service: TripExtraStopService = Depends(get_trip_extra_stop_service),
) -> TripExtraStopResponse:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        return await service.add_stop(user_id, route_id, payload)
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


@router.delete('/{extra_stop_id}', response_model=dict[str, str])
async def remove_my_extra_stop(
    route_id: int,
    extra_stop_id: int,
    user_id: int = Depends(get_current_user_id),
    service: TripExtraStopService = Depends(get_trip_extra_stop_service),
) -> dict[str, str]:
    if route_id <= 0 or extra_stop_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid id')
    await service.remove_stop(user_id, route_id, extra_stop_id)
    return {'status': 'deleted'}
