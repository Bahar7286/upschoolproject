"""Geo data audit — cities, districts, places coverage."""

from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import func, select

from app.data.tr_districts import TR_DISTRICTS
from app.db.connection import async_session_factory
from app.models.city_model import City
from app.models.district_model import District
from app.models.place_model import Place


async def main() -> None:
    async with async_session_factory() as session:
        city_count = (await session.execute(select(func.count(City.city_id)))).scalar_one()
        district_count = (await session.execute(select(func.count(District.district_id)))).scalar_one()
        place_count = (await session.execute(select(func.count(Place.place_id)))).scalar_one()
        print(f'Cities in DB: {city_count} (expected 81)')
        print(f'Districts in DB: {district_count} (json: {len(TR_DISTRICTS)})')
        print(f'Places in DB: {place_count}')

        zero_coords = (
            await session.execute(
                select(func.count(District.district_id)).where(
                    District.center_lat == City.center_lat,
                    District.center_lat != 0,
                )
            )
        ).scalar_one()
        print(f'Districts sharing city center (approx): {zero_coords}')

        by_city = await session.execute(
            select(Place.city, func.count(Place.place_id)).group_by(Place.city).order_by(func.count(Place.place_id).desc())
        )
        print('\nPlaces by city:')
        for row in by_city.all():
            print(f'  {row[0]}: {row[1]}')


if __name__ == '__main__':
    asyncio.run(main())
