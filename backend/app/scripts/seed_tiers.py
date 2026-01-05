"""Seed tier configuration into system_settings.

Run this script after migration to populate tier limits.
Usage: python -m app.scripts.seed_tiers
"""

import asyncio
from app.db.base import AsyncSessionLocal
from app.services.settings import set_setting


TIER_SETTINGS = [
    # Patient limits per tier (dynamic - can be changed via admin)
    ("TIER_USERS_LIMIT_BUILDER", 3, "Max active patients for BUILDER tier"),
    ("TIER_USERS_LIMIT_PRO", 50, "Max active patients for PRO tier"),
    ("TIER_USERS_LIMIT_CENTER", 150, "Max active patients for CENTER tier"),
    # AI USD spend limits per tier (monthly cap for cost control)
    # v1.2.0: Replaced credit system with pure USD-based spend limits
    ("TIER_AI_SPEND_LIMIT_BUILDER", 10, "Monthly AI spend limit USD for BUILDER"),
    ("TIER_AI_SPEND_LIMIT_PRO", 50, "Monthly AI spend limit USD for PRO"),
    ("TIER_AI_SPEND_LIMIT_CENTER", 200, "Monthly AI spend limit USD for CENTER"),
    # v1.3.1: Kura Credits exchange rate (1€ = N KC)
    ("KURA_CREDIT_RATE", 1000, "Credits per EUR (1€ = 1000 KC)"),
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
