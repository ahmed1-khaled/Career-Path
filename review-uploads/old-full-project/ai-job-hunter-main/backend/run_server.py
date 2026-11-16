"""Start AI Job Hunter in a Windows-compatible mode for Playwright browser automation.

Use this runner when you need the visible browser workflow. Uvicorn's Windows reload
mode uses SelectorEventLoop, which cannot launch Playwright's async driver subprocess.
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import uvicorn


def main() -> None:
    backend_dir = Path(__file__).resolve().parent
    # Ensure working directory is backend and in sys.path
    os.chdir(backend_dir)
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    if sys.platform == "win32":
        # Set the policy before Uvicorn creates the server event loop.
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    host = os.getenv("AI_JOB_HUNTER_HOST", "127.0.0.1")
    port = int(os.getenv("AI_JOB_HUNTER_PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=False, workers=1, loop="asyncio")


if __name__ == "__main__":
    main()
