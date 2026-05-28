#!/bin/sh
set -e
PORT="${PORT:-8000}"
echo "Running database migrations..."
uv run alembic upgrade head
echo "Starting Historial-GO API on 0.0.0.0:${PORT}"
exec uv run uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
