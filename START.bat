@echo off
setlocal enabledelayedexpansion

REM =============================================================================
REM CivicConnect TN - Development Server Launcher & Developer Console
REM =============================================================================

cd /d "%~dp0"
title CivicConnect TN - Development Server
color 0B

echo.
echo ===============================================================================
echo   CIVICCONNECT TN -- NEXT-GEN CITIZEN GRIEVANCE SYSTEM
echo   Development Server and Diagnostic Console Launcher
echo ===============================================================================
echo.

REM 1. Verify Node.js
where node >nul 2>nul
if errorlevel 1 goto NODE_MISSING

REM 2. Verify npm
where npm >nul 2>nul
if errorlevel 1 goto NPM_MISSING

REM 3. Verify .env.local
if not exist .env.local (
    echo [WARNING] .env.local file not found.
    if exist .env.example (
        echo Creating .env.local from .env.example...
        copy .env.example .env.local >nul
        echo [OK] .env.local created. Please verify your API keys.
    )
)

REM 4. Check for already running server on Port 3000 or 3001
set RUNNING_PID=
set RUNNING_PORT=

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    set RUNNING_PID=%%a
    set RUNNING_PORT=3000
)

if "!RUNNING_PID!"=="" (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001.*LISTENING"') do (
        set RUNNING_PID=%%a
        set RUNNING_PORT=3001
    )
)

if not "!RUNNING_PID!"=="" goto ALREADY_RUNNING

REM 5. Display Clean Service Startup Banner
echo Starting CivicConnect TN Services...
echo.
echo -------------------------------------------------------------------------------
echo   Local Web App:          http://localhost:3000
echo   Developer Diagnostics:  http://localhost:3000/dev/diagnostics
echo   Runtime Engine:         Next.js App Router [Turbopack]
echo -------------------------------------------------------------------------------
echo.
echo Checking Subsystems:
echo   [x] Next.js 16 App Router
echo   [x] Supabase PostGIS Database
echo   [x] Groq AI / LLaMA 3.3
echo   [x] Whisper Speech-to-Text
echo   [x] Supabase Realtime Engine
echo.
echo ===============================================================================
echo   Booting Development Server... [Press Ctrl+C in this window to stop]
echo ===============================================================================
echo.

REM 6. Launch browser once server is listening (background poll, no flashing window)
start "" /b cmd /c "timeout /t 7 /nobreak >nul & start http://localhost:3000/dev/diagnostics"

REM 7. Start Next.js Development Server (runs in this window so developer sees live logs)
call npm run dev

goto SERVER_STOPPED

:ALREADY_RUNNING
color 0A
echo [INFO] CivicConnect TN server is ALREADY RUNNING on Port !RUNNING_PORT! [PID: !RUNNING_PID!]
echo.
echo Opening Developer Diagnostic Console in your default browser...
start http://localhost:!RUNNING_PORT!/dev/diagnostics
echo.
echo -------------------------------------------------------------------------------
echo   Application URL:        http://localhost:!RUNNING_PORT!
echo   Diagnostics Console:    http://localhost:!RUNNING_PORT!/dev/diagnostics
echo -------------------------------------------------------------------------------
echo.
echo To restart or shutdown the server, double-click STOP.bat
echo.
echo Press any key to close this launcher window...
pause >nul
exit /b 0

:NODE_MISSING
color 0C
echo [ERROR] Node.js is not installed or not found in system PATH.
echo Please install Node.js v18+ from https://nodejs.org
echo.
pause
exit /b 1

:NPM_MISSING
color 0C
echo [ERROR] npm is not installed or not found in system PATH.
echo.
pause
exit /b 1

:SERVER_STOPPED
echo.
echo ===============================================================================
echo   CivicConnect development server has stopped.
echo ===============================================================================
echo.
pause
