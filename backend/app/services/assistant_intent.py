"""Asistan mesaj niyeti — selam/teşekkür için LLM çağrılmadan hızlı yanıt."""

from __future__ import annotations

import re
import unicodedata

from app.utils.city_coords import extract_city_name_from_text

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
_FOOD_HINT = re.compile(
    r'(yemek|lokanta|restoran|restaurant|kafe|cafe|kebap|balık|balik|tatlı|tatli|'
    r'brunch|kahvaltı|kahvalti|meze|yiyelim|yiyebilir|ne yiy|yemek.*öner|öner.*yemek|'
    r'lokasyon.*lokanta|somewhere to eat|where to eat)',
    re.IGNORECASE,
)
_ACCOMMODATION_HINT = re.compile(
    r'(konaklama|konak|otel|hotel|pansiyon|hostel|motel|butik otel|'
    r'where to stay|accommodation|lodging|stay in|place to stay|'
    r'nerede kal|kalacak yer|gecelem)',
    re.IGNORECASE,
)
_SPECIFIC_VENUE = re.compile(
    r'(tam bir mekan|gerçek mekan|ispesifik|somewhere specific|named restaurant|'
    r'lokasyon bir lokanta|bir lokanta|bir restoran|somewhere to eat|'
    r'konkret|somewhere concrete|adı geçen|isim ver)',
    re.IGNORECASE,
)

# İstanbul semt/ilçe koordinatları (asistan konum çözümleme)
_DISTRICT_POI: dict[str, tuple[float, float]] = {
    'eminonu': (41.0175, 28.9720),
    'eminönü': (41.0175, 28.9720),
    'sultanahmet': (41.0054, 28.9768),
    'fatih': (41.0186, 28.9497),
    'beyoglu': (41.0310, 28.9833),
    'beyoğlu': (41.0310, 28.9833),
    'karakoy': (41.0227, 28.9747),
    'karaköy': (41.0227, 28.9747),
    'galata': (41.0256, 28.9744),
    'kadikoy': (40.9903, 29.0258),
    'kadıköy': (40.9903, 29.0258),
    'besiktas': (41.0422, 29.0067),
    'beşiktaş': (41.0422, 29.0067),
    'ortakoy': (41.0553, 29.0267),
    'ortaköy': (41.0553, 29.0267),
    'uskudar': (41.0214, 29.0151),
    'üsküdar': (41.0214, 29.0151),
    'taksim': (41.0370, 28.9850),
    'cankurtaran': (41.0036, 28.9810),
    'balat': (41.0294, 28.9487),
    'fener': (41.0290, 28.9480),
}


def _norm(text: str) -> str:
    t = unicodedata.normalize('NFKD', text.strip().lower())
    return ''.join(c for c in t if not unicodedata.combining(c))


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
    if is_category_place_query(t):
        return True
    return bool(_TRAVEL_HINT.search(t))


def is_food_query(text: str) -> bool:
    if is_accommodation_query(text):
        return False
    return bool(_FOOD_HINT.search(text))


def is_accommodation_query(text: str) -> bool:
    return bool(_ACCOMMODATION_HINT.search(text))


def detect_explicit_category(text: str) -> str | None:
    """Net kategori isteği — kısa mesajlar (cami, müze) dahil."""
    if is_accommodation_query(text):
        return 'accommodation'
    if is_food_query(text):
        return 'restaurant'
    t = _norm(text)
    if len(text.strip()) <= 56:
        if any(w in t for w in ('cami', 'camii', 'mosque')):
            return 'mosque'
        if any(w in t for w in ('müze', 'muze', 'museum')):
            return 'museum'
        if any(w in t for w in ('saray', 'palace')):
            return 'palace'
        if any(w in t for w in ('çarşı', 'carsi', 'bazaar', 'pazar')):
            return 'bazaar'
        if any(w in t for w in ('tarihi', 'historical', 'antik', 'kale', 'manastır', 'manastir')):
            return 'historical'
    return None


def is_category_place_query(text: str) -> bool:
    cat = detect_explicit_category(text)
    return cat is not None and cat not in ('accommodation', 'restaurant')


def is_specific_venue_request(text: str) -> bool:
    t = text.strip()
    if _SPECIFIC_VENUE.search(t):
        return True
    if is_food_query(t) and any(w in _norm(t) for w in ('lokanta', 'restoran', 'mekan oner', 'mekan öner')):
        return True
    return False


def detect_query_category(text: str, interests: list[str] | None = None) -> str:
    """Mesaj ve ilgi alanlarından Places kategorisi."""
    explicit = detect_explicit_category(text)
    if explicit:
        return explicit
    t = _norm(text)
    if any(w in t for w in ('müze', 'muze', 'museum')):
        return 'museum'
    if any(w in t for w in ('cami', 'mosque')):
        return 'mosque'
    if any(w in t for w in ('saray', 'palace')):
        return 'palace'
    if any(w in t for w in ('otel', 'konak', 'hotel', 'pansiyon')):
        return 'accommodation'
    if any(w in t for w in ('çarşı', 'carsi', 'bazaar', 'alışveriş', 'alisveris')):
        return 'bazaar'
    joined = ' '.join(interests or []).lower()
    if any(w in joined for w in ('food', 'yemek', 'restaurant', 'cafe', 'gastronomy')):
        return 'restaurant'
    if any(w in joined for w in ('museum', 'müze', 'art')):
        return 'museum'
    return 'historical'


def resolve_intent(text: str, recent_user_text: str = '') -> str:
    """greeting | thanks | accommodation | category_venue | specific_venue | food | route_plan | general"""
    if is_greeting(text):
        return 'greeting'
    if is_thanks(text):
        return 'thanks'
    explicit = detect_explicit_category(text)
    if explicit == 'accommodation':
        return 'accommodation'
    if explicit == 'restaurant':
        return 'food'
    if explicit in ('mosque', 'museum', 'palace', 'bazaar', 'historical'):
        return 'category_venue'
    if is_accommodation_query(text) or (
        is_accommodation_query(recent_user_text) and not detect_explicit_category(text)
    ):
        return 'accommodation'
    if is_specific_venue_request(text):
        return 'specific_venue'
    if is_food_query(text) or is_food_query(recent_user_text):
        return 'food'
    if needs_travel_plan(text):
        return 'route_plan'
    return 'general'


def extract_trip_params(text: str) -> tuple[int | None, float | None]:
    """Mesajdan gün sayısı ve bütçe (TL) çıkar."""
    days: int | None = None
    budget: float | None = None
    day_match = re.search(r'(\d+)\s*g[uü]n', text, re.IGNORECASE)
    if day_match:
        days = int(day_match.group(1))
    budget_match = re.search(r'(\d+(?:[.,]\d+)?)\s*tl\b', text, re.IGNORECASE)
    if budget_match:
        budget = float(budget_match.group(1).replace(',', '.'))
    return days, budget


def extract_city_from_messages(messages: list, fallback_city: str) -> str:
    """Kullanıcı mesajlarından il adı; yoksa fallback."""
    for msg in reversed(messages):
        if getattr(msg, 'role', '') != 'user':
            continue
        found = extract_city_name_from_text(str(getattr(msg, 'content', '')))
        if found:
            return found
    return (fallback_city or '').strip() or 'İstanbul'


def extract_area_from_text(text: str) -> str:
    """Metinden semt/ilçe adı çıkar."""
    norm = _norm(text)
    for key in sorted(_DISTRICT_POI.keys(), key=len, reverse=True):
        if _norm(key) in norm:
            return key
    return ''


def extract_area_from_messages(
    messages: list,
    city: str,
    district: str,
) -> str:
    if district.strip():
        return district.strip()
    for msg in reversed(messages):
        if getattr(msg, 'role', '') == 'user':
            area = extract_area_from_text(msg.content)
            if area:
                return area
    return extract_area_from_text(city)


def district_coords(area: str) -> tuple[float, float] | None:
    if not area.strip():
        return None
    key = _norm(area)
    for name, coords in _DISTRICT_POI.items():
        if _norm(name) == key or key in _norm(name) or _norm(name) in key:
            return coords
    return None


def build_conversation_history(messages: list, limit: int = 6) -> str:
    recent = messages[-limit:] if len(messages) > limit else messages
    parts: list[str] = []
    for msg in recent:
        role = 'Kullanıcı' if getattr(msg, 'role', '') == 'user' else 'Asistan'
        content = str(getattr(msg, 'content', ''))[:180]
        if content.strip():
            parts.append(f'{role}: {content}')
    return ' | '.join(parts) if parts else 'yok'


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
