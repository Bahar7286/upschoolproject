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
| `OPENROUTER_API_KEY` | OpenRouter panelinden anahtar (ornek format: sk-or-v1-...) |
| `FRONTEND_URL` | Web URL (https, sondaki `/` yok) |
| `CORS_ORIGINS` | Aynı web URL |

`DATABASE_URL` ve `JWT_SECRET_KEY` Blueprint ile gelir — değiştirmeyin.

| `GOOGLE_PLACES_API_KEY` | Backend Google key |
| `GOOGLE_ROUTES_API_KEY` | Aynı backend key olabilir |

**Port hatası (`no open ports detected`):** Dockerfile `PORT` ortam değişkenini kullanır; bu düzeltme `docker-entrypoint.sh` ile gelir. Deploy öncesi `git push origin main` şart.

### historial-go-web → Environment

| Key | Değer |
|-----|--------|
| `VITE_API_BASE_URL` | API URL (sondaki `/` yok) |
| `VITE_GOOGLE_MAPS_API_KEY` | Frontend Maps key |

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
