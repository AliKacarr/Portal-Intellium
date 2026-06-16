# portaldb sıfırlama + backend (dev migration otomatik)
# Kullanım: .\scripts\reset-portaldb-and-run.ps1
# Gereksinim: PostgreSQL psql PATH'te; appsettings.json bağlantı bilgileri

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$appsettings = Join-Path $root "WebApi\appsettings.json"
$json = Get-Content $appsettings -Raw | ConvertFrom-Json
$cs = $json.ConnectionStrings.DevConnectionStrings

if ($cs -match "Host=([^;]+).*Port=([^;]+).*User Id=([^;]+).*Password=([^;]+).*Database=([^;]+)") {
    $dbHost = $Matches[1]
    $dbPort = $Matches[2]
    $dbUser = $Matches[3]
    $dbPass = $Matches[4]
    $dbName = $Matches[5]
} else {
    Write-Error "DevConnectionStrings parse edilemedi. appsettings.json kontrol edin."
}

$env:PGPASSWORD = $dbPass
Write-Host "Veritabani sifirlaniyor: $dbName @ ${dbHost}:${dbPort}" -ForegroundColor Yellow

$schemaSql = Join-Path $root "DataAccess\Scripts\ResetPortalDatabase.sql"
psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $schemaSql
if ($LASTEXITCODE -ne 0) {
    Write-Host "psql basarisiz. pgAdmin ile ResetPortalDatabase.sql calistirin, sonra: cd WebApi; dotnet run" -ForegroundColor Red
    exit 1
}

Write-Host "Backend baslatiliyor (migration otomatik)..." -ForegroundColor Green
Set-Location (Join-Path $root "WebApi")
dotnet run
