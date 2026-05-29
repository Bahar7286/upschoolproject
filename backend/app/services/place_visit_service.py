from app.core.exceptions import PlaceNotFoundError
from app.repositories.place_repository import PlaceRepository
from app.repositories.place_visit_repository import PlaceVisitRepository
from app.schemas.place_visit_schema import (
    VISIT_ENTITY_TYPES,
    VISIT_SOURCES,
    AlsoVisitedItem,
    AlsoVisitedResponse,
    PlaceVisitCreate,
)


class PlaceVisitService:
    def __init__(
        self,
        visit_repo: PlaceVisitRepository,
        place_repo: PlaceRepository,
    ) -> None:
        self.visits = visit_repo
        self.places = place_repo

    async def record_visit(self, user_id: int, payload: PlaceVisitCreate) -> None:
        entity_type = payload.entity_type.strip().lower()
        if entity_type not in VISIT_ENTITY_TYPES:
            raise ValueError(f'Geçersiz entity_type. Kullanın: {", ".join(VISIT_ENTITY_TYPES)}')
        source = payload.source.strip().lower()
        if source not in VISIT_SOURCES:
            raise ValueError(f'Geçersiz source. Kullanın: {", ".join(VISIT_SOURCES)}')

        entity_key = payload.entity_key.strip()
        place_name = payload.place_name.strip()
        city = payload.city.strip()

        if entity_type == 'place':
            place_id = int(entity_key)
            if place_id <= 0:
                raise ValueError('Geçersiz place id')
            place = await self.places.get_by_id(place_id)
            if not place:
                raise PlaceNotFoundError(place_id)
            place_name = place_name or place.name
            city = city or place.city

        await self.visits.upsert_visit(
            user_id=user_id,
            entity_type=entity_type,
            entity_key=entity_key,
            place_name=place_name,
            city=city,
            source=source,
        )

    async def also_visited(
        self,
        *,
        entity_type: str,
        entity_key: str,
        city: str | None = None,
        limit: int = 6,
        source_place_name: str = '',
    ) -> AlsoVisitedResponse:
        entity_type = entity_type.strip().lower()
        entity_key = entity_key.strip()
        total = await self.visits.count_target_visitors(
            entity_type=entity_type,
            entity_key=entity_key,
        )
        if total == 0:
            return AlsoVisitedResponse(
                entity_type=entity_type,
                entity_key=entity_key,
                source_place_name=source_place_name,
                total_visitors=0,
                items=[],
            )

        rows = await self.visits.co_visit_counts(
            entity_type=entity_type,
            entity_key=entity_key,
            city=city,
            limit=limit,
        )
        items: list[AlsoVisitedItem] = []
        for et, ek, name, row_city, count in rows:
            item = await self._enrich_item(et, ek, name, row_city, count, total)
            items.append(item)

        return AlsoVisitedResponse(
            entity_type=entity_type,
            entity_key=entity_key,
            source_place_name=source_place_name,
            total_visitors=total,
            items=items,
        )

    async def _enrich_item(
        self,
        entity_type: str,
        entity_key: str,
        name: str,
        city: str,
        count: int,
        total: int,
    ) -> AlsoVisitedItem:
        place_id: int | None = None
        google_place_id: str | None = None
        category: str | None = None
        image_url: str | None = None
        latitude: float | None = None
        longitude: float | None = None

        if entity_type == 'place':
            place_id = int(entity_key)
            place = await self.places.get_by_id(place_id)
            if place:
                name = place.name
                city = place.city
                category = place.category
                image_url = place.image_url
                latitude = place.latitude
                longitude = place.longitude
        else:
            google_place_id = entity_key

        percent = round((count / total) * 100, 1) if total else 0.0
        return AlsoVisitedItem(
            entity_type=entity_type,
            entity_key=entity_key,
            place_id=place_id,
            google_place_id=google_place_id,
            name=name or 'Mekan',
            city=city,
            category=category,
            image_url=image_url,
            latitude=latitude,
            longitude=longitude,
            co_visit_count=count,
            co_visit_percent=percent,
        )
