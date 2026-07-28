param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [Parameter(Mandatory=$true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " A.S BOQ PRO Güncelleme Sistemi" -ForegroundColor Cyan
Write-Host " Sürüm: $Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\package.json")) {
    Write-Host "HATA: package.json bulunamadı." -ForegroundColor Red
    Write-Host "Script proje ana klasöründe çalıştırılmalıdır." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/5] Git durumu kontrol ediliyor..." -ForegroundColor Yellow
git status --short

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupBranch = "backup-$Version-$timestamp"

Write-Host ""
Write-Host "[2/5] Güvenlik yedeği oluşturuluyor..." -ForegroundColor Yellow

git branch $backupBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "Yedek dal oluşturulamadı." -ForegroundColor Red
    exit 1
}

Write-Host "Yedek dal: $backupBranch" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Production build başlatılıyor..." -ForegroundColor Yellow

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "BUILD BAŞARISIZ!" -ForegroundColor Red
    Write-Host "Dosyalar GitHub'a gönderilmedi." -ForegroundColor Yellow
    Write-Host "Geri dönüş için:" -ForegroundColor Yellow
    Write-Host "git reset --hard $backupBranch" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "[4/5] Değişiklikler Git'e ekleniyor..." -ForegroundColor Yellow

git add .

$changes = git status --porcelain

if (-not $changes) {
    Write-Host "Commit edilecek yeni değişiklik bulunamadı." -ForegroundColor Yellow
    exit 0
}

git commit -m "$Version - $Message"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git commit işlemi başarısız." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[5/5] GitHub'a gönderiliyor..." -ForegroundColor Yellow

git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "GitHub push işlemi başarısız." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " $Version başarıyla yayınlandı." -ForegroundColor Green
Write-Host " Yedek: $backupBranch" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
