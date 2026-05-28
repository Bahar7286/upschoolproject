from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import get_place_service, require_admin
from app.core.exceptions import PlaceNotFoundError
from app.schemas.place_schema import (
    PLACE_CATEGORIES,
    PlaceCategoryCount,
    PlaceCreate,
    PlaceNearbyResponse,
    PlaceResponse,
    PlaceUpdate,
)
from app.services.place_service import PlaceService

router = APIRouter()


@router.get('', response_model=list[PlaceResponse])
async def list_places(
    city: str | None = Query(default='Istanbul'),
    district: str | None = Query(default=None, max_length=120),
    category: str | None = Query(default=None),
    q: str | None = Query(default=None, min_length=2),
    min_lat: float | None = None,
    max_lat: float | None = None,
    min_lng: float | None = None,
    max_lng: float | None = None,
    limit: int = Query(default=200, ge=1, le=500),
    service: PlaceService = Depends(get_place_service),
) -> list[PlaceResponse]:
    if category and category not in PLACE_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Invalid category. Use: {", ".join(PLACE_CATEGORIES)}')
    return await service.list_places(
        city=city,
        district=district,
        category=category,
        query=q,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lng=min_lng,
        max_lng=max_lng,
        limit=limit,
    )


@router.get('/categories', response_model=list[PlaceCategoryCount])
async def place_categories(
    city: str | None = Query(default='Istanbul'),
    service: PlaceService = Depends(get_place_service),
) -> list[PlaceCategoryCount]:
    return await service.category_stats(city=city)


@router.get('/nearby', response_model=list[PlaceNearbyResponse])
async def places_nearby(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_m: float = Query(default=2000, ge=100, le=20000),
    category: str | None = None,
    city: str | None = Query(default='Istanbul'),
    limit: int = Query(default=30, ge=1, le=100),
    service: PlaceService = Depends(get_place_service),
) -> list[PlaceNearbyResponse]:
    if category and category not in PLACE_CATEGORIES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Invalid category. Use: {", ".join(PLACE_CATEGORIES)}')
    return await service.nearby(
        lat=lat,
        lng=lng,
        radius_m=radius_m,
        category=category,
        city=city,
        limit=limit,
    )


@router.post('', response_model=PlaceResponse, status_code=status.HTTP_201_CREATED)
async def create_place(
    payload: PlaceCreate,
    _: int = Depends(require_admin),
    service: PlaceService = Depends(get_place_service),
) -> PlaceResponse:
    try:
        return await service.create_place(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch('/{place_id}', response_model=PlaceResponse)
async def update_place(
    place_id: int,
    payload: PlaceUpdate,
    _: int = Depends(require_admin),
    service: PlaceService = Depends(get_place_service),
) -> PlaceResponse:
    if place_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid place id')
    try:
        return await service.update_place(place_id, payload)
    except PlaceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Place not found') from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete('/{place_id}', response_model=dict[str, str])
async def delete_place(
    place_id: int,
    _: int = Depends(require_admin),
    service: PlaceService = Depends(get_place_service),
) -> dict[str, str]:
    if place_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid place id')
    try:
        await service.delete_place(place_id)
        return {'status': 'deleted'}
    except PlaceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Place not found') from exc


@router.get('/{place_id}', response_model=PlaceResponse)
async def get_place(
    place_id: int,
    service: PlaceService = Depends(get_place_service),
) -> PlaceResponse:
    if place_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid place id')
    try:
        return await service.get_place(place_id)
    except PlaceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Place not found') from exc
