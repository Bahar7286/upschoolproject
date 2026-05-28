"""Sync image_url for cities, districts, and places from Wikipedia thumbnails."""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.city_model import City
from app.models.district_model import District
from app.models.place_model import Place
from app.services.wikipedia_image_service import (
    resolve_city_image,
    resolve_district_image,
    resolve_place_image,
)

logger = logging.getLogger(__name__)


class ImageSyncResult:
    def __init__(self) -> None:
        self.updated = 0
        self.skipped = 0
        self.failed = 0


class ImageSyncService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def sync_cities(self, *, limit: int = 81, force: bool = False) -> ImageSyncResult:
        result = ImageSyncResult()
        stmt = select(City).order_by(City.city_id).limit(limit)
        cities = list((await self.db.execute(stmt)).scalars().all())
        for city in cities:
            if city.image_url and not force:
                result.skipped += 1
                continue
            url = await resolve_city_image(city.name_tr)
            await asyncio.sleep(0.15)
            if url:
                city.image_url = url
                result.updated += 1
            else:
                result.failed += 1
        await self.db.commit()
        return result

    async def sync_districts(
        self,
        *,
        city_id: int | None = None,
        limit: int = 200,
        force: bool = False,
    ) -> ImageSyncResult:
        result = ImageSyncResult()
        stmt = select(District).order_by(District.district_id)
        if city_id:
            stmt = stmt.where(District.city_id == city_id)
        stmt = stmt.limit(limit)
        rows = list((await self.db.execute(stmt)).scalars().all())
        city_names: dict[int, str] = {}
        for d in rows:
            if d.city_id not in city_names:
                c = await self.db.get(City, d.city_id)
                city_names[d.city_id] = c.name_tr if c else ''
            if d.image_url and not force:
                result.skipped += 1
                continue
            url = await resolve_district_image(d.name_tr, city_names.get(d.city_id, ''))
            await asyncio.sleep(0.12)
            if url:
                d.image_url = url
                result.updated += 1
            else:
                result.failed += 1
        await self.db.commit()
        return result

    async def sync_places(
        self,
        *,
        city: str | None = None,
        limit: int = 150,
        force: bool = False,
    ) -> ImageSyncResult:
        result = ImageSyncResult()
        stmt = select(Place).order_by(Place.place_id)
        if city:
            stmt = stmt.where(Place.city.ilike(city.strip()))
        stmt = stmt.limit(limit)
        places = list((await self.db.execute(stmt)).scalars().all())
        for p in places:
            if p.image_url and not force:
                result.skipped += 1
                continue
            url = await resolve_place_image(p.name, p.city)
            await asyncio.sleep(0.12)
            if url:
                p.image_url = url
                result.updated += 1
            else:
                result.failed += 1
        await self.db.commit()
        return result

    async def sync_all(
        self,
        *,
        city_id: int | None = None,
        places_limit: int = 200,
        force: bool = False,
    ) -> dict[str, int]:
        cities = await self.sync_cities(limit=81, force=force)
        districts = await self.sync_districts(city_id=city_id, limit=500 if city_id else 200, force=force)
        places = await self.sync_places(limit=places_limit, force=force)
        return {
            'cities_updated': cities.updated,
            'districts_updated': districts.updated,
            'places_updated': places.updated,
            'cities_failed': cities.failed,
            'districts_failed': districts.failed,
            'places_failed': places.failed,
        }
