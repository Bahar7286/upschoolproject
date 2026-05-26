# Historial-GO

B2B2C kültür turizmi uygulaması: yapay zeka ile rota keşfi, sesli rehber / geofence, rehber pazaryeri, trip talepleri, gamification ve Stripe ödeme. **İnteraktif web + API** (statik site değil); LLM OpenRouter veya Google Gemini üzerinden.

## Repo yapısı

| Klasör / dosya | İçerik |
|----------------|--------|
| [`frontend/`](frontend/) | React + Vite arayüz; mobil: `android/`, `ios/` (Capacitor) |
| [`backend/`](backend/) | FastAPI REST API |
| [`prodocs/`](prodocs/) | Yapay zeka ajanları için geliştirme referansı |
| [`.gitignore`](.gitignore) | Gizli dosya, cache, coverage hariç tutma |
| [`.env.example`](.env.example) | Ortam değişkeni şablonu (gerçek anahtar yok) |
| [`PRD.md`](PRD.md) | Ürün gereksinimleri |

## Canlı adresler

| Ortam | URL |
|-------|-----|
| Web (frontend) | _Deploy sonrası buraya yazın_ |
| API (backend) | _Deploy sonrası buraya yazın_ |

Detaylı deploy: [`DEPLOYMENT.md`](DEPLOYMENT.md).

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
- **LLM:** OpenRouter veya Gemini (`GET /ai/status`)

## Lisans / teslim

Tüm kaynak kod bu repoda commit edilir; eğitmen en güncel commit üzerinden değerlendirir. Teslim kontrolü: [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md).
