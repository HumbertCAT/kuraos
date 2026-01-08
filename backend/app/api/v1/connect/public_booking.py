"""Public booking endpoints for external clients.

These endpoints are UNAUTHENTICATED and designed for the public booking widget.
They allow potential clients to:
1. View available services
2. Query available slots
3. Create a booking (draft/pending status)
"""

from typing import Optional
from datetime import date
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.base import get_db
from app.db.models import (
    ServiceType,
    User,
    Booking,
    BookingStatus,
    Patient,
    Organization,
)
from app.services.slots import SlotService
from app.core.validators import ISODateTimeWithTZ

router = APIRouter()


# ============ SCHEMAS ============


class PublicServiceResponse(BaseModel):
    """Public view of a service (no internal IDs exposed)."""

    id: uuid.UUID
    title: str
    description: Optional[str]
    duration_minutes: int
    price: float
    currency: str
    kind: str  # ONE_ON_ONE or GROUP
    capacity: int

    model_config = {"from_attributes": True}


class PublicSlotResponse(BaseModel):
    """Available time slot for booking."""

    start: str  # ISO datetime
    end: str  # ISO datetime
    spots_total: int
    spots_booked: int
    spots_left: int


class BookingCreateRequest(BaseModel):
    """Request to create a new booking."""

    service_id: uuid.UUID
    therapist_id: uuid.UUID
    slot_start: ISODateTimeWithTZ  # Must include timezone (Z or +HH:MM)
    target_timezone: Optional[str] = None  # IANA timezone (e.g., "America/Mexico_City")
    patient_name: str = Field(..., min_length=2)
    patient_email: EmailStr
    patient_phone: Optional[str] = None
    patient_notes: Optional[str] = None


class BookingCreateResponse(BaseModel):
    """Response after creating a booking."""

    booking_id: uuid.UUID
    status: str
    service_title: str
    slot_start: str
    slot_end: str
    amount: float
    currency: str


# ============ ENDPOINTS ============


@router.get(
    "/services",
    response_model=list[PublicServiceResponse],
    summary="List public services",
)
async def list_public_services(
    therapist_id: uuid.UUID = Query(..., description="Therapist's public ID"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all active services offered by a therapist.
    This is the first step of the booking flow.
    """
    from app.db.models import service_therapist_link

    # Verify therapist exists
    therapist_result = await db.execute(select(User).where(User.id == therapist_id))
    therapist = therapist_result.scalar_one_or_none()
    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    # Get active services ASSIGNED to this therapist via M2M
    result = await db.execute(
        select(ServiceType)
        .join(
            service_therapist_link,
            ServiceType.id == service_therapist_link.c.service_type_id,
        )
        .where(
            service_therapist_link.c.user_id == therapist_id,
            ServiceType.is_active == True,
        )
        .order_by(ServiceType.title)
    )
    services = result.scalars().all()

    return [PublicServiceResponse.model_validate(s) for s in services]


@router.get(
    "/slots", response_model=list[PublicSlotResponse], summary="Get available slots"
)
async def get_public_slots(
    therapist_id: uuid.UUID = Query(..., description="Therapist to book with"),
    service_id: uuid.UUID = Query(..., description="Service to book"),
    start_date: date = Query(..., description="Start of date range"),
    end_date: date = Query(..., description="End of date range"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get available time slots for a therapist and service.
    This is step 2 of the booking flow.
    """
    slot_service = SlotService(db)
    slots = await slot_service.get_available_slots(
        therapist_id=therapist_id,
        service_id=service_id,
        start_date=start_date,
        end_date=end_date,
    )

    return [
        PublicSlotResponse(
            start=slot.start.isoformat() + ("" if slot.start.tzinfo else "Z"),
            end=slot.end.isoformat() + ("" if slot.end.tzinfo else "Z"),
            spots_total=slot.max_capacity,
            spots_booked=slot.current_bookings,
            spots_left=slot.max_capacity - slot.current_bookings,
        )
        for slot in slots
    ]


@router.post(
    "/bookings",
    response_model=BookingCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a booking",
)
async def create_public_booking(
    booking_data: BookingCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new booking (in PENDING status).
    This is step 3 of the booking flow.

    The booking will be confirmed after payment is processed.
    """

    # Get service
    service_result = await db.execute(
        select(ServiceType).where(ServiceType.id == booking_data.service_id)
    )
    service = service_result.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # Get therapist
    therapist_result = await db.execute(
        select(User).where(User.id == booking_data.therapist_id)
    )
    therapist = therapist_result.scalar_one_or_none()
    if not therapist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    # slot_start is already validated as timezone-aware datetime by Pydantic
    slot_start = booking_data.slot_start

    # Verify slot is available
    slot_service = SlotService(db)
    is_available = await slot_service.is_slot_available(
        therapist_id=booking_data.therapist_id,
        service_id=booking_data.service_id,
        start_time=slot_start,
    )
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Selected slot is no longer available",
        )

    # Find or create patient
    # FEATURE: Discovery Auto-Conversion - check if email exists as Lead
    from app.db.models import Lead, LeadStatus
    from datetime import datetime as dt

    patient_result = await db.execute(
        select(Patient).where(
            Patient.email == booking_data.patient_email,
            Patient.organization_id == therapist.organization_id,
        )
    )
    patient = patient_result.scalar_one_or_none()

    if not patient:
        # Check if there's an existing Lead that we can auto-convert
        lead_result = await db.execute(
            select(Lead).where(
                Lead.email == booking_data.patient_email,
                Lead.organization_id == therapist.organization_id,
                Lead.converted_patient_id.is_(None),  # Not yet converted
            )
        )
        lead = lead_result.scalar_one_or_none()

        if lead:
            # AUTO-CONVERSION: Lead → Patient with Memory Handover
            profile_data = {
                "referral_source": lead.source,
                "source_details": lead.source_details,
                "initial_notes": lead.notes,  # Memory handover!
                "converted_from_lead": str(lead.id),
                "converted_at": dt.utcnow().isoformat(),
                "auto_converted_via": "public_booking",
            }
            patient = Patient(
                organization_id=therapist.organization_id,
                first_name=lead.first_name,
                last_name=lead.last_name,
                email=booking_data.patient_email,
                phone=lead.phone or booking_data.patient_phone,
                profile_data=profile_data,
            )
            db.add(patient)
            await db.flush()

            # Update Lead status to CONVERTED
            lead.status = LeadStatus.CONVERTED
            lead.converted_patient_id = patient.id
            lead.converted_at = dt.utcnow()
        else:
            # No Lead found - create Patient from scratch
            name_parts = booking_data.patient_name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""

            patient = Patient(
                organization_id=therapist.organization_id,
                first_name=first_name,
                last_name=last_name,
                email=booking_data.patient_email,
                phone=booking_data.patient_phone,
            )
            db.add(patient)
            await db.flush()  # Get patient.id

    # Calculate end time
    from datetime import timedelta

    slot_end = slot_start + timedelta(minutes=service.duration_minutes)

    # === CRITICAL: Transactional slot locking ===
    # 1. Lock the therapist record to serialize booking requests for this therapist.
    # This prevents race conditions where concurrent transactions see "count < capacity"
    # and both insert, causing overbooking (Phantom Read problem).
    await db.execute(
        select(User.id).where(User.id == booking_data.therapist_id).with_for_update()
    )

    # 2. Count existing overlapping bookings
    from sqlalchemy import func

    overlapping_bookings_result = await db.execute(
        select(func.count(Booking.id)).where(
            and_(
                Booking.therapist_id == booking_data.therapist_id,
                Booking.start_time < slot_end,
                Booking.end_time > slot_start,
                Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            )
        )
    )
    existing_count = overlapping_bookings_result.scalar() or 0

    # 3. Check capacity
    if existing_count >= service.capacity:
        # Slot is full
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This slot is fully booked ({existing_count}/{service.capacity}). Please choose another time.",
        )
    # === END: Transactional slot locking ===

    # Create booking
    booking = Booking(
        organization_id=therapist.organization_id,
        patient_id=patient.id,
        service_type_id=service.id,
        therapist_id=therapist.id,
        start_time=slot_start,
        end_time=slot_end,
        status=BookingStatus.PENDING,
        amount_paid=service.price,
        currency=service.currency,
        patient_notes=booking_data.patient_notes,
        target_timezone=booking_data.target_timezone,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    return BookingCreateResponse(
        booking_id=booking.id,
        status=booking.status.value,
        service_title=service.title,
        slot_start=slot_start.isoformat(),
        slot_end=slot_end.isoformat(),
        amount=service.price,
        currency=service.currency,
    )


@router.delete(
    "/bookings/{booking_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel a pending booking",
)
async def cancel_public_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Cancel a PENDING booking.

    This is called when a user navigates back from the payment step
    to release the reserved slot.
    """
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Only allow canceling PENDING bookings
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending bookings can be cancelled",
        )

    booking.status = BookingStatus.CANCELLED
    await db.commit()

    return None


@router.post(
    "/bookings/{booking_id}/confirm",
    status_code=status.HTTP_200_OK,
    summary="Confirm a free booking",
)
async def confirm_free_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm a free booking (price = 0) without payment.

    This endpoint skips the payment step for services with price 0€
    and directly confirms the booking.
    """
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Get service to verify it's actually free
    service_result = await db.execute(
        select(ServiceType).where(ServiceType.id == booking.service_type_id)
    )
    service = service_result.scalar_one_or_none()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # Security check: Only allow confirming free bookings
    if service.price > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint is only for free bookings. Use payment flow for paid services.",
        )

    # Only allow confirming PENDING bookings
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending bookings can be confirmed",
        )

    # Confirm the booking
    booking.status = BookingStatus.CONFIRMED
    await db.commit()

    return {"status": "confirmed", "booking_id": booking.id}
