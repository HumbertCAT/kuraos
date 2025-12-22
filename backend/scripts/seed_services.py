"""Seed demo services for investor presentation.

Creates 4 services matching the therapist archetypes:
1. Ceremonia Grupal Psilocibina (Psychedelic)
2. Lectura de Carta Natal (Astrology)
3. Programa El Despertar (Coaching)
4. Vinyasa Flow Sunset (Yoga)

Run with:
    docker-compose exec backend python -c "exec(open('scripts/seed_services.py').read())"
"""

import asyncio
import uuid
from datetime import datetime, timedelta

SERVICES = [
    # ===== 1. PSICODÉLICA =====
    {
        "title": "Ceremonia Grupal Psilocibina",
        "description": "Retiro de fin de semana en Ibiza con ceremonia guiada de psilocibina, integración terapéutica, alojamiento y comidas incluidas. Máximo 8 participantes para atención personalizada.",
        "duration_minutes": 2880,  # 48 hours (weekend)
        "price": 450.00,
        "currency": "EUR",
        "mode": "GROUP",
        "scheduling_type": "FIXED_DATE",
        "max_participants": 8,
        "therapy_type": "PSYCHEDELIC",
        "color": "#8B5CF6",  # Purple
    },
    # ===== 2. ASTROLOGÍA =====
    {
        "title": "Lectura de Carta Natal",
        "description": "Sesión personalizada de 60 minutos vía Zoom donde exploraremos tu carta natal completa: Sol, Luna, Ascendente, las 12 casas y los aspectos más relevantes para tu momento actual.",
        "duration_minutes": 60,
        "price": 120.00,
        "currency": "EUR",
        "mode": "ONE_ON_ONE",
        "scheduling_type": "CALENDAR",
        "max_participants": 1,
        "therapy_type": "ASTROLOGY",
        "color": "#F59E0B",  # Amber
    },
    # ===== 3. COACHING =====
    {
        "title": "Programa El Despertar (8 sesiones)",
        "description": "Coaching transpersonal intensivo para hombres. 8 sesiones de 90 minutos a lo largo de 3 meses. Incluye ejercicios entre sesiones, acceso a grupo privado y materiales de trabajo.",
        "duration_minutes": 90,
        "price": 800.00,
        "currency": "EUR",
        "mode": "ONE_ON_ONE",
        "scheduling_type": "CALENDAR",
        "max_participants": 1,
        "therapy_type": "GENERAL",
        "color": "#10B981",  # Emerald
    },
    # ===== 4. YOGA =====
    {
        "title": "Vinyasa Flow Sunset",
        "description": "Clase grupal dinámica al atardecer. Secuencias fluidas sincronizadas con la respiración. Apto para todos los niveles. Trae tu propia esterilla o usa las del estudio.",
        "duration_minutes": 75,
        "price": 15.00,
        "currency": "EUR",
        "mode": "GROUP",
        "scheduling_type": "FIXED_DATE",
        "max_participants": 15,
        "therapy_type": "SOMATIC",
        "color": "#EC4899",  # Pink
    },
]


async def main():
    from sqlalchemy import select, text
    from app.db.base import AsyncSessionLocal
    from app.db.models import ServiceType, User, ServiceMode, SchedulingType

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
        print(f"🛠️ Creating services for org: {org_id}")
        print()

        created = 0
        updated = 0

        for svc_data in SERVICES:
            # Check if exists
            existing = await db.execute(
                select(ServiceType).where(
                    ServiceType.title == svc_data["title"],
                    ServiceType.organization_id == org_id,
                )
            )
            service = existing.scalar_one_or_none()

            # Parse enums
            kind = ServiceMode[svc_data["mode"]]
            scheduling_type = SchedulingType[svc_data["scheduling_type"]]

            if service:
                # Update existing
                service.description = svc_data["description"]
                service.duration_minutes = svc_data["duration_minutes"]
                service.price = svc_data["price"]
                service.currency = svc_data["currency"]
                service.kind = kind
                service.scheduling_type = scheduling_type
                service.capacity = svc_data.get("max_participants", 1)
                service.is_active = True
                updated += 1
                print(f"📝 Updated: {svc_data['title']}")
            else:
                # Create new
                service = ServiceType(
                    organization_id=org_id,
                    title=svc_data["title"],
                    description=svc_data["description"],
                    duration_minutes=svc_data["duration_minutes"],
                    price=svc_data["price"],
                    currency=svc_data["currency"],
                    kind=kind,
                    scheduling_type=scheduling_type,
                    capacity=svc_data.get("max_participants", 1),
                    is_active=True,
                )
                db.add(service)
                created += 1
                print(f"✅ Created: {svc_data['title']}")

            print(
                f"   💰 {svc_data['price']}€ | ⏱️ {svc_data['duration_minutes']}min | 👥 {svc_data['mode']}"
            )

        await db.commit()

        print()
        print("=" * 50)
        print(f"🎉 SERVICES READY!")
        print(f"   Created: {created}")
        print(f"   Updated: {updated}")
        print()
        print("📋 Summary:")
        print("   🧬 Ceremonia Psilocibina - 450€ (Retiro grupal)")
        print("   ⭐ Lectura Carta Natal - 120€ (1-on-1 Zoom)")
        print("   💪 Programa El Despertar - 800€ (8 sesiones)")
        print("   🧘 Vinyasa Flow Sunset - 15€ (Clase grupal)")


if __name__ == "__main__":
    asyncio.run(main())
