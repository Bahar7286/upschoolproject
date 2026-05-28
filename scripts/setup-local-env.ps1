# Historial-GO — yerel .env dosyalarını şablondan oluşturur (Git'e eklenmez)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Copy-EnvIfMissing($example, $target) {
    if (-not (Test-Path $target)) {
        Copy-Item $example $target
        Write-Host "Oluşturuldu: $target"
    } else {
        Write-Host "Zaten var: $target"
    }
}

Copy-EnvIfMissing (Join-Path $root 'backend\.env.example') (Join-Path $root 'backend\.env')
Copy-EnvIfMissing (Join-Path $root 'frontend\.env.example') (Join-Path $root 'frontend\.env')

Write-Host ""
Write-Host "Sonraki adımlar:"
Write-Host "  1. backend\.env içine OPENROUTER_API_KEY ekleyin (https://openrouter.ai/keys)"
Write-Host "  2. docker compose up -d"
Write-Host "  3a. cd backend; uv run alembic upgrade head; uv run uvicorn app.main:app --reload"
Write-Host "  3b. veya venv: .\scripts\run-backend-venv.ps1"
Write-Host "  4. cd frontend; npm run dev"
Write-Host "  5. http://127.0.0.1:8000/ai/status -> llm_enabled: true"
