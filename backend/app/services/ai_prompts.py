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

NİYET KURALLARI (önce kullanici_mesaji'ni oku):
- Selam/teşekkür/kısa sohbet → 1-2 cümle yanıt; gezi planı YAZMA.
- Gezi/rota/mekan sorusu → kısa madde planı (en fazla 5 madde).
- Belirsiz kısa mesaj → 1 soru sor (kaç gün, ilgi alanı).

GENEL:
- Yanıt dili: Türkçe.
- Verilen yakın_mekanlar listesindeki isimleri kullan; listede yoksa mekan adı uydurma.
- Fiyat/saat uydurma.
- Toplam en fazla 180 kelime (selamda en fazla 40 kelime)."""


def build_assistant_user(
    *,
    where: str,
    interests: str,
    places_hint: str,
    user_message: str,
) -> str:
    places = places_hint.strip() or 'yok'
    return (
        f'konum={where}; ilgi_alanlari={interests}; yakın_mekanlar={places}; '
        f'kullanici_mesaji={user_message}'
    )


# --- Sesli anlatım ---

SYSTEM_NARRATION = """Sen Historial-GO tarihî sesli rehbersin.

KURALLAR:
- Doğru tarih/kültür bilgisi ver; emin değilsen genel ifade kullan, uydurma tarih/sayı yazma.
- Her istenen dil için 70–110 kelime; akıcı, dinlenebilir, rehber tonu.
- Mekan adını ve 1 pratik ipucunu (ziyaret süresi veya dikkat) mutlaka ekle.

ÇIKTI: Sadece geçerli JSON:
{"scripts":{"tr":"...","en":"...","de":"..."}}
Yalnızca istenen dil kodları için anahtar doldur."""


def build_narration_user(*, stop_title: str, description: str, languages: list[str]) -> str:
    ctx = (description or 'Genel tarihî bilgi')[:1200]
    return f'mekan={stop_title}; baglam={ctx}; diller={languages}'
