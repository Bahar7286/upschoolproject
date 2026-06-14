import json
import logging
import math
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.models.place_model import Place
from app.repositories.city_repository import CityRepository
from app.repositories.district_repository import DistrictRepository
from app.repositories.place_repository import PlaceRepository

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PoiSyncResult:
    fetched: int
    created: int
    skipped_duplicates: int


_CATEGORY_MAP: dict[str, str] = {
    # sightseeing
    'museum': 'museum',
    'gallery': 'museum',
    'artwork': 'street',
    'attraction': 'historical',
    'castle': 'historical',
    'ruins': 'historical',
    'memorial': 'historical',
    'monument': 'historical',
    'mosque': 'mosque',
    'place_of_worship': 'mosque',
    'marketplace': 'bazaar',
    # food
    'restaurant': 'restaurant',
    'cafe': 'restaurant',
    'fast_food': 'restaurant',
    # lodging
    'hotel': 'accommodation',
    'hostel': 'accommodation',
    'motel': 'accommodation',
    'guest_house': 'accommodation',
}


class PoiSyncService:
    def __init__(
        self,
        city_repo: CityRepository,
        district_repo: DistrictRepository,
        place_repo: PlaceRepository,
    ) -> None:
        self.cities = city_repo
        self.districts = district_repo
        self.places = place_repo

    async def sync_city(
        self,
        *,
        city_id: int,
        radius_m: int = 25000,
        limit: int = 250,
    ) -> PoiSyncResult:
        city = await self.cities.get_by_id(city_id)
        if not city:
            raise ValueError('City not found')
        if not city.center_lat or not city.center_lng:
            raise ValueError('City coordinates missing')
        return await self._sync_bbox(
            city_id=city_id,
            city_name=city.name_tr,
            district_name='',
            center_lat=city.center_lat,
            center_lng=city.center_lng,
            radius_m=radius_m,
            limit=limit,
        )

    async def sync_district(
        self,
        *,
        district_id: int,
        radius_m: int = 12000,
        limit: int = 250,
    ) -> PoiSyncResult:
        district = await self.districts.get_by_id(district_id)
        if not district:
            raise ValueError('District not found')
        if not district.center_lat or not district.center_lng:
            raise ValueError('District coordinates missing')
        # Lookup city for name
        city = await self.cities.get_by_id(district.city_id)
        city_name = city.name_tr if city else ''
        return await self._sync_bbox(
            city_id=district.city_id,
            city_name=city_name,
            district_name=district.name_tr,
            center_lat=district.center_lat,
            center_lng=district.center_lng,
            radius_m=radius_m,
            limit=limit,
        )

    async def _sync_bbox(
        self,
        *,
        city_id: int | None,
        city_name: str,
        district_name: str,
        center_lat: float,
        center_lng: float,
        radius_m: int,
        limit: int,
    ) -> PoiSyncResult:
        # Rough bbox: radius_m converted to degrees (~111km per degree)
        dlat = radius_m / 111_000
        dlng = radius_m / (111_000 * max(0.2, abs(__import__('math').cos(__import__('math').radians(center_lat)))))
        south = center_lat - dlat
        north = center_lat + dlat
        west = center_lng - dlng
        east = center_lng + dlng

        query = f"""
[out:json][timeout:25];
(
  node[\"tourism\"~\"museum|attraction|gallery|hotel|hostel|guest_house\"][\"name\"]({south},{west},{north},{east});
  node[\"amenity\"~\"restaurant|cafe|fast_food\"][\"name\"]({south},{west},{north},{east});
  node[\"historic\"][\"name\"]({south},{west},{north},{east});
  node[\"place_of_worship\"~\"mosque\"][\"name\"]({south},{west},{north},{east});
  node[\"shop\"~\"mall|supermarket|department_store\"][\"name\"]({south},{west},{north},{east});
);
out center {min(limit, 500)};
"""
        url = f'{settings.overpass_base_url}/interpreter'
        headers = {
            'accept': 'application/json',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'user-agent': settings.overpass_user_agent,
        }

        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.post(url, content=query.encode('utf-8'), headers=headers)
            resp.raise_for_status()
            payload = resp.json()

        elements = payload.get('elements', [])
        city_districts = await self.districts.list_by_city_id(city_id) if city_id else []
        created = 0
        skipped = 0
        for el in elements:
            tags = el.get('tags') or {}
            name = (tags.get('name') or '').strip()
            if not name:
                continue
            lat = el.get('lat')
            lng = el.get('lon')
            if lat is None or lng is None:
                continue

            category = self._map_category(tags)
            if not category:
                continue

            resolved_district = (district_name or '').strip()
            if not resolved_district and city_districts:
                resolved_district = self._nearest_district_name(city_districts, float(lat), float(lng))

            # District can be empty if city sync; keep empty to preserve compatibility.
            if await self.places.likely_duplicate(
                name=name,
                city=city_name or '',
                district=resolved_district or '',
                lat=float(lat),
                lng=float(lng),
            ):
                skipped += 1
                continue

            place = Place(
                name=name[:200],
                category=category,
                city=(city_name or '').strip() or 'Türkiye',
                district=resolved_district,
                latitude=float(lat),
                longitude=float(lng),
                description=(tags.get('description') or '').strip()[:8000],
                tags=self._tags_from_osm(tags),
                is_partner=0,
            )
            await self.places.create(place)
            created += 1

        return PoiSyncResult(fetched=len(elements), created=created, skipped_duplicates=skipped)

    @staticmethod
    def _nearest_district_name(districts: list, lat: float, lng: float) -> str:
        best_name = ''
        best_dist = float('inf')
        for d in districts:
            if d.center_lat is None or d.center_lng is None:
                continue
            dist = _haversine_m(lat, lng, float(d.center_lat), float(d.center_lng))
            if dist < best_dist:
                best_dist = dist
                best_name = (d.name_tr or '').strip()
        return best_name

    @staticmethod
    def _map_category(tags: dict) -> str | None:
        tourism = tags.get('tourism')
        amenity = tags.get('amenity')
        historic = tags.get('historic')
        shop = tags.get('shop')
        place_of_worship = tags.get('place_of_worship')

        if tourism and tourism in _CATEGORY_MAP:
            return _CATEGORY_MAP[tourism]
        if amenity and amenity in _CATEGORY_MAP:
            return _CATEGORY_MAP[amenity]
        if place_of_worship and place_of_worship in _CATEGORY_MAP:
            return _CATEGORY_MAP[place_of_worship]
        if historic:
            return 'historical'
        if shop:
            return 'bazaar'
        return None

    @staticmethod
    def _tags_from_osm(tags: dict) -> str:
        collected: list[str] = []
        for key in ('tourism', 'amenity', 'historic', 'cuisine'):
            val = tags.get(key)
            if isinstance(val, str) and val.strip():
                collected.append(val.strip().lower())
        # De-dup + join
        unique = list(dict.fromkeys(collected))
        return ','.join(unique)


def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlng / 2) ** 2
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))

