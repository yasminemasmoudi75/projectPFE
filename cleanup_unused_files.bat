@echo off
REM ========================================
REM Script de Nettoyage - Backend (Batch)
REM Supprime les fichiers de test/debug inutiles
REM ========================================

setlocal enabledelayedexpansion

cls
echo ========================================
echo 🧹 Script de Nettoyage - Backend
echo ========================================
echo.

REM Change vers le répertoire du backend
cd /d D:\pfe\pfe\backend\backend

echo 📋 Fichiers À SUPPRIMER:
echo.

REM ========================================
REM Lister et supprimer les fichiers
REM ========================================

set "deleteCount=0"

REM Debug files
for /f "delims=" %%F in ('dir /b debug_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

for /f "delims=" %%F in ('dir /b debug_*.txt 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

for /f "delims=" %%F in ('dir /b debug_*.log 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

REM Analysis files
for /f "delims=" %%F in ('dir /b analyze_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

for /f "delims=" %%F in ('dir /b compare_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

for /f "delims=" %%F in ('dir /b inspect_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

for /f "delims=" %%F in ('dir /b roles_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

REM Exploration files
for /f "delims=" %%F in ('dir /b check_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

for /f "delims=" %%F in ('dir /b find_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

if exist "list_all_tables.js" (
    echo   ❌ list_all_tables.js
    set /a deleteCount+=1
)

REM Output files
if exist "all_cols.json" (
    echo   ❌ all_cols.json
    set /a deleteCount+=1
)

if exist "columns_output.json" (
    echo   ❌ columns_output.json
    set /a deleteCount+=1
)

if exist "output.txt" (
    echo   ❌ output.txt
    set /a deleteCount+=1
)

if exist "output_obj_43.json" (
    echo   ❌ output_obj_43.json
    set /a deleteCount+=1
)

if exist "tab_cols.json" (
    echo   ❌ tab_cols.json
    set /a deleteCount+=1
)

REM Exposed token
if exist "token.txt" (
    echo   ❌ token.txt
    set /a deleteCount+=1
)

REM Demo/Report files
for /f "delims=" %%F in ('dir /b DEMO_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

if exist "IMPLEMENTATION_ROADMAP.js" (
    echo   ❌ IMPLEMENTATION_ROADMAP.js
    set /a deleteCount+=1
)

if exist "QUICK_START.js" (
    echo   ❌ QUICK_START.js
    set /a deleteCount+=1
)

if exist "README_QUICK_START.js" (
    echo   ❌ README_QUICK_START.js
    set /a deleteCount+=1
)

if exist "RESUME_EXECUTIF.js" (
    echo   ❌ RESUME_EXECUTIF.js
    set /a deleteCount+=1
)

for /f "delims=" %%F in ('dir /b SAV_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

if exist "explain_ucs_tables.js" (
    echo   ❌ explain_ucs_tables.js
    set /a deleteCount+=1
)

REM Test files
for /f "delims=" %%F in ('dir /b test_*.js 2^>nul') do (
    echo   ❌ %%F
    set /a deleteCount+=1
)

if exist "run_permission_api_tests.js" (
    echo   ❌ run_permission_api_tests.js
    set /a deleteCount+=1
)

REM Optional files
if exist "API_ENDPOINTS_REQUIS.js" (
    echo   ❌ API_ENDPOINTS_REQUIS.js
    set /a deleteCount+=1
)

if exist "GUIDE_PERMISSIONS_MODULE.md" (
    echo   ❌ GUIDE_PERMISSIONS_MODULE.md
    set /a deleteCount+=1
)

if exist "create_reclamation_table.sql" (
    echo   ❌ create_reclamation_table.sql
    set /a deleteCount+=1
)

echo.
echo Total: !deleteCount! fichiers seront supprimés
echo.

REM ========================================
REM Demander confirmation
REM ========================================

set /p confirmation="Êtes-vous sûr? Tapez OUI pour confirmer (ou autre pour annuler): "

if /i NOT "!confirmation!"=="OUI" (
    echo.
    echo ❌ Opération annulée
    pause
    exit /b
)

echo.
echo ⚙️  Suppression en cours...
echo.

REM ========================================
REM Supprimer les fichiers
REM ========================================

del /q debug_*.js 2>nul
del /q debug_*.txt 2>nul
del /q debug_*.log 2>nul
del /q analyze_*.js 2>nul
del /q compare_*.js 2>nul
del /q inspect_*.js 2>nul
del /q roles_*.js 2>nul
del /q check_*.js 2>nul
del /q find_*.js 2>nul
del /q list_all_tables.js 2>nul
del /q all_cols.json 2>nul
del /q columns_output.json 2>nul
del /q output.txt 2>nul
del /q output_obj_43.json 2>nul
del /q tab_cols.json 2>nul
del /q token.txt 2>nul
del /q DEMO_*.js 2>nul
del /q IMPLEMENTATION_ROADMAP.js 2>nul
del /q QUICK_START.js 2>nul
del /q README_QUICK_START.js 2>nul
del /q RESUME_EXECUTIF.js 2>nul
del /q SAV_*.js 2>nul
del /q explain_ucs_tables.js 2>nul
del /q test_*.js 2>nul
del /q run_permission_api_tests.js 2>nul
del /q API_ENDPOINTS_REQUIS.js 2>nul
del /q GUIDE_PERMISSIONS_MODULE.md 2>nul
del /q create_reclamation_table.sql 2>nul

echo.
echo ========================================
echo 📊 Résumé:
echo ========================================
echo ✅ Suppression terminée!
echo.

dir /b *.js *.sql *.json *.txt *.md 2>nul | findstr /v node_modules

echo.
echo 🎉 Nettoyage terminé!
echo.

pause
