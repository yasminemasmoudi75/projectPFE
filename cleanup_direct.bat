@echo off
REM ========================================
REM Script de Nettoyage DIRECT - Backend
REM AUCUNE DEMANDE DE CONFIRMATION
REM ========================================

setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo   NETTOYAGE BACKEND
echo ========================================
echo.
echo Suppression des fichiers non-utilises...
echo.

cd /d D:\pfe\pfe\backend\backend

REM Compteur
set "count=0"

REM Delete debug files
for /f "delims=" %%F in ('dir /b debug_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

REM Delete analysis files
for /f "delims=" %%F in ('dir /b analyze_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

for /f "delims=" %%F in ('dir /b compare_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

for /f "delims=" %%F in ('dir /b inspect_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

for /f "delims=" %%F in ('dir /b roles_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

REM Delete exploration files
for /f "delims=" %%F in ('dir /b check_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

for /f "delims=" %%F in ('dir /b find_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

if exist "list_all_tables.js" (
    del /q "list_all_tables.js"
    set /a count+=1
    echo [DELETE] list_all_tables.js
)

REM Delete output files
for /f "delims=" %%F in ('dir /b output*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

if exist "all_cols.json" (
    del /q "all_cols.json"
    set /a count+=1
    echo [DELETE] all_cols.json
)

if exist "columns_output.json" (
    del /q "columns_output.json"
    set /a count+=1
    echo [DELETE] columns_output.json
)

if exist "tab_cols.json" (
    del /q "tab_cols.json"
    set /a count+=1
    echo [DELETE] tab_cols.json
)

if exist "token.txt" (
    del /q "token.txt"
    set /a count+=1
    echo [DELETE] token.txt
)

REM Delete demo/report files
for /f "delims=" %%F in ('dir /b DEMO_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

if exist "IMPLEMENTATION_ROADMAP.js" (
    del /q "IMPLEMENTATION_ROADMAP.js"
    set /a count+=1
    echo [DELETE] IMPLEMENTATION_ROADMAP.js
)

for /f "delims=" %%F in ('dir /b QUICK_START.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

for /f "delims=" %%F in ('dir /b README_QUICK_START.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

for /f "delims=" %%F in ('dir /b RESUME_EXECUTIF.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

for /f "delims=" %%F in ('dir /b SAV_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

if exist "explain_ucs_tables.js" (
    del /q "explain_ucs_tables.js"
    set /a count+=1
    echo [DELETE] explain_ucs_tables.js
)

REM Delete test files
for /f "delims=" %%F in ('dir /b test_*.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

for /f "delims=" %%F in ('dir /b run_permission_api_tests.* 2^>nul') do (
    del /q "%%F"
    set /a count+=1
    echo [DELETE] %%F
)

REM Delete api/guide files
if exist "API_ENDPOINTS_REQUIS.js" (
    del /q "API_ENDPOINTS_REQUIS.js"
    set /a count+=1
    echo [DELETE] API_ENDPOINTS_REQUIS.js
)

if exist "GUIDE_PERMISSIONS_MODULE.md" (
    del /q "GUIDE_PERMISSIONS_MODULE.md"
    set /a count+=1
    echo [DELETE] GUIDE_PERMISSIONS_MODULE.md
)

if exist "create_reclamation_table.sql" (
    del /q "create_reclamation_table.sql"
    set /a count+=1
    echo [DELETE] create_reclamation_table.sql
)

echo.
echo ========================================
echo RESUME
echo ========================================
echo Fichiers supprimes: !count!
echo.
echo Fichiers CONSERVES dans le backend:
echo.
dir /b *.js *.json *.sql *.md 2>nul
echo.
echo.

REM Show directories
echo Dossiers conserves:
echo  - src/
echo  - uploads/
echo  - logs/
echo  - node_modules/
echo.

echo ========================================
echo Nettoyage TERMINE!
echo ========================================
echo.

pause
