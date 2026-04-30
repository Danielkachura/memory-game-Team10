#!/usr/bin/env bash
# Build Squad RPS into a single ./release/SquadRPS binary (Linux/macOS)
# Requirements: Python 3.11+, Node 18+
set -e
cd "$(dirname "$0")"

echo "[1/4] Installing PyInstaller..."
pip install pyinstaller --quiet

echo "[2/4] Building React frontend..."
npm --prefix frontend/app run build

# Vite writes to frontend/app/dist — copy to repo-root dist/ where the spec expects it
rm -rf dist
cp -r frontend/app/dist dist

echo "[3/4] Running PyInstaller (output -> release/SquadRPS)..."
pyinstaller SquadRPS.spec --noconfirm

echo ""
echo "============================================================"
echo " BUILD COMPLETE"
echo " Executable: release/SquadRPS"
echo " Run it:     ./release/SquadRPS"
echo "============================================================"
