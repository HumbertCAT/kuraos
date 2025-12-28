"""
Pre-start script that waits for database to be ready.
Uses simple retry loop with the DATABASE_URL from environment.
"""
import logging
import os
import sys
import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_RETRIES = 60  # 60 seconds max
RETRY_INTERVAL = 1  # 1 second between retries


def wait_for_db() -> None:
    """Wait for database to be ready by attempting to connect."""
    # Get DATABASE_URL from environment, convert async to sync
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        logger.error("DATABASE_URL not set!")
        sys.exit(1)
    
    # Convert async URL to sync for this check
    db_url = db_url.replace("+asyncpg", "")
    
    logger.info("🔄 Waiting for database connection...")
    
    for attempt in range(MAX_RETRIES):
        try:
            engine = create_engine(db_url, pool_pre_ping=True)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ Database ready!")
            return
        except OperationalError as e:
            if attempt < MAX_RETRIES - 1:
                logger.info(f"   Attempt {attempt + 1}/{MAX_RETRIES}: DB not ready, retrying...")
                time.sleep(RETRY_INTERVAL)
            else:
                logger.error(f"❌ Failed to connect after {MAX_RETRIES}s: {e}")
                sys.exit(1)


def main() -> None:
    """Main entry point."""
    logger.info("🚀 Pre-start: Checking database availability...")
    wait_for_db()
    logger.info("✨ Pre-start complete. Proceeding to migrations...")


if __name__ == "__main__":
    main()
