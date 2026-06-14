"""81 il için temel rehber rotası şablonları."""

from __future__ import annotations

import unicodedata

from app.data.tr_cities import TR_CITIES

_ROUTE_TEMPLATES: list[tuple[str, str, int, float]] = [
    ('Kültür Keşfi', 'history,museum', 180, 249.0),
    ('Lezzet Turu', 'gastronomy,food', 150, 199.0),
    ('Tarih Yürüyüşü', 'history,architecture', 120, 179.0),
]


def _norm_city(name: str) -> str:
    t = unicodedata.normalize('NFKD', name.strip().lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    return t.replace('ı', 'i').replace(' ', '')


def city_route_templates() -> list[dict]:
    """Her il için bir kayıtlı rota tanımı."""
    rows: list[dict] = []
    for idx, city in enumerate(TR_CITIES):
        name = str(city.get('name', '')).strip()
        if not name:
            continue
        title_suffix, tags, minutes, price = _ROUTE_TEMPLATES[idx % len(_ROUTE_TEMPLATES)]
        rows.append(
            {
                'title': f'{name} {title_suffix}',
                'city': name,
                'estimated_minutes': minutes,
                'price': price,
                'tags': tags,
            }
        )
    return rows


def normalize_city_key(name: str) -> str:
    return _norm_city(name)
