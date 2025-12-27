"""
THE GOLDEN SEED PROTOCOL: Kura OS Premium Reset
===============================================
Rebuilds the local universe with "Conscious Luxury" archetypes
for high-stakes investor demos.

Run with:
    docker-compose exec backend python scripts/reboot_local_universe_PREMIUM.py
"""

import asyncio
import sys
import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy import select, text

# Add parent to path
sys.path.insert(0, "/app")

from app.db.base import AsyncSessionLocal
from app.db.models import (
    User,
    Organization,
    Patient,
    JourneyLog,
    Booking,
    ServiceType,
    ClinicalEntry,
    MessageLog,
    BookingStatus,
)

# --- DATA DEFINITIONS (FROM ANALYST) ---

SEED_SERVICES = [
    {
        "title": "The Sovereign Mind: Leadership Immersion",
        "description": "7-day intensive psilocybin-assisted protocol for high-performance executives. Includes medical screening, prep, and integration.",
        "price": 4800.00,
        "currency": "EUR",
        "duration_minutes": 480,
        "kind": "GROUP",
        "scheduling_type": "FIXED_DATE",
        "is_active": True,
    },
    {
        "title": "Architects' Circle: Integration Mastermind",
        "description": "Monthly recurring membership for post-retreat integration. Bi-weekly group circles and async support.",
        "price": 350.00,
        "currency": "EUR",
        "duration_minutes": 90,
        "kind": "GROUP",
        "scheduling_type": "CALENDAR",
        "is_active": True,
    },
    {
        "title": "Strategic Neuro-Repatterning",
        "description": "High-precision 1:1 strategy session. Focus on somatic blockage release and cognitive restructuring.",
        "price": 500.00,
        "currency": "EUR",
        "duration_minutes": 60,
        "kind": "ONE_ON_ONE",
        "scheduling_type": "CALENDAR",
        "is_active": True,
    },
]

SEED_PATIENTS = [
    # ARCHETYPE A: "THE WHALE" (Marcus Thorne)
    {
        "first_name": "Marcus",
        "last_name": "Thorne",
        "email": "m.thorne@venture-capital.example.com",
        "journey_key": "retreat_ibiza",
        "journey_status": "PREPARATION",
        "clinical_entry": {
            "title": "Initial Intake: Executive Burnout Assessment",
            "content": """
            <p><strong>Subjective:</strong> Client is a 45-year-old CEO of a Series B Fintech. Reports severe <em>"decision fatigue"</em> and chronic dissociation during board meetings. Sleep efficiency is <50% (Oura data reviewed). Expresses a loss of connection to his founding purpose.</p>
            <p><strong>Objective:</strong> Hyper-vigilant posture. Speech is rapid and pressured. Biomarkers indicate elevated cortisol baseline. No history of psychosis.</p>
            <p><strong>Assessment:</strong> Classic High-Functioning Burnout / Existential Distress. Good candidate for psilocybin protocol, focusing on <em>"ego dissolution"</em> and reconnection with core values.</p>
            <p><strong>Plan:</strong> Proceed with preparation phase. Focus on nervous system regulation before immersion.</p>
            """,
            "entry_type": "NOTE",
        },
        "whatsapp_history": [
            {
                "direction": "INBOUND",
                "text": "I'm frankly terrified that this will impact my ability to lead next week.",
                "days_ago": 5,
            },
            {
                "direction": "OUTBOUND",
                "text": "Marcus, valid concern. The protocol is designed to enhance clarity, not cloud it. Let's discuss safety protocols.",
                "days_ago": 5,
            },
            {
                "direction": "INBOUND",
                "text": "Okay, the data you sent helps. I'm ready to proceed.",
                "days_ago": 2,
            },
        ],
    },
    # ARCHETYPE B: "THE RED FLAG" (Elena Velázquez)
    {
        "first_name": "Elena",
        "last_name": "Velázquez",
        "email": "elena.art@design.example.com",
        "journey_key": "retreat_ibiza",
        "journey_status": "BLOCKED_MEDICAL",
        "clinical_entry": {
            "title": "🛡️ SYSTEM ALERT: SAFETY PROTOCOL ACTIVATED",
            "content": "<strong>AUTOMATIC BLOCK:</strong> Patient reported active use of Lithium. This is a fatal contraindication for Psilocybin (Risk of Seizures). Admin notification sent. Refund processed if applicable.",
            "entry_type": "AI_ANALYSIS",
        },
    },
    # ARCHETYPE C: "THE GHOST" (Julian Soler)
    {
        "first_name": "Julian",
        "last_name": "Soler",
        "email": "julian.creative@agency.example.com",
        "journey_key": "neuro_repatterning",
        "journey_status": "AWAITING_PAYMENT",
        "ghost_mode": True,  # Special flag for stale date
    },
    # ARCHETYPE D: "THE SUCCESS STORY" (Sarah Jenkins)
    {
        "first_name": "Sarah",
        "last_name": "Jenkins",
        "email": "sarah.j@foundation.example.org",
        "journey_key": "architects_circle",
        "journey_status": "ACTIVE_MEMBER",
        "clinical_entry": {
            "title": "Graduation Summary: 6-Month Arc",
            "content": """
            <p><strong>Outcome Analysis:</strong> Sarah has successfully transitioned from acute trauma processing to post-traumatic growth. The 'Architects Circle' membership is serving as a stabilization container.</p>
            <p><strong>Key Metrics:</strong> GAD-7 score reduced from 18 (Severe) to 4 (Minimal). Self-reported sense of agency is 9/10.</p>
            <p><strong>Next Steps:</strong> Recommended moving to quarterly maintenance sessions. She has referred 3 new CEO candidates (High LTV).</p>
            """,
            "entry_type": "NOTE",
        },
    },
]


async def wipe_data(db, org_id):
    print("\n💥 INITIATING DESTRUCTION SEQUENCE...")

    # Tables to clean - order matters for FK constraints
    tables_to_clean = [
        f"DELETE FROM form_assignments WHERE patient_id IN (SELECT id FROM patients WHERE organization_id = '{org_id}')",
        f"DELETE FROM message_logs WHERE organization_id = '{org_id}'",
        f"DELETE FROM bookings WHERE organization_id = '{org_id}'",
        f"DELETE FROM journey_logs WHERE patient_id IN (SELECT id FROM patients WHERE organization_id = '{org_id}')",
        f"DELETE FROM clinical_entries WHERE patient_id IN (SELECT id FROM patients WHERE organization_id = '{org_id}')",
        f"DELETE FROM leads WHERE organization_id = '{org_id}'",
        f"DELETE FROM service_types WHERE organization_id = '{org_id}'",
    ]

    for sql in tables_to_clean:
        try:
            await db.execute(text(sql))
        except Exception as e:
            print(f"   ⚠️ Skipped (table may not exist): {sql[:50]}...")

    # Clean patients (except admin if exists as patient)
    await db.execute(
        text(
            f"DELETE FROM patients WHERE organization_id = '{org_id}' AND email != 'humbert.torroella@gmail.com'"
        )
    )
    print("🗑️  Zone Cleared.")


async def seed_services(db, org_id):
    print("\n🏗️  REBUILDING PREMIUM INFRASTRUCTURE...")
    service_map = {}
    for s in SEED_SERVICES:
        svc = ServiceType(
            organization_id=org_id,
            title=s["title"],
            description=s["description"],
            duration_minutes=s["duration_minutes"],
            price=s["price"],
            currency=s["currency"],
            kind=s["kind"],
            scheduling_type=s["scheduling_type"],
            is_active=s["is_active"],
        )
        db.add(svc)
        await db.flush()
        # Map by simplified key for booking logic
        key = (
            "retreat"
            if "Sovereign" in s["title"]
            else ("circle" if "Circle" in s["title"] else "neuro")
        )
        service_map[key] = svc
    print(f"   ✅ {len(SEED_SERVICES)} Premium Services created")
    return service_map


async def seed_patients(db, org_id, service_map, therapist_id):
    print("\n🧬 SEEDING ARCHETYPES...")

    for p_data in SEED_PATIENTS:
        # Create Patient
        patient = Patient(
            id=uuid.uuid4(),
            organization_id=org_id,
            first_name=p_data["first_name"],
            last_name=p_data["last_name"],
            email=p_data["email"],
            journey_status={p_data["journey_key"]: p_data["journey_status"]},
            profile_image_url=f"/demo-avatars/{p_data['first_name'].lower()}.png",
        )
        db.add(patient)
        await db.flush()

        # Journey Log
        log = JourneyLog(
            patient_id=patient.id,
            journey_key=p_data["journey_key"],
            to_stage=p_data["journey_status"],
            changed_at=datetime.utcnow()
            - timedelta(hours=50 if p_data.get("ghost_mode") else 2),
        )
        db.add(log)

        # Clinical Entry (Note/Alert)
        if "clinical_entry" in p_data:
            entry_data = p_data["clinical_entry"]
            entry = ClinicalEntry(
                patient_id=patient.id,
                author_id=therapist_id,
                entry_type="SESSION_NOTE",
                content=entry_data["content"],
                entry_metadata={"title": entry_data["title"]},
            )
            db.add(entry)

        # WhatsApp History (for Marcus)
        if "whatsapp_history" in p_data:
            for msg in p_data["whatsapp_history"]:
                m = MessageLog(
                    organization_id=org_id,
                    patient_id=patient.id,
                    direction=msg["direction"],
                    content=msg["text"],
                    timestamp=datetime.utcnow() - timedelta(days=msg["days_ago"]),
                    provider_id=f"seed_{uuid.uuid4()}",
                    status="DELIVERED",
                )
                db.add(m)

        # Booking Logic (Simplified)
        if p_data["journey_status"] in ["PREPARATION", "ACTIVE_MEMBER"]:
            # Find service
            svc_key = "retreat" if "retreat" in p_data["journey_key"] else "circle"
            svc = service_map.get(svc_key)
            if svc:
                booking = Booking(
                    organization_id=org_id,
                    patient_id=patient.id,
                    service_type_id=svc.id,
                    therapist_id=therapist_id,
                    start_time=datetime.utcnow() + timedelta(days=3),
                    end_time=datetime.utcnow()
                    + timedelta(days=3, minutes=svc.duration_minutes),
                    status=BookingStatus.CONFIRMED,
                    amount_paid=svc.price,
                    currency="EUR",
                )
                db.add(booking)

        print(
            f"   👤 Created: {p_data['first_name']} {p_data['last_name']} ({p_data['journey_status']})"
        )


async def main():
    async with AsyncSessionLocal() as db:
        # Identify Admin
        result = await db.execute(
            select(User).where(User.email == "humbert.torroella@gmail.com")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Admin 'humbert.torroella@gmail.com' NOT FOUND. Abort.")
            return

        org_id = admin.organization_id
        print(f"🔱 ADMIN RECOGNIZED: {admin.full_name}")

        # Execute Protocols
        await wipe_data(db, org_id)
        services = await seed_services(db, org_id)
        await seed_patients(db, org_id, services, admin.id)

        await db.commit()
        print("\n✨ GOLDEN SEED COMPLETE. UNIVERSE IS READY.")


if __name__ == "__main__":
    asyncio.run(main())
