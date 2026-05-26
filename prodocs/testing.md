# Test rehberi

## Backend

```bash
cd backend
$env:DATABASE_URL="sqlite+aiosqlite:///./test_hg.db"   # PowerShell
uv run pytest -q                                          # tümü
uv run pytest tests/unit -m unit -q                     # birim
uv run pytest --cov=app/services --cov-fail-under=90 -q # servis coverage
```

- **Unit:** `tests/unit/` — mock DB `test_unit.db`
- **Integration:** `tests/integration/`, `tests/test_api.py`

## Frontend

```bash
cd frontend
npm test
```

Vitest: `src/**/*.test.ts` (api, geofence, services).

## CI önerisi

1. `docker compose up -d` (opsiyonel PG)
2. Backend pytest + coverage eşiği
3. Frontend `npm test` + `npm run build`
