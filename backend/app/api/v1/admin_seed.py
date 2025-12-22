"""Temporary admin endpoint for running seeds and migrations.

DELETE THIS FILE AFTER SEEDING IS COMPLETE!
"""

from fastapi import APIRouter, HTTPException
from app.db.base import AsyncSessionLocal
import subprocess
import os

router = APIRouter()


@router.post("/migrate")
async def run_migrations():
    """Run Alembic migrations to sync database schema."""
    try:
        # Run alembic upgrade head
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            cwd="/app",
            env={**os.environ},
        )

        return {
            "status": "success" if result.returncode == 0 else "error",
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/migrate/status")
async def migration_status():
    """Check current migration status."""
    try:
        result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True,
            cwd="/app",
            env={**os.environ},
        )

        return {
            "current": result.stdout.strip(),
            "stderr": result.stderr if result.stderr else None,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/db/schema")
async def check_db_schema():
    """Check actual DB table columns to diagnose migration issues."""
    from sqlalchemy import text

    async with AsyncSessionLocal() as db:
        # Check service_types columns
        result = await db.execute(
            text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'service_types'
            ORDER BY ordinal_position
        """)
        )
        service_types_cols = [r[0] for r in result.fetchall()]

        # Check bookings columns
        result = await db.execute(
            text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'bookings'
            ORDER BY ordinal_position
        """)
        )
        bookings_cols = [r[0] for r in result.fetchall()]

        # Check alembic version
        result = await db.execute(text("SELECT version_num FROM alembic_version"))
        alembic_version = result.scalar()

        return {
            "alembic_version": alembic_version,
            "service_types_columns": service_types_cols,
            "bookings_columns": bookings_cols,
            "has_scheduling_type": "scheduling_type" in service_types_cols,
            "has_target_timezone": "target_timezone" in bookings_cols,
        }


@router.post("/db/fix")
async def fix_db_schema():
    """Add missing columns to Cloud SQL that migrations didn't apply."""
    from sqlalchemy import text

    results = []

    async with AsyncSessionLocal() as db:
        # Add schedule_id to service_types if missing
        try:
            await db.execute(
                text("""
                ALTER TABLE service_types 
                ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES availability_schedules(id)
            """)
            )
            results.append("Added schedule_id to service_types")
        except Exception as e:
            results.append(f"schedule_id: {str(e)}")

        # Add scheduling_type to service_types if missing
        try:
            await db.execute(
                text("""
                ALTER TABLE service_types 
                ADD COLUMN IF NOT EXISTS scheduling_type VARCHAR(20) DEFAULT 'CALENDAR'
            """)
            )
            results.append("Added scheduling_type to service_types")
        except Exception as e:
            results.append(f"scheduling_type: {str(e)}")

        # Add target_timezone to bookings if missing
        try:
            await db.execute(
                text("""
                ALTER TABLE bookings 
                ADD COLUMN IF NOT EXISTS target_timezone VARCHAR(50)
            """)
            )
            results.append("Added target_timezone to bookings")
        except Exception as e:
            results.append(f"target_timezone: {str(e)}")

        await db.commit()

    return {"status": "success", "results": results}


@router.post("/seed/tiers")
async def seed_tiers():
    """Seed tier configuration."""
    from app.services.settings import set_setting

    TIER_SETTINGS = [
        ("TIER_LIMIT_BUILDER", 3, "Max active patients for BUILDER tier"),
        ("TIER_LIMIT_PRO", 50, "Max active patients for PRO tier"),
        ("TIER_LIMIT_CENTER", 150, "Max active patients for CENTER tier"),
        ("TIER_FEE_BUILDER", 0.05, "Commission rate for BUILDER tier (5%)"),
        ("TIER_FEE_PRO", 0.02, "Commission rate for PRO tier (2%)"),
        ("TIER_FEE_CENTER", 0.01, "Commission rate for CENTER tier (1%)"),
    ]

    async with AsyncSessionLocal() as db:
        for key, value, description in TIER_SETTINGS:
            await set_setting(db, key, value, description)

    return {"status": "success", "message": "Tier configuration seeded"}


@router.post("/seed/services")
async def seed_services():
    """Seed demo services."""
    from sqlalchemy import select
    from app.db.models import ServiceType, User, ServiceMode

    SERVICES = [
        {
            "title": "Ceremonia Grupal Psilocibina",
            "description": "Retiro de fin de semana con ceremonia guiada de psilocibina.",
            "duration_minutes": 2880,
            "price": 450.00,
            "currency": "EUR",
            "mode": "GROUP",
            "max_participants": 8,
        },
        {
            "title": "Lectura de Carta Natal",
            "description": "Sesión personalizada de 60 minutos explorando tu carta natal.",
            "duration_minutes": 60,
            "price": 120.00,
            "currency": "EUR",
            "mode": "ONE_ON_ONE",
            "max_participants": 1,
        },
        {
            "title": "Coaching Transpersonal",
            "description": "Programa de coaching de 8 sesiones.",
            "duration_minutes": 90,
            "price": 800.00,
            "currency": "EUR",
            "mode": "ONE_ON_ONE",
            "max_participants": 1,
        },
        {
            "title": "Clase de Yoga",
            "description": "Clase grupal de Vinyasa Flow.",
            "duration_minutes": 75,
            "price": 15.00,
            "currency": "EUR",
            "mode": "GROUP",
            "max_participants": 15,
        },
    ]

    async with AsyncSessionLocal() as db:
        # Find first org
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="No users found")

        org_id = user.organization_id
        created = 0

        for svc in SERVICES:
            # Check if exists
            existing = await db.execute(
                select(ServiceType)
                .where(ServiceType.title == svc["title"])
                .where(ServiceType.organization_id == org_id)
            )
            if existing.scalar_one_or_none():
                continue

            service = ServiceType(
                organization_id=org_id,
                title=svc["title"],
                description=svc["description"],
                duration_minutes=svc["duration_minutes"],
                price=svc["price"],
                currency=svc["currency"],
                kind=ServiceMode[svc["mode"]],
                capacity=svc["max_participants"],
                is_active=True,
            )
            db.add(service)
            created += 1

        await db.commit()

    return {"status": "success", "created": created}


@router.get("/seed/status")
async def seed_status():
    """Check what's seeded."""
    from sqlalchemy import select, func
    from app.db.models import ServiceType, FormTemplate, SystemSetting

    async with AsyncSessionLocal() as db:
        services_count = await db.execute(select(func.count(ServiceType.id)))
        forms_count = await db.execute(select(func.count(FormTemplate.id)))
        settings_count = await db.execute(select(func.count(SystemSetting.id)))

        return {
            "services": services_count.scalar(),
            "form_templates": forms_count.scalar(),
            "system_settings": settings_count.scalar(),
        }
