import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_path))

from app.db.session import AsyncSessionLocal
from app.db.models import Organization, Patient, PrivacyTier
from sqlalchemy import update


async def migrate_to_legacy():
    print("🚀 Starting migration to LEGACY privacy tier...")
    async with AsyncSessionLocal() as db:
        try:
            # 1. Update all organizations
            print("Updating organizations...")
            await db.execute(
                update(Organization).values(default_privacy_tier=PrivacyTier.LEGACY)
            )

            # 2. Update all patients
            print("Updating patients (clearing overrides to follow global legacy)...")
            await db.execute(
                update(Patient).values(privacy_tier_override=PrivacyTier.LEGACY)
            )

            await db.commit()
            print("✅ All users migrated to LEGACY privacy tier.")
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            await db.rollback()


if __name__ == "__main__":
    asyncio.run(migrate_to_legacy())
