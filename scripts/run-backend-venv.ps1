# Yerel backend — klasik venv (uv kullanmiyorsaniz)
# Kullanim: .\scripts\run-backend-venv.ps1

$ErrorActionPreference = 'Stop'
$backend = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..' 'backend' | Resolve-Path

Set-Location $backend

if (-not (Test-Path '.venv\Scripts\python.exe')) {
    Write-Host 'venv olusturuluyor...' -ForegroundColor Cyan
    python -m venv .venv
    .\.venv\Scripts\pip install -U pip
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        uv export --frozen --no-dev -o .requirements.txt
        .\.venv\Scripts\pip install -r .requirements.txt
    } else {
        Write-Host 'uv yok: once backend\.venv icinde pip install alembic fastapi uvicorn sqlalchemy asyncpg python-dotenv ...' -ForegroundColor Yellow
        exit 1
    }
}

$env:PYTHONPATH = $backend.Path
Write-Host 'Migration...' -ForegroundColor Cyan
.\.venv\Scripts\alembic -c alembic.ini upgrade head

Write-Host 'API http://127.0.0.1:8000' -ForegroundColor Green
.\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
