#!/usr/bin/env python3
"""
Privacy Tier Backfill Script - Kura Cortex v1.5

Normalizes existing Organizations with country_code and default_privacy_tier.

Usage:
    # Dry run (default)
    python scripts/ops/backfill_privacy_v1_5.py

    # Execute changes
    python scripts/ops/backfill_privacy_v1_5.py --execute

    # With custom default country
    python scripts/ops/backfill_privacy_v1_5.py --default-country=US --execute
"""

import asyncio
import argparse
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_maker
from app.db.models import Organization, PrivacyTier


# Country code → Default privacy tier mapping
COUNTRY_PRIVACY_MAP = {
    # EU/EEA - GDPR (STANDARD = delete raw, keep transcript)
    "ES": PrivacyTier.STANDARD,
    "DE": PrivacyTier.STANDARD,
    "FR": PrivacyTier.STANDARD,
    "IT": PrivacyTier.STANDARD,
    "PT": PrivacyTier.STANDARD,
    "NL": PrivacyTier.STANDARD,
    "BE": PrivacyTier.STANDARD,
    "AT": PrivacyTier.STANDARD,
    "CH": PrivacyTier.STANDARD,
    "GB": PrivacyTier.STANDARD,
    "IE": PrivacyTier.STANDARD,
    "SE": PrivacyTier.STANDARD,
    "NO": PrivacyTier.STANDARD,
    "DK": PrivacyTier.STANDARD,
    "FI": PrivacyTier.STANDARD,
    "PL": PrivacyTier.STANDARD,
    "GR": PrivacyTier.STANDARD,
    # Americas
    "US": PrivacyTier.LEGACY,  # BAA permits archival
    "CA": PrivacyTier.STANDARD,
    "MX": PrivacyTier.STANDARD,
    "AR": PrivacyTier.STANDARD,
    "CL": PrivacyTier.STANDARD,
    "CO": PrivacyTier.STANDARD,
    "BR": PrivacyTier.STANDARD,
    "PE": PrivacyTier.STANDARD,
    "EC": PrivacyTier.STANDARD,
    "UY": PrivacyTier.STANDARD,
    "CR": PrivacyTier.STANDARD,
}


def infer_country_from_org(org: Organization) -> str | None:
    """
    Try to infer country code from organization data.

    Checks (in order):
    1. Existing country_code field (if already set)
    2. Stripe billing address country
    3. Organization name patterns (weak signal)

    Returns:
        ISO 3166-1 alpha-2 country code or None
    """
    # Already has country code
    if hasattr(org, "country_code") and org.country_code:
        return org.country_code.upper()

    # Try to get from Stripe metadata if available
    # Note: This would require Stripe API call, skip for now

    return None


async def backfill_privacy_tiers(
    execute: bool = False, default_country: str = "ES"
) -> dict:
    """
    Backfill country_code and default_privacy_tier for all organizations.

    Args:
        execute: If True, actually commit changes. If False, dry run.
        default_country: Default country code if inference fails.

    Returns:
        Summary report dict
    """
    report = {
        "total_orgs": 0,
        "already_set": 0,
        "inferred": 0,
        "defaulted": 0,
        "updated": [],
        "errors": [],
    }

    async with async_session_maker() as db:
        # Fetch all organizations
        stmt = select(Organization)
        result = await db.execute(stmt)
        orgs = result.scalars().all()

        report["total_orgs"] = len(orgs)
        print(f"\n📊 Found {len(orgs)} organizations to process\n")

        for org in orgs:
            try:
                # Check if already has privacy tier set
                if org.default_privacy_tier is not None:
                    report["already_set"] += 1
                    print(
                        f"  ✓ {org.name}: Already configured ({org.default_privacy_tier.value})"
                    )
                    continue

                # Set ES + LEGACY for all orgs (project decision v1.5.2)
                country = "ES"
                tier = PrivacyTier.LEGACY
                source = "project_default"
                report["defaulted"] += 1

                print(f"  → {org.name}: {country} → {tier.value} ({source})")

                if execute:
                    # Update organization
                    org.country_code = country
                    org.default_privacy_tier = tier
                    report["updated"].append({
                        "org_id": str(org.id),
                        "name": org.name,
                        "country": country,
                        "tier": tier.value,
                    })

            except Exception as e:
                report["errors"].append({
                    "org_id": str(org.id),
                    "name": org.name,
                    "error": str(e),
                })
                print(f"  ✗ {org.name}: ERROR - {e}")

        if execute:
            await db.commit()
            print(f"\n✅ Committed {len(report['updated'])} updates")
        else:
            print(f"\n⚠️  DRY RUN - No changes committed")
            print(f"   Run with --execute to apply changes")

    return report


def print_report(report: dict):
    """Print summary report."""
    print("\n" + "=" * 50)
    print("📋 BACKFILL REPORT")
    print("=" * 50)
    print(f"Total organizations:  {report['total_orgs']}")
    print(f"Already configured:   {report['already_set']}")
    print(f"Country inferred:     {report['inferred']}")
    print(f"Used default:         {report['defaulted']}")
    print(f"Updated:              {len(report['updated'])}")
    print(f"Errors:               {len(report['errors'])}")

    if report["errors"]:
        print("\n⚠️  ERRORS:")
        for err in report["errors"]:
            print(f"  - {err['name']}: {err['error']}")


async def main():
    parser = argparse.ArgumentParser(
        description="Backfill privacy tiers for organizations"
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Actually commit changes (default is dry run)",
    )
    parser.add_argument(
        "--default-country",
        default="ES",
        help="Default country code if inference fails (default: ES)",
    )

    args = parser.parse_args()

    print("=" * 50)
    print("🔐 KURA CORTEX v1.5 - Privacy Tier Backfill")
    print("=" * 50)

    if not args.execute:
        print("⚠️  DRY RUN MODE - No changes will be made")
    else:
        print("🚨 EXECUTE MODE - Changes will be committed!")
        response = input("Continue? [y/N]: ")
        if response.lower() != "y":
            print("Aborted.")
            return

    report = await backfill_privacy_tiers(
        execute=args.execute, default_country=args.default_country
    )

    print_report(report)


if __name__ == "__main__":
    asyncio.run(main())
