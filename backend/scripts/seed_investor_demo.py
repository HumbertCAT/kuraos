"""Cinematic Demo Data for Investor Presentation.

Creates realistic demo data with 4 therapist archetypes and their patients
in various journey states. Designed to tell a compelling story.

Run with:
    docker-compose exec backend python -c "exec(open('scripts/seed_investor_demo.py').read())"
"""

import asyncio
import uuid
from datetime import datetime, timedelta

# ============ DATA DEFINITIONS ============

# Service Types for demo
SERVICES = [
    {
        "title": "Ceremonia Grupal Psilocibina",
        "description": "Retiro de fin de semana con integración terapéutica",
        "duration_minutes": 1440,  # 24h (retreat)
        "price": 450.00,
        "currency": "EUR",
        "scheduling_type": "FIXED_DATE",
    },
    {
        "title": "Lectura de Carta Natal",
        "description": "Sesión personalizada de 60 minutos vía Zoom",
        "duration_minutes": 60,
        "price": 120.00,
        "currency": "EUR",
        "scheduling_type": "CALENDAR",
    },
    {
        "title": "Programa El Despertar (8 sesiones)",
        "description": "Coaching transpersonal para hombres conscientes",
        "duration_minutes": 90,
        "price": 800.00,
        "currency": "EUR",
        "scheduling_type": "CALENDAR",
    },
    {
        "title": "Vinyasa Flow Sunset",
        "description": "Clase grupal dinámica (máx. 15 personas)",
        "duration_minutes": 75,
        "price": 15.00,
        "currency": "EUR",
        "scheduling_type": "FIXED_DATE",
    },
]

# Patients with different journey states
PATIENTS = [
    # ===== PSYCHEDELIC THERAPY (Dra. Amaya Sol) =====
    {
        "first_name": "Elena",
        "last_name": "Torres Medicación",
        "email": "elena.torres@demo.com",
        "phone": "+34 612 345 678",
        "profile_image_url": "/demo-avatars/elena.png",
        "journey_status": {"retreat_ibiza_2025": "BLOCKED_MEDICAL"},
        "journey_key": "retreat_ibiza_2025",
        "journey_log": {
            "from": None,
            "to": "BLOCKED_MEDICAL",
            "hours_ago": 2,
        },
        "notes": "🚨 CONTRAINDICACIÓN DETECTADA: Toma Prozac diariamente. Antecedentes de ansiedad severa.",
    },
    {
        "first_name": "Miguel",
        "last_name": "Sánchez Aprobado",
        "email": "miguel.sanchez@demo.com",
        "phone": "+34 623 456 789",
        "profile_image_url": "/demo-avatars/miguel.png",
        "journey_status": {"retreat_ibiza_2025": "PREPARATION_PHASE"},
        "journey_key": "retreat_ibiza_2025",
        "journey_log": {
            "from": "AWAITING_SCREENING",
            "to": "PREPARATION_PHASE",
            "hours_ago": 48,
        },
        "notes": "✅ Screening aprobado. Sin contraindicaciones médicas. Enviada guía de dieta previa.",
    },
    {
        "first_name": "Sofía",
        "last_name": "Blanco Espera",
        "email": "sofia.blanco@demo.com",
        "phone": "+34 634 567 890",
        "profile_image_url": "/demo-avatars/sofia.png",
        "journey_status": {"retreat_ibiza_2025": "AWAITING_PAYMENT"},
        "journey_key": "retreat_ibiza_2025",
        "journey_log": {
            "from": "PREPARATION_PHASE",
            "to": "AWAITING_PAYMENT",
            "hours_ago": 72,  # >48h - will trigger reminder!
        },
        "notes": "Aprobada pero no ha completado el pago. Enviar recordatorio.",
    },
    # ===== ASTROLOGY (Leo Star) =====
    {
        "first_name": "Carmen",
        "last_name": "Luna Datos",
        "email": "carmen.luna@demo.com",
        "phone": "+34 645 678 901",
        "profile_image_url": "/demo-avatars/carmen.png",
        "journey_status": {"carta_natal": "AWAITING_BIRTH_DATA"},
        "journey_key": "carta_natal",
        "journey_log": {
            "from": None,
            "to": "AWAITING_BIRTH_DATA",
            "hours_ago": 6,
        },
        "notes": "Reservó lectura. Pendiente de recibir coordenadas de nacimiento.",
    },
    {
        "first_name": "Pablo",
        "last_name": "Estrella Análisis",
        "email": "pablo.estrella@demo.com",
        "phone": "+34 656 789 012",
        "profile_image_url": "/demo-avatars/pablo.png",
        "journey_status": {"carta_natal": "ANALYSIS_IN_PROGRESS"},
        "journey_key": "carta_natal",
        "journey_log": {
            "from": "AWAITING_BIRTH_DATA",
            "to": "ANALYSIS_IN_PROGRESS",
            "hours_ago": 24,
        },
        "notes": "Nacimiento: 15/03/1985, 14:32, Barcelona. Leo estudiando su carta...",
        "birth_date": "1985-03-15",
        "birth_time": "14:32",
        "birth_place": "Barcelona, España",
    },
    # ===== COACHING (Marcos Vital) =====
    {
        "first_name": "David",
        "last_name": "Guerrero Onboarding",
        "email": "david.guerrero@demo.com",
        "phone": "+34 667 890 123",
        "profile_image_url": "/demo-avatars/david.png",
        "journey_status": {"despertar_8s": "ONBOARDING"},
        "journey_key": "despertar_8s",
        "journey_log": {
            "from": None,
            "to": "ONBOARDING",
            "hours_ago": 168,  # 1 week
        },
        "notes": "Sesión 2 de 8 completada. Trabajando en patrón de evitación.",
    },
    {
        "first_name": "Javier",
        "last_name": "Roca Estancado",
        "email": "javier.roca@demo.com",
        "phone": "+34 678 901 234",
        "profile_image_url": "/demo-avatars/javier.png",
        "journey_status": {"despertar_8s": "STAGNATION_ALERT"},
        "journey_key": "despertar_8s",
        "journey_log": {
            "from": "DEEP_DIVE",
            "to": "STAGNATION_ALERT",
            "hours_ago": 360,  # 15 days
        },
        "notes": "⚠️ 15 días sin actividad. Última sesión: trabajando límites con su padre.",
    },
    {
        "first_name": "Andrés",
        "last_name": "Valiente Graduado",
        "email": "andres.valiente@demo.com",
        "phone": "+34 689 012 345",
        "profile_image_url": "/demo-avatars/andres.png",
        "journey_status": {"despertar_8s": "GRADUATED"},
        "journey_key": "despertar_8s",
        "journey_log": {
            "from": "DEEP_DIVE",
            "to": "GRADUATED",
            "hours_ago": 72,
        },
        "notes": "🎓 Completó las 8 sesiones. Transformación notable. Candidato a testimonial.",
    },
    # ===== YOGA (Shanti Devi) =====
    {
        "first_name": "Laura",
        "last_name": "Paz Waiver",
        "email": "laura.paz@demo.com",
        "phone": "+34 690 123 456",
        "profile_image_url": "/demo-avatars/laura.png",
        "journey_status": {"yoga_urban_om": "AWAITING_WAIVER"},
        "journey_key": "yoga_urban_om",
        "journey_log": {
            "from": None,
            "to": "AWAITING_WAIVER",
            "hours_ago": 1,
        },
        "notes": "Nueva alumna. Pendiente de firmar waiver antes de primera clase.",
    },
    {
        "first_name": "Ana",
        "last_name": "Om Activa",
        "email": "ana.om@demo.com",
        "phone": "+34 601 234 567",
        "profile_image_url": "/demo-avatars/ana.png",
        "journey_status": {"yoga_urban_om": "ACTIVE_STUDENT"},
        "journey_key": "yoga_urban_om",
        "journey_log": {
            "from": "AWAITING_WAIVER",
            "to": "ACTIVE_STUDENT",
            "hours_ago": 720,  # 1 month
        },
        "notes": "Alumna fiel. 12 clases en el último mes. Bono de 10 activo.",
    },
]


# ============ MAIN SEED FUNCTION ============


async def main():
    from sqlalchemy import select, text
    from app.db.base import AsyncSessionLocal
    from app.db.models import Patient, JourneyLog, JourneyTemplate

    async with AsyncSessionLocal() as db:
        # Find admin organization
        from app.db.models import User

        result = await db.execute(
            select(User).where(User.email == "humbert.torroella@gmail.com")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Admin humbert.torroella@gmail.com not found!")
            return

        org_id = admin.organization_id
        print(f"✅ Organization: {org_id}")
        print(f"   Admin: {admin.full_name}")
        print()

        # Clean up old demo patients (optional)
        # await db.execute(text("DELETE FROM journey_logs WHERE patient_id IN (SELECT id FROM patients WHERE email LIKE '%@demo.com')"))
        # await db.execute(text("DELETE FROM patients WHERE email LIKE '%@demo.com'"))

        created = 0
        updated = 0

        for p_data in PATIENTS:
            # Check if exists
            existing = await db.execute(
                select(Patient).where(
                    Patient.email == p_data["email"], Patient.organization_id == org_id
                )
            )
            patient = existing.scalar_one_or_none()

            if patient:
                # Update existing
                patient.first_name = p_data["first_name"]
                patient.last_name = p_data["last_name"]
                patient.phone = p_data.get("phone")
                patient.journey_status = p_data["journey_status"]
                patient.profile_image_url = p_data.get("profile_image_url")
                if "birth_date" in p_data:
                    patient.birth_date = datetime.fromisoformat(p_data["birth_date"])
                if "birth_time" in p_data:
                    patient.birth_time = p_data["birth_time"]
                if "birth_place" in p_data:
                    patient.birth_place = p_data["birth_place"]
                updated += 1
                print(f"📝 Updated: {p_data['first_name']} {p_data['last_name']}")
            else:
                # Create new
                patient = Patient(
                    id=uuid.uuid4(),
                    organization_id=org_id,
                    first_name=p_data["first_name"],
                    last_name=p_data["last_name"],
                    email=p_data["email"],
                    phone=p_data.get("phone"),
                    journey_status=p_data["journey_status"],
                    profile_image_url=p_data.get("profile_image_url"),
                )
                if "birth_date" in p_data:
                    patient.birth_date = datetime.fromisoformat(p_data["birth_date"])
                if "birth_time" in p_data:
                    patient.birth_time = p_data["birth_time"]
                if "birth_place" in p_data:
                    patient.birth_place = p_data["birth_place"]

                db.add(patient)
                await db.flush()
                created += 1
                print(f"✅ Created: {p_data['first_name']} {p_data['last_name']}")

            # Create/Update Journey Log
            log_data = p_data.get("journey_log", {})
            if log_data:
                # Check if log exists
                existing_log = await db.execute(
                    select(JourneyLog).where(
                        JourneyLog.patient_id == patient.id,
                        JourneyLog.journey_key == p_data["journey_key"],
                    )
                )
                if not existing_log.scalar_one_or_none():
                    log = JourneyLog(
                        patient_id=patient.id,
                        journey_key=p_data["journey_key"],
                        from_stage=log_data.get("from"),
                        to_stage=log_data["to"],
                    )
                    db.add(log)
                    await db.flush()

                    # Backdate the log
                    log_time = datetime.utcnow() - timedelta(
                        hours=log_data["hours_ago"]
                    )
                    await db.execute(
                        text("UPDATE journey_logs SET changed_at = :t WHERE id = :id"),
                        {"t": log_time, "id": log.id},
                    )

            # Print status
            status = list(p_data["journey_status"].values())[0]
            print(f"   Journey: {p_data['journey_key']} → {status}")
            print(f"   {p_data.get('notes', '')[:60]}...")
            print()

        # Create JourneyTemplates if they don't exist
        templates = [
            {
                "name": "Retiro Ibiza 2025 (Psilocibina)",
                "key": "retreat_ibiza_2025",
                "allowed_stages": [
                    "AWAITING_SCREENING",
                    "BLOCKED_MEDICAL",
                    "PREPARATION_PHASE",
                    "AWAITING_PAYMENT",
                    "CONFIRMED",
                    "COMPLETED",
                ],
                "initial_stage": "AWAITING_SCREENING",
            },
            {
                "name": "Lectura Carta Natal",
                "key": "carta_natal",
                "allowed_stages": [
                    "AWAITING_BIRTH_DATA",
                    "ANALYSIS_IN_PROGRESS",
                    "READY_FOR_SESSION",
                    "COMPLETED",
                ],
                "initial_stage": "AWAITING_BIRTH_DATA",
            },
            {
                "name": "Programa El Despertar (8 sesiones)",
                "key": "despertar_8s",
                "allowed_stages": [
                    "ONBOARDING",
                    "DEEP_DIVE",
                    "STAGNATION_ALERT",
                    "GRADUATED",
                    "CANCELLED",
                ],
                "initial_stage": "ONBOARDING",
            },
            {
                "name": "Urban Om Yoga",
                "key": "yoga_urban_om",
                "allowed_stages": [
                    "AWAITING_WAIVER",
                    "ACTIVE_STUDENT",
                    "PAUSED",
                    "INACTIVE",
                ],
                "initial_stage": "AWAITING_WAIVER",
            },
        ]

        for t_data in templates:
            existing = await db.execute(
                select(JourneyTemplate).where(
                    JourneyTemplate.key == t_data["key"],
                    JourneyTemplate.organization_id == org_id,
                )
            )
            if not existing.scalar_one_or_none():
                template = JourneyTemplate(
                    organization_id=org_id,
                    name=t_data["name"],
                    key=t_data["key"],
                    allowed_stages=t_data["allowed_stages"],
                    initial_stage=t_data["initial_stage"],
                )
                db.add(template)
                print(f"📋 Template: {t_data['name']}")

        await db.commit()

        print()
        print("=" * 50)
        print(f"🎬 DEMO DATA READY!")
        print(f"   Created: {created} patients")
        print(f"   Updated: {updated} patients")
        print(f"   Total: {len(PATIENTS)} demo patients")
        print()
        print("📊 Journey Status Summary:")
        print("   🧬 BLOCKED_MEDICAL: Elena Torres")
        print("   🧬 PREPARATION_PHASE: Miguel Sánchez")
        print("   🧬 AWAITING_PAYMENT (>48h): Sofía Blanco")
        print("   ⭐ AWAITING_BIRTH_DATA: Carmen Luna")
        print("   ⭐ ANALYSIS_IN_PROGRESS: Pablo Estrella")
        print("   💪 ONBOARDING: David Guerrero")
        print("   💪 STAGNATION_ALERT: Javier Roca")
        print("   💪 GRADUATED: Andrés Valiente")
        print("   🧘 AWAITING_WAIVER: Laura Paz")
        print("   🧘 ACTIVE_STUDENT: Ana Om")


if __name__ == "__main__":
    asyncio.run(main())
