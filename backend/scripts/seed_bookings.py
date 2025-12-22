"""Seed demo bookings for investor presentation.

Creates bookings coherent with patient journey states:
- Elena Torres → Ceremonia Psilocibina (blocked, so booking cancelled/pending)
- Miguel Sánchez → Ceremonia Psilocibina (CONFIRMED)
- Sofía Blanco → Ceremonia Psilocibina (AWAITING_PAYMENT → PENDING)
- Carmen Luna → Lectura Carta Natal (needs birth data first)
- Pablo Estrella → Lectura Carta Natal (CONFIRMED, in analysis)
- David Guerrero → Programa El Despertar (CONFIRMED, onboarding)
- Javier Roca → Programa El Despertar (CONFIRMED, stagnated)
- Andrés Valiente → Programa El Despertar (COMPLETED, graduated)
- Laura Paz → Vinyasa Flow (needs waiver)
- Ana Om → Vinyasa Flow (CONFIRMED, active)

Run with:
    docker-compose exec backend python -c "exec(open('scripts/seed_bookings.py').read())"
"""

import asyncio
from datetime import datetime, timedelta
import random

# Booking definitions matching patient journeys
BOOKINGS = [
    # ===== PSICODÉLICA (FIXED_DATE - same time for all!) =====
    {
        "patient_email": "elena.torres@demo.com",
        "service_title": "Ceremonia Grupal Psilocibina",
        "status": "CANCELLED",  # Blocked due to medical
        "days_from_now": 45,
        "fixed_hour": 10,  # 10:00 AM - retreat start
        "amount_paid": 0.0,
        "notes": "Cancelado por contraindicación médica (ISRS)",
    },
    {
        "patient_email": "miguel.sanchez@demo.com",
        "service_title": "Ceremonia Grupal Psilocibina",
        "status": "CONFIRMED",
        "days_from_now": 45,
        "fixed_hour": 10,  # 10:00 AM - retreat start
        "amount_paid": 450.0,
        "notes": "Preparación pre-retiro en curso",
    },
    {
        "patient_email": "sofia.blanco@demo.com",
        "service_title": "Ceremonia Grupal Psilocibina",
        "status": "PENDING",  # Awaiting payment
        "days_from_now": 45,
        "fixed_hour": 10,  # 10:00 AM - retreat start
        "amount_paid": 0.0,
        "notes": "Depósito pendiente - recordatorio enviado",
    },
    # ===== ASTROLOGÍA =====
    {
        "patient_email": "carmen.luna@demo.com",
        "service_title": "Lectura de Carta Natal",
        "status": "PENDING",  # Needs birth data
        "days_from_now": 7,
        "amount_paid": 120.0,
        "notes": "Esperando datos de nacimiento exactos",
    },
    {
        "patient_email": "pablo.estrella@demo.com",
        "service_title": "Lectura de Carta Natal",
        "status": "CONFIRMED",
        "days_from_now": 3,
        "amount_paid": 120.0,
        "notes": "Carta natal preparada, sesión de revisión programada",
    },
    # ===== COACHING =====
    {
        "patient_email": "david.guerrero@demo.com",
        "service_title": "Programa El Despertar (8 sesiones)",
        "status": "CONFIRMED",
        "days_from_now": 2,  # Next session soon
        "amount_paid": 800.0,
        "notes": "Sesión 2 de 8 - Onboarding completado",
    },
    {
        "patient_email": "javier.roca@demo.com",
        "service_title": "Programa El Despertar (8 sesiones)",
        "status": "CONFIRMED",
        "days_from_now": -14,  # Past - should have happened
        "amount_paid": 800.0,
        "notes": "Sesión 5 de 8 - SIN ASISTIR - Requiere seguimiento",
    },
    {
        "patient_email": "andres.valiente@demo.com",
        "service_title": "Programa El Despertar (8 sesiones)",
        "status": "COMPLETED",
        "days_from_now": -30,  # Past
        "amount_paid": 800.0,
        "notes": "✅ Programa completado con éxito - Graduado",
    },
    # ===== YOGA (FIXED_DATE - same class time for all!) =====
    {
        "patient_email": "laura.paz@demo.com",
        "service_title": "Vinyasa Flow Sunset",
        "status": "PENDING",  # Needs waiver
        "days_from_now": 1,
        "fixed_hour": 19,  # 19:00 - Sunset class
        "amount_paid": 15.0,
        "notes": "Waiver pendiente de firma",
    },
    {
        "patient_email": "ana.om@demo.com",
        "service_title": "Vinyasa Flow Sunset",
        "status": "CONFIRMED",
        "days_from_now": 1,
        "fixed_hour": 19,  # 19:00 - Sunset class
        "amount_paid": 15.0,
        "notes": "Estudiante regular - 3er clase este mes",
    },
]


async def main():
    from sqlalchemy import select
    from app.db.base import AsyncSessionLocal
    from app.db.models import Booking, Patient, ServiceType, User, BookingStatus

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
        therapist_id = admin.id
        print(f"📅 Creating bookings for org: {org_id}")
        print()

        # Load all patients and services for lookup
        patients_result = await db.execute(
            select(Patient).where(Patient.organization_id == org_id)
        )
        patients_by_email = {
            p.email: p for p in patients_result.scalars().all() if p.email
        }

        services_result = await db.execute(
            select(ServiceType).where(ServiceType.organization_id == org_id)
        )
        services_by_title = {s.title: s for s in services_result.scalars().all()}

        print(
            f"📋 Found {len(patients_by_email)} patients, {len(services_by_title)} services"
        )
        print()

        created = 0
        skipped = 0

        for booking_data in BOOKINGS:
            patient = patients_by_email.get(booking_data["patient_email"])
            service = services_by_title.get(booking_data["service_title"])

            if not patient:
                print(f"⚠️ Patient not found: {booking_data['patient_email']}")
                skipped += 1
                continue

            if not service:
                print(f"⚠️ Service not found: {booking_data['service_title']}")
                skipped += 1
                continue

            # Check if booking already exists for this patient+service
            existing = await db.execute(
                select(Booking).where(
                    Booking.patient_id == patient.id,
                    Booking.service_type_id == service.id,
                )
            )
            if existing.scalar_one_or_none():
                print(f"⏭️ Booking exists: {patient.first_name} → {service.title}")
                skipped += 1
                continue

            # Calculate times
            now = datetime.utcnow()
            start_time = now + timedelta(days=booking_data["days_from_now"])

            # Use fixed_hour if provided (for FIXED_DATE events), otherwise random
            if "fixed_hour" in booking_data:
                start_time = start_time.replace(
                    hour=booking_data["fixed_hour"], minute=0, second=0
                )
            else:
                # Random hour for calendar-based bookings
                start_time = start_time.replace(
                    hour=random.randint(10, 17), minute=0, second=0
                )
            end_time = start_time + timedelta(minutes=service.duration_minutes)

            # Parse status
            status = BookingStatus[booking_data["status"]]

            booking = Booking(
                organization_id=org_id,
                patient_id=patient.id,
                service_type_id=service.id,
                therapist_id=therapist_id,
                start_time=start_time,
                end_time=end_time,
                status=status,
                amount_paid=booking_data["amount_paid"],
                currency="EUR",
                patient_notes=booking_data.get("notes"),
                target_timezone="Europe/Madrid",
            )
            db.add(booking)
            created += 1

            status_emoji = {
                "PENDING": "🟡",
                "CONFIRMED": "🟢",
                "COMPLETED": "✅",
                "CANCELLED": "🔴",
            }.get(booking_data["status"], "⚪")

            print(
                f"{status_emoji} {patient.first_name} {patient.last_name} → {service.title}"
            )
            print(
                f"   {booking_data['status']} | {booking_data['amount_paid']}€ | {start_time.strftime('%d/%m/%Y')}"
            )

        await db.commit()

        print()
        print("=" * 50)
        print(f"🎉 BOOKINGS READY!")
        print(f"   Created: {created}")
        print(f"   Skipped: {skipped}")


if __name__ == "__main__":
    asyncio.run(main())
