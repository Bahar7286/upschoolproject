"""Wikipedia / Wikimedia thumbnail lookup for region images."""

from __future__ import annotations

import logging
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)


async def fetch_wikipedia_thumbnail(query: str, *, lang: str = 'tr', width: int = 800) -> str:
    """Returns thumbnail URL or empty string."""
    q = query.strip()
    if not q:
        return ''

    for try_lang in (lang, 'en'):
        url = f'https://{try_lang}.wikipedia.org/api/rest_v1/page/summary/{quote(q)}'
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers={'Accept': 'application/json'})
            if resp.status_code >= 400:
                continue
            data = resp.json()
            thumb = data.get('thumbnail') or {}
            if isinstance(thumb, dict) and thumb.get('source'):
                src = str(thumb['source'])
                if width and 'width=' in src:
                    return src
                return src
            original = data.get('originalimage') or {}
            if isinstance(original, dict) and original.get('source'):
                return str(original['source'])
        except Exception as exc:
            logger.debug('Wikipedia thumb %s (%s): %s', q, try_lang, exc)
    return ''


async def resolve_city_image(name_tr: str) -> str:
    for q in (f'{name_tr}', f'{name_tr} (il)', f'{name_tr}, Turkey'):
        url = await fetch_wikipedia_thumbnail(q)
        if url:
            return url
    return ''


async def resolve_district_image(district_name: str, city_name: str) -> str:
    for q in (
        f'{district_name}, {city_name}',
        f'{district_name} ({city_name})',
        district_name,
    ):
        url = await fetch_wikipedia_thumbnail(q)
        if url:
            return url
    return ''


async def resolve_place_image(place_name: str, city_name: str) -> str:
    for q in (place_name, f'{place_name}, {city_name}', f'{place_name} ({city_name})'):
        url = await fetch_wikipedia_thumbnail(q)
        if url:
            return url
    return ''
