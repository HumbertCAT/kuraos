"""Booking management endpoints for therapists (authenticated)."""

from typing import Optional
from datetime import datetime, date
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.base import get_db
from app.db.models import Booking, BookingStatus, Patient, ServiceType
from app.api.deps import CurrentUser
from app.schemas.common import PaginatedResponse, ListMetadata

router = APIRouter()


# ============ SCHEMAS ============
from decimal import Decimal


class BookingListResponse(BaseModel):
    """Booking response for list view."""

    id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: str
    service_id: uuid.UUID
    service_title: str
    service_price: Decimal  # For pending payment calculations
    start_time: datetime
    end_time: datetime
    status: str
    amount_paid: Decimal
    currency: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ============ ENDPOINTS ============


@router.get(
    "/",
    response_model=PaginatedResponse[BookingListResponse],
    summary="List bookings",
)
async def list_bookings(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    service_id: Optional[uuid.UUID] = Query(None, description="Filter by service"),
    patient_id: Optional[uuid.UUID] = Query(None, description="Filter by patient"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by status"
    ),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date"),
    sort_by: Optional[str] = Query(
        None, description="Field to sort by (e.g. start_time)"
    ),
    order: Optional[str] = Query(
        "desc", regex="^(asc|desc)$", description="Sort order"
    ),
):
    """
    List all bookings for the current therapist.

    Supports filtering by:
    - service_id: Filter by specific service
    - patient_id: Filter by specific patient
    - status: Filter by booking status (pending, confirmed, cancelled)
    - start_date/end_date: Filter by date range
    """
    # Base query - only bookings for this therapist
    query = (
        select(
            Booking,
            Patient.first_name,
            Patient.last_name,
            ServiceType.title.label("service_title"),
            ServiceType.price.label("service_price"),
        )
        .join(Patient, Booking.patient_id == Patient.id)
        .join(ServiceType, Booking.service_type_id == ServiceType.id)
        .where(Booking.therapist_id == current_user.id)
    )

    # Apply filters
    if service_id:
        query = query.where(Booking.service_type_id == service_id)

    if patient_id:
        query = query.where(Booking.patient_id == patient_id)

    if status_filter:
        try:
            booking_status = BookingStatus(status_filter.upper())
            query = query.where(Booking.status == booking_status)
        except ValueError:
            pass  # Invalid status, ignore filter

    if start_date:
        start_dt = datetime.combine(start_date, datetime.min.time())
        query = query.where(Booking.start_time >= start_dt)

    if end_date:
        end_dt = datetime.combine(end_date, datetime.max.time())
        query = query.where(Booking.start_time <= end_dt)

    # Get absolute total count for therapist
    absolute_total_query = select(func.count(Booking.id)).where(
        Booking.therapist_id == current_user.id
    )
    absolute_total_result = await db.execute(absolute_total_query)
    total_count = int(absolute_total_result.scalar() or 0)

    # Get total count after filtering
    count_query = select(func.count(Booking.id)).select_from(query.subquery())
    filtered_result = await db.execute(count_query)
    filtered_count = int(filtered_result.scalar() or 0)

    # Calculate extra KPIs (e.g. Total Revenue from confirmed bookings)
    revenue_query = (
        select(func.sum(ServiceType.price))
        .select_from(Booking)
        .join(ServiceType, Booking.service_type_id == ServiceType.id)
        .where(
            Booking.therapist_id == current_user.id,
            Booking.status == BookingStatus.CONFIRMED,
        )
    )
    revenue_result = await db.execute(revenue_query)
    total_confirmed_revenue = float(revenue_result.scalar() or 0.0)

    # Apply pagination and sorting
    sort_field = Booking.start_time
    if sort_by == "start_time":
        sort_field = Booking.start_time
    elif sort_by == "created_at":
        sort_field = Booking.created_at

    if order == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())

    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    rows = result.all()

    data = [
        BookingListResponse(
            id=row.Booking.id,
            patient_id=row.Booking.patient_id,
            patient_name=f"{row.first_name} {row.last_name}".strip(),
            service_id=row.Booking.service_type_id,
            service_title=row.service_title,
            service_price=row.service_price or 0,
            start_time=row.Booking.start_time,
            end_time=row.Booking.end_time,
            status=row.Booking.status.value,
            amount_paid=row.Booking.amount_paid or 0,
            currency=row.Booking.currency or "EUR",
            created_at=row.Booking.created_at,
        )
        for row in rows
    ]

    return PaginatedResponse(
        data=data,
        meta=ListMetadata(
            total=total_count,
            filtered=filtered_count,
            page=page,
            page_size=per_page,
            extra={
                "total_confirmed_revenue": total_confirmed_revenue,
            },
        ),
    )


@router.patch(
    "/{booking_id}/status",
    summary="Update booking status",
)
async def update_booking_status(
    booking_id: uuid.UUID,
    new_status: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update the status of a booking (confirm, cancel, etc.)."""
    result = await db.execute(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.therapist_id == current_user.id,
        )
    )
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    try:
        booking.status = BookingStatus(new_status.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {new_status}",
        )

    await db.commit()
    return {"message": "Status updated", "new_status": booking.status.value}


@router.delete(
    "/{booking_id}",
    summary="Delete a booking",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_booking(
    booking_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Delete a booking."""
    result = await db.execute(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.therapist_id == current_user.id,
        )
    )
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Check if this booking has been rescheduled (has child bookings)
    child_check = await db.execute(
        select(Booking).where(Booking.rescheduled_from_id == booking_id)
    )
    if child_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar: esta reserva fue reprogramada. Elimina primero la nueva reserva.",
        )

    await db.delete(booking)
    await db.commit()
    return None


# ============ CANCEL / RESCHEDULE ============

import logging

logger = logging.getLogger(__name__)


class CancelBookingRequest(BaseModel):
    """Request to cancel a booking."""

    reason: Optional[str] = None


class RescheduleBookingRequest(BaseModel):
    """Request to reschedule a booking."""

    new_start_time: datetime
    reason: Optional[str] = None


@router.post(
    "/{booking_id}/cancel",
    summary="Cancel a booking",
)
async def cancel_booking(
    booking_id: uuid.UUID,
    request: CancelBookingRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Cancel a booking. Notifies patient via email/SMS."""
    from app.services.booking_management import BookingManagementService
    from app.services.notification_service import notification_service

    result = await db.execute(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.therapist_id == current_user.id,
        )
    )
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Get patient and service for notification
    patient_result = await db.execute(
        select(Patient).where(Patient.id == booking.patient_id)
    )
    patient = patient_result.scalar_one_or_none()

    svc_result = await db.execute(
        select(ServiceType).where(ServiceType.id == booking.service_type_id)
    )
    service_type = svc_result.scalar_one_or_none()

    # Cancel the booking
    service = BookingManagementService(db)
    await service.cancel_booking(booking, request.reason, by="therapist")

    # Send notification (non-blocking - failure doesn't revert cancellation)
    if patient and service_type:
        try:
            await notification_service.notify_booking_cancelled(
                booking=booking,
                patient=patient,
                therapist=current_user,
                service_title=service_type.title,
                reason=request.reason,
            )
        except Exception as e:
            logger.error(f"Failed to send cancellation notification: {e}")

    return {"message": "Reserva cancelada", "booking_id": str(booking.id)}


@router.post(
    "/{booking_id}/reschedule",
    summary="Reschedule a booking",
)
async def reschedule_booking(
    booking_id: uuid.UUID,
    request: RescheduleBookingRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Reschedule a booking. Notifies patient via email/SMS."""
    from app.services.booking_management import BookingManagementService
    from app.services.notification_service import notification_service
    from datetime import timedelta

    result = await db.execute(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.therapist_id == current_user.id,
        )
    )
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Get patient for notification
    patient_result = await db.execute(
        select(Patient).where(Patient.id == booking.patient_id)
    )
    patient = patient_result.scalar_one_or_none()

    # Get service for duration
    svc_result = await db.execute(
        select(ServiceType).where(ServiceType.id == booking.service_type_id)
    )
    service_type = svc_result.scalar_one_or_none()

    if not service_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    new_end_time = request.new_start_time + timedelta(
        minutes=service_type.duration_minutes
    )

    mgmt_service = BookingManagementService(db)
    new_booking = await mgmt_service.reschedule_booking(
        booking,
        new_start_time=request.new_start_time,
        new_end_time=new_end_time,
        reason=request.reason,
        by="therapist",
    )

    # Send notification (non-blocking - failure doesn't revert reschedule)
    if patient and service_type:
        try:
            await notification_service.notify_booking_rescheduled(
                old_booking=booking,
                new_booking=new_booking,
                patient=patient,
                therapist=current_user,
                service_title=service_type.title,
                reason=request.reason,
            )
        except Exception as e:
            logger.error(f"Failed to send reschedule notification: {e}")

    return {
        "message": "Reserva reprogramada",
        "old_booking_id": str(booking.id),
        "new_booking_id": str(new_booking.id),
    }
