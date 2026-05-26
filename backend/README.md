# Historial-GO — Backend

FastAPI API katmanı. Tam kurulum ve çalıştırma: **[../README.md](../README.md)** (kök README).

## Hızlı başlangıç

```powershell
cd backend
copy .env.example .env
uv sync
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Alternatif (venv aktifleştirmeden):

```powershell
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Klasör yapısı

- `app/api/routers` — HTTP endpoint’ler
- `app/models` — SQLAlchemy tabloları
- `app/schemas` — Pydantic istek/yanıt modelleri
- `app/services` — iş kuralları
- `app/db` — bağlantı, bootstrap, seed
- `tests` — pytest

## API dokümantasyonu

Sunucu çalışırken: http://127.0.0.1:8000/docs
