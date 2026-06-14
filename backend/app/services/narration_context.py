"""Dil bazlı sesli anlatım bağlamı — TR/EN karışımını önler."""

from __future__ import annotations

import re

_TR_CHARS = frozenset('ğüşıöçĞÜŞİÖÇ')


def has_turkish(text: str) -> bool:
    return any(c in _TR_CHARS for c in text)


def split_description_by_language(description: str) -> tuple[str, str]:
    """Açıklamayı Türkçe ve İngilizce parçalara ayır (Google editorial_summary vb.)."""
    tr_parts: list[str] = []
    en_parts: list[str] = []
    for block in re.split(r'\n+', (description or '').strip()):
        line = block.strip()
        if not line:
            continue
        if line.startswith('[TR]'):
            tr_parts.append(line[4:].strip())
        elif line.startswith('[EN]'):
            en_parts.append(line[4:].strip())
        elif has_turkish(line):
            tr_parts.append(line)
        elif re.search(r'[a-zA-Z]', line):
            en_parts.append(line)
        else:
            tr_parts.append(line)
    return '\n\n'.join(tr_parts).strip(), '\n\n'.join(en_parts).strip()


def build_bilingual_contexts(
    *,
    description: str,
    wiki_tr: str,
    wiki_en: str,
    title: str,
    city: str,
    district: str,
) -> tuple[str, str]:
    """Sesli anlatım için dil ayrılmış zengin bağlam."""
    desc_tr, desc_en = split_description_by_language(description)
    location = ', '.join(p for p in (district, city) if p) or 'Türkiye'

    tr_body = '\n\n'.join(p for p in (wiki_tr.strip(), desc_tr) if p).strip()
    en_body = '\n\n'.join(p for p in (wiki_en.strip(), desc_en) if p).strip()

    if not tr_body:
        tr_body = (
            f'{title}, {location} bölgesinde Türkiye\'nin önemli kültür ve gezi noktalarından biridir.'
        )
    if not en_body:
        en_body = f'{title} is a significant cultural destination in {location}, Turkey.'

    return tr_body[:3500], en_body[:3500]
