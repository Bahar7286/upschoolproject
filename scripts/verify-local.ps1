# Local verification - backend must be running (uvicorn)
param([string]$ApiBase = 'http://127.0.0.1:8000')

$ErrorActionPreference = 'Continue'
$ApiBase = $ApiBase.TrimEnd('/')

Write-Host '=== Historial-GO local verification ===' -ForegroundColor Cyan

try {
    $null = Invoke-RestMethod -Uri "$ApiBase/health" -TimeoutSec 15
    Write-Host '[OK] /health' -ForegroundColor Green
} catch {
    Write-Host '[FAIL] /health - start backend: cd backend; uv run uvicorn app.main:app --reload' -ForegroundColor Red
    exit 1
}

try {
    $ai = Invoke-RestMethod -Uri "$ApiBase/ai/status" -TimeoutSec 15
    if ($ai.llm_enabled -eq $true) {
        Write-Host "[OK] /ai/status llm_enabled=true provider=$($ai.provider)" -ForegroundColor Green
    } else {
        Write-Host '[WARN] /ai/status llm_enabled=false - add OPENROUTER_API_KEY to backend\.env' -ForegroundColor Yellow
    }
} catch {
    Write-Host '[FAIL] /ai/status' -ForegroundColor Red
}

try {
    $null = Invoke-WebRequest -Uri "$ApiBase/docs" -UseBasicParsing -TimeoutSec 15
    Write-Host '[OK] /docs (Swagger)' -ForegroundColor Green
} catch {
    Write-Host '[FAIL] /docs' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Frontend: cd frontend; npm run dev -> http://localhost:5173'
Write-Host 'Demo: tourist@example.com / demo123'
