"""Single-file launcher for Squad RPS.

Usage:
  python run.py          # development (requires npm + node for hot-reload)
  ./SquadRPS             # packaged executable built by build_exe.bat / build_exe.sh
"""
from __future__ import annotations

import os
import sys
import webbrowser
from pathlib import Path

# When frozen by PyInstaller the bundle root is sys._MEIPASS; otherwise the
# repo root is the directory that contains this file.
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys._MEIPASS)  # type: ignore[attr-defined]
else:
    BASE_DIR = Path(__file__).resolve().parent

# Make sure the backend package is importable when run as a plain script.
sys.path.insert(0, str(BASE_DIR))

import uvicorn

HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "8000"))
URL = f"http://{HOST}:{PORT}"


def open_browser() -> None:
    import threading
    import time

    def _open() -> None:
        time.sleep(1.5)
        webbrowser.open(URL)

    threading.Thread(target=_open, daemon=True).start()


if __name__ == "__main__":
    print(f"Squad RPS starting at {URL}")
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
