"""Wikipedia summary for place narration enrichment."""

from __future__ import annotations

import logging
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)


def _encode_variants(title: str) -> list[str]:
    t = title.strip()
    if not t:
        return []
    variants = [quote(t), quote(t.replace(' ', '_'))]
    return list(dict.fromkeys(variants))


async def _fetch_one(query: str, lang: str) -> tuple[str, str, str]:
    """Returns (extract, title, page_url)."""
    for encoded in _encode_variants(query):
        url = f'https://{lang}.wikipedia.org/api/rest_v1/page/summary/{encoded}'
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers={'Accept': 'application/json'})
            if resp.status_code >= 400:
                continue
            data = resp.json()
            extract = str(data.get('extract', '')).strip()
            if not extract:
                continue
            title = str(data.get('title', query))
            content_urls = data.get('content_urls') or {}
            desktop = content_urls.get('desktop') or {}
            page_url = str(desktop.get('page', ''))
            return extract, title, page_url
        except Exception as exc:
            logger.debug('Wikipedia %s (%s): %s', query, lang, exc)
    return '', '', ''


async def fetch_wikipedia_summary(query: str, lang: str = 'tr') -> tuple[str, list[dict[str, str]]]:
    """Returns (extract text, sources) — tek sorgu."""
    text, title, page_url = await _fetch_one(query, lang)
    if not text and lang == 'tr':
        text, title, page_url = await _fetch_one(query, 'en')
    sources = [{'title': f'Wikipedia: {title}', 'url': page_url}] if page_url else []
    return text[:2500], sources


async def fetch_place_wikipedia_content(
    place_name: str,
    *,
    city: str = '',
    district: str = '',
) -> tuple[str, list[dict[str, str]]]:
    """Mekan adı + şehir ile TR/EN Wikipedia özetlerini birleştir."""
    name = place_name.strip()
    if not name:
        return '', []

    city = city.strip()
    district = district.strip()
    queries = [
        name,
        f'{name}, {city}' if city else '',
        f'{name} ({city})' if city else '',
        f'{name}, {district}' if district and district != city else '',
        f'{name}, Turkey',
    ]
    seen_text: set[str] = set()
    sources: list[dict[str, str]] = []
    chunks: list[str] = []

    for q in dict.fromkeys(q for q in queries if q):
        for lang in ('tr', 'en'):
            text, title, page_url = await _fetch_one(q, lang)
            if not text or text in seen_text:
                continue
            seen_text.add(text)
            prefix = 'TR' if lang == 'tr' else 'EN'
            chunks.append(f'[{prefix}] {text}')
            if page_url:
                sources.append({'title': f'Wikipedia ({lang}): {title}', 'url': page_url})
            if len(chunks) >= 2:
                break
        if len(chunks) >= 2:
            break

    combined = '\n\n'.join(chunks)[:3500]
    return combined, sources
