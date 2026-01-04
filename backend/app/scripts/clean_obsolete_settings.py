"""Clean obsolete system settings from database.

These settings are no longer used:
- TIER_STRIPE_FEE_* (moved to env vars in config.py)
- AI_COST_TEXT (not referenced anywhere)
- AI_COST_MULTIMODAL (not referenced anywhere)

Run: python -m app.scripts.clean_obsolete_settings
"""

import asyncio
from app.db.base import AsyncSessionLocal
from sqlalchemy import delete
from app.db.models import SystemSetting


OBSOLETE_KEYS = [
    "TIER_STRIPE_FEE_BUILDER",
    "TIER_STRIPE_FEE_PRO",
    "TIER_STRIPE_FEE_CENTER",
    "AI_COST_TEXT",
    "AI_COST_MULTIMODAL",
]


async def clean_obsolete_settings():
    """Remove obsolete settings from system_settings table."""
    async with AsyncSessionLocal() as db:
        for key in OBSOLETE_KEYS:
            result = await db.execute(
                delete(SystemSetting).where(SystemSetting.key == key)
            )
            if result.rowcount > 0:
                print(f"✓ Deleted: {key}")
            else:
                print(f"- Not found: {key}")

        await db.commit()
        print("\n✅ Cleanup complete!")


if __name__ == "__main__":
    asyncio.run(clean_obsolete_settings())
