from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_route_service
from app.schemas.route_schema import RouteCreate, RouteRequest, RouteResponse, RouteUpdate
from app.services.route_service import RouteService

router = APIRouter()


@router.get('', response_model=list[RouteResponse])
async def get_routes(service: RouteService = Depends(get_route_service)) -> list[RouteResponse]:
    return await service.list_routes()


@router.get('/{route_id}', response_model=RouteResponse)
async def get_route(route_id: int, service: RouteService = Depends(get_route_service)) -> RouteResponse:
    if route_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid route id')

    route = await service.get_route_by_id(route_id)
    if not route:
        raise HTTPException(status_code=404, detail='Route not found')

    return route


@router.post('', response_model=RouteResponse)
async def post_route(payload: RouteCreate, service: RouteService = Depends(get_route_service)) -> RouteResponse:
    return await service.create_route(payload)


@router.patch('/{route_id}', response_model=RouteResponse)
async def patch_route(
    route_id: int,
    payload: RouteUpdate,
    service: RouteService = Depends(get_route_service),
) -> RouteResponse:
    if route_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid route id')

    route = await service.update_route(route_id, payload)
    if not route:
        raise HTTPException(status_code=404, detail='Route not found')

    return route


@router.delete('/{route_id}', response_model=dict[str, str])
async def delete_route(route_id: int, service: RouteService = Depends(get_route_service)) -> dict[str, str]:
    if route_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid route id')

    deleted = await service.delete_route(route_id)
    if not deleted:
        raise HTTPException(status_code=404, detail='Route not found')

    return {'status': 'deleted'}


@router.post('/recommend', response_model=list[RouteResponse])
async def post_recommend_routes(
    payload: RouteRequest,
    service: RouteService = Depends(get_route_service),
) -> list[RouteResponse]:
    return await service.recommend_routes(payload)
