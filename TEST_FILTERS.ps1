# Test script pour vérifier les données de filtres
# Usage: powershell -ExecutionPolicy Bypass -File TEST_FILTERS.ps1

$BASE_URL = "http://localhost:3066/api"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "FILTER DIAGNOSTIC TESTS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Test 1: Check table connection
Write-Host "`nTest 1: Check database table connection" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/test/connection" -Method GET -UseBasicParsing
    Write-Host $response.Content -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 2: Get ALL filters for client/STOCK (visible + hidden)
Write-Host "`nTest 2: Get ALL filters for client/STOCK (visible + hidden)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/test/filters/client/STOCK" -Method GET -UseBasicParsing
    Write-Host $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3 -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 3: Get ONLY visible filters for client/STOCK
Write-Host "`nTest 3: Get ONLY visible filters for client/STOCK" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/test/visible-filters/client/STOCK" -Method GET -UseBasicParsing
    Write-Host $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3 -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 4: Get products and check filters
Write-Host "`nTest 4: Get products list and filter metadata" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/products" -Method GET -Headers @{"Authorization"="Bearer YOUR_TOKEN_HERE"} -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Filter Metadata:" -ForegroundColor Green
    Write-Host ($data.filtersMeta | ConvertTo-Json -Depth 3) -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "END OF TESTS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
