from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.auth_deps import get_current_user_id
from app.api.dependencies import get_place_service, get_place_visit_service, require_admin
from app.core.exceptions import PlaceNotFoundError
from app.schemas.place_schema import (
    PLACE_CATEGORIES,
    PlaceCategoryCount,
    PlaceCreate,
    PlaceNearbyResponse,
    PlaceResponse,
    PlaceUpdate,
)
from app.schemas.place_visit_schema import AlsoVisitedResponse, PlaceVisitCreate
from app.services.place_service import PlaceService
from app.services.place_visit_service import PlaceVisitService

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


@router.post('/visits', status_code=status.HTTP_204_NO_CONTENT)
async def record_place_visit(
    payload: PlaceVisitCreate,
    user_id: int = Depends(get_current_user_id),
    service: PlaceVisitService = Depends(get_place_visit_service),
) -> None:
    """Mekan ziyaretini kaydet (co-visit önerileri için)."""
    try:
        await service.record_visit(user_id, payload)
    except PlaceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Place not found') from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get('/google/{google_place_id}/also-visited', response_model=AlsoVisitedResponse)
async def google_place_also_visited(
    google_place_id: str,
    city: str | None = Query(default=None, max_length=120),
    place_name: str = Query(default='', max_length=200),
    limit: int = Query(default=6, ge=1, le=12),
    service: PlaceVisitService = Depends(get_place_visit_service),
) -> AlsoVisitedResponse:
    """Google Places mekanı için birlikte gezilen yerler."""
    gid = google_place_id.strip()
    if not gid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid google place id')
    return await service.also_visited(
        entity_type='google_place',
        entity_key=gid,
        city=city,
        limit=limit,
        source_place_name=place_name.strip(),
    )


@router.get('/{place_id}/also-visited', response_model=AlsoVisitedResponse)
async def place_also_visited(
    place_id: int,
    city: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=6, ge=1, le=12),
    place_service: PlaceService = Depends(get_place_service),
    visit_service: PlaceVisitService = Depends(get_place_visit_service),
) -> AlsoVisitedResponse:
    """Bu mekanı gezenlerin sıklıkla ziyaret ettiği diğer mekanlar."""
    if place_id <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid place id')
    try:
        place = await place_service.get_place(place_id)
    except PlaceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Place not found') from exc
    filter_city = city or place.city
    return await visit_service.also_visited(
        entity_type='place',
        entity_key=str(place_id),
        city=filter_city,
        limit=limit,
        source_place_name=place.name,
    )


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
