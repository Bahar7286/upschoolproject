# Historial-GO

B2B2C kültür turizmi uygulaması: yapay zeka ile rota keşfi, sesli rehber / geofence, rehber pazaryeri, trip talepleri, gamification ve Stripe ödeme. **İnteraktif web + API** (statik site değil); LLM varsayılan olarak OpenRouter (ör. Gemma) üzerinden.

## Repo yapısı

| Klasör / dosya | İçerik |
|----------------|--------|
| [`frontend/`](frontend/) | React + Vite arayüz; mobil: `android/`, `ios/` (Capacitor) |
| [`backend/`](backend/) | FastAPI REST API |
| [`prodocs/`](prodocs/) | Yapay zeka ajanları için geliştirme referansı |
| [`prodocs/API_KEYS_TR.md`](prodocs/API_KEYS_TR.md) | API anahtarları: nereden alınır, nereye yapıştırılır (TR) |
| [`.gitignore`](.gitignore) | Gizli dosya, cache, coverage hariç tutma |
| [`.env.example`](.env.example) | Ortam değişkeni şablonu (gerçek anahtar yok) |
| [`PRD.md`](PRD.md) | Proje anayasası: problem, kullanıcı, özellikler |
| [`tech-stack.md`](tech-stack.md) | Teknolojiler, seçim gerekçeleri, geliştirmede AI kullanımı |
| [`Plan.md`](Plan.md) | PRD’den kullanıcı hikayeleri ve teknik adımlar |
| [`DesignSystem.md`](DesignSystem.md) | Renk, tipografi, bileşen kuralları |
| [`Progress.md`](Progress.md) | İş kaydı, kararlar ve hatalar |

## Canlı adresler

| Ortam | URL |
|-------|-----|
| Web (frontend) | https://historial-go-web.onrender.com |
| API (backend) | https://historial-go-api.onrender.com |

Deploy adımları: [`scripts/RENDER_BLUEPRINT.md`](scripts/RENDER_BLUEPRINT.md) · özet: [`DEPLOYMENT.md`](DEPLOYMENT.md)

Deploy sonrası URL’leri otomatik yazmak için (PowerShell):

```powershell
.\scripts\update-live-urls.ps1 -FrontendUrl "https://historial-go-web.onrender.com" -ApiUrl "https://historial-go-api.onrender.com"
```

## Teslim scriptleri

| Script | Amaç |
|--------|------|
| [`scripts/setup-local-env.ps1`](scripts/setup-local-env.ps1) | `.env` dosyalarını şablondan oluşturur |
| [`scripts/verify-local.ps1`](scripts/verify-local.ps1) | `/health`, `/ai/status`, `/docs` kontrolü |
| [`scripts/verify-live.ps1`](scripts/verify-live.ps1) | Canlı API + frontend kontrolü |
| [`scripts/JURY_DEMO.md`](scripts/JURY_DEMO.md) | Jüri demo adımları |

## Hızlı başlangıç (yerel)

**1. Ortam**

```bash
cp .env.example backend/.env
# backend/.env içinde DATABASE_URL, JWT_SECRET_KEY, isteğe bağlı OPENROUTER_API_KEY
cp frontend/.env.example frontend/.env
```

**2. Veritabanı + API**

```bash
docker compose up -d
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**3. Arayüz**

```bash
cd frontend
npm install
npm run dev
```

- Uygulama: http://localhost:5173  
- API dokümantasyonu: http://127.0.0.1:8000/docs  

**Demo:** `tourist@example.com` / `demo123` (rehber ve admin için `prodocs/README.md`).

## Test

```bash
cd backend && uv run pytest -q
cd frontend && npm test
```

Ayrıntı: [`prodocs/testing.md`](prodocs/testing.md).

## Teknoloji

- **Frontend:** React 19, TypeScript, Vite, Tailwind, Capacitor  
- **Backend:** FastAPI, SQLAlchemy 2, async PostgreSQL/SQLite, JWT, Stripe, httpx (LLM)  
- **LLM:** OpenRouter (`GET /ai/status`; model: `OPENROUTER_MODEL`)

## Lisans / teslim

Tüm kaynak kod bu repoda commit edilir; eğitmen en güncel commit üzerinden değerlendirir. Teslim kontrolü: [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md).
