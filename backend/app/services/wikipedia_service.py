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


def _place_wikipedia_queries(name: str, city: str, district: str) -> list[str]:
    return list(
        dict.fromkeys(
            q
            for q in (
                name,
                f'{name}, {city}' if city else '',
                f'{name} ({city})' if city else '',
                f'{name}, {district}' if district and district != city else '',
                f'{name}, Turkey',
            )
            if q
        )
    )


async def fetch_place_wikipedia_bilingual(
    place_name: str,
    *,
    city: str = '',
    district: str = '',
) -> tuple[str, str, list[dict[str, str]]]:
    """Mekan için ayrı TR ve EN Wikipedia özetleri."""
    name = place_name.strip()
    if not name:
        return '', '', []

    city = city.strip()
    district = district.strip()
    queries = _place_wikipedia_queries(name, city, district)
    sources: list[dict[str, str]] = []
    seen_urls: set[str] = set()
    tr_text = ''
    en_text = ''

    for q in queries:
        if not tr_text:
            text, title, page_url = await _fetch_one(q, 'tr')
            if text:
                tr_text = text
                if page_url and page_url not in seen_urls:
                    seen_urls.add(page_url)
                    sources.append({'title': f'Wikipedia (tr): {title}', 'url': page_url})
        if not en_text:
            text, title, page_url = await _fetch_one(q, 'en')
            if text:
                en_text = text
                if page_url and page_url not in seen_urls:
                    seen_urls.add(page_url)
                    sources.append({'title': f'Wikipedia (en): {title}', 'url': page_url})
        if tr_text and en_text:
            break

    return tr_text[:2500], en_text[:2500], sources


async def fetch_place_wikipedia_content(
    place_name: str,
    *,
    city: str = '',
    district: str = '',
) -> tuple[str, list[dict[str, str]]]:
    """DB zenginleştirme için öncelikle Türkçe Wikipedia özeti."""
    tr_text, en_text, sources = await fetch_place_wikipedia_bilingual(
        place_name, city=city, district=district
    )
    if tr_text:
        return tr_text, sources
    return en_text, sources
