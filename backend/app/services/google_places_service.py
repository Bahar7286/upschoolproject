"""Google Places API (New) proxy with in-memory TTL cache."""

from __future__ import annotations

import hashlib
import logging
import time
from typing import Any

import httpx

from app.core.config import settings
from app.schemas.google_schema import GooglePlaceDetailResponse, GooglePlaceSummary

logger = logging.getLogger(__name__)

# Our category -> Google Places API (New) includedTypes
CATEGORY_TO_GOOGLE_TYPES: dict[str, list[str]] = {
    'museum': ['museum', 'art_gallery', 'tourist_attraction'],
    'palace': ['tourist_attraction', 'historical_landmark'],
    'historical': ['tourist_attraction', 'museum', 'church', 'historical_landmark'],
    'mosque': ['mosque', 'place_of_worship'],
    'bazaar': ['shopping_mall', 'market', 'department_store'],
    'street': ['tourist_attraction', 'park'],
    'restaurant': ['restaurant', 'cafe', 'bakery', 'meal_takeaway'],
    'accommodation': ['lodging', 'hotel', 'hostel', 'guest_house', 'bed_and_breakfast'],
}

NEARBY_FIELD_MASK = (
    'places.id,places.displayName,places.formattedAddress,places.location,'
    'places.rating,places.userRatingCount,places.types,places.googleMapsUri,places.photos'
)

DETAIL_FIELD_MASK = (
    'id,displayName,formattedAddress,location,rating,userRatingCount,'
    'websiteUri,googleMapsUri,editorialSummary,regularOpeningHours,types,photos'
)

_cache: dict[str, tuple[float, Any]] = {}
_CACHE_TTL_SEC = 6 * 3600  # 6 hours
_RATE: dict[str, list[float]] = {}
_RATE_WINDOW = 60
_RATE_MAX = 30


def _cache_get(key: str) -> Any | None:
    entry = _cache.get(key)
    if not entry:
        return None
    ts, val = entry
    if time.time() - ts > _CACHE_TTL_SEC:
        del _cache[key]
        return None
    return val


def _cache_set(key: str, val: Any) -> None:
    _cache[key] = (time.time(), val)


def _rate_ok(client_key: str) -> bool:
    now = time.time()
    hits = _RATE.get(client_key, [])
    hits = [t for t in hits if now - t < _RATE_WINDOW]
    if len(hits) >= _RATE_MAX:
        return False
    hits.append(now)
    _RATE[client_key] = hits
    return True


def _api_key() -> str:
    key = settings.google_places_api_key.strip()
    if not key:
        raise ValueError('GOOGLE_PLACES_API_KEY yapılandırılmamış')
    return key


def google_places_enabled() -> bool:
    return bool(settings.google_places_api_key.strip())


def _display_name(place: dict) -> str:
    dn = place.get('displayName') or {}
    if isinstance(dn, dict):
        return str(dn.get('text', ''))
    return str(dn)


def _location(place: dict) -> tuple[float, float]:
    loc = place.get('location') or {}
    return float(loc.get('latitude', 0)), float(loc.get('longitude', 0))


def _photo_media_url(place: dict) -> str:
    photos = place.get('photos') or []
    if not photos:
        return ''
    name = str((photos[0] or {}).get('name', ''))
    if not name:
        return ''
    return (
        f'https://places.googleapis.com/v1/{name}/media'
        f'?maxHeightPx=480&maxWidthPx=720&key={_api_key()}'
    )


def _infer_category(types: list[str], requested: str | None = None) -> str:
    if requested and requested in CATEGORY_TO_GOOGLE_TYPES:
        return requested
    lowered = {t.lower() for t in types}
    if lowered & {'restaurant', 'cafe', 'bakery', 'meal_takeaway', 'food', 'bar'}:
        return 'restaurant'
    if lowered & {'lodging', 'hotel', 'hostel', 'guest_house', 'bed_and_breakfast'}:
        return 'accommodation'
    if lowered & {'museum', 'art_gallery', 'tourist_attraction', 'historical_landmark'}:
        return 'museum'
    return requested or 'museum'


def _summarize(place: dict, *, category: str | None = None) -> GooglePlaceSummary:
    lat, lng = _location(place)
    pid = str(place.get('id', ''))
    if pid.startswith('places/'):
        pid = pid.split('/')[-1]
    types = list(place.get('types') or [])
    cat = _infer_category(types, category)
    return GooglePlaceSummary(
        place_id=pid,
        name=_display_name(place),
        lat=lat,
        lng=lng,
        address=str(place.get('formattedAddress', '')),
        rating=place.get('rating'),
        user_rating_count=place.get('userRatingCount'),
        types=types,
        google_maps_uri=str(place.get('googleMapsUri', '')),
        photo_url=_photo_media_url(place),
        category=cat,
    )


def _sort_by_popularity(places: list[GooglePlaceSummary]) -> list[GooglePlaceSummary]:
    return sorted(
        places,
        key=lambda p: (p.user_rating_count or 0, p.rating or 0.0),
        reverse=True,
    )


# Google Nearby Search (New) allows max 20 results per HTTP request (no pagination).
_NEARBY_MULTI_TYPE_GROUPS: list[list[str]] = [
    ['tourist_attraction', 'museum', 'historical_landmark'],
    ['restaurant', 'cafe', 'bakery'],
    ['lodging', 'hotel', 'shopping_mall'],
    ['mosque', 'church', 'art_gallery'],
    ['market', 'tourist_attraction'],
]


class GooglePlacesService:
    async def _fetch_nearby_types(
        self,
        *,
        lat: float,
        lng: float,
        radius_m: float,
        types: list[str],
        category: str | None = None,
    ) -> list[GooglePlaceSummary]:
        body = {
            'includedTypes': types[:1] if len(types) == 1 else types[:3],
            'maxResultCount': 20,
            'rankPreference': 'POPULARITY',
            'locationRestriction': {
                'circle': {
                    'center': {'latitude': lat, 'longitude': lng},
                    'radius': min(float(radius_m), 50000.0),
                }
            },
            'languageCode': 'tr',
        }
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': _api_key(),
            'X-Goog-FieldMask': NEARBY_FIELD_MASK,
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                'https://places.googleapis.com/v1/places:searchNearby',
                json=body,
                headers=headers,
            )
        if resp.status_code >= 400:
            logger.warning('Places nearby %s: %s', resp.status_code, resp.text[:300])
            raise ValueError('Google Places araması başarısız')
        data = resp.json()
        return _sort_by_popularity([
            _summarize(p, category=category)
            for p in data.get('places', [])
            if _display_name(p)
        ])

    async def search_text(
        self,
        *,
        query: str,
        lat: float,
        lng: float,
        radius_m: float = 50000,
        client_key: str = 'global',
    ) -> tuple[list[GooglePlaceSummary], bool]:
        if not google_places_enabled():
            return [], False
        if not _rate_ok(client_key):
            raise ValueError('Çok fazla istek. Lütfen biraz bekleyin.')

        q = query.strip()
        if len(q) < 2:
            return [], False

        cache_key = hashlib.sha256(
            f'text:{q.lower()}:{lat:.4f}:{lng:.4f}:{radius_m:.0f}'.encode()
        ).hexdigest()
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached, True

        body = {
            'textQuery': q,
            'languageCode': 'tr',
            'maxResultCount': 20,
            'locationBias': {
                'circle': {
                    'center': {'latitude': lat, 'longitude': lng},
                    'radius': min(float(radius_m), 50000.0),
                }
            },
        }
        headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': _api_key(),
            'X-Goog-FieldMask': NEARBY_FIELD_MASK,
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                'https://places.googleapis.com/v1/places:searchText',
                json=body,
                headers=headers,
            )
        if resp.status_code >= 400:
            logger.warning('Places text search %s: %s', resp.status_code, resp.text[:300])
            raise ValueError('Google Places metin araması başarısız')

        places = _sort_by_popularity([
            _summarize(p)
            for p in resp.json().get('places', [])
            if _display_name(p)
        ])
        _cache_set(cache_key, places)
        return places, False

    async def search_nearby(
        self,
        *,
        lat: float,
        lng: float,
        radius_m: float,
        category: str | None,
        client_key: str = 'global',
    ) -> tuple[list[GooglePlaceSummary], bool]:
        if not google_places_enabled():
            return [], False
        if abs(lat) < 0.01 and abs(lng) < 0.01:
            raise ValueError('Geçersiz harita koordinatı (0,0)')
        if not _rate_ok(client_key):
            raise ValueError('Çok fazla istek. Lütfen biraz bekleyin.')

        types = CATEGORY_TO_GOOGLE_TYPES.get(category or '', ['tourist_attraction'])
        cache_key = hashlib.sha256(
            f'nearby:{lat:.4f}:{lng:.4f}:{radius_m:.0f}:{category or "multi"}:{",".join(sorted(types))}'.encode()
        ).hexdigest()
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached, True

        if category:
            merged: dict[str, GooglePlaceSummary] = {}
            for t in types:
                try:
                    batch = await self._fetch_nearby_types(
                        lat=lat, lng=lng, radius_m=radius_m, types=[t], category=category
                    )
                except ValueError:
                    continue
                for place in batch:
                    merged[place.place_id] = place
            places = _sort_by_popularity(list(merged.values()))[:40]
        else:
            merged: dict[str, GooglePlaceSummary] = {}
            for group in _NEARBY_MULTI_TYPE_GROUPS:
                try:
                    batch = await self._fetch_nearby_types(
                        lat=lat, lng=lng, radius_m=radius_m, types=group
                    )
                except ValueError:
                    continue
                for place in batch:
                    merged[place.place_id] = place
            places = _sort_by_popularity(list(merged.values()))[:80]

        _cache_set(cache_key, places)
        return places, False

    async def get_place(self, place_id: str) -> GooglePlaceDetailResponse:
        if not google_places_enabled:
            raise ValueError('GOOGLE_PLACES_API_KEY yapılandırılmamış')

        pid = place_id if place_id.startswith('places/') else f'places/{place_id}'
        cache_key = f'detail:{pid}'
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        headers = {
            'X-Goog-Api-Key': _api_key(),
            'X-Goog-FieldMask': DETAIL_FIELD_MASK,
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(f'https://places.googleapis.com/v1/{pid}', headers=headers)
        if resp.status_code >= 400:
            raise ValueError('Mekan detayı alınamadı')

        p = resp.json()
        lat, lng = _location(p)
        hours = ''
        roh = p.get('regularOpeningHours') or {}
        if isinstance(roh, dict) and roh.get('weekdayDescriptions'):
            hours = '; '.join(roh['weekdayDescriptions'][:2])

        editorial = p.get('editorialSummary') or {}
        editorial_text = ''
        if isinstance(editorial, dict):
            t = editorial.get('text')
            if isinstance(t, dict):
                editorial_text = str(t.get('text', ''))
            elif isinstance(t, str):
                editorial_text = t

        types = list(p.get('types') or [])
        detail = GooglePlaceDetailResponse(
            place_id=place_id.split('/')[-1],
            name=_display_name(p),
            lat=lat,
            lng=lng,
            formatted_address=str(p.get('formattedAddress', '')),
            rating=p.get('rating'),
            user_rating_count=p.get('userRatingCount'),
            website_uri=str(p.get('websiteUri', '')),
            google_maps_uri=str(p.get('googleMapsUri', '')),
            editorial_summary=editorial_text,
            opening_hours=hours,
            types=types,
            sources=[],
            photo_url=_photo_media_url(p),
            category=_infer_category(types),
        )
        _cache_set(cache_key, detail)
        return detail


google_places_service = GooglePlacesService()
