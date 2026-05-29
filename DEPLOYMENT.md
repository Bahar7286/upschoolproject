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
OPENROUTER_MODEL=google/gemma-4-31b-it:free
```

Alternatif (doğrudan Google Gemini API, OpenRouter değil):

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

Health: `https://<api-host>/health` · Readiness: `https://<api-host>/ready`

## 3. Frontend (Vercel örneği)

1. Root: `frontend/`
2. Build: `npm run build` · Output: `dist`
3. Env: `VITE_API_BASE_URL=https://<api-host>` (sonunda `/` yok)

## 5. Teslim kontrol listesi

| Kriter | Nasıl kanıtlanır |
|--------|------------------|
| Etkileşimli uygulama | Kayıt → onboarding → AI rota önerisi → İller → mekan → TR/EN dinle |
| LLM API entegrasyonu | `/ai/status` + öneri yanıtında `"source": "llm"` |
| Ayrı FE/BE API | Farklı URL’ler; mobil Capacitor aynı API’yi kullanır |
| Canlı deploy | README’de **Canlı URL** satırları doldurulmuş |

## 6. Deploy sonrası UX doğrulama

Push ve **Manual Deploy** (Clear build cache önerilir) sonrası kontrol edin:

| Kontrol | Beklenen |
|---------|----------|
| `VITE_API_BASE_URL` | `https://historial-go-api.onrender.com` (Render web env, build-time) |
| `CORS_ORIGINS` | `https://historial-go-web.onrender.com` |
| Alt nav (mobil) | 4 öğe; Profil yok |
| `/audio` | `/map` yönlendirmesi |
| İlçe kategori hub | Beyaz `CategoryIconCard` (yeşil gradient yok) |
| Mekan detay | TR/EN + Dinle |
| Hard refresh | `Ctrl+Shift+R` veya gizli pencere (eski cache) |

```powershell
.\scripts\verify-live.ps1
```

## Canlı URL (doldurun)

```
Frontend: https://historial-go-web.onrender.com
Backend:  https://historial-go-api.onrender.com/docs
AI durum: https://historial-go-api.onrender.com/ai/status
```

## Yerel doğrulama

**1. Ortam (bir kez)**

```powershell
.\scripts\setup-local-env.ps1
# backend\.env -> DATABASE_URL, JWT_SECRET_KEY, OPENROUTER_API_KEY
```

**2. Backend (PowerShell — iki yol, ikisi de doğru)**

`docker compose` **proje kökünden** çalıştırılır (`docker-compose.yml` kökte).

**Yol A — venv + alembic (sizin kullandığınız):**

```powershell
cd "c:\Users\gulba\OneDrive\Masaüstü\upschoolproject"
docker compose up -d
cd backend
.\.venv\Scripts\Activate.ps1
python -m app.db.migrate_on_start
# veya: alembic -c alembic.ini upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Yol B — uv (README ile aynı):**

```powershell
cd "c:\Users\gulba\OneDrive\Masaüstü\upschoolproject"
docker compose up -d
cd backend
uv sync
uv run python -m app.db.migrate_on_start
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API: http://127.0.0.1:8000/docs  
- Sağlık: http://127.0.0.1:8000/health  

**3. Frontend (ayrı terminal)**

```powershell
cd frontend
npm install
npm run dev
```

**4. Kontrol**

```powershell
.\scripts\verify-local.ps1
```