from fastapi import APIRouter, HTTPException, Query, Request, status

from app.core.config import settings
from app.schemas.google_schema import (
    ComputeRouteRequest,
    ComputeRouteResponse,
    GooglePlaceDetailResponse,
    GooglePlacesNearbyResponse,
)
from app.services.google_places_service import google_places_service
from app.services.google_routes_service import google_routes_service
from app.services.wikipedia_service import fetch_wikipedia_summary

router = APIRouter()


def _client_key(request: Request) -> str:
    forwarded = request.headers.get('x-forwarded-for', '')
    if forwarded:
        return forwarded.split(',')[0].strip()[:64]
    if request.client:
        return request.client.host
    return 'anon'


@router.get('/places/nearby', response_model=GooglePlacesNearbyResponse)
async def places_nearby(
    request: Request,
    lat: float,
    lng: float,
    radius_m: float = 5000,
    category: str | None = None,
) -> GooglePlacesNearbyResponse:
    if not settings.google_places_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Google Places API yapılandırılmamış (GOOGLE_PLACES_API_KEY)',
        )
    try:
        places, cached = await google_places_service.search_nearby(
            lat=lat,
            lng=lng,
            radius_m=radius_m,
            category=category,
            client_key=_client_key(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail='Google Places araması başarısız',
        ) from exc
    return GooglePlacesNearbyResponse(
        places=places,
        cached=cached,
        radius_m=radius_m,
    )


@router.get('/places/search', response_model=GooglePlacesNearbyResponse)
async def places_search(
    request: Request,
    q: str = Query(min_length=2, max_length=120),
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: float = Query(default=50000, ge=500, le=50000),
) -> GooglePlacesNearbyResponse:
    if not settings.google_places_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Google Places API yapılandırılmamış (GOOGLE_PLACES_API_KEY)',
        )
    try:
        places, cached = await google_places_service.search_text(
            query=q,
            lat=lat,
            lng=lng,
            radius_m=radius_m,
            client_key=_client_key(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail='Google Places araması başarısız',
        ) from exc
    return GooglePlacesNearbyResponse(
        places=places,
        cached=cached,
        radius_m=radius_m,
    )


@router.get('/places/{place_id}', response_model=GooglePlaceDetailResponse)
async def place_detail(place_id: str) -> GooglePlaceDetailResponse:
    if not settings.google_places_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Google Places API yapılandırılmamış',
        )
    try:
        detail = await google_places_service.get_place(place_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    wiki_text, sources = await fetch_wikipedia_summary(detail.name)
    if wiki_text and not detail.editorial_summary:
        detail.editorial_summary = wiki_text
    detail.sources = sources
    return detail


@router.post('/routes', response_model=ComputeRouteResponse)
async def compute_route(payload: ComputeRouteRequest) -> ComputeRouteResponse:
    if not settings.google_routes_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Google Routes API yapılandırılmamış',
        )
    try:
        return await google_routes_service.compute_route(
            origin_lat=payload.origin_lat,
            origin_lng=payload.origin_lng,
            dest_lat=payload.dest_lat,
            dest_lng=payload.dest_lng,
            travel_mode=payload.travel_mode,
            waypoints=[(w.lat, w.lng) for w in payload.waypoints],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail='Rota hesaplanamadı',
        ) from exc
