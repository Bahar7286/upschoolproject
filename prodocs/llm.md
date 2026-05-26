# LLM entegrasyonu

## Gereksinim

Uygulama statik değil; rota önerisi ve anlatım **harici LLM API** ile desteklenir (kabul kriteri).

## Yapılandırma (`backend/.env`)

```env
LLM_PROVIDER=openrouter   # veya gemini
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemini-2.0-flash-001
# GEMINI_API_KEY=...      # LLM_PROVIDER=gemini
```

Anahtar yoksa: `AIService` kural motoruna düşer; yanıtta `source: "rules"`.

## Kod

| Dosya | Rol |
|-------|-----|
| `app/services/llm_service.py` | OpenRouter chat/completions, Gemini generateContent |
| `app/services/ai_service.py` | Prompt, parse, fallback |
| `app/api/ai_routes.py` | `/ai/recommend`, `/ai/status`, narration |

## Frontend

- `fetchAiStatus()` — Discover sayfasında LLM durumu
- Öneri: `POST /ai/recommend` body: `tags`, `budget`, `duration_hours`, `city`

## Test

```bash
cd backend
uv run pytest tests/unit/test_llm_service.py tests/unit/test_ai_llm_integration.py -q
```
