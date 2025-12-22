"""Clean up test data and prepare for investor demo.

Run with:
    docker-compose exec backend python -c "exec(open('scripts/cleanup_test_data.py').read())"
"""

import asyncio


async def main():
    from sqlalchemy import text
    from app.db.base import AsyncSessionLocal
    from app.db.models import User
    from sqlalchemy import select

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
        print(f"🧹 Cleaning test data for org: {org_id}")
        print()

        # First delete dependent records
        # Clinical entries
        deleted_entries = await db.execute(
            text("""
                DELETE FROM clinical_entries 
                WHERE patient_id IN (
                    SELECT id FROM patients 
                    WHERE organization_id = :org_id 
                    AND email NOT LIKE '%@demo.com'
                )
            """),
            {"org_id": org_id},
        )
        print(f"   🗑️ Deleted {deleted_entries.rowcount} clinical entries")

        # Form submissions
        deleted_submissions = await db.execute(
            text("""
                DELETE FROM form_submissions 
                WHERE patient_id IN (
                    SELECT id FROM patients 
                    WHERE organization_id = :org_id 
                    AND email NOT LIKE '%@demo.com'
                )
            """),
            {"org_id": org_id},
        )
        print(f"   🗑️ Deleted {deleted_submissions.rowcount} form submissions")

        # Journey logs
        deleted_jlogs = await db.execute(
            text("""
                DELETE FROM journey_logs 
                WHERE patient_id IN (
                    SELECT id FROM patients 
                    WHERE organization_id = :org_id 
                    AND email NOT LIKE '%@demo.com'
                )
            """),
            {"org_id": org_id},
        )
        print(f"   🗑️ Deleted {deleted_jlogs.rowcount} journey logs")

        # Bookings
        deleted_bookings = await db.execute(
            text("""
                DELETE FROM bookings 
                WHERE patient_id IN (
                    SELECT id FROM patients 
                    WHERE organization_id = :org_id 
                    AND email NOT LIKE '%@demo.com'
                )
            """),
            {"org_id": org_id},
        )
        print(f"   🗑️ Deleted {deleted_bookings.rowcount} bookings")

        # Now we can delete patients
        deleted = await db.execute(
            text("""
                DELETE FROM patients 
                WHERE organization_id = :org_id 
                AND email NOT LIKE '%@demo.com'
                AND email != 'humbert.torroella@gmail.com'
            """),
            {"org_id": org_id},
        )
        print(f"   🗑️ Deleted {deleted.rowcount} test patients (kept @demo.com)")

        # Clean up orphaned journey_logs
        deleted_logs = await db.execute(
            text("""
                DELETE FROM journey_logs
                WHERE patient_id NOT IN (SELECT id FROM patients)
            """)
        )
        print(f"   🗑️ Deleted {deleted_logs.rowcount} orphaned journey logs")

        # Clean up old system events (keep last 100)
        deleted_events = await db.execute(
            text("""
                DELETE FROM system_events
                WHERE id NOT IN (
                    SELECT id FROM system_events 
                    ORDER BY created_at DESC 
                    LIMIT 100
                )
            """)
        )
        print(f"   🗑️ Deleted {deleted_events.rowcount} old system events")

        # Clean up test forms (keep ones with specific names)
        deleted_forms = await db.execute(
            text("""
                DELETE FROM form_templates
                WHERE organization_id = :org_id
                AND title NOT IN (
                    'Screening Médico Riguroso',
                    'Coordenadas de Nacimiento',
                    'Check-in Semanal',
                    'Exención de Responsabilidad (Waiver)'
                )
            """),
            {"org_id": org_id},
        )
        print(f"   🗑️ Deleted {deleted_forms.rowcount} test form templates")

        # Clean up test services (keep demo services)
        deleted_services = await db.execute(
            text("""
                DELETE FROM services
                WHERE organization_id = :org_id
                AND title NOT IN (
                    'Ceremonia Grupal Psilocibina',
                    'Lectura de Carta Natal',
                    'Programa El Despertar (8 sesiones)',
                    'Vinyasa Flow Sunset'
                )
            """),
            {"org_id": org_id},
        )
        print(f"   🗑️ Deleted {deleted_services.rowcount} test services")

        await db.commit()

        print()
        print("✅ Cleanup complete!")
        print()
        print("📋 Remaining data:")

        # Count remaining
        counts = await db.execute(
            text("""
                SELECT 
                    (SELECT COUNT(*) FROM patients WHERE organization_id = :org_id) as patients,
                    (SELECT COUNT(*) FROM form_templates WHERE organization_id = :org_id) as forms,
                    (SELECT COUNT(*) FROM services WHERE organization_id = :org_id) as services,
                    (SELECT COUNT(*) FROM journey_logs) as logs,
                    (SELECT COUNT(*) FROM system_events) as events
            """),
            {"org_id": org_id},
        )
        row = counts.fetchone()
        print(f"   Patients: {row[0]}")
        print(f"   Forms: {row[1]}")
        print(f"   Services: {row[2]}")
        print(f"   Journey Logs: {row[3]}")
        print(f"   System Events: {row[4]}")


if __name__ == "__main__":
    asyncio.run(main())
