import pytest
from datetime import date, datetime, time, timedelta
from app.services.slots import SlotService
from app.db.models import (
    AvailabilityBlock,
    AvailabilitySchedule,
    SpecificAvailability,
    ServiceType,
    Booking,
    BookingStatus,
    User,
    Organization,
    Patient,
    UserRole,
)
import uuid
from app.core.security import get_password_hash


@pytest.mark.asyncio
class TestGroupBooking:
    async def create_fixtures(self, db):
        """Helper to create Organization, Therapist, and Default Schedule."""
        # Org
        org = Organization(
            name=f"Test Org {uuid.uuid4()}", referral_code=f"REF-{uuid.uuid4()}"
        )
        db.add(org)
        await db.commit()
        await db.refresh(org)

        # Therapist
        therapist = User(
            email=f"therapist-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("password"),
            full_name="Dr. Test",
            role=UserRole.OWNER,
            organization_id=org.id,
            is_active=True,
        )
        db.add(therapist)
        await db.commit()
        await db.refresh(therapist)

        # Default Schedule (required for AvailabilityBlock)
        schedule = AvailabilitySchedule(
            user_id=therapist.id,
            name="Default",
            is_default=True,
        )
        db.add(schedule)
        await db.commit()
        await db.refresh(schedule)

        return org, therapist, schedule

    async def test_slot_capacity_logic(self, test_db):
        """Test that slots allow multiple bookings up to capacity."""
        org, therapist, schedule = await self.create_fixtures(test_db)

        # 1. Create Service with capacity = 2, linked to schedule
        service = ServiceType(
            organization_id=org.id,
            title="Group Therapy",
            duration_minutes=60,
            price=50.0,
            capacity=2,  # IMPORTANT
            schedule_id=schedule.id,  # Link to schedule for slot generation
            is_active=True,
        )
        test_db.add(service)

        # 2. Add Availability (Mon 09:00-10:00)
        block = AvailabilityBlock(
            user_id=therapist.id,
            schedule_id=schedule.id,  # Required since v0.8.5
            day_of_week=0,  # Monday
            start_time="09:00",
            end_time="10:00",
            effective_from=datetime.utcnow()
            - timedelta(days=1),  # Start from yesterday
        )
        test_db.add(block)
        await test_db.commit()

        # Find a Monday
        today = date.today()
        days_until_monday = (0 - today.weekday() + 7) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        target_monday = today + timedelta(days=days_until_monday)

        slot_service = SlotService(test_db)

        # 3. Check slots - Should be available (0/2)
        slots = await slot_service.get_available_slots(
            therapist.id, service.id, target_monday, target_monday
        )
        assert len(slots) == 1
        assert slots[0].current_bookings == 0
        assert slots[0].max_capacity == 2

        # 4. Create 1st Booking
        slot_start = datetime.combine(target_monday, time(9, 0))
        slot_end = datetime.combine(target_monday, time(10, 0))

        # Create Patient 1
        patient1 = Patient(
            organization_id=org.id,
            first_name="P1",
            last_name="Test",
            email=f"p1-{uuid.uuid4()}@example.com",
        )
        test_db.add(patient1)
        await test_db.commit()

        booking1 = Booking(
            organization_id=org.id,
            service_type_id=service.id,
            therapist_id=therapist.id,
            patient_id=patient1.id,
            start_time=slot_start,
            end_time=slot_end,
            status=BookingStatus.CONFIRMED,
            amount_paid=50.0,
            currency="EUR",
        )
        test_db.add(booking1)
        await test_db.commit()

        # 5. Check slots - Should be available (1/2)
        slots = await slot_service.get_available_slots(
            therapist.id, service.id, target_monday, target_monday
        )
        assert len(slots) == 1
        assert slots[0].current_bookings == 1

        # 6. Create 2nd Booking
        # Create Patient 2
        patient2 = Patient(
            organization_id=org.id,
            first_name="P2",
            last_name="Test",
            email=f"p2-{uuid.uuid4()}@example.com",
        )
        test_db.add(patient2)
        await test_db.commit()

        booking2 = Booking(
            organization_id=org.id,
            service_type_id=service.id,
            therapist_id=therapist.id,
            patient_id=patient2.id,
            start_time=slot_start,
            end_time=slot_end,
            status=BookingStatus.CONFIRMED,
            amount_paid=50.0,
            currency="EUR",
        )
        test_db.add(booking2)
        await test_db.commit()

        # 7. Check slots - Should NOT be available (2/2)
        slots = await slot_service.get_available_slots(
            therapist.id, service.id, target_monday, target_monday
        )
        assert len(slots) == 0  # Fully booked!

    async def test_specific_availability(self, test_db):
        """Test specific availability overrides."""
        org, therapist, schedule = await self.create_fixtures(test_db)

        service = ServiceType(
            organization_id=org.id,
            title="Retreat",
            duration_minutes=60,
            price=100.0,
            schedule_id=schedule.id,  # Link to schedule
            is_active=True,
        )
        test_db.add(service)
        await test_db.commit()

        # Pick a date that is NOT covered by any AvailabilityBlock (e.g. Sunday)
        today = date.today()
        # Find next Sunday
        days_until_sunday = (6 - today.weekday() + 7) % 7
        target_sunday = today + timedelta(days=days_until_sunday)
        if days_until_sunday == 0:
            target_sunday += timedelta(days=7)  # Next week if today is Sunday

        # Verify no slots initially
        slot_service = SlotService(test_db)
        slots = await slot_service.get_available_slots(
            therapist.id, service.id, target_sunday, target_sunday
        )
        assert len(slots) == 0

        # Create Specific Availability for Sunday 10:00-11:00
        start_dt = datetime.combine(target_sunday, time(10, 0))
        end_dt = datetime.combine(target_sunday, time(11, 0))

        specific = SpecificAvailability(
            user_id=therapist.id,
            schedule_id=schedule.id,  # Link to schedule for slot filtering
            start_datetime=start_dt,
            end_datetime=end_dt,
        )
        test_db.add(specific)
        await test_db.commit()

        # Verify slot appears
        slots = await slot_service.get_available_slots(
            therapist.id, service.id, target_sunday, target_sunday
        )
        assert len(slots) == 1
        assert slots[0].start == start_dt
