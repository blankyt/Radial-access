@echo off
title Radial Access - Build Windows Executable (.exe)
cd /d "%~dp0"

echo ========================================================
echo     Building Standalone RadialAccess.exe (PyInstaller)
echo ========================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 was not found in your system PATH!
    pause
    exit /b 1
)

:: Activate venv if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo [*] Installing PyInstaller and dependencies...
pip install pyinstaller PyQt6 pynput --quiet

echo [*] Compiling single-file native executable...
pyinstaller --noconsole ^
            --onefile ^
            --name "RadialAccess" ^
            --add-data "config.json;." ^
            --clean ^
            main.py

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! Your standalone executable is ready:
    echo  dist\RadialAccess.exe
    echo ========================================================
    echo.
    echo You can now copy dist\RadialAccess.exe anywhere on your PC!
    echo To make it start with Windows on boot:
    echo 1. Press Win + R, type: shell:startup, press Enter.
    echo 2. Right-click RadialAccess.exe and choose "Create Shortcut".
    echo 3. Move the shortcut into the Startup folder.
    echo.
) else (
    echo.
    echo [!] PyInstaller build failed. Check error output above.
)

pause
