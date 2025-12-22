#!/usr/bin/env python3
"""Master seed script - runs all seeds in the correct order.

Run with:
    docker-compose exec backend python scripts/seed_all.py

Or directly (if running locally):
    cd backend && python scripts/seed_all.py
"""

import asyncio
import subprocess
import sys
import os

# Ensure we're in the backend directory
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def run_seed(script_name: str):
    """Run a seed script and capture output."""
    print(f"\n{'=' * 60}")
    print(f"🌱 Running: {script_name}")
    print("=" * 60)

    # Import and run the main function from each script
    if script_name == "app.scripts.seed_tiers":
        from app.scripts.seed_tiers import seed_tiers

        await seed_tiers()
    elif script_name == "scripts.seed_services":
        from scripts.seed_services import main

        await main()
    elif script_name == "scripts.seed_form_templates":
        from scripts.seed_form_templates import main

        await main()
    elif script_name == "scripts.seed_bookings":
        from scripts.seed_bookings import main

        await main()
    elif script_name == "scripts.seed_form_assignments":
        from scripts.seed_form_assignments import main

        await main()
    elif script_name == "scripts.seed_automation_playbooks":
        from scripts.seed_automation_playbooks import main

        await main()
    else:
        print(f"⚠️ Unknown script: {script_name}")


async def main():
    """Run all seeds in order."""
    print("\n" + "🚀" * 20)
    print("   RUNNING ALL SEED SCRIPTS")
    print("🚀" * 20)

    # Order matters! Run dependencies first
    seeds = [
        "app.scripts.seed_tiers",  # 1. Tier configuration (system settings)
        "scripts.seed_services",  # 2. Services (needed for bookings)
        "scripts.seed_form_templates",  # 3. Form templates
        "scripts.seed_bookings",  # 4. Bookings (needs services + patients)
        "scripts.seed_form_assignments",  # 5. Form assignments (needs forms + patients)
        "scripts.seed_automation_playbooks",  # 6. Automation playbooks
    ]

    success = 0
    failed = 0

    for seed in seeds:
        try:
            await run_seed(seed)
            success += 1
        except Exception as e:
            print(f"❌ FAILED: {seed}")
            print(f"   Error: {e}")
            failed += 1
            # Continue with other seeds

    print("\n" + "=" * 60)
    print("📊 SEED SUMMARY")
    print("=" * 60)
    print(f"   ✅ Success: {success}")
    print(f"   ❌ Failed: {failed}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
