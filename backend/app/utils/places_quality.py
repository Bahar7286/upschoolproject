"""Google Places sonuçlarından şehir adı / idari alan gibi anlamsız kayıtları ayıkla."""

from __future__ import annotations

import unicodedata

_GENERIC_TYPES = frozenset(
    {
        'locality',
        'administrative_area_level_1',
        'administrative_area_level_2',
        'administrative_area_level_3',
        'political',
        'country',
        'postal_code',
        'route',
        'neighborhood',
        'sublocality',
        'sublocality_level_1',
    }
)

_POI_TYPES = frozenset(
    {
        'tourist_attraction',
        'museum',
        'mosque',
        'church',
        'historical_landmark',
        'art_gallery',
        'restaurant',
        'cafe',
        'park',
        'shopping_mall',
        'market',
        'lodging',
        'hotel',
        'place_of_worship',
    }
)


def _norm(text: str) -> str:
    t = unicodedata.normalize('NFKD', text.strip().lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    return t.replace('ı', 'i').replace(' ', '')


def is_generic_place(place: object, city: str = '') -> bool:
    name = str(getattr(place, 'name', '') or '').strip()
    if not name or len(name) < 2:
        return True

    types = {str(t).lower() for t in (getattr(place, 'types', None) or [])}
    name_n = _norm(name)
    city_n = _norm(city)

    if city_n and name_n == city_n:
        return True
    if city_n and name_n in {f'{city_n}ili', f'{city_n}province', f'ili{city_n}'}:
        return True

    addr = _norm(str(getattr(place, 'address', '') or getattr(place, 'formatted_address', '') or ''))
    if city_n and name_n == city_n and city_n in addr and len(types & _POI_TYPES) == 0:
        return True

    if types and types <= _GENERIC_TYPES:
        return True
    if types & _GENERIC_TYPES and not types & _POI_TYPES:
        return True

    return False


def filter_quality_places(places: list, city: str = '') -> list:
    return [p for p in places if not is_generic_place(p, city)]


def dedupe_places(places: list) -> list:
    seen: set[str] = set()
    out: list = []
    for place in places:
        pid = str(getattr(place, 'place_id', '') or getattr(place, 'name', '')).strip().lower()
        name_key = _norm(str(getattr(place, 'name', '')))
        key = pid or name_key
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(place)
    return out
