"""Seed data for testing v0.9.x automation features.

Run with:
    docker-compose exec backend python scripts/seed_automation_demo.py
"""

import asyncio
import uuid
from datetime import datetime, timedelta


async def main():
    from sqlalchemy import select, text
    from app.db.base import AsyncSessionLocal
    from app.db.models import User, Organization, Patient, JourneyLog, JourneyTemplate

    async with AsyncSessionLocal() as db:
        # Find the admin user
        result = await db.execute(
            select(User).where(User.email == "humbert.torroella@gmail.com")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Admin user humbert.torroella@gmail.com not found!")
            print("   Please register/login first.")
            return

        org_id = admin.organization_id
        print(f"✅ Found admin: {admin.full_name} (org: {org_id})")

        # Create test patients with different journey states
        test_patients = [
            {
                "first_name": "María",
                "last_name": "Demo Aprobada",
                "email": "maria.demo@test.com",
                "journey_status": {"intake": "AWAITING_PAYMENT"},
                "log_from": None,
                "log_to": "AWAITING_PAYMENT",
                "hours_ago": 2,  # Recent - no reminder
            },
            {
                "first_name": "Pedro",
                "last_name": "Demo Estancado",
                "email": "pedro.demo@test.com",
                "journey_status": {"intake": "AWAITING_PAYMENT"},
                "log_from": None,
                "log_to": "AWAITING_PAYMENT",
                "hours_ago": 72,  # >48h - should trigger reminder!
            },
            {
                "first_name": "Laura",
                "last_name": "Demo Bloqueada",
                "email": "laura.demo@test.com",
                "journey_status": {"intake": "BLOCKED_HIGH_RISK"},
                "log_from": None,
                "log_to": "BLOCKED_HIGH_RISK",
                "hours_ago": 24,
            },
            {
                "first_name": "Carlos",
                "last_name": "Demo Confirmado",
                "email": "carlos.demo@test.com",
                "journey_status": {
                    "intake": "AWAITING_PAYMENT",
                    "booking": "CONFIRMED",
                },
                "log_from": "AWAITING_PAYMENT",
                "log_to": "CONFIRMED",
                "hours_ago": 1,
            },
        ]

        created_count = 0

        for p_data in test_patients:
            # Check if already exists
            existing = await db.execute(
                select(Patient).where(
                    Patient.email == p_data["email"], Patient.organization_id == org_id
                )
            )
            if existing.scalar_one_or_none():
                print(
                    f"⏭️  {p_data['first_name']} {p_data['last_name']} already exists, skipping"
                )
                continue

            # Create patient
            patient = Patient(
                id=uuid.uuid4(),
                organization_id=org_id,
                first_name=p_data["first_name"],
                last_name=p_data["last_name"],
                email=p_data["email"],
                journey_status=p_data["journey_status"],
            )
            db.add(patient)
            await db.flush()

            # Create journey log entry (with backdated timestamp)
            log_time = datetime.utcnow() - timedelta(hours=p_data["hours_ago"])
            journey_log = JourneyLog(
                patient_id=patient.id,
                journey_key="intake",
                from_stage=p_data["log_from"],
                to_stage=p_data["log_to"],
            )
            db.add(journey_log)

            # Manually set the changed_at to simulate time passage
            await db.flush()
            await db.execute(
                text("""
                    UPDATE journey_logs 
                    SET changed_at = :time 
                    WHERE id = :id
                """),
                {"time": log_time, "id": journey_log.id},
            )

            created_count += 1
            status_str = str(p_data["journey_status"])
            print(f"✅ Created: {p_data['first_name']} {p_data['last_name']}")
            print(f"   Journey: {status_str}")
            print(f"   Log time: {log_time} ({p_data['hours_ago']}h ago)")

        # Create a JourneyTemplate for reference
        existing_template = await db.execute(
            select(JourneyTemplate).where(
                JourneyTemplate.key == "intake",
                JourneyTemplate.organization_id == org_id,
            )
        )
        if not existing_template.scalar_one_or_none():
            template = JourneyTemplate(
                organization_id=org_id,
                name="Intake Flow",
                key="intake",
                allowed_stages=[
                    "SCREENING_PENDING",
                    "AWAITING_PAYMENT",
                    "BLOCKED_HIGH_RISK",
                    "CONFIRMED",
                    "COMPLETED",
                ],
                initial_stage="SCREENING_PENDING",
            )
            db.add(template)
            print("✅ Created JourneyTemplate: Intake Flow")

        await db.commit()

        print(f"\n🎉 Seed complete! Created {created_count} test patients.")
        print("\n📋 Test scenarios:")
        print("   - María: Estado reciente (2h) - NO trigger de reminder")
        print("   - Pedro: Estancado 72h - SÍ trigger de reminder con /trigger-cron")
        print("   - Laura: Bloqueada por riesgo alto")
        print("   - Carlos: Ya confirmado (multiple journeys)")
        print("\n🔧 Para probar el stale monitor:")
        print("   curl -X POST http://localhost:8001/api/v1/admin/trigger-cron ...")


if __name__ == "__main__":
    asyncio.run(main())
