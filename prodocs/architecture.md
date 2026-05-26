# Mimari — Historial-GO

## Katmanlar

```
[ React SPA / Capacitor ]  →  HTTP/JSON  →  [ FastAPI routers ]
                                              ↓
                                         [ Services ]
                                              ↓
                                         [ Repositories ]
                                              ↓
                                         [ SQLAlchemy + PostgreSQL/SQLite ]
```

## Frontend (`/frontend`)

- **Vite + React + TypeScript** — sayfalar `src/pages/`, ortak UI `src/components/`
- **Servisler** `src/services/` — `api.ts` base URL, auth header, hata sarmalayıcı
- **Offline** `src/lib/offline-package.ts`, geofence `src/hooks/useGeofence.ts`
- **Mobil** `android/`, `ios/` — Capacitor native kabuk

## Backend (`/backend`)

| Katman | Yol | Sorumluluk |
|--------|-----|------------|
| API | `app/api/*_routes.py` | HTTP, Pydantic şema, status kodları |
| Service | `app/services/*.py` | İş kuralları, LLM/Stripe entegrasyonu |
| Repository | `app/repositories/*.py` | CRUD, sorgular |
| Model | `app/models/*.py` | SQLAlchemy tabloları |
| Core | `app/core/config.py`, `security.py` | Ayarlar, JWT |

## Modül eşlemesi

| Modül | Router | Service |
|-------|--------|---------|
| Auth / profil | `auth_routes` | `auth_service`, `profile_service` |
| Rota / durak | `route_routes`, `stop_routes` | `RouteService`, `StopService` |
| AI | `ai_routes` | `AIService` + `LLMService` |
| Ödeme | `payment_routes` | `PaymentService` |
| Rehber / trip | `guide_routes` | `guide_service`, `trip_request_service` |
| Sosyal | `social_routes` | `NoteService`, `ReviewService` |

## Veri

- Geliştirme: Docker Compose PostgreSQL veya SQLite
- Üretim: `DATABASE_URL` — `postgres://` otomatik `postgresql+asyncpg://` normalize edilir

## İlgili dokümanlar

- Detaylı Türkçe mimari: [../docs/architecture/MIMARI.md](../docs/architecture/MIMARI.md)
- UX: [../docs/ux/](../docs/ux/)
