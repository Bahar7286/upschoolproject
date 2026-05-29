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
Write-Host "Manuel UX (mobil 375px veya DevTools):"
Write-Host "  1. Giris -> Keşfet -> Kişisel Rotani Olustur"
Write-Host "  2. Iller -> il -> ilce -> kategori (ikon kartlar) -> mekan -> TR/EN Dinle"
Write-Host "  3. Harita -> POI pinleri"
Write-Host "  4. /audio -> /map yonlendirmesi"
Write-Host "  5. Alt nav: 4 oge (Profil yok); ust menude Ses yok"
