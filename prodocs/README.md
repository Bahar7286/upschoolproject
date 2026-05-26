# prodocs — Yapay zeka ajanları için geliştirme referansı

Bu klasör, Cursor / Copilot gibi ajanların projeyi hızlı anlaması için **tek kaynak**tır.

## Hızlı bağlam

| Konu | Dosya |
|------|--------|
| Ürün gereksinimleri | [../PRD.md](../PRD.md) |
| Mimari (FE / API / servis / repo) | [architecture.md](./architecture.md) |
| REST uç noktaları özeti | [api-map.md](./api-map.md) |
| LLM (OpenRouter / Gemini) | [llm.md](./llm.md) |
| Test komutları | [testing.md](./testing.md) |
| Deploy | [../DEPLOYMENT.md](../DEPLOYMENT.md) |
| Teslim kontrol listesi | [../SUBMISSION_CHECKLIST.md](../SUBMISSION_CHECKLIST.md) |

## Klasör haritası

```
/frontend     React + Vite SPA; Capacitor → android/, ios/
/backend      FastAPI; app/api (router) → app/services → app/repositories
/prodocs      Bu klasör (ajan referansı)
```

## Kurallar (ajanlar için)

1. **İş mantığı** `backend/app/services/` içinde; router ince kalmalı.
2. **LLM** yalnızca `llm_service.py` üzerinden; `ai_service` fallback ile kural motoruna düşer.
3. **Frontend** API çağrıları `frontend/src/services/*`; base URL `VITE_API_BASE_URL`.
4. Gizli anahtarları commit etmeyin; `.env.example` şablonlarını kullanın.
5. Test: `backend/tests/unit` (hızlı), `backend/tests/integration` + `test_api.py` (HTTP).

## Demo hesaplar (seed)

| Rol | E-posta | Şifre |
|-----|---------|--------|
| Turist | tourist@example.com | demo123 |
| Rehber | guide@example.com | demo123 |
| Admin | admin@example.com | demo123 |
