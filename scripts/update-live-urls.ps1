param(
    [Parameter(Mandatory = $true)]
    [string]$FrontendUrl,
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl
)

$ErrorActionPreference = 'Stop'
$FrontendUrl = $FrontendUrl.TrimEnd('/')
$ApiUrl = $ApiUrl.TrimEnd('/')
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$readme = Join-Path $root 'README.md'
$content = Get-Content $readme -Raw
$content = $content -replace '\| Web \(frontend\) \| _Deploy sonrası buraya yazın_ \|', "| Web (frontend) | $FrontendUrl |"
$content = $content -replace '\| API \(backend\) \| _Deploy sonrası buraya yazın_ \|', "| API (backend) | $ApiUrl |"
Set-Content $readme $content -NoNewline

$deploy = Join-Path $root 'DEPLOYMENT.md'
$d = Get-Content $deploy -Raw
$d = $d -replace 'Frontend: https://_{10,}', "Frontend: $FrontendUrl"
$d = $d -replace 'Backend:  https://_{10,}/docs', "Backend:  $ApiUrl/docs"
$d = $d -replace 'AI durum: https://_{10,}/ai/status', "AI durum: $ApiUrl/ai/status"
Set-Content $deploy $d -NoNewline

$date = Get-Date -Format 'yyyy-MM-dd'
$progress = Join-Path $root 'Progress.md'
$p = Get-Content $progress -Raw
$p = $p -replace '\| Canlı deploy URL''leri \| README tablosu boş — deploy sonrası doldurulacak \|', "| Canlı deploy URL'leri | Tamamlandı ($date): FE $FrontendUrl, API $ApiUrl |"
Set-Content $progress $p -NoNewline

$plan = Join-Path $root 'Plan.md'
$pl = Get-Content $plan -Raw
$pl = $pl -replace '\| E7\.3 \| \(Jüri\) Canlı uygulamayı denemek \| Render/Vercel deploy, README canlı URL \| ⏳ Sizin deploy \|', '| E7.3 | (Jüri) Canlı uygulamayı denemek | Render Blueprint deploy, README canlı URL | ✅ |'
Set-Content $plan $pl -NoNewline

$check = Join-Path $root 'SUBMISSION_CHECKLIST.md'
$c = Get-Content $check -Raw
$c = $c -replace '- \[ \] \*\*Sizin doldurmanız gereken:\*\* `DEPLOYMENT.md` ve README''deki canlı URL''ler', '- [x] **Canlı deploy:** `DEPLOYMENT.md` ve README canlı URL dolduruldu'
Set-Content $check $c -NoNewline

Write-Host "Güncellendi: README.md, DEPLOYMENT.md, Progress.md, Plan.md, SUBMISSION_CHECKLIST.md"
