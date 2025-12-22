"""Seed demo form assignments for investor presentation.

Creates form assignments matching patient journey states:
- Elena Torres → Screening Médico (flagged for review)
- Miguel Sánchez → Screening Médico (completed/approved)
- Sofía Blanco → Screening Médico (pending)
- Carmen Luna → Coordenadas Nacimiento (pending)
- Pablo Estrella → Coordenadas Nacimiento (completed)
- David Guerrero → Check-in Semanal (pending - first checkin)
- Laura Paz → Waiver (pending)
- Ana Om → Waiver (completed)

Run with:
    docker-compose exec backend python -c "exec(open('scripts/seed_form_assignments.py').read())"
"""

import asyncio
from datetime import datetime, timedelta
import secrets

FORM_ASSIGNMENTS = [
    # ===== PSICODÉLICA - Screening =====
    {
        "patient_email": "elena.torres@demo.com",
        "form_title": "Screening Médico Riguroso",
        "status": "COMPLETED",
        "opened_at": -3,  # days ago
        "completed_at": -2,
        # Flagged because of SSRI medication
    },
    {
        "patient_email": "miguel.sanchez@demo.com",
        "form_title": "Screening Médico Riguroso",
        "status": "COMPLETED",
        "opened_at": -10,
        "completed_at": -8,
    },
    {
        "patient_email": "sofia.blanco@demo.com",
        "form_title": "Screening Médico Riguroso",
        "status": "OPENED",  # Started but not finished
        "opened_at": -1,
        "completed_at": None,
    },
    # ===== ASTROLOGÍA - Datos Nacimiento =====
    {
        "patient_email": "carmen.luna@demo.com",
        "form_title": "Coordenadas de Nacimiento",
        "status": "SENT",  # Not even opened yet
        "opened_at": None,
        "completed_at": None,
    },
    {
        "patient_email": "pablo.estrella@demo.com",
        "form_title": "Coordenadas de Nacimiento",
        "status": "COMPLETED",
        "opened_at": -5,
        "completed_at": -5,
    },
    # ===== COACHING - Check-in =====
    {
        "patient_email": "david.guerrero@demo.com",
        "form_title": "Check-in Semanal",
        "status": "SENT",
        "opened_at": None,
        "completed_at": None,
    },
    {
        "patient_email": "javier.roca@demo.com",
        "form_title": "Check-in Semanal",
        "status": "EXPIRED",  # Didn't respond in time
        "opened_at": -10,
        "completed_at": None,
    },
    # ===== YOGA - Waiver =====
    {
        "patient_email": "laura.paz@demo.com",
        "form_title": "Exención de Responsabilidad (Waiver)",
        "status": "SENT",
        "opened_at": None,
        "completed_at": None,
    },
    {
        "patient_email": "ana.om@demo.com",
        "form_title": "Exención de Responsabilidad (Waiver)",
        "status": "COMPLETED",
        "opened_at": -30,
        "completed_at": -30,
    },
    # === SATISFACCIÓN (universal) ===
    {
        "patient_email": "andres.valiente@demo.com",
        "form_title": "Encuesta de Satisfacción",
        "status": "COMPLETED",
        "opened_at": -1,
        "completed_at": -1,
    },
]


async def main():
    from sqlalchemy import select
    from app.db.base import AsyncSessionLocal
    from app.db.models import (
        FormAssignment,
        FormTemplate,
        Patient,
        User,
        FormAssignmentStatus,
    )

    async with AsyncSessionLocal() as db:
        # Find admin organization
        result = await db.execute(
            select(User).where(User.email == "humbert.torroella@gmail.com")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Admin not found!")
            return

        org_id = admin.organization_id
        print(f"📝 Creating form assignments for org: {org_id}")
        print()

        # Load patients and forms
        patients_result = await db.execute(
            select(Patient).where(Patient.organization_id == org_id)
        )
        patients_by_email = {
            p.email: p for p in patients_result.scalars().all() if p.email
        }

        forms_result = await db.execute(
            select(FormTemplate).where(FormTemplate.organization_id == org_id)
        )
        forms_by_title = {f.title: f for f in forms_result.scalars().all()}

        print(
            f"📋 Found {len(patients_by_email)} patients, {len(forms_by_title)} forms"
        )
        print()

        created = 0
        skipped = 0

        for assignment_data in FORM_ASSIGNMENTS:
            patient = patients_by_email.get(assignment_data["patient_email"])
            form = forms_by_title.get(assignment_data["form_title"])

            if not patient:
                print(f"⚠️ Patient not found: {assignment_data['patient_email']}")
                skipped += 1
                continue

            if not form:
                print(f"⚠️ Form not found: {assignment_data['form_title']}")
                skipped += 1
                continue

            # Check if assignment already exists
            existing = await db.execute(
                select(FormAssignment).where(
                    FormAssignment.patient_id == patient.id,
                    FormAssignment.template_id == form.id,
                )
            )
            if existing.scalar_one_or_none():
                print(f"⏭️ Assignment exists: {patient.first_name} → {form.title}")
                skipped += 1
                continue

            # Calculate timestamps
            now = datetime.utcnow()
            opened_at = None
            completed_at = None

            if assignment_data.get("opened_at") is not None:
                opened_at = now + timedelta(days=assignment_data["opened_at"])

            if assignment_data.get("completed_at") is not None:
                completed_at = now + timedelta(days=assignment_data["completed_at"])

            # Parse status
            status = FormAssignmentStatus[assignment_data["status"]]

            # Generate token
            token = secrets.token_urlsafe(16)

            assignment = FormAssignment(
                patient_id=patient.id,
                template_id=form.id,
                token=token,
                status=status,
                opened_at=opened_at,
                completed_at=completed_at,
                valid_until=now + timedelta(days=30),
            )
            db.add(assignment)
            created += 1

            status_emoji = {
                "SENT": "📤",
                "OPENED": "👁️",
                "COMPLETED": "✅",
                "EXPIRED": "⏰",
            }.get(assignment_data["status"], "⚪")

            print(
                f"{status_emoji} {patient.first_name} → {form.title[:25]}... [{assignment_data['status']}]"
            )

        await db.commit()

        print()
        print("=" * 50)
        print(f"🎉 FORM ASSIGNMENTS READY!")
        print(f"   Created: {created}")
        print(f"   Skipped: {skipped}")


if __name__ == "__main__":
    asyncio.run(main())
