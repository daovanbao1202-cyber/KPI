@echo off
title KPI App Control Center
cd /d "%~dp0"

:menu
cls
echo ==========================================
echo       KPI App Management
echo ==========================================
echo 1. Start App (Dev Mode)
echo 2. Clear Cache and Start (Fix "Stuck" issues)
echo 3. Build for Production
echo 4. Exit
echo ==========================================
set /p opt="Chon tuy chon (1-4): "

if "%opt%"=="1" goto start_app
if "%opt%"=="2" goto clean_start
if "%opt%"=="3" goto build_app
if "%opt%"=="4" exit
goto menu

:clean_start
echo Đang xóa bộ nhớ đệm (.next)...
if exist .next rmdir /s /q .next
goto start_app

:start_app
echo 1. Dang kiem tra thu vien (node_modules)...
if not exist node_modules (
    echo Dang cai dat thu vien, vui long doi...
    npm install
)

echo 2. Dang khoi dong server...
echo.
echo [QUAN TRONG] Vui long doi cho den khi terminal hien chu "Ready"
echo Sau do ban hay mo trinh duyet vao: http://localhost:3000
echo.
start "" "http://localhost:3000"
npm run dev
pause
goto menu

:build_app
echo Dang build ung dung...
npm run build
pause
goto menu
