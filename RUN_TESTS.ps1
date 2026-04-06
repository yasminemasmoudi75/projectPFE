# Script de test pour TabRoleFilterVisibility
# Utilisation: Exécute les 8 tests pour vérifier l'intégration

$BASE_URL = "http://localhost:3066/api/test"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTS TabRoleFilterVisibility (8/8)" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour faire un appel API
function Test-Endpoint {
    param(
        [int]$TestNumber,
        [string]$Description,
        [string]$Endpoint
    )
    
    Write-Host "TEST $TestNumber️⃣: $Description" -ForegroundColor Cyan
    Write-Host "  URL: $Endpoint" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $Endpoint -Method Get -ErrorAction Stop
        Write-Host "  ✅ SUCCÈS" -ForegroundColor Green
        Write-Host "  Réponse:" -ForegroundColor Gray
        $response | ConvertTo-Json | ForEach-Object { Write-Host "    $_" }
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "  ❌ ERREUR: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Vérifier le backend
Write-Host "🔍 Vérification du backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3066/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend OK: $($health.status)" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ Backend INDISPONIBLE: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Lancez: npm start" -ForegroundColor Yellow
    exit 1
}

# TEST 1
Test-Endpoint -TestNumber 1 `
    -Description "Vérifier la connexion à la table" `
    -Endpoint "$BASE_URL/connection"

# TEST 2
Test-Endpoint -TestNumber 2 `
    -Description "Obtenir TOUS les filtres pour client/STOCK" `
    -Endpoint "$BASE_URL/filters/client/STOCK"

# TEST 3
Test-Endpoint -TestNumber 3 `
    -Description "Obtenir SEULEMENT les filtres VISIBLES pour client/STOCK" `
    -Endpoint "$BASE_URL/visible-filters/client/STOCK"

# TEST 4
Test-Endpoint -TestNumber 4 `
    -Description "Obtenir tous les RÔLES" `
    -Endpoint "$BASE_URL/roles"

# TEST 5
Test-Endpoint -TestNumber 5 `
    -Description "Obtenir tous les MODULES" `
    -Endpoint "$BASE_URL/modules"

# TEST 6
Test-Endpoint -TestNumber 6 `
    -Description "Statistiques GLOBALES de la table" `
    -Endpoint "$BASE_URL/stats"

# TEST 7
Test-Endpoint -TestNumber 7 `
    -Description "Tous les filtres du module STOCK (groupés par rôle)" `
    -Endpoint "$BASE_URL/module/STOCK"

# TEST 8
Test-Endpoint -TestNumber 8 `
    -Description "DASHBOARD COMPLET (matrice de visibilité)" `
    -Endpoint "$BASE_URL/dashboard"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "✅ Tests terminés!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
