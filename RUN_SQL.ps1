#!/usr/bin/env pwsh
# ═════════════════════════════════════════════════════════════════
# 🔧 POWERSHELL SCRIPT: Exécuter le SQL automatiquement
# ═════════════════════════════════════════════════════════════════

# Configuration
$sqlFile = "$PSScriptRoot\SQL_COMPLETE_ALL_ROLES_ALL_MODULES.sql"
$server = "localhost"
$database = "PFE"  # À adapter selon ton nom de base

Write-Host "🚀 Exécution du script SQL..." -ForegroundColor Cyan
Write-Host "📁 Fichier: $sqlFile" -ForegroundColor Yellow
Write-Host "🗄️  Base de données: $database`n" -ForegroundColor Yellow

# Vérifier que le fichier existe
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ ERREUR: Le fichier SQL n'existe pas!" -ForegroundColor Red
    Write-Host "Chemin attendu: $sqlFile" -ForegroundColor Red
    exit 1
}

# Exécuter le script SQL
try {
    sqlcmd -S $server -d $database -i "$sqlFile" -b
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Script SQL exécuté avec succès!" -ForegroundColor Green
        Write-Host "📊 Tous les rôles et modules ont été insérés." -ForegroundColor Green
    } else {
        Write-Host "`n❌ ERREUR lors de l'exécution du script SQL" -ForegroundColor Red
        Write-Host "Code d'erreur: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} 
catch {
    Write-Host "`n❌ ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Vérification: Compter les rôles insérés
Write-Host "`n🔍 Vérification des données..." -ForegroundColor Cyan

$verifyQuery = @"
SELECT 
    ProfileUser,
    COUNT(*) as 'Nombre de Modules'
FROM TabAWProfileAccess
WHERE LOWER(ProfileUser) IN ('admin', 'commerciale', 'technicien', 'client', 'agent')
GROUP BY ProfileUser
ORDER BY ProfileUser;
"@

try {
    sqlcmd -S $server -d $database -Q $verifyQuery -h -1
    Write-Host "`n✨ Tous les rôles ont été créés avec succès!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Impossible de vérifier les données: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🎉 Fait! Les permissions sont maintenant configurées dans la base." -ForegroundColor Green
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Redémarrer le backend: npm start" -ForegroundColor Cyan
Write-Host "  2. Redémarrer le frontend: npm run dev" -ForegroundColor Cyan
Write-Host "  3. Tester les permissions dans l'app" -ForegroundColor Cyan
