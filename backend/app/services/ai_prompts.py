"""Historial-GO LLM sistem promptları — kısa, yapılandırılmış, hızlı yanıt."""

from __future__ import annotations

import json
from typing import Any

# --- Rota önerisi ---

SYSTEM_ROUTE_RECOMMEND = """Sen Historial-GO rota öneri motorusun (Türkiye kültür turizmi).

KURALLAR:
- Yalnızca verilen route_id değerlerinden seç; listede olmayan id yazma.
- En fazla istenen adet kadar rota döndür; skora göre sırala.
- score: 0.0–1.0 (etiket eşleşmesi en önemli, sonra bütçe/süre/konum).
- reason: Türkçe, tek cümle, en fazla 100 karakter.
- matched_tags: kullanıcı ilgi alanlarıyla kesişen rota etiketleri.
- fits_budget: price <= bütçe ise true.
- fits_duration: |estimated_minutes - hedef_süre| <= hedef_sürenin %45'i ise true.

ÇIKTI: Sadece geçerli JSON, açıklama/markdown yok:
{"recommendations":[{"route_id":int,"score":float,"reason":str,"matched_tags":[str],"fits_budget":bool,"fits_duration":bool}]}"""


def build_route_recommend_user(
    *,
    interests: list[str],
    budget: float,
    duration_minutes: int,
    location_lat: float | None,
    location_lng: float | None,
    max_results: int,
    catalog: list[dict[str, Any]],
) -> str:
    loc = (
        f'{location_lat:.4f},{location_lng:.4f}'
        if location_lat is not None and location_lng is not None
        else 'yok'
    )
    compact = json.dumps(catalog, ensure_ascii=False, separators=(',', ':'))
    return (
        f'ilgi_alanlari={interests}; butce_try={budget}; hedef_dk={duration_minutes}; '
        f'konum={loc}; max={max_results}; rotalar={compact}'
    )


# --- Turist asistanı ---

SYSTEM_ASSISTANT = """Sen Historial-GO Turist AI Asistanısın.

NİYET (intent alanına göre):
- selam/teşekkür → 1-2 cümle; gezi planı YAZMA.
- rota → sohbet_gecmisi'ndeki gün/bütçe/konumu kullan; en fazla 5 maddelik günlük plan.
- yemek → YALNIZCA yakın_mekanlar listesindeki GERÇEK restoran/lokanta isimlerini öner; turistik mekan (cami, çarşı, meydan) YAZMA.
- genel → kısa, net yanıt.

KURALLAR:
- Yanıt dili: Türkçe (locale=tr ise).
- yakın_mekanlar listesindeki isimleri kullan; listede yoksa mekan adı uydurma.
- sohbet_gecmisi'ndeki bütçe, gün sayısı ve semt bilgisini dikkate al.
- Fiyat/saat uydurma.
- Toplam en fazla 220 kelime."""

SYSTEM_ASSISTANT_EN = """You are the Historial-GO Tourist AI Assistant.

INTENT (follow the intent field):
- greeting/thanks → 1–2 sentences only; do NOT write a full itinerary.
- route → use days/budget/location from chat history; max 5 bullet points per day.
- food → ONLY recommend REAL restaurants from nearby_places; do NOT suggest mosques, bazaars, or landmarks.
- general → concise, helpful answer.

RULES:
- Reply in English when locale=en.
- Use names from nearby_places only; never invent venue names.
- Respect budget, trip length, and district from chat history.
- Do not invent prices or opening hours.
- Max 220 words total."""

SYSTEM_ASSISTANT_VENUE = """Sen Historial-GO yemek rehberisin.

KURALLAR:
- Kullanıcı somut lokanta/restoran istiyor.
- YALNIZCA verilen mekan_listesi'ndeki isimleri kullan; turistik yer (cami, saray, çarşı, meydan) ÖNERME.
- Her mekan için: isim, kısa neden (1 cümle), adres satırı.
- En fazla 3 mekan öner; en yüksek puanlıları tercih et.
- Türkçe, samimi ton. Toplam en fazla 120 kelime."""


def format_places_detail(places: list[Any]) -> str:
    """GooglePlaceSummary veya benzeri nesneleri prompt için sırala."""
    lines: list[str] = []
    for p in places[:8]:
        name = getattr(p, 'name', str(p))
        addr = getattr(p, 'address', '') or ''
        rating = getattr(p, 'rating', None)
        count = getattr(p, 'user_rating_count', None)
        extra = ''
        if rating:
            extra += f' puan={rating}'
        if count:
            extra += f' yorum={count}'
        lines.append(f'{name} ({addr}{extra})'.strip())
    return '; '.join(lines) if lines else 'yok'


def assistant_system_for_locale(locale: str = 'tr') -> str:
    return SYSTEM_ASSISTANT_EN if locale == 'en' else SYSTEM_ASSISTANT


def build_assistant_user(
    *,
    where: str,
    interests: str,
    places_hint: str,
    user_message: str,
    intent: str = 'genel',
    history: str = 'yok',
    locale: str = 'tr',
) -> str:
    places = places_hint.strip() or 'yok'
    return (
        f'locale={locale}; intent={intent}; konum={where}; ilgi_alanlari={interests}; '
        f'yakın_mekanlar={places}; sohbet_gecmisi={history}; '
        f'kullanici_mesaji={user_message}'
    )


def format_places_reply(
    places: list[Any],
    city: str,
    *,
    days: int | None = None,
    budget: float | None = None,
    locale: str = 'tr',
) -> str:
    """Gezi planı / mekan önerisi — okunabilir numaralı liste."""
    if not places:
        if locale == 'en':
            return (
                f'No live venues found for **{city}**. '
                'Try the **Map** tab or pick another city.'
            )
        return (
            f'**{city}** için şu an canlı mekan bulamadım. '
            '**Harita** sekmesinden veya **Keşfet → İller** üzerinden bakabilirsin.'
        )

    if locale == 'en':
        header_parts = [f'**{city}** — suggested places']
        if days:
            header_parts.append(f'({days}-day trip)')
        if budget:
            header_parts.append(f'budget ~{budget:.0f} TRY')
        lines = [' '.join(header_parts) + '\n']
        footer = '\nSee **Map** in the app for live pins and details.'
    else:
        header_parts = [f'**{city}** için önerilen mekanlar']
        if days:
            header_parts.append(f'({days} günlük gezi)')
        if budget:
            header_parts.append(f'bütçe ~{budget:.0f} TL')
        lines = [' — '.join(header_parts) + '\n']
        footer = '\nDetay ve harita pinleri için **Harita** sekmesine bakabilirsin.'

    for i, p in enumerate(places[:8], 1):
        name = getattr(p, 'name', '')
        addr = getattr(p, 'address', '') or getattr(p, 'formatted_address', '') or ''
        rating = getattr(p, 'rating', None)
        count = getattr(p, 'user_rating_count', None)
        stars = f' ⭐ {rating}' if rating else ''
        reviews = (
            f' ({count} reviews)' if count and locale == 'en'
            else (f' ({count} yorum)' if count else '')
        )
        lines.append(f'{i}. **{name}**{stars}{reviews}')
        if addr:
            lines.append(f'   📍 {addr}')

    lines.append(footer)
    return '\n'.join(lines)


def format_itinerary_reply(
    places: list[Any],
    city: str,
    *,
    days: int | None = None,
    budget: float | None = None,
    locale: str = 'tr',
) -> str:
    """Gün gün gezi planı — gerçek mekan isimleriyle."""
    if not places:
        return format_places_reply([], city, days=days, budget=budget, locale=locale)

    day_count = max(1, min(days or 1, 7))
    picks = places[: min(len(places), day_count * 4)]
    per_day = max(2, (len(picks) + day_count - 1) // day_count)

    if locale == 'en':
        header = [f'**{city}** — {day_count}-day itinerary']
        if budget:
            header.append(f'budget ~{budget:.0f} TRY')
        lines = [' — '.join(header) + '\n']
        day_label = 'Day'
        footer = '\nSee **Map** for live pins and routes.'
    else:
        header = [f'**{city}** için {day_count} günlük gezi planı']
        if budget:
            header.append(f'bütçe ~{budget:.0f} TL')
        lines = [' — '.join(header) + '\n']
        day_label = 'Gün'
        footer = '\nDetay ve harita pinleri için **Harita** sekmesine bakabilirsin.'

    idx = 0
    for day in range(1, day_count + 1):
        chunk = picks[idx : idx + per_day]
        if not chunk:
            break
        idx += per_day
        lines.append(f'\n**{day}. {day_label}**')
        for i, p in enumerate(chunk, 1):
            name = getattr(p, 'name', '')
            addr = getattr(p, 'address', '') or getattr(p, 'formatted_address', '') or ''
            rating = getattr(p, 'rating', None)
            cat = str(getattr(p, 'category', '') or '').lower()
            cat_labels_tr = {
                'restaurant': 'Yeme-İçme',
                'accommodation': 'Konaklama',
                'museum': 'Müze',
                'mosque': 'Cami',
                'historical': 'Gezi',
                'palace': 'Saray',
                'bazaar': 'Çarşı',
            }
            cat_labels_en = {
                'restaurant': 'Food',
                'accommodation': 'Stay',
                'museum': 'Museum',
                'mosque': 'Mosque',
                'historical': 'Sightseeing',
                'palace': 'Palace',
                'bazaar': 'Bazaar',
            }
            cat_label = (cat_labels_en if locale == 'en' else cat_labels_tr).get(cat, '')
            tag = f' · {cat_label}' if cat_label else ''
            stars = f' ⭐ {rating}' if rating else ''
            lines.append(f'{i}. **{name}**{tag}{stars}')
            if addr:
                lines.append(f'   📍 {addr}')

    lines.append(footer)
    return '\n'.join(lines)


def format_venue_reply(places: list[Any], where: str, *, locale: str = 'tr') -> str:
    """Google Places sonuçlarından doğrudan yanıt — LLM halüsinasyonu yok."""
    if not places:
        if locale == 'en':
            return (
                f'No registered restaurants found for {where}. '
                'Try the Map tab with the Food filter for live venues.'
            )
        return (
            f'{where} için şu an kayıtlı restoran bulamadım. '
            'Harita sekmesinden "Yemek" filtresiyle canlı mekanlara bakabilirsin.'
        )
    if locale == 'en':
        lines = [f'Restaurants I recommend in **{where}**:\n']
        footer = '\nSee **Map → Food** in the app for details.'
    else:
        lines = [f'**{where}** bölgesinde önerdiğim lokantalar:\n']
        footer = '\nDetay için uygulamada **Harita → Yemek** filtresine bakabilirsin.'
    for i, p in enumerate(places[:5], 1):
        name = getattr(p, 'name', '')
        addr = getattr(p, 'address', '') or ''
        rating = getattr(p, 'rating', None)
        count = getattr(p, 'user_rating_count', None)
        stars = f' ⭐ {rating}' if rating else ''
        reviews = f' ({count} reviews)' if count and locale == 'en' else (f' ({count} yorum)' if count else '')
        lines.append(f'{i}. **{name}**{stars}{reviews}')
        if addr:
            lines.append(f'   📍 {addr}')
    lines.append(footer)
    return '\n\n'.join(lines)


def format_accommodation_reply(places: list[Any], where: str, *, locale: str = 'tr') -> str:
    """Konaklama önerisi — yalnızca otel/pansiyon."""
    if not places:
        if locale == 'en':
            return (
                f'No lodging found for {where}. '
                'Try the Map tab with the Stay filter for live results.'
            )
        return (
            f'{where} için şu an kayıtlı konaklama bulamadım. '
            'Harita sekmesinden "Konaklama" filtresiyle canlı sonuçlara bakabilirsin.'
        )
    if locale == 'en':
        lines = [f'Places to stay in **{where}**:\n']
        footer = '\nSee **Map → Stay** in the app for details.'
    else:
        lines = [f'**{where}** bölgesinde konaklama önerileri:\n']
        footer = '\nDetay için uygulamada **Harita → Konaklama** filtresine bakabilirsin.'
    for i, p in enumerate(places[:5], 1):
        name = getattr(p, 'name', '')
        addr = getattr(p, 'address', '') or ''
        rating = getattr(p, 'rating', None)
        count = getattr(p, 'user_rating_count', None)
        stars = f' ⭐ {rating}' if rating else ''
        reviews = f' ({count} reviews)' if count and locale == 'en' else (f' ({count} yorum)' if count else '')
        lines.append(f'{i}. **{name}**{stars}{reviews}')
        if addr:
            lines.append(f'   📍 {addr}')
    lines.append(footer)
    return '\n\n'.join(lines)


_CATEGORY_REPLY_HEADERS_TR: dict[str, str] = {
    'mosque': '**{where}** bölgesinde cami önerileri:\n',
    'museum': '**{where}** bölgesinde müze önerileri:\n',
    'palace': '**{where}** bölgesinde saray önerileri:\n',
    'bazaar': '**{where}** bölgesinde çarşı / alışveriş önerileri:\n',
    'historical': '**{where}** bölgesinde tarihî mekan önerileri:\n',
}

_CATEGORY_REPLY_HEADERS_EN: dict[str, str] = {
    'mosque': 'Mosques in **{where}**:\n',
    'museum': 'Museums in **{where}**:\n',
    'palace': 'Palaces in **{where}**:\n',
    'bazaar': 'Bazaars & markets in **{where}**:\n',
    'historical': 'Historic sights in **{where}**:\n',
}

_CATEGORY_MAP_FOOTER_TR: dict[str, str] = {
    'mosque': '\nDetay için uygulamada **Harita → Cami** filtresine bakabilirsin.',
    'museum': '\nDetay için uygulamada **Harita → Müze** filtresine bakabilirsin.',
    'palace': '\nDetay için uygulamada **Harita** sekmesine bakabilirsin.',
    'bazaar': '\nDetay için uygulamada **Harita → Çarşı** filtresine bakabilirsin.',
    'historical': '\nDetay için uygulamada **Harita** sekmesine bakabilirsin.',
}

_CATEGORY_MAP_FOOTER_EN: dict[str, str] = {
    'mosque': '\nSee **Map → Mosque** in the app for details.',
    'museum': '\nSee **Map → Museum** in the app for details.',
    'palace': '\nSee **Map** in the app for details.',
    'bazaar': '\nSee **Map → Bazaar** in the app for details.',
    'historical': '\nSee **Map** in the app for details.',
}


def format_category_reply(
    places: list[Any],
    where: str,
    category: str,
    *,
    locale: str = 'tr',
) -> str:
    """Kategori bazlı mekan önerisi — cami, müze vb."""
    headers = _CATEGORY_REPLY_HEADERS_EN if locale == 'en' else _CATEGORY_REPLY_HEADERS_TR
    footers = _CATEGORY_MAP_FOOTER_EN if locale == 'en' else _CATEGORY_MAP_FOOTER_TR
    header_tpl = headers.get(category, headers.get('historical', '**{where}**:\n'))
    footer = footers.get(category, footers.get('historical', ''))
    if not places:
        if locale == 'en':
            return f'No {category} places found for {where}. Try the Map tab with filters.'
        return f'{where} için {category} kategorisinde mekan bulamadım. Harita sekmesinden filtreleyebilirsin.'
    lines = [header_tpl.format(where=where)]
    for i, p in enumerate(places[:5], 1):
        name = getattr(p, 'name', '')
        addr = getattr(p, 'address', '') or ''
        rating = getattr(p, 'rating', None)
        count = getattr(p, 'user_rating_count', None)
        stars = f' ⭐ {rating}' if rating else ''
        reviews = f' ({count} reviews)' if count and locale == 'en' else (f' ({count} yorum)' if count else '')
        lines.append(f'{i}. **{name}**{stars}{reviews}')
        if addr:
            lines.append(f'   📍 {addr}')
    lines.append(footer)
    return '\n\n'.join(lines)


# --- Sesli anlatım ---

SYSTEM_NARRATION = """Sen Historial-GO tarihî sesli rehbersin. Metinler sesli okunacak — yazı dili değil, konuşma dili kullan.

KURALLAR:
- Doğru tarih/kültür bilgisi ver; emin değilsen genel ifade kullan, uydurma tarih/sayı yazma.
- scripts.tr: Türkçe, 200–280 kelime, sıcak rehber tonu, "siz" hitabı.
- scripts.en: İngilizce, 200–280 kelime, natural spoken English for tourists (not literal translation of TR).
- scripts.de: Almanca, 180–240 kelime (istenirse).
- Yapı: karşılama + mekanın önemi → tarih/mimari/kültür (2–3 paragraf) → pratik ipucu (ziyaret süresi, sessizlik, fotoğraf) → kapanış daveti.
- Mekan adını girişte ve bir kez daha ortada mutlaka söyle.
- Şehir/ilçe bağlamını kullan (Türkiye, bölge).

ÇIKTI: Sadece geçerli JSON:
{"scripts":{"tr":"...","en":"...","de":"..."}}
Yalnızca istenen dil kodları için anahtar doldur."""


def build_narration_user(
    *,
    stop_title: str,
    description: str,
    languages: list[str],
    city: str | None = None,
    district: str | None = None,
    category: str | None = None,
) -> str:
    ctx = (description or 'Genel tarihî bilgi')[:2800]
    loc = ', '.join(p for p in (district, city) if p) or 'Türkiye'
    cat = category or 'historical'
    return (
        f'mekan={stop_title}; konum={loc}; kategori={cat}; baglam={ctx}; diller={languages}'
    )


# --- Kişisel rota üretimi ---

SYSTEM_PERSONAL_ROUTE = """Sen Historial-GO kişisel gezi planlayıcısısın (Türkiye kültür turizmi).

KURALLAR:
- YALNIZCA aday_mekanlar listesindeki candidate_id değerlerinden durak seç; listede olmayan mekan uydurma.
- Kullanıcının il/ilçe sınırına uy; farklı semt/ilçeden mekan ekleme.
- Süre ve bütçe sınırlarına uy; toplam dwell_minutes <= hedef_dk.
- Durakları mantıklı yürüyüş sırasına koy.
- reason ve narration_snippet: seçilen dilde, kısa ve net.

ÇIKTI: Sadece geçerli JSON:
{"title":str,"summary":str,"total_minutes":int,"estimated_cost":float,"stops":[{"candidate_id":str,"order":int,"dwell_minutes":int,"reason":str,"narration_snippet":str}]}"""


def build_personal_route_user(
    *,
    city: str,
    district: str,
    interests: list[str],
    budget: float,
    duration_minutes: int,
    max_stops: int,
    language: str,
    candidates: list[dict[str, Any]],
) -> str:
    compact = json.dumps(candidates, ensure_ascii=False, separators=(',', ':'))
    area = f'{district}, {city}' if district.strip() else city
    return (
        f'dil={language}; bolge={area}; ilgi={interests}; butce_try={budget}; '
        f'hedef_dk={duration_minutes}; max_durak={max_stops}; aday_mekanlar={compact}'
    )
