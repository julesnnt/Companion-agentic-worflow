@echo off
title COMPANION — Stop Servers

echo.
echo  Stopping COMPANION servers...
echo.

:: Kill processes on port 8000 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill processes on port 5173 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo  Done. All servers stopped.
echo.
timeout /t 2 /nobreak >nul
