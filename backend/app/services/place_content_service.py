"""Mekan açıklamalarını Wikipedia ile zenginleştir — sesli anlatım için."""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.place_model import Place
from app.services.wikipedia_service import fetch_place_wikipedia_content

logger = logging.getLogger(__name__)

MIN_RICH_LEN = 180


async def enrich_place_description(
    name: str,
    city: str,
    district: str,
    category: str,
    current: str | None,
) -> str:
    """Mevcut açıklamayı Wikipedia özetiyle genişlet."""
    base = (current or '').strip()
    if len(base) >= MIN_RICH_LEN and 'Wikipedia' not in base:
        return base

    wiki_text, _ = await fetch_place_wikipedia_content(name, city=city, district=district)
    parts: list[str] = []
    if base and base != name:
        parts.append(base)
    if wiki_text:
        parts.append(wiki_text)
    if category and category not in ('historical', ''):
        parts.append(f'Kategori: {category}.')
    if city:
        parts.append(f'Konum: {district + ", " if district else ""}{city}, Türkiye.')
    merged = '\n\n'.join(p for p in parts if p.strip())
    return merged[:3500] if merged else base or f'{name}, {city} bölgesinde ziyaret edilebilecek önemli bir kültür noktasıdır.'


async def enrich_places_batch(session: AsyncSession, *, limit: int = 250) -> int:
    """Kısa açıklamalı mekanları Wikipedia ile güncelle."""
    stmt = (
        select(Place)
        .where(or_(Place.description.is_(None), func.length(Place.description) < MIN_RICH_LEN))
        .order_by(Place.place_id)
        .limit(limit)
    )
    places = list((await session.execute(stmt)).scalars().all())
    if not places:
        return 0

    updated = 0
    for place in places:
        try:
            new_desc = await enrich_place_description(
                place.name,
                place.city,
                place.district or '',
                place.category or 'historical',
                place.description,
            )
            if new_desc and new_desc != (place.description or ''):
                place.description = new_desc
                updated += 1
        except Exception as exc:
            logger.debug('Place enrich skip %s: %s', place.name, exc)
        await asyncio.sleep(0.12)

    if updated:
        await session.commit()
        logger.info('Place descriptions enriched: %s/%s', updated, len(places))
    return updated
