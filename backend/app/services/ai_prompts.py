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
- Yanıt dili: Türkçe.
- yakın_mekanlar listesindeki isimleri kullan; listede yoksa mekan adı uydurma.
- sohbet_gecmisi'ndeki bütçe, gün sayısı ve semt bilgisini dikkate al.
- Fiyat/saat uydurma.
- Toplam en fazla 180 kelime."""

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


def build_assistant_user(
    *,
    where: str,
    interests: str,
    places_hint: str,
    user_message: str,
    intent: str = 'genel',
    history: str = 'yok',
) -> str:
    places = places_hint.strip() or 'yok'
    return (
        f'intent={intent}; konum={where}; ilgi_alanlari={interests}; '
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
    return '\n\n'.join(lines)


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


# --- Sesli anlatım ---

SYSTEM_NARRATION = """Sen Historial-GO tarihî sesli rehbersin.

KURALLAR:
- Doğru tarih/kültür bilgisi ver; emin değilsen genel ifade kullan, uydurma tarih/sayı yazma.
- Her istenen dil için 150–250 kelime; akıcı, dinlenebilir, rehber tonu.
- Yapı: kısa giriş → tarih/kültür → pratik ipucu (ziyaret süresi, dikkat) → kapanış.
- Mekan adını mutlaka söyle.

ÇIKTI: Sadece geçerli JSON:
{"scripts":{"tr":"...","en":"...","de":"..."}}
Yalnızca istenen dil kodları için anahtar doldur."""


def build_narration_user(*, stop_title: str, description: str, languages: list[str]) -> str:
    ctx = (description or 'Genel tarihî bilgi')[:1200]
    return f'mekan={stop_title}; baglam={ctx}; diller={languages}'


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
