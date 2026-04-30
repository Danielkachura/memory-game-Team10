@echo off
REM Build Squad RPS into a single SquadRPS.exe
REM Requirements: Python 3.11+, Node 18+

setlocal
cd /d "%~dp0"

echo [1/4] Installing PyInstaller...
pip install pyinstaller --quiet
if errorlevel 1 ( echo pip install failed. & exit /b 1 )

echo [2/4] Building React frontend...
call npm --prefix frontend\app run build
if errorlevel 1 ( echo Frontend build failed. & exit /b 1 )

REM Vite writes to frontend/app/dist — copy to repo-root dist/ where the spec expects it
if exist dist rmdir /s /q dist
xcopy /e /i /q frontend\app\dist dist >nul

echo [3/4] Running PyInstaller (output -> release\SquadRPS.exe)...
pyinstaller SquadRPS.spec --noconfirm
if errorlevel 1 ( echo PyInstaller failed. & exit /b 1 )

echo.
echo ============================================================
echo  BUILD COMPLETE
echo  Executable: release\SquadRPS.exe
echo  Double-click it or run from the terminal -- no Node needed.
echo ============================================================
endlocal
