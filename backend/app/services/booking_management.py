"""Booking Management Service for self-service cancel/reschedule."""

import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Booking, BookingStatus, ServiceType, SchedulingType


class BookingManagementService:
    """Service for managing booking cancellations and reschedules."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_booking_by_token(self, token: str) -> Optional[Booking]:
        """Get booking by public token for self-service management."""
        result = await self.db.execute(
            select(Booking).where(Booking.public_token == token)
        )
        return result.scalar_one_or_none()

    async def get_cancellation_policy(self, service: ServiceType) -> dict:
        """Get cancellation policy for a service, with defaults."""
        policy = service.cancellation_policy or {}
        return {
            "allow_cancel": policy.get("allow_cancel", True),
            "allow_reschedule": policy.get("allow_reschedule", True),
            "min_hours_before": policy.get("min_hours_before", 24),  # Default 24h
            "refund_policy": policy.get("refund_policy", "none"),
        }

    async def can_cancel(
        self, booking: Booking, by: str = "patient"
    ) -> Tuple[bool, str]:
        """
        Check if booking can be cancelled.
        Returns (allowed, reason_if_not_allowed).
        """
        # Already cancelled or completed
        if booking.status in [
            BookingStatus.CANCELLED,
            BookingStatus.COMPLETED,
            BookingStatus.NO_SHOW,
        ]:
            return False, "Esta reserva ya no puede ser cancelada."

        # Get service and policy
        result = await self.db.execute(
            select(ServiceType).where(ServiceType.id == booking.service_type_id)
        )
        service = result.scalar_one_or_none()
        if not service:
            return False, "Servicio no encontrado."

        policy = await self.get_cancellation_policy(service)

        # Check if cancellation is allowed
        if not policy["allow_cancel"]:
            return False, "Este servicio no permite cancelaciones."

        # Check time window (only for patients)
        if by == "patient":
            hours_until = (
                booking.start_time - datetime.now(timezone.utc)
            ).total_seconds() / 3600
            if hours_until < policy["min_hours_before"]:
                return (
                    False,
                    f"La cancelación debe hacerse con al menos {policy['min_hours_before']} horas de antelación.",
                )

        return True, ""

    async def can_reschedule(
        self, booking: Booking, by: str = "patient"
    ) -> Tuple[bool, str]:
        """
        Check if booking can be rescheduled.
        Returns (allowed, reason_if_not_allowed).
        """
        # Already cancelled or completed
        if booking.status in [
            BookingStatus.CANCELLED,
            BookingStatus.COMPLETED,
            BookingStatus.NO_SHOW,
        ]:
            return False, "Esta reserva ya no puede ser modificada."

        # Get service
        result = await self.db.execute(
            select(ServiceType).where(ServiceType.id == booking.service_type_id)
        )
        service = result.scalar_one_or_none()
        if not service:
            return False, "Servicio no encontrado."

        # FIXED_DATE services cannot be rescheduled
        if service.scheduling_type == SchedulingType.FIXED_DATE:
            return False, "Los eventos de fecha fija no pueden ser reprogramados."

        policy = await self.get_cancellation_policy(service)

        # Check if rescheduling is allowed
        if not policy["allow_reschedule"]:
            return False, "Este servicio no permite reprogramaciones."

        # Check time window (only for patients)
        if by == "patient":
            hours_until = (
                booking.start_time - datetime.now(timezone.utc)
            ).total_seconds() / 3600
            if hours_until < policy["min_hours_before"]:
                return (
                    False,
                    f"La reprogramación debe hacerse con al menos {policy['min_hours_before']} horas de antelación.",
                )

        return True, ""

    async def cancel_booking(
        self,
        booking: Booking,
        reason: Optional[str] = None,
        by: str = "patient",
    ) -> Booking:
        """
        Cancel a booking.
        Updates status and records cancellation metadata.
        """
        booking.status = BookingStatus.CANCELLED
        booking.cancellation_reason = reason
        booking.cancelled_at = datetime.now(timezone.utc)
        booking.cancelled_by = by

        await self.db.commit()
        await self.db.refresh(booking)
        return booking

    async def reschedule_booking(
        self,
        booking: Booking,
        new_start_time: datetime,
        new_end_time: datetime,
        reason: Optional[str] = None,
        by: str = "patient",
    ) -> Booking:
        """
        Reschedule a booking to a new time slot.
        Creates a new booking and marks the old one as rescheduled.
        """
        import secrets

        # Mark old booking as cancelled (rescheduled)
        booking.status = BookingStatus.CANCELLED
        booking.cancellation_reason = reason or "Reprogramada"
        booking.cancelled_at = datetime.now(timezone.utc)
        booking.cancelled_by = by

        # Create new booking with same details but new time
        new_booking = Booking(
            organization_id=booking.organization_id,
            patient_id=booking.patient_id,
            service_type_id=booking.service_type_id,
            therapist_id=booking.therapist_id,
            start_time=new_start_time,
            end_time=new_end_time,
            status=booking.stripe_payment_status == "succeeded"
            and BookingStatus.CONFIRMED
            or BookingStatus.PENDING,
            stripe_payment_intent_id=booking.stripe_payment_intent_id,
            stripe_payment_status=booking.stripe_payment_status,
            amount_paid=booking.amount_paid,
            currency=booking.currency,
            patient_notes=booking.patient_notes,
            target_timezone=booking.target_timezone,
            public_token=secrets.token_urlsafe(32),
            rescheduled_from_id=booking.id,
        )

        self.db.add(new_booking)
        await self.db.commit()
        await self.db.refresh(new_booking)
        return new_booking
