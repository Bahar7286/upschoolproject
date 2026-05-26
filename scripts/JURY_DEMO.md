# Jüri demo kontrol listesi

## Yerel (geliştirici)

1. `docker compose up -d`
2. `cd backend` → `uv run uvicorn app.main:app --reload`
3. `cd frontend` → `npm run dev`
4. `.\scripts\verify-local.ps1` → `/health` OK; `/ai/status` → `llm_enabled: true` (anahtar gerekli)
5. http://localhost:5173 → `tourist@example.com` / `demo123`
6. Keşfet → Kişisel önerileri getir
7. Rota detay → sesli rehber / harita

## Canlı (deploy sonrası)

```powershell
.\scripts\verify-live.ps1 -FrontendUrl "https://<web>" -ApiUrl "https://<api>"
```

| # | Kontrol | Beklenen |
|---|---------|----------|
| 1 | Frontend URL | SPA yüklenir |
| 2 | Giriş demo hesap | Dashboard / keşfet |
| 3 | AI öneri | LLM aktif etiketi veya `source: llm` |
| 4 | `https://<api>/ai/status` | `llm_enabled: true` |
| 5 | `https://<api>/docs` | Swagger |
| 6 | Rota + sesli rehber | Konum izni verin |

## Sık hatalar

- **CORS:** `CORS_ORIGINS` = tam frontend URL (https)
- **Boş API:** `VITE_API_BASE_URL` yanlış veya web servisi yeniden build edilmedi
- **LLM kapalı:** `OPENROUTER_API_KEY` Render API env’de yok
- **Uyku modu:** Render free ilk istek 30–60 sn; önce `/health` açın
