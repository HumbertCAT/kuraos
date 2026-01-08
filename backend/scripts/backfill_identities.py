"""Backfill identity_id for existing Leads and Patients.

Simple manual script for small datasets (demo + production user).
Run with: docker exec kuraos-backend-1 python scripts/backfill_identities.py
"""

import asyncio
import sys

# Add parent to path
sys.path.insert(0, "/app")

from sqlalchemy import select
from app.db.base import get_session_factory
from app.db.models import Lead, Patient
from app.services.identity_resolver import IdentityResolver


async def backfill_leads(session_factory):
    """Backfill identity_id for all leads without it."""
    async with session_factory() as db:
        # Get all leads without identity_id
        result = await db.execute(select(Lead).where(Lead.identity_id.is_(None)))
        leads = result.scalars().all()

        if not leads:
            print("✅ No leads to backfill")
            return 0

        print(f"📋 Found {len(leads)} leads without identity_id")

        backfilled = 0
        for lead in leads:
            resolver = IdentityResolver(db, lead.organization_id)

            try:
                identity = await resolver.resolve_identity(
                    email=lead.email,
                    phone=lead.phone,
                    name=f"{lead.first_name} {lead.last_name}",
                    source="backfill",
                )

                lead.identity_id = identity.id
                print(
                    f"  ✅ Lead {lead.first_name} {lead.last_name} → identity {identity.id}"
                )
                backfilled += 1

            except ValueError as e:
                print(f"  ⚠️  Lead {lead.first_name} {lead.last_name} skipped: {e}")

        await db.commit()
        print(f"✅ Backfilled {backfilled}/{len(leads)} leads")
        return backfilled


async def backfill_patients(session_factory):
    """Backfill identity_id for all patients without it."""
    async with session_factory() as db:
        # Get all patients without identity_id
        result = await db.execute(select(Patient).where(Patient.identity_id.is_(None)))
        patients = result.scalars().all()

        if not patients:
            print("✅ No patients to backfill")
            return 0

        print(f"👤 Found {len(patients)} patients without identity_id")

        backfilled = 0
        for patient in patients:
            resolver = IdentityResolver(db, patient.organization_id)

            try:
                identity = await resolver.resolve_identity(
                    email=patient.email,
                    phone=patient.phone,
                    name=f"{patient.first_name} {patient.last_name}",
                    source="backfill",
                )

                patient.identity_id = identity.id
                print(
                    f"  ✅ Patient {patient.first_name} {patient.last_name} → identity {identity.id}"
                )
                backfilled += 1

            except ValueError as e:
                print(
                    f"  ⚠️  Patient {patient.first_name} {patient.last_name} skipped: {e}"
                )

        await db.commit()
        print(f"✅ Backfilled {backfilled}/{len(patients)} patients")
        return backfilled


async def main():
    """Run backfill for both leads and patients."""
    print("🔐 Identity Vault Backfill Script")
    print("=" * 50)

    session_factory = get_session_factory()

    leads_count = await backfill_leads(session_factory)
    print()
    patients_count = await backfill_patients(session_factory)

    print()
    print("=" * 50)
    print(f"✅ Backfill complete! {leads_count} leads + {patients_count} patients")


if __name__ == "__main__":
    asyncio.run(main())
