from app.core.exceptions import PlaceNotFoundError
from app.models.place_model import Place
from app.repositories.place_repository import PlaceRepository
from app.schemas.place_schema import (
    PLACE_CATEGORIES,
    PlaceCategoryCount,
    PlaceCreate,
    PlaceNearbyResponse,
    PlaceResponse,
    PlaceUpdate,
)


class PlaceService:
    def __init__(self, repository: PlaceRepository) -> None:
        self.repository = repository

    @staticmethod
    def _to_response(place: Place) -> PlaceResponse:
        tags = [t.strip() for t in place.tags.split(',') if t.strip()]
        return PlaceResponse(
            place_id=place.place_id,
            name=place.name,
            category=place.category,
            city=place.city,
            district=place.district,
            latitude=place.latitude,
            longitude=place.longitude,
            description=place.description,
            tags=tags,
            is_partner=bool(place.is_partner),
            image_url=place.image_url,
        )

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
    ) -> list[PlaceResponse]:
        places = await self.repository.list_places(
            city=city,
            district=district,
            category=category,
            query=query,
            min_lat=min_lat,
            max_lat=max_lat,
            min_lng=min_lng,
            max_lng=max_lng,
            limit=limit,
        )
        return [self._to_response(p) for p in places]

    async def get_place(self, place_id: int) -> PlaceResponse:
        place = await self.repository.get_by_id(place_id)
        if not place:
            raise PlaceNotFoundError(place_id)
        return self._to_response(place)

    async def nearby(
        self,
        *,
        lat: float,
        lng: float,
        radius_m: float = 2000,
        category: str | None = None,
        city: str | None = None,
        limit: int = 30,
    ) -> list[PlaceNearbyResponse]:
        results = await self.repository.nearby(
            lat=lat,
            lng=lng,
            radius_m=radius_m,
            category=category,
            city=city,
            limit=limit,
        )
        return [
            PlaceNearbyResponse(
                **self._to_response(place).model_dump(),
                distance_m=round(dist, 1),
            )
            for place, dist in results
        ]

    async def category_stats(self, city: str | None = None) -> list[PlaceCategoryCount]:
        counts = await self.repository.count_by_category(city=city)
        return [PlaceCategoryCount(category=k, count=v) for k, v in sorted(counts.items())]

    @staticmethod
    def _join_tags(tags: list[str]) -> str:
        return ','.join(dict.fromkeys(t.strip() for t in tags if t.strip()))

    def _validate_category(self, category: str) -> None:
        if category not in PLACE_CATEGORIES:
            raise ValueError(f'Invalid category. Use: {", ".join(PLACE_CATEGORIES)}')

    async def create_place(self, payload: PlaceCreate) -> PlaceResponse:
        self._validate_category(payload.category)
        place = Place(
            name=payload.name.strip(),
            category=payload.category,
            city=payload.city.strip(),
            district=payload.district.strip(),
            latitude=payload.latitude,
            longitude=payload.longitude,
            description=payload.description.strip(),
            tags=self._join_tags(payload.tags),
            is_partner=1 if payload.is_partner else 0,
        )
        created = await self.repository.create(place)
        return self._to_response(created)

    async def update_place(self, place_id: int, payload: PlaceUpdate) -> PlaceResponse:
        place = await self.repository.get_by_id(place_id)
        if not place:
            raise PlaceNotFoundError(place_id)
        data = payload.model_dump(exclude_unset=True)
        if 'category' in data and data['category'] is not None:
            self._validate_category(data['category'])
            place.category = data['category']
        if 'name' in data and data['name'] is not None:
            place.name = data['name'].strip()
        if 'city' in data and data['city'] is not None:
            place.city = data['city'].strip()
        if 'district' in data and data['district'] is not None:
            place.district = data['district'].strip()
        if 'latitude' in data and data['latitude'] is not None:
            place.latitude = data['latitude']
        if 'longitude' in data and data['longitude'] is not None:
            place.longitude = data['longitude']
        if 'description' in data and data['description'] is not None:
            place.description = data['description'].strip()
        if 'tags' in data and data['tags'] is not None:
            place.tags = self._join_tags(data['tags'])
        if 'is_partner' in data and data['is_partner'] is not None:
            place.is_partner = 1 if data['is_partner'] else 0
        updated = await self.repository.save(place)
        return self._to_response(updated)

    async def delete_place(self, place_id: int) -> None:
        place = await self.repository.get_by_id(place_id)
        if not place:
            raise PlaceNotFoundError(place_id)
        await self.repository.delete(place)
