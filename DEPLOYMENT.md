# Historial-GO — Canlıya alma (web deploy)

Proje kabul kriteri: **çalışan, canlı bir web uygulaması** (App Store zorunlu değil).

## Mimari

| Katman | Teknoloji | Canlı örnek yol |
|--------|-----------|-----------------|
| Frontend | React + Vite (SPA) | Vercel / Netlify / Render Static |
| Backend API | FastAPI (REST) | Render / Railway / Fly.io |
| Veritabanı | PostgreSQL | Render Postgres / Neon / Supabase |

Frontend ve backend **ayrı origin**; backend yalnızca JSON API sunar (`/docs`, `/ai/*`, `/auth/*`, …).

## 1. LLM anahtarı (zorunlu — kabul kriteri)

1. [OpenRouter](https://openrouter.ai/) hesabı → API key
2. Backend ortam değişkenleri:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

Alternatif Gemini:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
```

Doğrulama: `GET https://<API>/ai/status` → `"llm_enabled": true`

## 2. Render Blueprint (önerilen — tek panel)

Adım adım: [`scripts/RENDER_BLUEPRINT.md`](scripts/RENDER_BLUEPRINT.md)  
Repo kökünde [`render.yaml`](render.yaml) → Render Dashboard → New → Blueprint.

## 3. Backend (Render manuel örneği)

1. `render.yaml` ile Blueprint veya manuel **Web Service** → Docker, context: `backend/`
2. Ortam değişkenleri: `DATABASE_URL`, `JWT_SECRET_KEY`, `FRONTEND_URL`, `CORS_ORIGINS`, `OPENROUTER_API_KEY`
3. `CORS_ORIGINS` = canlı frontend URL (ör. `https://historial-go.vercel.app`)
4. `FRONTEND_URL` = aynı frontend URL (Stripe redirect)

Health: `https://<api-host>/health`

## 3. Frontend (Vercel örneği)

1. Root: `frontend/`
2. Build: `npm run build` · Output: `dist`
3. Env: `VITE_API_BASE_URL=https://<api-host>` (sonunda `/` yok)

## 5. Teslim kontrol listesi

| Kriter | Nasıl kanıtlanır |
|--------|------------------|
| Etkileşimli uygulama | Kayıt → onboarding → AI rota önerisi → satın alma → sesli rehber |
| LLM API entegrasyonu | `/ai/status` + öneri yanıtında `"source": "llm"` |
| Ayrı FE/BE API | Farklı URL’ler; mobil Capacitor aynı API’yi kullanır |
| Canlı deploy | README’de **Canlı URL** satırları doldurulmuş |

## Canlı URL (doldurun)

```
Frontend: https://___________________________
Backend:  https://___________________________/docs
AI durum: https://___________________________/ai/status
```

## Yerel doğrulama

```powershell
.\scripts\setup-local-env.ps1
# backend\.env -> OPENROUTER_API_KEY ekleyin (https://openrouter.ai/keys)
docker compose up -d
cd backend
uv sync
uv run uvicorn app.main:app --reload

cd frontend
npm install
npm run dev

# Ayri terminal:
.\scripts\verify-local.ps1
```
