"""CLI: Wikipedia görsellerini DB'ye yazar.

Usage:
  python -m app.scripts.sync_images
  python -m app.scripts.sync_images --scope places --limit 100
  python -m app.scripts.sync_images --scope districts --city-id 34
  python -m app.scripts.sync_images --force
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from app.db.connection import SessionLocal
from app.services.image_sync_service import ImageSyncService


async def main() -> int:
    parser = argparse.ArgumentParser(description='Sync region images from Wikipedia')
    parser.add_argument('--scope', choices=('all', 'cities', 'districts', 'places'), default='all')
    parser.add_argument('--city-id', type=int, default=None)
    parser.add_argument('--limit', type=int, default=200)
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()

    async with SessionLocal() as session:
        service = ImageSyncService(db=session)
        if args.scope == 'cities':
            r = await service.sync_cities(force=args.force)
            print(f'cities: updated={r.updated} skipped={r.skipped} failed={r.failed}')
        elif args.scope == 'districts':
            r = await service.sync_districts(city_id=args.city_id, limit=args.limit, force=args.force)
            print(f'districts: updated={r.updated} skipped={r.skipped} failed={r.failed}')
        elif args.scope == 'places':
            r = await service.sync_places(limit=args.limit, force=args.force)
            print(f'places: updated={r.updated} skipped={r.skipped} failed={r.failed}')
        else:
            stats = await service.sync_all(
                city_id=args.city_id,
                places_limit=args.limit,
                force=args.force,
            )
            print(stats)
    return 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
