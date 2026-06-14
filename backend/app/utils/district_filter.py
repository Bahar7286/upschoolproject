"""İlçe adı eşleştirme — Google/DB sonuçlarını semte göre filtrele."""

from __future__ import annotations

import unicodedata


def _norm(text: str) -> str:
    t = unicodedata.normalize('NFKD', text.strip().lower())
    return ''.join(c for c in t if not unicodedata.combining(c))


def district_name_variants(district: str) -> set[str]:
    raw = district.strip()
    if not raw:
        return set()
    n = _norm(raw)
    return {raw, raw.lower(), n, n.replace(' ', '')}


def address_matches_district(address: str, district: str) -> bool:
    if not district.strip():
        return True
    addr = _norm(address or '')
    if not addr:
        return False
    for variant in district_name_variants(district):
        v = _norm(variant)
        if len(v) >= 3 and v in addr:
            return True
    return False


def filter_by_district(items: list, district: str, *, address_attr: str = 'address') -> list:
    if not district.strip():
        return items
    out = []
    for item in items:
        addr = getattr(item, address_attr, '') or ''
        name = getattr(item, 'name', '') or ''
        if address_matches_district(addr, district) or address_matches_district(name, district):
            out.append(item)
    return out
