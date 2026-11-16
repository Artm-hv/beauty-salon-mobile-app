@echo off
chcp 65001 >nul
title Svoya Nail Studio - Serwer Deweloperski (Expo Metro)
cd /d "%~dp0"

cls
echo ================================================================
echo    SVOYA NAIL STUDIO - SERWER DEWELOPERSKI (Expo Metro + REST API)
echo ================================================================
echo.

:: 1. Sprawdzanie obecnosci folderu node_modules
if not exist "node_modules\" (
    echo [!] Brak folderu node_modules. Instalowanie zaleznosci...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [X] Blad podczas instalacji zaleznosci.
        pause
        exit /b
    )
)

:: 2. Zwalnianie portow 8081 i 8000 w przypadku zawieszenia poprzednich procesow
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: 3. Uruchamianie serwera REST API w tle (Python)
if exist "backend\server.py" (
    echo [OK] Uruchamianie serwera REST API - Python port 8000
    start "Svoya REST API" /min python backend\server.py
)

echo.
echo ================================================================
echo   [1] Uruchom LAN / Hotspot z komputera [DOMYSLNIE - nacisnij ENTER]
echo   [2] Uruchom TUNEL (Zalecane na eduroam / uczelni - dziala ZAWSZE)
echo   [3] Uruchom w PRZEGLADARCE (Web) - bez telefonu na komputerze
echo ================================================================
echo.
set "choice=1"
set /p choice="Wybierz opcje [ENTER = 1]: "
if "%choice%"=="2" goto run_tunnel
if "%choice%"=="3" goto run_web
goto run_lan

:run_lan
cls
echo ================================================================
echo [INFO] Uruchamianie serwera Expo przez lokalna siec Wi-Fi (LAN)...
echo [WSKAZOWKA] Zeskanuj kod QR w aplikacji Expo Go na telefonie!
echo [UWAGA] Jesli jestes na eduroam, wlacz Hotspot w Windows lub uzyj opcji [2] Tunel!
echo ================================================================
echo.
call npx expo start --lan -c
if %errorlevel% neq 0 (
    echo.
    echo [X] Wystapil blad podczas uruchamiania Expo.
    pause
)
pause
exit /b

:run_tunnel
cls
echo ================================================================
echo [INFO] Uruchamianie serwera Expo w trybie TUNEL...
echo [WSKAZOWKA] Omija blokady eduroam i uczelniane zapory sieciowe!
echo ================================================================
echo.
call npx expo start --tunnel -c
if %errorlevel% neq 0 (
    echo.
    echo [X] Wystapil blad podczas uruchamiania trybu Tunel.
    pause
)
pause
exit /b

:run_web
cls
echo ================================================================
echo [INFO] Uruchamianie aplikacji w przegladarce internetowej...
echo ================================================================
echo.
call npm run web
if %errorlevel% neq 0 (
    echo.
    echo [X] Wystapil blad podczas uruchamiania wersji Web.
    pause
)
pause
exit /b
