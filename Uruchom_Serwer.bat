@echo off
chcp 65001 >nul
title Svoya Nail Studio - Serwer Deweloperski (Expo Metro)
cd /d "%~dp0"

cls
echo ================================================================
echo    💅 SVOYA NAIL STUDIO - SERWER DEWELOPERSKI (Expo Metro)
echo ================================================================
echo.

:: 1. Sprawdzanie obecności folderu node_modules
if not exist "node_modules\" (
    echo [!] Brak folderu node_modules. Instalowanie zaleznosci...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [X] Blad podczas instalacji zaleznosci.
        pause
        exit /b
    )
)

:: 2. Zwalnianie portu 8081 w przypadku zawieszenia poprzedniego procesu
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: 3. Sprawdzanie autoryzacji w Expo CLI
set EXPO_USER=
for /f "tokens=*" %%i in ('npx expo whoami 2^>nul') do set EXPO_USER=%%i

if "%EXPO_USER%"=="" set EXPO_USER=Not logged in
if "%EXPO_USER%"=="Not logged in" goto no_auth

echo [OK] Zalogowano w Expo jako: %EXPO_USER%
echo.
echo   [1] Uruchom przez TUNEL (Tunnel) - polaczenie z dowolnej sieci / telefonu
echo   [2] Uruchom przez lokalne Wi-Fi (LAN) - wspolna siec Wi-Fi
echo   [3] Uruchom w PRZEGLADARCE (Web) - bez telefonu
echo.
set /p choice="Wybierz tryb [domyslnie 1]: "
if "%choice%"=="2" goto run_lan
if "%choice%"=="3" goto run_web
goto run_tunnel

:no_auth
echo [!] Brak aktywnego logowania do konta Expo na tym komputerze.
echo.
echo   [1] Zaloguj sie do swojego konta Expo (zalecane dla trybu Tunnel)
echo   [2] Uruchom przez lokalne Wi-Fi (LAN) - BEZ KONTA (telefon i PC w jednym Wi-Fi)
echo   [3] Uruchom w przegladarce (Web) - BEZ KONTA
echo.
set /p no_auth_choice="Wybierz opcje [1, 2 lub 3]: "
if "%no_auth_choice%"=="2" goto run_lan
if "%no_auth_choice%"=="3" goto run_web

echo.
echo Podaj login (email) i haslo do swojego konta expo.dev:
call npx expo login
goto run_tunnel

:run_tunnel
cls
echo ================================================================
echo [INFO] Uruchamianie serwera Expo przez tunel...
echo [WSKAZOWKA] Ponizej pojawi sie kod QR oraz biezace logi z telefonu!
echo ================================================================
echo.
npx expo start --tunnel
pause
exit /b

:run_lan
cls
echo ================================================================
echo [INFO] Uruchamianie serwera Expo przez lokalna siec Wi-Fi (LAN)...
echo ================================================================
echo.
npx expo start --lan
pause
exit /b

:run_web
cls
echo ================================================================
echo [INFO] Uruchamianie aplikacji w przegladarce internetowej...
echo ================================================================
echo.
npm run web
pause
exit /b
