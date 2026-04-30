"""Single-file launcher for Squad RPS.

Usage:
  python run.py          # development (requires npm + node for hot-reload)
  ./SquadRPS             # packaged executable built by build_exe.bat / build_exe.sh
"""
from __future__ import annotations

import multiprocessing
import os
import socket
import sys
import webbrowser
from pathlib import Path

# Required on Windows for PyInstaller onefile executables that pull in
# anything using multiprocessing (uvicorn/anyio do so indirectly).
multiprocessing.freeze_support()

# When frozen by PyInstaller the bundle root is sys._MEIPASS; otherwise the
# repo root is the directory that contains this file.
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys._MEIPASS)  # type: ignore[attr-defined]
else:
    BASE_DIR = Path(__file__).resolve().parent

# Make sure the backend package is importable when run as a plain script.
sys.path.insert(0, str(BASE_DIR))

import uvicorn

# Listen on all interfaces so LAN players can connect.
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))
LOCAL_URL = f"http://127.0.0.1:{PORT}"


def get_lan_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "YOUR-LAN-IP"


def open_browser() -> None:
    import threading
    import time

    def _open() -> None:
        time.sleep(2)
        webbrowser.open(LOCAL_URL)

    threading.Thread(target=_open, daemon=True).start()


if __name__ == "__main__":
    lan_ip = get_lan_ip()
    print("=" * 55)
    print(f"  Squad RPS is starting...")
    print(f"  Local:   {LOCAL_URL}")
    print(f"  LAN:     http://{lan_ip}:{PORT}  (share with other players)")
    print("=" * 55)
    open_browser()

    if getattr(sys, "frozen", False):
        # In a frozen exe, import the app object directly (string import fails).
        from backend.python_api.app import app as _app  # noqa: PLC0415
        uvicorn.run(_app, host=HOST, port=PORT, reload=False)
    else:
        uvicorn.run(
            "backend.python_api.app:app",
            host=HOST,
            port=PORT,
            reload=False,
        )
