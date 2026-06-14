# API özeti

Base: `http://127.0.0.1:8000` (geliştirme) — Swagger: `/docs`

## Yetkilendirme özeti

| Alan | Kural |
|------|--------|
| `GET /routes`, `GET /places`, `GET /ai/status` | Herkese açık |
| `GET /routes/{id}/stops` | Önizleme herkese; tam içerik satın alma / rehber / admin |
| `POST /auth/register`, checkout | JWT (kayıt sonrası token) |
| `POST/PATCH/DELETE /routes` | Rehber (sahip) veya admin |
| `GET /users`, `GET /payments` | Admin |
| `GET /payments/users/{id}` | Kendi hesap veya admin |
| `/quotes/*` | Deprecated — `trip-requests` kullanın |

## Auth

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/auth/register` | Kayıt |
| POST | `/auth/login` | JWT |
| POST | `/auth/forgot-password` | Sıfırlama e-postası (dev: token log) |
| POST | `/auth/reset-password` | Yeni şifre |
| GET/PATCH | `/auth/me` | Profil (Bearer) |

## Rotalar & keşif

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/routes` | Liste |
| GET | `/routes/{id}` | Detay + duraklar |
| POST | `/ai/recommend` | LLM/kural tabanlı öneri |
| GET | `/ai/status` | `llm_enabled`, provider |
| POST | `/ai/narration/preview` | Anlatım önizleme |
| GET | `/cities` | 81 il |
| GET | `/cities/{id}/districts` | İlçe listesi |
| GET | `/places?city=&district=` | İl/ilçe bazlı mekanlar |
| GET | `/favorites` | Favori listesi (JWT) |
| POST | `/favorites` | Favoriye ekle (JWT) |
| DELETE | `/favorites/{type}/{id}` | Favoriden çıkar (JWT) |
| POST | `/admin/poi/sync` | OSM POI senkron (admin) |
| PATCH | `/admin/users/{id}/premium` | Premium aç/kapat (admin) |

## Rehber & trip

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/guides` | Marketplace |
| POST | `/trip-requests` | Turist talebi |
| GET/PATCH | `/trip-requests/{id}` | Durum, teklifler |

## Ödeme

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/payments/checkout` | Stripe veya demo |
| GET | `/payments/history` | Oturumdaki kullanıcının satın alımları (JWT; alias) |
| GET | `/payments/users/{id}` | Belirtilen kullanıcının satın alımları (kendi hesap veya admin) |

## Diğer

- `/places`, `/plans`, `/notes`, `/reviews`, `/guides/profile` — CRUD benzeri uçlar
- Sağlık: `GET /health`, `GET /ready` (DB ping)

## Google (proxy)

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/google/places/nearby` | Yakındaki yerler |
| GET | `/google/places/{place_id}` | Place detay |
| POST | `/google/routes` | Rota çizimi (polyline) |

## Geo

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/geo/center?city=&district=` | Harita merkez koordinatı |

Tam şema için çalışan backend’de `/openapi.json` kullanın.
