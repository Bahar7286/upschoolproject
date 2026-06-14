# Progress.md — İş kaydı, kararlar ve hatalar

**Proje:** Historial-GO · **Format:** Kronolojik özet (en yeni altta)

---

## Yaklaşım

- Backend ve frontend **ayrı süreçler**; iletişim yalnızca REST API.
- Python ortamı: **uv**; test önce backend, sonra frontend.
- Hata ayıklama: terminal çıktısı → test → kod düzeltmesi.
- Gizlilik: gerçek API anahtarları ve DB şifreleri **yalnızca yerel `.env`**; repoda yalnızca `.env.example`.

---

## Faz 1 — Ortam ve iskelet

| Tarih | Yapılan | Karar / not |
|-------|---------|-------------|
| Başlangıç | `backend/` + `frontend/` yapısı doğrulandı | Monorepo kök |
| — | `uv` kurulumu (winget), PATH sorunları giderildi | PowerShell’de `&&` yerine `;` |
| — | Backend `uv run uvicorn` → `/health` 200 | FE ayrı terminalde |
| — | “Boş sayfa” | Backend `/` UI sunmaz; Vite `localhost:5173` gerekli |

---

## Faz 2 — CRUD ve auth

| Yapılan | Karar |
|---------|--------|
| Users, routes, payments CRUD + testler | İnce router, servis katmanı |
| `LoginResponse` yalnızca `access_token` | Swagger sadeleştirme |
| JWT, register/login | Demo seed kullanıcılar |

---

## Faz 3 — Modüler backend

| Yapılan | Karar |
|---------|--------|
| `repositories/` katmanı | Test edilebilirlik |
| Places, plans, notes, reviews, trip_requests, guide_offers | PRD özellikleri |
| `profile_service`, `password_reset_service` | `auth_service` birleştirildi |
| `NoteRepository.delete_by_user_route` | Testte eksik metod bulundu, eklendi |

---

## Faz 4 — LLM (kabul kriteri)

| Yapılan | Karar |
|---------|--------|
| `llm_service.py` (OpenRouter + isteğe bağlı Gemini API) | Tek HTTP katmanı |
| `ai_service` LLM + kural fallback | `source: llm \| rules` |
| `GET /ai/status` | Jüri doğrulama |
| FE Discover’da LLM durumu | `fetchAiStatus()` |

**Hata:** LLM unit testinde `AsyncMock` ile `.json()` — **Çözüm:** `MagicMock` response.

---

## Faz 5 — Frontend akışları

| Yapılan | Karar |
|---------|--------|
| Onboarding, discover, harita, audio-guide | Capacitor hazır |
| Checkout, trip request, guide marketplace | Stripe yoksa demo |
| Gamification UI, admin, verification | PRD persona’ları |
| Tasarım sistemi v2 (heritage token) | `DesignSystem.md` |

---

## Faz 6 — Test ve kalite

| Yapılan | Karar |
|---------|--------|
| `tests/unit/` + marker `unit` | Ayrı SQLite `test_unit.db` |
| Integration `test_api.py`, `test_auth_payment_ai.py` | `test_historial_go.db` ayrı dosya |
| `app/services` coverage ~%90+ | `--cov-fail-under=90` |
| Vitest: api, geofence, services | `npm test` |

**Hata:** Integration’da `drop_all` yarışı — **Çözüm:** Unit ve integration için farklı DB dosyaları.

**Hata:** Review testleri seed çakışması — **Çözüm:** Benzersiz `route_id` (88, 99).

**Hata:** `GuideOfferCreate` min message — **Çözüm:** Test mesajı uzatıldı.

---

## Faz 7 — Teslim ve dokümantasyon

| Yapılan | Karar |
|---------|--------|
| `prodocs/` ajan referansı | `docs/` UX/mimari kalır |
| `.env.example` kök + backend + frontend | `.gitignore` ile `.env` hariç |
| `DEPLOYMENT.md`, `render.yaml`, Dockerfile | Canlı URL kullanıcı doldurur |
| Git commit: tam stack teslim | `a595627` ve sonrası |
| Zorunlu belgeler: PRD, tech-stack, Plan, DesignSystem, Progress | Bu dosya seti |

---

## Açık konular

| Konu | Durum |
|------|--------|
| Canlı deploy URL’leri | ✅ Frontend: https://historial-go-web.onrender.com · API: https://historial-go-api.onrender.com |
| `OPENROUTER_API_KEY` (yerel) | `backend/.env` içine siz ekleyin → `llm_enabled: true` |
| Alembic migration | ✅ `backend/alembic/versions/` |
| AR avatar | v2 |
| Google Places proxy + keşif sayfaları | ✅ Mayıs 2026 |
| Backend rate limit / `/ready` | ✅ prod-only limit, AI anon/auth bucket |
| Guide mutasyon auth | ✅ JWT + `require_guide_self_or_admin` |
| Integration test hızı | ✅ `seed_minimal_data` + `client_full_geo` (~56 sn) |

---

## Faz 8 — 81 il/ilçe keşif + Premium flag

| Yapılan | Karar |
|---------|--------|
| `cities` / `districts` tabloları + seed | TurkiyeAPI dataset vendor (81 il, 973 ilçe) |
| `GET /cities`, `GET /cities/{id}/districts` | Keşfet akışı için deterministik veri |
| `POST /admin/poi/sync` | Overpass (OSM) tabanlı POI çekme (admin tetiklemeli) |
| `favorites` tablosu + `/favorites` | Mekan favorileri (JWT) |
| `users.is_premium` + `/admin/users/{id}/premium` | Ödeme yok; admin flag ile feature gating |
| FE: `/cities` akışı + `/favorites` + `/premium` | Turist keşfi öne çıkarıldı; rehber sekmesi korunuyor |

---

## Teslim hazırlığı (otomasyon)

| Tarih | Yapılan |
|-------|---------|
| 2026-05-26 | `backend/.env` + `frontend/.env` tam şablon; `scripts/` (setup, verify, Render rehberi, URL güncelleme) |
| 2026-05-26 | Yerel: Docker PG, pytest 127 passed, Vitest 20 passed, `/health` + `/docs` OK |
| 2026-05-26 | `verify-local.ps1`: LLM anahtarı bekleniyor (OpenRouter key kullanıcı eklemeli) |
| 2026-05-26 | Production güvenlik: API auth, durak önizleme, SMTP reset, UPLOAD_DIR, testler (131 pytest) |

---

## Faz 9 — Türkiye keşif, Google, dokümantasyon senkronu

| Yapılan | Karar |
|---------|--------|
| `google_routes`, `geo_routes`, city/district/places FE akışı | API anahtarı backend’de |
| i18n TR/EN, `nav-items`, mobil login görünürlüğü | `AuthHeaderActions` |
| Rate limit yalnızca production; testlerde `TESTING=1` | 141 pytest yeşil |
| PRD, MVP, Plan, DesignSystem güncellemesi | Eski RN/Node taslakları düzeltildi |

---

## Faz 10 — Keşif, ses ve bağlantı UX (Mayıs 2026)

| Yapılan | Karar |
|---------|--------|
| Mobil alt nav 4 öğe; drawer `createPortal`; scroll/overlap düzeltmesi | Profil header’da; Ses nav kaldırıldı |
| `CategoryIconCard` — il/ilçe kategori seçimi (beyaz ikon kart) | Yeşil gradient hub kaldırıldı |
| `PlaceNarrationPanel` — mekan detay TR/EN prefetch + Dinle | `/audio` → `/map` redirect |
| `api.ts` retry/backoff + startup `/health` ping | Render cold start |
| Aktif rota: Google map polyline, watchPosition, geofence ek duraklar | `useGeofenceWatch` istemci tarafı |
| `ensure_images_seeded` + narration cache (TTL) | Backend startup |
| PRD, Plan, Checklist, DesignSystem senkron | Teslim dokümanları güncellendi |

**Deploy:** Push `659b25d` / `ea0f588` sonrası Render auto-deploy; canlı JS `index-BSwm78H_.js` (May 2026).

---

## Faz 11 — Denetim düzeltmeleri (Haziran 2026)

| Yapılan | Karar |
|---------|--------|
| Guide CRUD/earnings/payout JWT + sahiplik | `require_guide_self_or_admin`, admin-only `POST /guides` |
| AI POST opsiyonel auth + anon/auth rate limit | `get_optional_user_id`, `_AI_ANON_MAX=8` |
| `seed_minimal_data` / `seed_full_geo_data` | Integration ~56 sn (önceden saatler) |
| `GET /payments/history` alias | api-map hizalandı |
| `/quotes` → 410 Gone | FE quotes-page kaldırıldı |
| SeoService, ProfileService, ModerationDecisionRepository | Katman temizliği |
| features/discover, profile, map-session | Sayfa orchestration feature'lara taşındı |

---

```powershell
docker compose up -d
cd backend; uv run uvicorn app.main:app --reload
cd frontend; npm run dev
cd backend; uv run pytest -q    # 141 passed
cd frontend; npm test
```

---

## Güvenlik hatırlatması

⚠️ `backend/.env`, Stripe/LLM anahtarları, `JWT_SECRET_KEY` ve veritabanı şifreleri **GitHub’a push edilmemelidir**. Yalnızca `.env.example` şablonları commit edilir.
