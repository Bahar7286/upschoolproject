# Mevcut PostgreSQL (create_all ile olusturulmus) icin Alembic'i senkronlar.
# Kullanim: .\scripts\fix-local-alembic.ps1

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..' 'backend')

Write-Host 'Alembic: migrate_on_start (stamp + upgrade)...' -ForegroundColor Cyan
uv run python -m app.db.migrate_on_start

Write-Host 'Tamam. Simdi: uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000' -ForegroundColor Green
