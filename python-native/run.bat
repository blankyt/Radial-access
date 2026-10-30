@echo off
title Radial Access - Native Windows Launcher
cd /d "%~dp0"

echo ===================================================
echo     Radial Access - Windows Native Quick Launcher
echo ===================================================
echo.

:: 1. Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 was not found in your system PATH!
    echo Please install Python 3.9+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

:: 2. Create virtual environment if it does not exist yet (optional and clean)
if not exist "venv" (
    echo [*] Setting up isolated Python virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [!] Virtual environment creation failed, using system Python...
        goto install_system
    )
)

if exist "venv\Scripts\python.exe" (
    echo [*] Checking dependencies in virtual environment...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt --quiet
    echo.
    echo [*] Starting Radial Access Native Overlay...
    echo [*] Global Hotkey: Alt+Space (or click the tray icon in taskbar)
    echo.
    python main.py
    goto end
)

:install_system
echo [*] Checking requirements on system python...
pip install -r requirements.txt --quiet
echo.
echo [*] Starting Radial Access Native Overlay...
echo [*] Global Hotkey: Alt+Space (or click the tray icon in taskbar)
echo.
python main.py

:end
if %errorlevel% neq 0 (
    echo.
    echo [!] Radial Access closed with an error.
    pause
)
