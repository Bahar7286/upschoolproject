from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import (
    get_route_service,
    get_user_repository,
    require_guide_or_admin,
    require_route_owner_or_admin,
)
from app.repositories.user_repository import UserRepository
from app.core.exceptions import RouteNotFoundError
from app.schemas.route_schema import RouteCreate, RouteRequest, RouteResponse, RouteUpdate
from app.services.route_service import RouteService

router = APIRouter()


@router.get('', response_model=list[RouteResponse])
async def list_routes(service: RouteService = Depends(get_route_service)) -> list[RouteResponse]:
    return await service.list_routes()


@router.post('', response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
async def create_route(
    payload: RouteCreate,
    service: RouteService = Depends(get_route_service),
    user_id: int = Depends(require_guide_or_admin),
    user_repo: UserRepository = Depends(get_user_repository),
) -> RouteResponse:
    user = await user_repo.get_by_id(user_id)
    if user and user.role == 'guide' and payload.guide_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Routes must be created for your own guide account',
        )
    return await service.create_route(payload)


@router.post('/recommend', response_model=list[RouteResponse])
async def recommend_routes(
    payload: RouteRequest,
    service: RouteService = Depends(get_route_service),
) -> list[RouteResponse]:
    return await service.recommend_routes(payload)


@router.get('/{route_id}', response_model=RouteResponse)
async def get_route(
    route_id: int,
    service: RouteService = Depends(get_route_service),
) -> RouteResponse:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        return await service.get_route_by_id(route_id)
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc


@router.patch('/{route_id}', response_model=RouteResponse)
async def update_route(
    route_id: int,
    payload: RouteUpdate,
    service: RouteService = Depends(get_route_service),
    _: int = Depends(require_route_owner_or_admin),
) -> RouteResponse:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        return await service.update_route(route_id, payload)
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc


@router.delete('/{route_id}', response_model=dict[str, str])
async def delete_route(
    route_id: int,
    service: RouteService = Depends(get_route_service),
    _: int = Depends(require_route_owner_or_admin),
) -> dict[str, str]:
    if route_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid route id')
    try:
        await service.delete_route(route_id)
    except RouteNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Route not found') from exc
    return {'status': 'deleted'}
