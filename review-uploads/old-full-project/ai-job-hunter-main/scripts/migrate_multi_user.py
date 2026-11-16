import os
import sys
from pathlib import Path

# Change working directory to backend so relative sqlite:///./ai_job_hunter.db resolves correctly
backend_dir = Path(__file__).resolve().parent.parent / "backend"
os.chdir(str(backend_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import engine
from app.migrations import run_multi_user_migrations


def main():
    print("Running multi-user database migrations...")
    run_multi_user_migrations(engine)
    print("Multi-user database migrations completed successfully.")


if __name__ == "__main__":
    main()
