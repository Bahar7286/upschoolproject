"""Asistan mesaj niyeti — selam/teşekkür için LLM çağrılmadan hızlı yanıt."""

from __future__ import annotations

import re

_GREETING = re.compile(
    r'^(selam|slm|slmm|merhaba|mrb|hey|hi|hello|günaydın|gunaydin|iyi günler|'
    r'iyi akşamlar|iyi aksamlar|naber|nbr|hoşgeldin|hosgeldin|sa)\s*[!.?]*$',
    re.IGNORECASE,
)
_THANKS = re.compile(
    r'^(teşekkür(ler)?|tesekkur(ler)?|sağol|sagol|eyv|thanks|thank you)\s*[!.?]*$',
    re.IGNORECASE,
)
_TRAVEL_HINT = re.compile(
    r'(rota|plan|gezi|nerede|nereye|ne yap|öner|oner|mekan|tur|ziyaret|gidilir|'
    r'tavsiye|gün|gun|günde|kaç gün|itinerary|visit|place|museum|restaurant)',
    re.IGNORECASE,
)


def is_greeting(text: str) -> bool:
    t = text.strip()
    if not t:
        return False
    if len(t) <= 5 and re.match(r'^(slm|sel|hey|hi|mrb|sa)$', t, re.IGNORECASE):
        return True
    return bool(_GREETING.match(t))


def is_thanks(text: str) -> bool:
    return bool(_THANKS.match(text.strip()))


def needs_travel_plan(text: str) -> bool:
    t = text.strip()
    if len(t) > 35:
        return True
    return bool(_TRAVEL_HINT.search(t))


def quick_assistant_reply(text: str, city: str, district: str = '') -> str | None:
    where = f'{district}, {city}' if district else city
    if is_greeting(text):
        return (
            f'Selam! 👋 Ben Historial-GO asistanıyım. '
            f'{where} veya başka bir il için gezi planı istersen kaç günün olduğunu '
            f've ilgi alanını (tarih, yemek, müze…) yazman yeterli.'
        )
    if is_thanks(text):
        return 'Rica ederim! Başka bir sorunda yazabilirsin.'
    return None
