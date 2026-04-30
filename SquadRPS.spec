# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for Squad RPS single-file executable."""

import sys
from pathlib import Path

ROOT = Path(SPECPATH)
DIST_DIR = ROOT / "dist"

block_cipher = None

a = Analysis(
    [str(ROOT / "run.py")],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[
        # Bundle the pre-built React frontend
        (str(DIST_DIR), "dist"),
        # Bundle the backend package so relative imports resolve
        (str(ROOT / "backend"), "backend"),
    ],
    hiddenimports=[
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "uvicorn.protocols.websockets",
        "uvicorn.protocols.websockets.auto",
        "uvicorn.lifespan",
        "uvicorn.lifespan.on",
        "fastapi",
        "starlette",
        "starlette.staticfiles",
        "starlette.responses",
        "anyio",
        "anyio._backends._asyncio",
        "anthropic",
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="SquadRPS",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,   # keep console so players can see logs / errors
    icon=None,
    distpath=str(ROOT / "release"),  # write exe to release/ not dist/
)
