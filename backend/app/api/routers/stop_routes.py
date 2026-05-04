from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_stop_service
from app.schemas.stop_schema import StopCreate, StopResponse, StopUpdate
from app.services.stop_service import StopService

router = APIRouter(prefix='/routes/{route_id}/stops', tags=['stops'])


@router.get('', response_model=list[StopResponse])
async def get_stops(route_id: int, service: StopService = Depends(get_stop_service)) -> list[StopResponse]:
    if route_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid route id')

    if not await service.route_exists(route_id):
        raise HTTPException(status_code=404, detail='Route not found')

    return await service.list_stops(route_id)


@router.post('', response_model=StopResponse)
async def post_stop(
    route_id: int,
    payload: StopCreate,
    service: StopService = Depends(get_stop_service),
) -> StopResponse:
    if route_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid route id')

    stop = await service.create_stop(route_id, payload)
    if not stop:
        raise HTTPException(status_code=404, detail='Route not found')

    return stop


@router.get('/{stop_id}', response_model=StopResponse)
async def get_stop(
    route_id: int,
    stop_id: int,
    service: StopService = Depends(get_stop_service),
) -> StopResponse:
    if route_id <= 0 or stop_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid id')

    stop = await service.get_stop(route_id, stop_id)
    if not stop:
        raise HTTPException(status_code=404, detail='Stop not found')

    return stop


@router.patch('/{stop_id}', response_model=StopResponse)
async def patch_stop(
    route_id: int,
    stop_id: int,
    payload: StopUpdate,
    service: StopService = Depends(get_stop_service),
) -> StopResponse:
    if route_id <= 0 or stop_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid id')

    stop = await service.update_stop(route_id, stop_id, payload)
    if not stop:
        raise HTTPException(status_code=404, detail='Stop not found')

    return stop


@router.delete('/{stop_id}', response_model=dict[str, str])
async def delete_stop(
    route_id: int,
    stop_id: int,
    service: StopService = Depends(get_stop_service),
) -> dict[str, str]:
    if route_id <= 0 or stop_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid id')

    deleted = await service.delete_stop(route_id, stop_id)
    if not deleted:
        raise HTTPException(status_code=404, detail='Stop not found')

    return {'status': 'deleted'}
