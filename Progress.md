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
| `llm_service.py` (OpenRouter + Gemini) | Tek HTTP katmanı |
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
| Canlı deploy URL’leri | README tablosu boş — deploy sonrası doldurulacak |
| Alembic migration | PRD yol haritası; henüz yok |
| AR avatar | v2 |

---

## Komut özeti (doğrulanmış)

```powershell
docker compose up -d
cd backend; uv run uvicorn app.main:app --reload
cd frontend; npm run dev
cd backend; uv run pytest -q
cd frontend; npm test
```

---

## Güvenlik hatırlatması

⚠️ `backend/.env`, Stripe/LLM anahtarları, `JWT_SECRET_KEY` ve veritabanı şifreleri **GitHub’a push edilmemelidir**. Yalnızca `.env.example` şablonları commit edilir.
