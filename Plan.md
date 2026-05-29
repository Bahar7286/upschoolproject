# Plan.md — PRD’den türetilen teknik plan

**Kaynak:** [PRD.md](PRD.md) · **Durum:** MVP tamamlandı (Mayıs 2026) · **Test:** backend 141 pytest geçer

---

## Epic 1 — Altyapı ve kimlik

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E1.1 | Turist olarak kayıt olup giriş yapmak istiyorum | `auth_routes`, JWT, `User` model, FE login/register | ✅ |
| E1.2 | İlgi/süre/bütçe tercihlerimi kaydetmek istiyorum | Onboarding, `PATCH /auth/me` | ✅ |
| E1.3 | Şifremi unuttumda sıfırlamak istiyorum | `password_reset_service`, forgot/reset | ✅ |

---

## Epic 2 — Rota keşfi ve AI

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E2.1 | İlgi alanıma göre rota önerisi almak istiyorum | `POST /ai/recommend`, `AIService`, Discover | ✅ |
| E2.2 | Rota detayında durakları görmek istiyorum | `routes`, `stops`, route-detail | ✅ |
| E2.3 | Anlatım metnini önizlemek istiyorum | `POST /ai/narration/preview` | ✅ |
| E2.4 | LLM’nin aktif olduğunu bilmek istiyorum | `GET /ai/status` | ✅ |
| E2.5 | Sohbet asistanı ile gezi sormak istiyorum | `/assistant`, Places ipuçları + LLM | ✅ |

---

## Epic 3 — Harita, ses, offline

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E3.1 | Haritada rotayı ve POI’leri görmek istiyorum | Leaflet/Google map, `places`, `google/places/nearby`, aktif rota polyline | ✅ |
| E3.2 | Durağa yaklaşınca sesli anlatım istiyorum | `useGeofenceWatch`, `PlaceNarrationPanel`, `/ai/narration/*` | ✅ |
| E3.3 | Zayıf internette kullanmak istiyorum | `offline-package.ts` (kısmi) | ⚠️ kısmi |
| E3.4 | Mobilde menü ve keşif akışını rahat kullanmak istiyorum | 4 öğeli alt nav, drawer portal, `CategoryIconCard` | ✅ |

---

## Epic 4 — Ödeme ve satın alma

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E4.1 | Rotayı satın almak istiyorum | Stripe session, checkout | ✅ |
| E4.2 | Geçmiş ödemelerimi görmek istiyorum | `purchases`, `/purchases` | ✅ |

---

## Epic 5 — Rehber B2B ve trip pazaryeri

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E5.1 | Rehber profil ve doğrulama | `guide_profiles`, admin onay | ✅ |
| E5.2 | Turist talebine teklif vermek | `trip_requests`, `guide_offers` | ✅ |
| E5.3 | Panelde analitik | Guide dashboard | ✅ |
| E5.4 | Taslak rotamı görmek (rehber) | `get_route_by_id` + `allow_unpublished` / viewer rol | ✅ |

---

## Epic 6 — Oyunlaştırma ve sosyal

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E6.1 | XP ve rozet | `gamification.py`, profil | ✅ |
| E6.2 | Not/yorum | `social_routes` | ✅ |
| E6.3 | Gezi planı | `plan_routes`, planner | ✅ |

---

## Epic 7 — Kalite, teslim, deploy

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E7.1 | Regresyon testi | pytest 141, Vitest, coverage servis ~%90 | ✅ |
| E7.2 | Standart repo yapısı | `frontend/`, `backend/`, `prodocs/` | ✅ |
| E7.3 | Canlı demo | Render, README URL | ✅ |
| E7.4 | Production güvenlik | Rate limit (prod), hata maskeleme, `/ready` | ✅ |

---

## Epic 8 — Türkiye keşif ve Google entegrasyonu

| ID | Kullanıcı hikayesi | Teknik adımlar | Durum |
|----|-------------------|----------------|-------|
| E8.1 | 81 il ve ilçeleri görmek | `cities`, `districts`, seed, `/cities` | ✅ |
| E8.2 | İl/ilçede kategorili mekanlar | `places`, city/district sayfaları | ✅ |
| E8.3 | Harita merkezi koordinat | `GET /geo/center` | ✅ |
| E8.4 | Google place detay ve rota çizimi | `/google/places/*`, `/google/routes` proxy | ✅ |
| E8.5 | Favori mekanlar | `favorites` tablosu, `/favorites` | ✅ |
| E8.6 | Admin POI / görsel senkron | `POST /admin/poi/sync`, `images/sync` | ✅ |

---

## Sonraki sprint (PRD yol haritası v2)

1. PostGIS / spatial index  
2. AR avatar entegrasyonu  
3. Ankara / İzmir zengin POI seed (İstanbul dışı içerik)  
4. Google Places kalıcı DB önbelleği  
5. Wikidata zenginleştirme  
6. Tam offline paket (ses + harita bir arada)

---

## Bağımlılık sırası (özet)

```
Docker PG → Alembic → Backend modeller → Auth → Routes/Places
         → Cities/Districts seed → AI (LLM) → Google proxy
         → FE sayfalar (keşif, harita, asistan) → Payments → Trip/Guide
         → Tests (141) → Deploy → Canlı URL
```
