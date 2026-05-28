"""Wikipedia summary for place narration enrichment."""

from __future__ import annotations

import logging
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)


async def fetch_wikipedia_summary(query: str, lang: str = 'tr') -> tuple[str, list[dict[str, str]]]:
    """Returns (extract text, sources)."""
    q = query.strip()
    if not q:
        return '', []

    url = f'https://{lang}.wikipedia.org/api/rest_v1/page/summary/{quote(q)}'
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, headers={'Accept': 'application/json'})
        if resp.status_code == 404 and lang == 'tr':
            url_en = f'https://en.wikipedia.org/api/rest_v1/page/summary/{quote(q)}'
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url_en, headers={'Accept': 'application/json'})
        if resp.status_code >= 400:
            return '', []
        data = resp.json()
        extract = str(data.get('extract', '')).strip()
        title = str(data.get('title', q))
        content_urls = data.get('content_urls') or {}
        desktop = content_urls.get('desktop') or {}
        page_url = str(desktop.get('page', ''))
        sources = [{'title': f'Wikipedia: {title}', 'url': page_url}] if page_url else []
        return extract[:2000], sources
    except Exception as exc:
        logger.debug('Wikipedia fetch failed: %s', exc)
        return '', []
