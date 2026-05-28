# tech-stack.md — Teknoloji yığını ve seçim gerekçeleri

**Proje:** Historial-GO · **Son güncelleme:** Mayıs 2026

---

## 1. Özet tablo

| Katman | Teknoloji | Sürüm / not |
|--------|-----------|-------------|
| Arayüz | React + TypeScript + Vite | SPA; hızlı HMR |
| Stil | Tailwind CSS 3 | Tasarım token’ları `tailwind.config.js` |
| Mobil kabuk | Capacitor | `frontend/android`, `frontend/ios` |
| API | FastAPI | Async, OpenAPI `/docs` |
| ORM | SQLAlchemy 2 (async) | Repository + service katmanı |
| Veritabanı | PostgreSQL (prod), SQLite (test) | Docker Compose yerel |
| Auth | JWT (python-jose) | Bearer token |
| Ödeme | Stripe API | Yoksa demo checkout |
| LLM (ürün) | OpenRouter (örn. Gemma) veya doğrudan Gemini API | `httpx` ile REST |
| Harita | Leaflet + opsiyonel Google Maps | `VITE_GOOGLE_MAPS_API_KEY` |
| Test BE | pytest, pytest-asyncio, coverage | `tests/unit`, `tests/integration` |
| Test FE | Vitest | `src/**/*.test.ts` |
| Paket yönetimi BE | uv | `pyproject.toml`, `uv.lock` |
| Deploy şablonları | Render + Vercel + Docker | `render.yaml`, `vercel.json` |

---

## 2. Servis seçimlerinin gerekçeleri

### 2.1 FastAPI (backend framework)

- **Neden:** Otomatik OpenAPI, Pydantic v2 ile tip güvenliği, async I/O (DB + harici LLM/Stripe çağrıları).
- **Alternatif:** Django REST — daha ağır; bu MVP için router → service → repository yeterli.
- **Karar:** İnce router, iş mantığı `app/services/` içinde.

### 2.2 PostgreSQL + SQLAlchemy async

- **Neden:** İlişkisel veri (kullanıcı, rota, durak, satın alma, trip talebi); üretimde güvenilir.
- **Geliştirme:** `docker-compose.yml` ile yerel PG; testlerde SQLite (`aiosqlite`) hız için.
- **Karar:** Alembic henüz yok; `bootstrap.py` ile şema evrimi (MVP).

### 2.3 React + Vite (frontend)

- **Neden:** Bileşen tabanlı UI, TypeScript ile servis katmanı (`src/services/`), Vite ile hızlı geliştirme.
- **Alternatif:** Next.js — SSR bu projede zorunlu değil; API ayrı host’ta.
- **Karar:** SPA + `VITE_API_BASE_URL` ile backend ayrımı (kabul kriteri).

### 2.4 Capacitor (mobil)

- **Neden:** Tek web kod tabanından Android/iOS paketi; GPS ve native özellikler için köprü.
- **Karar:** Akademik teslimde web + mobil klasör yapısı (`/frontend/android`, `/ios`).

### 2.5 OpenRouter (LLM)

- **Neden:** Kabul kriteri — yapay zeka **harici API** ile; statik kural listesi tek başına yeterli değil.
- **OpenRouter:** Tek endpoint üzerinden model seçimi (varsayılan: `google/gemma-4-31b-it:free`).
- **Gemini API:** `LLM_PROVIDER=gemini` ile doğrudan Google `generateContent` (OpenRouter’dan bağımsız).
- **Fallback:** Anahtar yoksa `ai_service` kural motoru (`source: rules`).
- **Karar:** Tüm HTTP çağrıları `llm_service.py` içinde; prompt/parse `ai_service.py`.

### 2.6 Stripe

- **Neden:** Uluslararası kart ödemesi ve checkout session standardı.
- **Karar:** `STRIPE_SECRET_KEY` yoksa demo ödeme akışı (geliştirme/jüri).

### 2.7 Leaflet (+ opsiyonel Google Maps)

- **Neden:** Açık harita katmanı maliyetsiz; Google zengin POI için opsiyonel.
- **Karar:** `map-config.ts` ile sağlayıcı seçimi.

---

## 3. Geliştirme sürecinde yapay zekanın kullanımı

| Alan | Nasıl kullanıldı | İnsan kontrolü |
|------|------------------|----------------|
| Mimari iskelet | Cursor ajanı ile router/service/repo ayrımı | Kod inceleme, testler |
| LLM entegrasyonu | `llm_service` + `ai_service` taslağı | Mock testler, fallback davranışı |
| Test paketi | Birim + entegrasyon senaryoları üretimi | `pytest` / Vitest yeşil koşu, coverage %90 servis |
| UI sayfaları | Bileşen ve sayfa iskeletleri | `DesignSystem.md` ile tutarlılık |
| Dokümantasyon | `prodocs/`, PRD, Plan, Progress taslakları | Öğrenci tarafından doğrulama ve güncelleme |
| Hata ayıklama | Terminal log analizi (uv PATH, boş sayfa = FE kapalı) | Manuel `npm run dev` + `uvicorn` |

**İlke:** AI üretimi doğrudan commit edilmeden önce çalıştırılabilir test ve yerel smoke ile doğrulanır. Ürün içi LLM (OpenRouter) geliştirme aracından **ayrıdır** — yalnızca runtime’da `backend/.env` anahtarları ile etkinleşir.

---

## 4. Güvenlik ve gizlilik

- **Asla repoda:** `backend/.env`, gerçek `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `STRIPE_*`, `JWT_SECRET_KEY`, DB şifreleri.
- **Repoda:** `.env.example`, `backend/.env.example`, `frontend/.env.example` (placeholder).
- **`.gitignore`:** `.env`, `*.db`, coverage, `node_modules`, `.venv`.

---

## 5. İlgili dosyalar

- Mimari: [prodocs/architecture.md](prodocs/architecture.md), [docs/architecture/MIMARI.md](docs/architecture/MIMARI.md)
- LLM: [prodocs/llm.md](prodocs/llm.md)
- Deploy: [DEPLOYMENT.md](DEPLOYMENT.md)
