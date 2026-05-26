# API özeti

Base: `http://127.0.0.1:8000` (geliştirme) — Swagger: `/docs`

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
| GET | `/payments/history` | Satın alımlar |

## Diğer

- `/places`, `/plans`, `/notes`, `/reviews`, `/guides/profile` — CRUD benzeri uçlar
- Sağlık: `GET /health`

Tam şema için çalışan backend’de `/openapi.json` kullanın.
