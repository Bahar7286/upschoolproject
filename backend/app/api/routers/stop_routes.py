from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_stop_service
from app.core.exceptions import RouteNotFoundError, StopNotFoundError
from app.schemas.stop_schema import StopCreate, StopResponse, StopUpdate
from app.services.stop_service import StopService

router = APIRouter(prefix='/routes/{route_id}/stops', tags=['stops'])


@router.get('', response_model=list[StopResponse])
async def list_stops(
    route_id: int,
    service: StopService = Depends(get_stop_service),
) -> list[StopResponse]:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        return await service.list_stops(route_id)
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc


@router.post('', response_model=StopResponse, status_code=status.HTTP_201_CREATED)
async def create_stop(
    route_id: int,
    payload: StopCreate,
    service: StopService = Depends(get_stop_service),
) -> StopResponse:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        return await service.create_stop(route_id, payload)
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc


@router.get('/{stop_id}', response_model=StopResponse)
async def get_stop(
    route_id: int,
    stop_id: int,
    service: StopService = Depends(get_stop_service),
) -> StopResponse:
    if route_id <= 0 or stop_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid id')
    try:
        return await service.get_stop(route_id, stop_id)
    except StopNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Stop not found') from exc


@router.patch('/{stop_id}', response_model=StopResponse)
async def update_stop(
    route_id: int,
    stop_id: int,
    payload: StopUpdate,
    service: StopService = Depends(get_stop_service),
) -> StopResponse:
    if route_id <= 0 or stop_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid id')
    try:
        return await service.update_stop(route_id, stop_id, payload)
    except StopNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Stop not found') from exc


@router.delete('/{stop_id}', response_model=dict[str, str])
async def delete_stop(
    route_id: int,
    stop_id: int,
    service: StopService = Depends(get_stop_service),
) -> dict[str, str]:
    if route_id <= 0 or stop_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid id')
    try:
        await service.delete_stop(route_id, stop_id)
    except StopNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Stop not found') from exc
    return {'status': 'deleted'}
