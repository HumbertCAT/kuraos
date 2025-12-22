"""Slot generation service for the Booking Engine.

This service calculates available time slots based on:
1. Recurring availability blocks (AvailabilityBlock)
2. Existing bookings/events
3. Time-off exceptions (TimeOff)

Formula: (AvailabilityBlocks - Events - TimeOff) = Available Slots
"""

from datetime import datetime, date, time, timedelta
import uuid
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.db.models import (
    AvailabilityBlock,
    TimeOff,
    Booking,
    BookingStatus,
    ServiceType,
    SpecificAvailability,
    SchedulingType,
    AvailabilitySchedule,
)
from app.services.google_calendar import GoogleCalendarService


@dataclass
class TimeSlot:
    """A bookable time slot."""

    start: datetime
    end: datetime
    therapist_id: uuid.UUID
    max_capacity: int = 1
    current_bookings: int = 0

    @property
    def check_capacity(self) -> bool:
        return self.current_bookings < self.max_capacity

    def overlaps(self, other_start: datetime, other_end: datetime) -> bool:
        """Check if this slot overlaps with another time range."""
        return self.start < other_end and self.end > other_start


class SlotService:
    """Service for generating and managing available time slots."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_available_slots(
        self,
        therapist_id: uuid.UUID,
        service_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> list[TimeSlot]:
        """
        Get available time slots for a therapist within a date range.

        Args:
            therapist_id: The therapist's user ID
            service_id: The service type being booked
            start_date: Start of the date range (inclusive)
            end_date: End of the date range (inclusive)

        Returns:
            List of available TimeSlot objects
        """
        # Get service configuration
        service_result = await self.db.execute(
            select(ServiceType).where(ServiceType.id == service_id)
        )
        service = service_result.scalar_one_or_none()
        if not service:
            return []

        duration_minutes = service.duration_minutes

        # Get schedule_id to use (from service or user's default)
        schedule_id = service.schedule_id
        if not schedule_id:
            # Get user's default schedule
            default_schedule = await self.db.execute(
                select(AvailabilitySchedule).where(
                    AvailabilitySchedule.user_id == therapist_id,
                    AvailabilitySchedule.is_default == True,
                )
            )
            default = default_schedule.scalar_one_or_none()
            schedule_id = default.id if default else None

        # For FIXED_DATE services, we don't use recurring availability
        # The therapist explicitly sets the date/time, so we only check bookings
        if service.scheduling_type == SchedulingType.FIXED_DATE:
            # For FIXED_DATE, there are no "available slots" to browse
            # The booking is at a specific time set by the fixed_date field
            # This method shouldn't be called for FIXED_DATE services
            return []

        # CALENDAR services: Use recurring availability + specific availability
        if not schedule_id:
            # No schedule defined, no slots available
            return []

        # Step 1: Get recurring availability blocks for the schedule
        availability_blocks = await self._get_availability_blocks(schedule_id)

        # Step 2: Generate potential slots from availability
        potential_slots = self._generate_slots_from_availability(
            availability_blocks,
            start_date,
            end_date,
            duration_minutes,
            therapist_id,
        )

        # Step 1.5: Get specific availability (global + schedule-specific)
        specific_availability = await self._get_specific_availability(
            therapist_id, schedule_id, start_date, end_date
        )
        potential_specific_slots = self._generate_slots_from_specific(
            specific_availability, duration_minutes, therapist_id
        )

        # Combine slots and deduplicate
        all_potential_slots = self._deduplicate_slots(
            potential_slots + potential_specific_slots
        )

        if not all_potential_slots:
            return []

        # Step 3: Get blockers (time-off and existing bookings)
        time_offs = await self._get_time_offs(
            therapist_id, schedule_id, start_date, end_date
        )
        existing_bookings = await self._get_existing_bookings(
            therapist_id, start_date, end_date
        )

        # Step 3.5: Get Google Calendar busy times
        gcal_busy_times = await self._get_gcal_busy_times(
            therapist_id, schedule_id, start_date, end_date
        )

        # Step 4: Filter out blocked slots (respecting capacity)
        available_slots = self._filter_blocked_slots(
            all_potential_slots,
            time_offs,
            existing_bookings,
            gcal_busy_times,
            service.capacity,
        )

        # Step 5: Filter out past slots
        now = datetime.utcnow()
        available_slots = [s for s in available_slots if s.start > now]

        return available_slots

    async def _get_availability_blocks(
        self, schedule_id: uuid.UUID
    ) -> list[AvailabilityBlock]:
        """Get active availability blocks for a schedule."""
        now = datetime.utcnow()
        result = await self.db.execute(
            select(AvailabilityBlock).where(
                AvailabilityBlock.schedule_id == schedule_id,
                AvailabilityBlock.effective_from <= now,
                or_(
                    AvailabilityBlock.effective_until.is_(None),
                    AvailabilityBlock.effective_until >= now,
                ),
            )
        )
        return list(result.scalars().all())

    def _generate_slots_from_availability(
        self,
        blocks: list[AvailabilityBlock],
        start_date: date,
        end_date: date,
        duration_minutes: int,
        therapist_id: uuid.UUID,
    ) -> list[TimeSlot]:
        """Generate potential slots from availability blocks."""
        slots = []
        current_date = start_date

        while current_date <= end_date:
            weekday = current_date.weekday()  # 0=Monday, 6=Sunday

            for block in blocks:
                if block.day_of_week == weekday:
                    # Parse time strings
                    start_hour, start_min = map(int, block.start_time.split(":"))
                    end_hour, end_min = map(int, block.end_time.split(":"))

                    block_start = datetime.combine(
                        current_date, time(start_hour, start_min)
                    )
                    block_end = datetime.combine(current_date, time(end_hour, end_min))

                    # Generate slots within this block
                    slot_start = block_start
                    while slot_start + timedelta(minutes=duration_minutes) <= block_end:
                        slot_end = slot_start + timedelta(minutes=duration_minutes)
                        slots.append(
                            TimeSlot(
                                start=slot_start,
                                end=slot_end,
                                therapist_id=therapist_id,
                                max_capacity=1,  # Default, will be updated in filtering
                            )
                        )
                        slot_start = slot_end

            current_date += timedelta(days=1)

        return slots

    async def _get_specific_availability(
        self,
        therapist_id: uuid.UUID,
        schedule_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> list[SpecificAvailability]:
        """Get specific availability blocks within date range.

        Returns blocks that are global (schedule_id=NULL) or specific to this schedule.
        """
        start_dt = datetime.combine(start_date, time.min)
        end_dt = datetime.combine(end_date, time.max)

        result = await self.db.execute(
            select(SpecificAvailability).where(
                SpecificAvailability.user_id == therapist_id,
                SpecificAvailability.end_datetime >= start_dt,
                SpecificAvailability.start_datetime <= end_dt,
                or_(
                    SpecificAvailability.schedule_id.is_(None),  # Global
                    SpecificAvailability.schedule_id == schedule_id,  # Specific
                ),
            )
        )
        return list(result.scalars().all())

    def _generate_slots_from_specific(
        self,
        blocks: list[SpecificAvailability],
        duration_minutes: int,
        therapist_id: uuid.UUID,
    ) -> list[TimeSlot]:
        """Generate slots from specific availability blocks."""
        slots = []
        for block in blocks:
            # Generate slots within this block
            slot_start = block.start_datetime
            if slot_start.tzinfo is not None:
                slot_start = slot_start.replace(tzinfo=None)

            block_end = block.end_datetime
            if block_end.tzinfo is not None:
                block_end = block_end.replace(tzinfo=None)

            while slot_start + timedelta(minutes=duration_minutes) <= block_end:
                slot_end = slot_start + timedelta(minutes=duration_minutes)
                slots.append(
                    TimeSlot(
                        start=slot_start,
                        end=slot_end,
                        therapist_id=therapist_id,
                    )
                )
                slot_start = slot_end
        return slots

    def _deduplicate_slots(self, slots: list[TimeSlot]) -> list[TimeSlot]:
        """Remove duplicate slots (same start time)."""
        seen = set()
        unique = []
        for slot in slots:
            # Use tuple for hashing logic
            key = (slot.start, slot.end)
            if key not in seen:
                seen.add(key)
                unique.append(slot)
        return unique

    async def _get_time_offs(
        self,
        therapist_id: uuid.UUID,
        schedule_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> list[TimeOff]:
        """Get time-off blocks that overlap with the date range.

        Returns blocks that are global (schedule_id=NULL) or specific to this schedule.
        """
        start_dt = datetime.combine(start_date, time.min)
        end_dt = datetime.combine(end_date, time.max)

        result = await self.db.execute(
            select(TimeOff).where(
                TimeOff.user_id == therapist_id,
                TimeOff.start_datetime <= end_dt,
                TimeOff.end_datetime >= start_dt,
                or_(
                    TimeOff.schedule_id.is_(None),  # Global
                    TimeOff.schedule_id == schedule_id,  # Specific
                ),
            )
        )
        return list(result.scalars().all())

    async def _get_existing_bookings(
        self,
        therapist_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> list[Booking]:
        """Get existing bookings that overlap with the date range."""
        start_dt = datetime.combine(start_date, time.min)
        end_dt = datetime.combine(end_date, time.max)

        result = await self.db.execute(
            select(Booking).where(
                Booking.therapist_id == therapist_id,
                Booking.start_time <= end_dt,
                Booking.end_time >= start_dt,
                Booking.status.in_([
                    BookingStatus.PENDING,
                    BookingStatus.CONFIRMED,
                ]),
            )
        )
        return list(result.scalars().all())

    async def _get_gcal_busy_times(
        self,
        therapist_id: uuid.UUID,
        schedule_id: uuid.UUID,
        start_date: date,
        end_date: date,
    ) -> list[tuple[datetime, datetime]]:
        """Get busy times from Google Calendar for blocking calendars."""
        try:
            gcal_service = GoogleCalendarService(self.db)
            start_dt = datetime.combine(start_date, time.min)
            end_dt = datetime.combine(end_date, time.max)
            return await gcal_service.get_busy_times(
                user_id=therapist_id,
                schedule_id=schedule_id,
                start_time=start_dt,
                end_time=end_dt,
            )
        except Exception:
            # If GCal fails, don't block the booking flow
            return []

    def _filter_blocked_slots(
        self,
        slots: list[TimeSlot],
        time_offs: list[TimeOff],
        bookings: list[Booking],
        gcal_busy_times: list[tuple[datetime, datetime]],
        capacity: int = 1,
    ) -> list[TimeSlot]:
        """
        Remove slots that overlap with time-offs, gcal busy times, or exceed booking capacity.

        Args:
            slots: List of potential slots
            time_offs: List of therapist's time off blocks
            bookings: List of existing bookings
            gcal_busy_times: List of (start, end) tuples from Google Calendar
            capacity: Max number of bookings allowed per slot (default 1)
        """
        available = []

        def to_naive(dt: datetime) -> datetime:
            """Convert timezone-aware datetime to naive (UTC)."""
            if dt.tzinfo is not None:
                return dt.replace(tzinfo=None)
            return dt

        for slot in slots:
            is_blocked = False

            # Check time-offs (Always blocks)
            for time_off in time_offs:
                if slot.overlaps(
                    to_naive(time_off.start_datetime),
                    to_naive(time_off.end_datetime),
                ):
                    is_blocked = True
                    break

            if is_blocked:
                continue

            # Check Google Calendar busy times (Always blocks)
            for gcal_start, gcal_end in gcal_busy_times:
                if slot.overlaps(to_naive(gcal_start), to_naive(gcal_end)):
                    is_blocked = True
                    break

            if is_blocked:
                continue

            # Check bookings (Respect capacity)
            overlapping_bookings = 0
            for booking in bookings:
                if slot.overlaps(
                    to_naive(booking.start_time),
                    to_naive(booking.end_time),
                ):
                    overlapping_bookings += 1

            if overlapping_bookings >= capacity:
                is_blocked = True

            # Update slot info
            slot.max_capacity = capacity
            slot.current_bookings = overlapping_bookings

            if not is_blocked:
                available.append(slot)

        return available

    async def is_slot_available(
        self,
        therapist_id: uuid.UUID,
        service_id: uuid.UUID,
        start_time: datetime,
    ) -> bool:
        """
        Check if a specific slot is available for booking.
        Used to validate booking requests.
        """
        slot_date = start_time.date()
        available_slots = await self.get_available_slots(
            therapist_id=therapist_id,
            service_id=service_id,
            start_date=slot_date,
            end_date=slot_date,
        )

        # Compare without timezone - slots are naive, request might be aware
        # Strip timezone from start_time for comparison (slots are stored as naive)
        start_time_naive = (
            start_time.replace(tzinfo=None) if start_time.tzinfo else start_time
        )

        return any(slot.start == start_time_naive for slot in available_slots)
