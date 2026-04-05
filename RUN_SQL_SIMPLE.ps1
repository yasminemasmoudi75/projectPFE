#!/usr/bin/env pwsh
# SCRIPT: Executer le SQL pour inserer tous les roles

$sqlFile = "$PSScriptRoot\SQL_COMPLETE_ALL_ROLES_ALL_MODULES.sql"
$server = "localhost"
$database = "PFE"

Write-Host "Execution du script SQL..." -ForegroundColor Cyan
Write-Host "Fichier: $sqlFile" -ForegroundColor Yellow
Write-Host "Base: $database" -ForegroundColor Yellow

if (-not (Test-Path $sqlFile)) {
    Write-Host "ERREUR: Fichier SQL non trouve!" -ForegroundColor Red
    exit 1
}

# Executer avec sqlcmd
try {
    sqlcmd -S $server -d $database -i $sqlFile -b
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "" 
        Write-Host "SUCCESS - Script SQL executed!" -ForegroundColor Green
        Write-Host "All roles and modules inserted." -ForegroundColor Green
    } else {
        Write-Host "ERROR: SQL script failed with code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} 
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. npm start (backend)" -ForegroundColor Cyan
Write-Host "2. npm run dev (frontend)" -ForegroundColor Cyan
Write-Host "3. Test permissions in app" -ForegroundColor Cyan
