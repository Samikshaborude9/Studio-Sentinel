import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine

from app.orchestrator.models import Incident


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    load_dotenv(repo_root / ".env")

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is not set. Add it to your .env file before running this script.")

    engine = create_engine(database_url, pool_pre_ping=True)
    SQLModel.metadata.create_all(engine)
    print(f"Schema checked successfully for: {database_url.split('@')[-1]}")


if __name__ == "__main__":
    main()
