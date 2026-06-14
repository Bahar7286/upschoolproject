"""81 il merkez koordinatları — tr-cities.json."""

from __future__ import annotations

import json
import math
import unicodedata
from functools import lru_cache
from pathlib import Path


def _norm(text: str) -> str:
    t = unicodedata.normalize('NFKD', text.strip().lower())
    return ''.join(c for c in t if not unicodedata.combining(c))


def _name_keys(name: str, slug: str = '') -> set[str]:
    keys: set[str] = set()
    for raw in (name, slug):
        if not raw:
            continue
        n = _norm(raw)
        keys.add(n)
        keys.add(n.replace(' ', ''))
        keys.add(raw.strip().lower())
    return keys


@lru_cache(maxsize=1)
def _city_index() -> dict[str, tuple[float, float, str]]:
    path = Path(__file__).resolve().parent.parent / 'data' / 'tr-cities.json'
    index: dict[str, tuple[float, float, str]] = {}
    rows = json.loads(path.read_text(encoding='utf-8'))
    for row in rows:
        name = str(row.get('name', '')).strip()
        slug = str(row.get('slug', '')).strip()
        lat = float(row.get('lat', 0))
        lng = float(row.get('lng', 0))
        if not name or lat == 0.0 and lng == 0.0:
            continue
        for key in _name_keys(name, slug):
            index[key] = (lat, lng, name)
    return index


def resolve_city_coords(city: str) -> tuple[float, float] | None:
    raw = (city or '').strip()
    if not raw:
        return None
    index = _city_index()
    n = _norm(raw)
    if n in index:
        lat, lng, _ = index[n]
        return lat, lng
    compact = n.replace(' ', '')
    if compact in index:
        lat, lng, _ = index[compact]
        return lat, lng
    for key, (lat, lng, canonical) in index.items():
        if n in key or key in n:
            return lat, lng
        if _norm(canonical) == n:
            return lat, lng
    return None


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlng / 2) ** 2
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))
