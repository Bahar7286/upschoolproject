#!/bin/sh
set -e
PORT="${PORT:-8000}"
cd /app

echo "Running database migrations..."
uv run python -m app.db.migrate_on_start

echo "Starting Historial-GO API on 0.0.0.0:${PORT}"
exec uv run uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
