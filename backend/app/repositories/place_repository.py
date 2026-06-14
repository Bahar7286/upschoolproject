from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.place_model import Place
from app.repositories.base import BaseRepository
from app.utils.geolocation import calculate_distance_meters


def _tr_ascii(value: str) -> str:
    table = str.maketrans(
        {
            'İ': 'I',
            'I': 'I',
            'ı': 'i',
            'Ş': 'S',
            'ş': 's',
            'Ğ': 'G',
            'ğ': 'g',
            'Ü': 'U',
            'ü': 'u',
            'Ö': 'O',
            'ö': 'o',
            'Ç': 'C',
            'ç': 'c',
        }
    )
    return value.translate(table)


def _variants(value: str) -> set[str]:
    raw = value.strip()
    if not raw:
        return set()
    ascii_v = _tr_ascii(raw)
    # Also handle common Istanbul casing mismatch
    extra: set[str] = set()
    if raw.lower() in {'i̇stanbul', 'istanbul', 'İstanbul'.lower()}:
        extra.add('Istanbul')
        extra.add('istanbul')
        extra.add('İstanbul')
    return {raw, ascii_v, raw.lower(), ascii_v.lower(), *extra}


class PlaceRepository(BaseRepository):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def list_places(
        self,
        *,
        city: str | None = None,
        district: str | None = None,
        category: str | None = None,
        query: str | None = None,
        min_lat: float | None = None,
        max_lat: float | None = None,
        min_lng: float | None = None,
        max_lng: float | None = None,
        limit: int = 200,
    ) -> list[Place]:
        stmt = select(Place).order_by(Place.name.asc())
        if city:
            opts = {v.lower() for v in _variants(city)}
            stmt = stmt.where(func.lower(Place.city).in_(opts))
        if district:
            opts = {v.lower() for v in _variants(district)}
            stmt = stmt.where(func.lower(Place.district).in_(opts))
        if category:
            stmt = stmt.where(Place.category == category)
        if query:
            like = f'%{query.strip()}%'
            stmt = stmt.where(Place.name.ilike(like) | Place.description.ilike(like))
        if min_lat is not None and max_lat is not None:
            stmt = stmt.where(Place.latitude.between(min(min_lat, max_lat), max(min_lat, max_lat)))
        if min_lng is not None and max_lng is not None:
            stmt = stmt.where(Place.longitude.between(min(min_lng, max_lng), max(min_lng, max_lng)))
        stmt = stmt.limit(min(limit, 500))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def likely_duplicate(
        self,
        *,
        name: str,
        city: str,
        district: str,
        lat: float,
        lng: float,
        radius_m: float = 60,
    ) -> bool:
        # Fast duplicate guard: same name + city/district, and very close coordinates.
        candidates = await self.list_places(city=city, district=district, query=name, limit=50)
        for place in candidates:
            dist = calculate_distance_meters(
                user_lat=lat,
                user_lng=lng,
                target_lat=place.latitude,
                target_lng=place.longitude,
            )
            if dist <= radius_m:
                return True
        return False

    async def get_by_id(self, place_id: int) -> Place | None:
        return await self.db.get(Place, place_id)

    async def create(self, place: Place) -> Place:
        self.db.add(place)
        return await self._commit_refresh(place)

    async def save(self, place: Place) -> Place:
        return await self._commit_refresh(place)

    async def delete(self, place: Place) -> None:
        await self.db.delete(place)
        await self.db.commit()

    async def count_by_category(self, city: str | None = None) -> dict[str, int]:
        stmt = select(Place.category, func.count(Place.place_id))
        if city:
            opts = {v.lower() for v in _variants(city)}
            stmt = stmt.where(func.lower(Place.city).in_(opts))
        stmt = stmt.group_by(Place.category)
        result = await self.db.execute(stmt)
        return {row[0]: int(row[1]) for row in result.all()}

    async def nearby(
        self,
        *,
        lat: float,
        lng: float,
        radius_m: float = 2000,
        category: str | None = None,
        city: str | None = None,
        limit: int = 30,
    ) -> list[tuple[Place, float]]:
        places = await self.list_places(city=city, category=category, limit=500)
        scored: list[tuple[Place, float]] = []
        for place in places:
            dist = calculate_distance_meters(
                user_lat=lat,
                user_lng=lng,
                target_lat=place.latitude,
                target_lng=place.longitude,
            )
            if dist <= radius_m:
                scored.append((place, dist))
        scored.sort(key=lambda item: item[1])
        return scored[:limit]
