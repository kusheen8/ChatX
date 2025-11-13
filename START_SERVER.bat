@echo off
title Chat Server
echo ========================================
echo    Chat Server - Starting...
echo ========================================
echo.

cd server

REM Kill any existing process on port 5000
echo Checking port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING 2^>nul') do (
    echo Killing existing process %%a on port 5000...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 >nul
)

echo.
echo Starting server...
echo.
npm run dev

pause

