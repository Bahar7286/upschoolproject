# LLM entegrasyonu

## Gereksinim

Uygulama statik değil; rota önerisi ve anlatım **harici LLM API** ile desteklenir (kabul kriteri).

## Yapılandırma (`backend/.env`)

```env
LLM_PROVIDER=openrouter   # veya gemini
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=google/gemma-4-31b-it:free
# GEMINI_API_KEY=...      # yalnızca LLM_PROVIDER=gemini (doğrudan Google API)
```

Anahtar yoksa: `AIService` kural motoruna düşer; yanıtta `source: "rules"`.

## Kod

| Dosya | Rol |
|-------|-----|
| `app/services/llm_service.py` | OpenRouter chat/completions; isteğe bağlı doğrudan Gemini API |
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
