# Mevcut PostgreSQL (create_all / yarim migration) icin Alembic'i senkronlar.
# Kullanim: .\scripts\fix-local-alembic.ps1

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..' 'backend')

if (Test-Path '.\.venv\Scripts\Activate.ps1') {
    . .\.venv\Scripts\Activate.ps1
}

Write-Host 'Alembic: schema heal + upgrade head...' -ForegroundColor Cyan
python -m app.db.migrate_on_start
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Tamam. Kontrol:' -ForegroundColor Green
python -m alembic current

Write-Host ''
Write-Host 'Sonra API:' -ForegroundColor Green
Write-Host '  python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000'
