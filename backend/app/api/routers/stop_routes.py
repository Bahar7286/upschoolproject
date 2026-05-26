from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth_deps import get_optional_user_id
from app.api.dependencies import (
    get_route_access_service,
    get_stop_service,
    require_route_owner_or_admin,
)
from app.core.exceptions import RouteNotFoundError, StopNotFoundError
from app.schemas.stop_schema import StopCreate, StopResponse, StopUpdate
from app.services.route_access_service import RouteAccessService
from app.services.stop_service import StopService

router = APIRouter(prefix='/routes/{route_id}/stops', tags=['stops'])


@router.get('', response_model=list[StopResponse])
async def list_stops(
    route_id: int,
    user_id: int | None = Depends(get_optional_user_id),
    service: StopService = Depends(get_stop_service),
    access: RouteAccessService = Depends(get_route_access_service),
) -> list[StopResponse]:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        stops = await service.list_stops(route_id)
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc

    if await access.has_full_route_access(user_id, route_id):
        return stops
    return access.mask_stops_for_preview(stops)


@router.post('', response_model=StopResponse, status_code=status.HTTP_201_CREATED)
async def create_stop(
    route_id: int,
    payload: StopCreate,
    service: StopService = Depends(get_stop_service),
    _: int = Depends(require_route_owner_or_admin),
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
    user_id: int | None = Depends(get_optional_user_id),
    service: StopService = Depends(get_stop_service),
    access: RouteAccessService = Depends(get_route_access_service),
) -> StopResponse:
    if route_id <= 0 or stop_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid id')
    try:
        stop = await service.get_stop(route_id, stop_id)
    except StopNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Stop not found') from exc

    if await access.has_full_route_access(user_id, route_id):
        return stop
    preview = access.mask_stops_for_preview(await service.list_stops(route_id))
    match = next((s for s in preview if s.stop_id == stop_id), None)
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Stop not found') from None
    return match


@router.patch('/{stop_id}', response_model=StopResponse)
async def update_stop(
    route_id: int,
    stop_id: int,
    payload: StopUpdate,
    service: StopService = Depends(get_stop_service),
    _: int = Depends(require_route_owner_or_admin),
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
    _: int = Depends(require_route_owner_or_admin),
) -> dict[str, str]:
    if route_id <= 0 or stop_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid id')
    try:
        await service.delete_stop(route_id, stop_id)
    except StopNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Stop not found') from exc
    return {'status': 'deleted'}
