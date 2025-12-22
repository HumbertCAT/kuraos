"""Unit tests for SlotService - the core booking engine logic.

Tests cover:
1. Slot generation from AvailabilityBlocks
2. TimeOff exclusions
3. Booking conflict detection
4. Slot availability validation
"""

import pytest
import uuid
from datetime import datetime, date, time, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.slots import SlotService, TimeSlot


# ============ TimeSlot Tests ============


class TestTimeSlot:
    """Test the TimeSlot dataclass and its overlap logic."""

    def test_overlaps_complete_overlap(self):
        """Slot fully inside another range should overlap."""
        slot = TimeSlot(
            start=datetime(2025, 12, 15, 10, 0),
            end=datetime(2025, 12, 15, 11, 0),
            therapist_id=uuid.uuid4(),
        )
        assert (
            slot.overlaps(
                datetime(2025, 12, 15, 9, 0),
                datetime(2025, 12, 15, 12, 0),
            )
            is True
        )

    def test_overlaps_partial_start(self):
        """Slot starting before but ending inside range should overlap."""
        slot = TimeSlot(
            start=datetime(2025, 12, 15, 9, 0),
            end=datetime(2025, 12, 15, 10, 30),
            therapist_id=uuid.uuid4(),
        )
        assert (
            slot.overlaps(
                datetime(2025, 12, 15, 10, 0),
                datetime(2025, 12, 15, 11, 0),
            )
            is True
        )

    def test_overlaps_partial_end(self):
        """Slot starting inside but ending after range should overlap."""
        slot = TimeSlot(
            start=datetime(2025, 12, 15, 10, 30),
            end=datetime(2025, 12, 15, 11, 30),
            therapist_id=uuid.uuid4(),
        )
        assert (
            slot.overlaps(
                datetime(2025, 12, 15, 10, 0),
                datetime(2025, 12, 15, 11, 0),
            )
            is True
        )

    def test_no_overlap_before(self):
        """Slot ending before range starts should NOT overlap."""
        slot = TimeSlot(
            start=datetime(2025, 12, 15, 8, 0),
            end=datetime(2025, 12, 15, 9, 0),
            therapist_id=uuid.uuid4(),
        )
        assert (
            slot.overlaps(
                datetime(2025, 12, 15, 10, 0),
                datetime(2025, 12, 15, 11, 0),
            )
            is False
        )

    def test_no_overlap_after(self):
        """Slot starting after range ends should NOT overlap."""
        slot = TimeSlot(
            start=datetime(2025, 12, 15, 12, 0),
            end=datetime(2025, 12, 15, 13, 0),
            therapist_id=uuid.uuid4(),
        )
        assert (
            slot.overlaps(
                datetime(2025, 12, 15, 10, 0),
                datetime(2025, 12, 15, 11, 0),
            )
            is False
        )

    def test_adjacent_slots_no_overlap(self):
        """Back-to-back slots should NOT overlap (end == start)."""
        slot = TimeSlot(
            start=datetime(2025, 12, 15, 9, 0),
            end=datetime(2025, 12, 15, 10, 0),
            therapist_id=uuid.uuid4(),
        )
        assert (
            slot.overlaps(
                datetime(2025, 12, 15, 10, 0),
                datetime(2025, 12, 15, 11, 0),
            )
            is False
        )


# ============ SlotService Tests ============


class TestSlotServiceGeneration:
    """Test slot generation from availability blocks."""

    def test_generate_slots_single_block(self):
        """Generate slots from a single availability block."""
        # Create mock DB session (not used in _generate_slots_from_availability)
        mock_db = MagicMock(spec=AsyncSession)
        service = SlotService(mock_db)
        therapist_id = uuid.uuid4()

        # Create mock availability block (Monday 9-12)
        mock_block = MagicMock()
        mock_block.day_of_week = 0  # Monday
        mock_block.start_time = "09:00"
        mock_block.end_time = "12:00"

        # Test date: Monday Dec 16, 2025
        start_date = date(2025, 12, 15)  # Monday
        end_date = date(2025, 12, 15)  # Same day
        duration_minutes = 60

        slots = service._generate_slots_from_availability(
            blocks=[mock_block],
            start_date=start_date,
            end_date=end_date,
            duration_minutes=duration_minutes,
            therapist_id=therapist_id,
        )

        # Should generate 3 slots: 9-10, 10-11, 11-12
        assert len(slots) == 3
        assert slots[0].start == datetime(2025, 12, 15, 9, 0)
        assert slots[0].end == datetime(2025, 12, 15, 10, 0)
        assert slots[1].start == datetime(2025, 12, 15, 10, 0)
        assert slots[2].start == datetime(2025, 12, 15, 11, 0)

    def test_generate_slots_30_min_duration(self):
        """Generate 30-minute slots from a 2-hour block."""
        mock_db = MagicMock(spec=AsyncSession)
        service = SlotService(mock_db)
        therapist_id = uuid.uuid4()

        mock_block = MagicMock()
        mock_block.day_of_week = 0  # Monday
        mock_block.start_time = "10:00"
        mock_block.end_time = "12:00"

        slots = service._generate_slots_from_availability(
            blocks=[mock_block],
            start_date=date(2025, 12, 15),
            end_date=date(2025, 12, 15),
            duration_minutes=30,
            therapist_id=therapist_id,
        )

        # Should generate 4 slots: 10:00, 10:30, 11:00, 11:30
        assert len(slots) == 4

    def test_generate_slots_multiple_days(self):
        """Generate slots across multiple days."""
        mock_db = MagicMock(spec=AsyncSession)
        service = SlotService(mock_db)
        therapist_id = uuid.uuid4()

        # Monday and Tuesday
        mock_block_mon = MagicMock()
        mock_block_mon.day_of_week = 0  # Monday
        mock_block_mon.start_time = "09:00"
        mock_block_mon.end_time = "10:00"

        mock_block_tue = MagicMock()
        mock_block_tue.day_of_week = 1  # Tuesday
        mock_block_tue.start_time = "14:00"
        mock_block_tue.end_time = "15:00"

        slots = service._generate_slots_from_availability(
            blocks=[mock_block_mon, mock_block_tue],
            start_date=date(2025, 12, 15),  # Monday
            end_date=date(2025, 12, 16),  # Tuesday
            duration_minutes=60,
            therapist_id=therapist_id,
        )

        # Should generate 2 slots: Mon 9-10, Tue 14-15
        assert len(slots) == 2
        assert slots[0].start.weekday() == 0  # Monday
        assert slots[1].start.weekday() == 1  # Tuesday

    def test_generate_slots_no_matching_day(self):
        """No slots generated if date range doesn't include block's day."""
        mock_db = MagicMock(spec=AsyncSession)
        service = SlotService(mock_db)
        therapist_id = uuid.uuid4()

        mock_block = MagicMock()
        mock_block.day_of_week = 0  # Monday
        mock_block.start_time = "09:00"
        mock_block.end_time = "10:00"

        # Saturday-Sunday range (no Monday)
        slots = service._generate_slots_from_availability(
            blocks=[mock_block],
            start_date=date(2025, 12, 13),  # Saturday
            end_date=date(2025, 12, 14),  # Sunday
            duration_minutes=60,
            therapist_id=therapist_id,
        )

        assert len(slots) == 0


class TestSlotServiceFiltering:
    """Test slot filtering with TimeOffs and Bookings."""

    def test_filter_slots_with_time_off(self):
        """Slots overlapping with TimeOff should be removed."""
        mock_db = MagicMock(spec=AsyncSession)
        service = SlotService(mock_db)
        therapist_id = uuid.uuid4()

        slots = [
            TimeSlot(
                datetime(2025, 12, 15, 9, 0),
                datetime(2025, 12, 15, 10, 0),
                therapist_id,
            ),
            TimeSlot(
                datetime(2025, 12, 15, 10, 0),
                datetime(2025, 12, 15, 11, 0),
                therapist_id,
            ),
            TimeSlot(
                datetime(2025, 12, 15, 11, 0),
                datetime(2025, 12, 15, 12, 0),
                therapist_id,
            ),
        ]

        # TimeOff blocks 10:00-11:00 slot
        mock_time_off = MagicMock()
        mock_time_off.start_datetime = datetime(2025, 12, 15, 10, 0)
        mock_time_off.end_datetime = datetime(2025, 12, 15, 11, 0)

        filtered = service._filter_blocked_slots(slots, [mock_time_off], [], [])

        # Should have 2 slots (9-10 and 11-12)
        assert len(filtered) == 2
        assert filtered[0].start.hour == 9
        assert filtered[1].start.hour == 11

    def test_filter_slots_with_booking(self):
        """Slots overlapping with existing bookings should be removed."""
        mock_db = MagicMock(spec=AsyncSession)
        service = SlotService(mock_db)
        therapist_id = uuid.uuid4()

        slots = [
            TimeSlot(
                datetime(2025, 12, 15, 9, 0),
                datetime(2025, 12, 15, 10, 0),
                therapist_id,
            ),
            TimeSlot(
                datetime(2025, 12, 15, 10, 0),
                datetime(2025, 12, 15, 11, 0),
                therapist_id,
            ),
        ]

        # Booking at 9:00-10:00
        mock_booking = MagicMock()
        mock_booking.start_time = datetime(2025, 12, 15, 9, 0)
        mock_booking.end_time = datetime(2025, 12, 15, 10, 0)

        filtered = service._filter_blocked_slots(slots, [], [mock_booking], [])

        # Should only have 10-11 slot
        assert len(filtered) == 1
        assert filtered[0].start.hour == 10

    def test_filter_slots_multiple_blockers(self):
        """Handle multiple time-offs and bookings."""
        mock_db = MagicMock(spec=AsyncSession)
        service = SlotService(mock_db)
        therapist_id = uuid.uuid4()

        slots = [
            TimeSlot(
                datetime(2025, 12, 15, 9, 0),
                datetime(2025, 12, 15, 10, 0),
                therapist_id,
            ),
            TimeSlot(
                datetime(2025, 12, 15, 10, 0),
                datetime(2025, 12, 15, 11, 0),
                therapist_id,
            ),
            TimeSlot(
                datetime(2025, 12, 15, 11, 0),
                datetime(2025, 12, 15, 12, 0),
                therapist_id,
            ),
            TimeSlot(
                datetime(2025, 12, 15, 12, 0),
                datetime(2025, 12, 15, 13, 0),
                therapist_id,
            ),
        ]

        # TimeOff at 9-10, Booking at 11-12
        mock_time_off = MagicMock()
        mock_time_off.start_datetime = datetime(2025, 12, 15, 9, 0)
        mock_time_off.end_datetime = datetime(2025, 12, 15, 10, 0)

        mock_booking = MagicMock()
        mock_booking.start_time = datetime(2025, 12, 15, 11, 0)
        mock_booking.end_time = datetime(2025, 12, 15, 12, 0)

        filtered = service._filter_blocked_slots(
            slots, [mock_time_off], [mock_booking], []
        )

        # Should have 10-11 and 12-13
        assert len(filtered) == 2
        assert filtered[0].start.hour == 10
        assert filtered[1].start.hour == 12


# ============ Integration-Style Tests ============


@pytest.mark.asyncio
class TestSlotServiceIntegration:
    """Test full slot generation flow with mocked DB."""

    async def test_get_available_slots_no_service(self):
        """Return empty list if service doesn't exist."""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        service = SlotService(mock_db)
        slots = await service.get_available_slots(
            therapist_id=uuid.uuid4(),
            service_id=uuid.uuid4(),
            start_date=date(2025, 12, 15),
            end_date=date(2025, 12, 15),
        )

        assert slots == []

    async def test_is_slot_available_found(self):
        """Slot should be available if it exists in available slots."""
        mock_db = AsyncMock(spec=AsyncSession)
        service = SlotService(mock_db)
        therapist_id = uuid.uuid4()
        service_id = uuid.uuid4()

        # Mock the full flow
        with patch.object(service, "get_available_slots") as mock_get_slots:
            mock_get_slots.return_value = [
                TimeSlot(
                    start=datetime(2025, 12, 15, 10, 0),
                    end=datetime(2025, 12, 15, 11, 0),
                    therapist_id=therapist_id,
                )
            ]

            result = await service.is_slot_available(
                therapist_id=therapist_id,
                service_id=service_id,
                start_time=datetime(2025, 12, 15, 10, 0),
            )

            assert result is True

    async def test_is_slot_available_not_found(self):
        """Slot should NOT be available if not in available slots."""
        mock_db = AsyncMock(spec=AsyncSession)
        service = SlotService(mock_db)
        therapist_id = uuid.uuid4()
        service_id = uuid.uuid4()

        with patch.object(service, "get_available_slots") as mock_get_slots:
            mock_get_slots.return_value = [
                TimeSlot(
                    start=datetime(2025, 12, 15, 10, 0),
                    end=datetime(2025, 12, 15, 11, 0),
                    therapist_id=therapist_id,
                )
            ]

            # Check for a different time
            result = await service.is_slot_available(
                therapist_id=therapist_id,
                service_id=service_id,
                start_time=datetime(2025, 12, 15, 14, 0),  # Not 10:00
            )

            assert result is False
