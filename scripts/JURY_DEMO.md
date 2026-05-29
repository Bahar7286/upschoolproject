# Jüri demo kontrol listesi

## Yerel (geliştirici)

1. `docker compose up -d`
2. `cd backend` → `uv run uvicorn app.main:app --reload`
3. `cd frontend` → `npm run dev`
4. `.\scripts\verify-local.ps1` → `/health` OK; `/ai/status` → `llm_enabled: true` (anahtar gerekli)
5. http://localhost:5173 → `tourist@example.com` / `demo123`
6. Keşfet → **Kişisel Rotanı Oluştur** (AI chip paneli)
7. İller → il → ilçe → kategori (ikon kartlar) → mekan → **TR/EN Dinle**
8. Harita → POI pinleri; `/audio` → `/map` yönlendirmesi

## Canlı (deploy sonrası)

```powershell
.\scripts\verify-live.ps1 -FrontendUrl "https://historial-go-web.onrender.com" -ApiUrl "https://historial-go-api.onrender.com"
```

| # | Kontrol | Beklenen |
|---|---------|----------|
| 1 | Frontend URL | SPA yüklenir |
| 2 | Giriş demo hesap | Keşfet / İller |
| 3 | AI öneri | Kişisel Rotanı Oluştur; öneri listesi |
| 4 | Mekan detay | TR/EN toggle + Dinle |
| 5 | Mobil alt nav | 4 öğe (Profil yok); Ses sekmesi yok |
| 6 | `https://historial-go-api.onrender.com/ai/status` | `llm_enabled: true` |
| 7 | `https://historial-go-api.onrender.com/docs` | Swagger |

## Sık hatalar

- **CORS:** `CORS_ORIGINS` = tam frontend URL (https)
- **Boş API:** `VITE_API_BASE_URL` yanlış veya web servisi yeniden build edilmedi
- **LLM kapalı:** `OPENROUTER_API_KEY` Render API env’de yok
- **Uyku modu:** Render free ilk istek 30–60 sn; önce `/health` açın
