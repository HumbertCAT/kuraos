"""Public booking management endpoints for self-service cancel/reschedule."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models import Booking, ServiceType, Patient, SchedulingType
from app.services.booking_management import BookingManagementService
from app.services.slots import SlotService

router = APIRouter()


# ============ Schemas ============


class BookingPublicResponse(BaseModel):
    """Public booking details for self-service management."""

    booking_id: str
    service_title: str
    start_time: str
    end_time: str
    status: str
    patient_name: str
    patient_email: str
    amount_paid: float
    currency: str
    can_cancel: bool
    can_reschedule: bool
    cancel_reason: Optional[str] = None
    reschedule_reason: Optional[str] = None


class PolicyResponse(BaseModel):
    """Cancellation/reschedule policy for a booking."""

    allow_cancel: bool
    allow_reschedule: bool
    min_hours_before: int
    refund_policy: str
    can_cancel_now: bool
    can_reschedule_now: bool
    cancel_message: Optional[str] = None
    reschedule_message: Optional[str] = None


class CancelRequest(BaseModel):
    """Request to cancel a booking."""

    reason: Optional[str] = None


class RescheduleRequest(BaseModel):
    """Request to reschedule a booking."""

    new_slot_start: datetime
    reason: Optional[str] = None


class ActionResponse(BaseModel):
    """Response after cancel/reschedule action."""

    success: bool
    message: str
    booking_id: Optional[str] = None


# ============ Endpoints ============


@router.get("/{token}", response_model=BookingPublicResponse)
async def get_booking_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get booking details by public token."""
    service = BookingManagementService(db)
    booking = await service.get_booking_by_token(token)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada.",
        )

    # Get service details
    result = await db.execute(
        select(ServiceType).where(ServiceType.id == booking.service_type_id)
    )
    svc = result.scalar_one_or_none()

    # Get patient details
    result = await db.execute(select(Patient).where(Patient.id == booking.patient_id))
    patient = result.scalar_one_or_none()

    # Check what actions are allowed
    can_cancel, cancel_reason = await service.can_cancel(booking)
    can_reschedule, reschedule_reason = await service.can_reschedule(booking)

    return BookingPublicResponse(
        booking_id=str(booking.id),
        service_title=svc.title if svc else "Servicio",
        start_time=booking.start_time.isoformat(),
        end_time=booking.end_time.isoformat(),
        status=booking.status.value,
        patient_name=f"{patient.first_name} {patient.last_name}" if patient else "",
        patient_email=patient.email or "" if patient else "",
        amount_paid=booking.amount_paid,
        currency=booking.currency,
        can_cancel=can_cancel,
        can_reschedule=can_reschedule,
        cancel_reason=cancel_reason if not can_cancel else None,
        reschedule_reason=reschedule_reason if not can_reschedule else None,
    )


@router.get("/{token}/policy", response_model=PolicyResponse)
async def get_booking_policy(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get cancellation/reschedule policy for a booking."""
    service = BookingManagementService(db)
    booking = await service.get_booking_by_token(token)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada.",
        )

    # Get service
    result = await db.execute(
        select(ServiceType).where(ServiceType.id == booking.service_type_id)
    )
    svc = result.scalar_one_or_none()

    if not svc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado.",
        )

    policy = await service.get_cancellation_policy(svc)
    can_cancel, cancel_msg = await service.can_cancel(booking)
    can_reschedule, reschedule_msg = await service.can_reschedule(booking)

    return PolicyResponse(
        allow_cancel=policy["allow_cancel"],
        allow_reschedule=policy["allow_reschedule"],
        min_hours_before=policy["min_hours_before"],
        refund_policy=policy["refund_policy"],
        can_cancel_now=can_cancel,
        can_reschedule_now=can_reschedule,
        cancel_message=cancel_msg if not can_cancel else None,
        reschedule_message=reschedule_msg if not can_reschedule else None,
    )


@router.post("/{token}/cancel", response_model=ActionResponse)
async def cancel_booking(
    token: str,
    request: CancelRequest,
    db: AsyncSession = Depends(get_db),
):
    """Cancel a booking (patient self-service)."""
    service = BookingManagementService(db)
    booking = await service.get_booking_by_token(token)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada.",
        )

    # Check if cancellation is allowed
    can_cancel, reason = await service.can_cancel(booking, by="patient")
    if not can_cancel:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason,
        )

    # Cancel the booking
    await service.cancel_booking(booking, request.reason, by="patient")

    # TODO: Send cancellation email to patient and therapist

    return ActionResponse(
        success=True,
        message="Tu reserva ha sido cancelada correctamente.",
        booking_id=str(booking.id),
    )


@router.post("/{token}/reschedule", response_model=ActionResponse)
async def reschedule_booking(
    token: str,
    request: RescheduleRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reschedule a booking to a new time (patient self-service)."""
    mgmt_service = BookingManagementService(db)
    booking = await mgmt_service.get_booking_by_token(token)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada.",
        )

    # Check if rescheduling is allowed
    can_reschedule, reason = await mgmt_service.can_reschedule(booking, by="patient")
    if not can_reschedule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason,
        )

    # Verify the new slot is available
    result = await db.execute(
        select(ServiceType).where(ServiceType.id == booking.service_type_id)
    )
    svc = result.scalar_one_or_none()

    if not svc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado.",
        )

    slot_service = SlotService(db)
    is_available = await slot_service.is_slot_available(
        therapist_id=booking.therapist_id,
        service_id=booking.service_type_id,
        start_time=request.new_slot_start,
    )

    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El horario seleccionado ya no está disponible.",
        )

    # Calculate new end time
    from datetime import timedelta

    new_end_time = request.new_slot_start + timedelta(minutes=svc.duration_minutes)

    # Reschedule
    new_booking = await mgmt_service.reschedule_booking(
        booking,
        new_start_time=request.new_slot_start,
        new_end_time=new_end_time,
        reason=request.reason,
        by="patient",
    )

    # TODO: Send reschedule email to patient and therapist

    return ActionResponse(
        success=True,
        message="Tu reserva ha sido reprogramada correctamente.",
        booking_id=str(new_booking.id),
    )


@router.get("/{token}/available-slots")
async def get_available_slots_for_reschedule(
    token: str,
    start_date: str,
    end_date: str,
    db: AsyncSession = Depends(get_db),
):
    """Get available slots for rescheduling a booking."""
    mgmt_service = BookingManagementService(db)
    booking = await mgmt_service.get_booking_by_token(token)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada.",
        )

    # Check if rescheduling is allowed
    can_reschedule, reason = await mgmt_service.can_reschedule(booking, by="patient")
    if not can_reschedule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=reason,
        )

    # Parse dates
    from datetime import date

    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de fecha inválido. Use YYYY-MM-DD.",
        )

    # Get available slots
    slot_service = SlotService(db)
    slots = await slot_service.get_available_slots(
        therapist_id=booking.therapist_id,
        service_id=booking.service_type_id,
        start_date=start,
        end_date=end,
    )

    return {
        "slots": [
            {
                "start": slot.start.isoformat() + "Z"
                if not slot.start.tzinfo
                else slot.start.isoformat(),
                "end": slot.end.isoformat() + "Z"
                if not slot.end.tzinfo
                else slot.end.isoformat(),
            }
            for slot in slots
        ]
    }
