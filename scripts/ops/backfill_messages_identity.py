#!/usr/bin/env python3
"""Backfill identity_id in message_logs from patient.identity_id.

TD-115: Ensures historical messages are linked to the Identity Vault.
This prevents data loss when querying by identity_id in the future.

Usage:
    python scripts/ops/backfill_messages_identity.py

Prerequisites:
    - Cloud SQL Auth Proxy running (for production)
    - DATABASE_URL set in environment
"""

import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.db.models import MessageLog, Patient


async def backfill_identity_ids():
    """Populate identity_id on message_logs from their patient's identity_id."""

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not set. Using local Docker default.")
        database_url = (
            "postgresql+asyncpg://postgres:postgres@localhost:5433/therapistos"
        )

    # Convert to async URL if needed
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Find messages without identity_id but with patient_id
        query = select(MessageLog).where(
            MessageLog.identity_id.is_(None), MessageLog.patient_id.isnot(None)
        )
        result = await session.execute(query)
        messages = result.scalars().all()

        print(f"📋 Found {len(messages)} messages needing identity_id backfill")

        if not messages:
            print("✅ No backfill needed - all messages already have identity_id")
            return

        # Batch update by patient
        patient_ids = set(m.patient_id for m in messages)
        print(f"👥 Processing {len(patient_ids)} unique patients...")

        updated_count = 0
        for patient_id in patient_ids:
            # Get patient's identity_id
            patient = await session.get(Patient, patient_id)
            if not patient or not patient.identity_id:
                print(f"   ⚠️ Patient {patient_id} has no identity_id, skipping")
                continue

            # Update all messages for this patient
            stmt = (
                update(MessageLog)
                .where(
                    MessageLog.patient_id == patient_id,
                    MessageLog.identity_id.is_(None),
                )
                .values(identity_id=patient.identity_id)
            )
            result = await session.execute(stmt)
            updated_count += result.rowcount
            print(f"   ✓ Patient {patient_id}: {result.rowcount} messages updated")

        await session.commit()
        print(f"\n✅ Backfill complete! Updated {updated_count} messages")


if __name__ == "__main__":
    print("🔧 TD-115: Backfilling identity_id in message_logs")
    print("=" * 50)
    asyncio.run(backfill_identity_ids())
