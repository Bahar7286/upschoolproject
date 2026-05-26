# Render Blueprint deploy (Seçenek A)

## 1. Önkoşul

- GitHub’da güncel kod: `git push origin main`
- https://render.com hesabı

## 2. Blueprint oluşturma

1. Render Dashboard → **New** → **Blueprint**
2. GitHub reponuzu bağlayın
3. `render.yaml` onaylayın → **Apply**

## 3. Deploy sonrası URL’leri not edin

| Servis | Örnek ad |
|--------|----------|
| API | `https://historial-go-api.onrender.com` |
| Web | `https://historial-go-web.onrender.com` |

## 4. Ortam değişkenleri (manuel)

### historial-go-api → Environment

| Key | Değer |
|-----|--------|
| `OPENROUTER_API_KEY` | OpenRouter’dan `sk-or-v1-...` |
| `FRONTEND_URL` | Web URL (https, sondaki `/` yok) |
| `CORS_ORIGINS` | Aynı web URL |

`DATABASE_URL` ve `JWT_SECRET_KEY` Blueprint ile gelir — değiştirmeyin.

### historial-go-web → Environment

| Key | Değer |
|-----|--------|
| `VITE_API_BASE_URL` | API URL (sondaki `/` yok) |

Kaydettikten sonra **Manual Deploy** (web servisi).

## 5. Doğrulama

```
https://<API>/health
https://<API>/ai/status   → llm_enabled: true
https://<WEB>/            → uygulama açılır
```

## 6. Repoda URL güncelleme

```powershell
.\scripts\update-live-urls.ps1 -FrontendUrl "https://..." -ApiUrl "https://..."
git add README.md DEPLOYMENT.md Progress.md Plan.md SUBMISSION_CHECKLIST.md
git commit -m "docs: add live deployment URLs"
git push origin main
```
