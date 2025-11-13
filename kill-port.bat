@echo off
echo Killing process on port 5000...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% == 0 (
        echo Process %%a killed successfully!
    ) else (
        echo Failed to kill process %%a
    )
)

echo.
echo Done! You can now start the server.
pause

