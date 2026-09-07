@echo off
setlocal enabledelayedexpansion

REM =============================================================================
REM CivicConnect TN - Development Server Shutdown Utility
REM =============================================================================

cd /d "%~dp0"
title CivicConnect TN - Shutdown Utility
color 0E

echo.
echo ===============================================================================
echo   CIVICCONNECT TN -- STOPPING DEVELOPMENT SERVER
echo ===============================================================================
echo.

set KILLED=0

REM Terminate any process listening on Port 3000
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    if not "%%p"=="" (
        if not "%%p"=="0" (
            echo Found active CivicConnect process on Port 3000 [PID: %%p]
            echo Terminating process tree...
            taskkill /PID %%p /T /F >nul 2>nul
            set /a KILLED+=1
            echo [SUCCESS] Terminated Port 3000 PID %%p.
        )
    )
)

REM Terminate any process listening on Port 3001
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3001.*LISTENING"') do (
    if not "%%p"=="" (
        if not "%%p"=="0" (
            echo Found active CivicConnect process on Port 3001 [PID: %%p]
            echo Terminating process tree...
            taskkill /PID %%p /T /F >nul 2>nul
            set /a KILLED+=1
            echo [SUCCESS] Terminated Port 3001 PID %%p.
        )
    )
)

if exist .dev-server.pid (
    set /p SAVED_PID=<.dev-server.pid
    if not "!SAVED_PID!"=="" (
        taskkill /PID !SAVED_PID! /T /F >nul 2>nul
    )
    del .dev-server.pid >nul 2>nul
)

echo.
if !KILLED! gtr 0 (
    color 0A
    echo ===============================================================================
    echo   [SUCCESS] CivicConnect TN development server stopped cleanly.
    echo   Ports 3000 and 3001 are now released.
    echo ===============================================================================
) else (
    color 0F
    echo ===============================================================================
    echo   [INFO] No running CivicConnect development server was detected.
    echo   Ports 3000 and 3001 are already free.
    echo ===============================================================================
)
echo.
echo Press any key to close this window...
pause >nul
