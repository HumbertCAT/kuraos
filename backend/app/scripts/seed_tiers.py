"""Seed tier configuration into system_settings.

Run this script after migration to populate tier limits.
Usage: python -m app.scripts.seed_tiers
"""

import asyncio
from app.db.base import AsyncSessionLocal
from app.services.settings import set_setting


TIER_SETTINGS = [
    # Patient limits per tier
    ("TIER_LIMIT_BUILDER", 3, "Max active patients for BUILDER tier"),
    ("TIER_LIMIT_PRO", 50, "Max active patients for PRO tier"),
    ("TIER_LIMIT_CENTER", 150, "Max active patients for CENTER tier"),
    # Commission fees per tier (for future payment processing)
    ("TIER_FEE_BUILDER", 0.05, "Commission rate for BUILDER tier (5%)"),
    ("TIER_FEE_PRO", 0.02, "Commission rate for PRO tier (2%)"),
    ("TIER_FEE_CENTER", 0.01, "Commission rate for CENTER tier (1%)"),
]


async def seed_tiers():
    """Insert or update tier configuration in system_settings."""
    async with AsyncSessionLocal() as db:
        for key, value, description in TIER_SETTINGS:
            await set_setting(db, key, value, description)
            print(f"✓ {key} = {value}")

        print("\n✅ Tier configuration seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_tiers())
