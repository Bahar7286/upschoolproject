param(
    [Parameter(Mandatory = $true)]
    [string]$FrontendUrl,
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl
)

$ApiUrl = $ApiUrl.TrimEnd('/')
$FrontendUrl = $FrontendUrl.TrimEnd('/')

Write-Host "=== Canlı jüri doğrulama ===" -ForegroundColor Cyan

& "$PSScriptRoot\verify-local.ps1" -ApiBase $ApiUrl

try {
    $r = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 30
    if ($r.StatusCode -eq 200) {
        Write-Host "[OK] Frontend $FrontendUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "[FAIL] Frontend erişilemiyor" -ForegroundColor Red
}

Write-Host ""
Write-Host "Manuel: giriş -> Keşfet -> AI öneri -> rota detay sesli rehber"
