"""Availability management endpoints for therapist scheduling."""

from typing import Optional
from datetime import datetime, date
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.base import get_db
from app.db.models import (
    AvailabilityBlock,
    TimeOff,
    User,
    SpecificAvailability,
    AvailabilitySchedule,
)
from app.api.deps import CurrentUser
from app.services.slots import SlotService, TimeSlot

router = APIRouter()


# ============ SCHEMAS ============


class AvailabilityBlockCreate(BaseModel):
    """Schema for creating a recurring availability block."""

    schedule_id: uuid.UUID = Field(..., description="ID of the availability schedule")
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str = Field(
        ..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$", description="HH:MM format"
    )
    end_time: str = Field(
        ..., pattern=r"^([01]\d|2[0-3]):([0-5]\d)$", description="HH:MM format"
    )
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v, info):
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("end_time must be after start_time")
        return v


class AvailabilityBlockResponse(BaseModel):
    """Schema for availability block response."""

    id: uuid.UUID
    user_id: uuid.UUID
    schedule_id: uuid.UUID
    day_of_week: int
    start_time: str
    end_time: str
    effective_from: datetime
    effective_until: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class TimeOffCreate(BaseModel):
    """Schema for creating a time-off block (exception)."""

    start_datetime: datetime
    end_datetime: datetime
    reason: Optional[str] = Field(None, max_length=255)
    schedule_id: Optional[uuid.UUID] = Field(
        None, description="NULL = applies to ALL schedules"
    )

    @field_validator("end_datetime")
    @classmethod
    def end_after_start(cls, v, info):
        start = info.data.get("start_datetime")
        if start and v <= start:
            raise ValueError("end_datetime must be after start_datetime")
        return v


class TimeOffResponse(BaseModel):
    """Schema for time-off response."""

    id: uuid.UUID
    user_id: uuid.UUID
    schedule_id: Optional[uuid.UUID]
    start_datetime: datetime
    end_datetime: datetime
    reason: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SpecificAvailabilityCreate(BaseModel):
    """Schema for creating a specific availability block."""

    start_datetime: datetime
    end_datetime: datetime
    schedule_id: Optional[uuid.UUID] = Field(
        None, description="NULL = applies to ALL schedules"
    )

    @field_validator("end_datetime")
    @classmethod
    def end_after_start(cls, v, info):
        start = info.data.get("start_datetime")
        if start and v <= start:
            raise ValueError("end_datetime must be after start_datetime")
        return v


class SpecificAvailabilityResponse(BaseModel):
    """Schema for specific availability response."""

    id: uuid.UUID
    user_id: uuid.UUID
    schedule_id: Optional[uuid.UUID]
    start_datetime: datetime
    end_datetime: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# ============ AVAILABILITY BLOCK ENDPOINTS ============


@router.get(
    "/blocks",
    response_model=list[AvailabilityBlockResponse],
    summary="List availability blocks",
)
async def list_availability_blocks(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    List all recurring availability blocks for the current therapist.
    """
    result = await db.execute(
        select(AvailabilityBlock)
        .where(AvailabilityBlock.user_id == current_user.id)
        .order_by(AvailabilityBlock.day_of_week, AvailabilityBlock.start_time)
    )
    blocks = result.scalars().all()
    return [AvailabilityBlockResponse.model_validate(b) for b in blocks]


@router.post(
    "/blocks",
    response_model=AvailabilityBlockResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create availability block",
)
async def create_availability_block(
    block_data: AvailabilityBlockCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new recurring availability block for the current therapist.
    """
    # Verify schedule belongs to user
    schedule_result = await db.execute(
        select(AvailabilitySchedule).where(
            AvailabilitySchedule.id == block_data.schedule_id,
            AvailabilitySchedule.user_id == current_user.id,
        )
    )
    schedule = schedule_result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found or does not belong to you",
        )

    block = AvailabilityBlock(
        user_id=current_user.id,
        schedule_id=block_data.schedule_id,
        day_of_week=block_data.day_of_week,
        start_time=block_data.start_time,
        end_time=block_data.end_time,
        effective_from=block_data.effective_from or datetime.utcnow(),
        effective_until=block_data.effective_until,
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return AvailabilityBlockResponse.model_validate(block)


@router.delete(
    "/blocks/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete availability block",
)
async def delete_availability_block(
    block_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a recurring availability block.
    """
    result = await db.execute(
        select(AvailabilityBlock).where(
            AvailabilityBlock.id == block_id,
            AvailabilityBlock.user_id == current_user.id,
        )
    )
    block = result.scalar_one_or_none()

    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability block not found",
        )

    await db.delete(block)
    await db.commit()
    return None


# ============ TIME OFF ENDPOINTS ============


@router.get(
    "/time-off", response_model=list[TimeOffResponse], summary="List time-off blocks"
)
async def list_time_off(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    upcoming_only: bool = Query(True, description="Only show future time-off"),
):
    """
    List all time-off blocks for the current therapist.
    """
    query = select(TimeOff).where(TimeOff.user_id == current_user.id)

    if upcoming_only:
        query = query.where(TimeOff.end_datetime >= datetime.utcnow())

    query = query.order_by(TimeOff.start_datetime)
    result = await db.execute(query)
    blocks = result.scalars().all()
    return [TimeOffResponse.model_validate(b) for b in blocks]


@router.post(
    "/time-off",
    response_model=TimeOffResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create time-off block",
)
async def create_time_off(
    time_off_data: TimeOffCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new time-off block (vacation, appointment, etc.).
    schedule_id=None means it applies to ALL schedules.
    """
    # If schedule_id provided, verify it belongs to user
    if time_off_data.schedule_id:
        schedule_result = await db.execute(
            select(AvailabilitySchedule).where(
                AvailabilitySchedule.id == time_off_data.schedule_id,
                AvailabilitySchedule.user_id == current_user.id,
            )
        )
        if not schedule_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Schedule not found or does not belong to you",
            )

    time_off = TimeOff(
        user_id=current_user.id,
        schedule_id=time_off_data.schedule_id,
        start_datetime=time_off_data.start_datetime,
        end_datetime=time_off_data.end_datetime,
        reason=time_off_data.reason,
    )
    db.add(time_off)
    await db.commit()
    await db.refresh(time_off)
    return TimeOffResponse.model_validate(time_off)


@router.delete(
    "/time-off/{time_off_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete time-off block",
)
async def delete_time_off(
    time_off_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a time-off block.
    """
    result = await db.execute(
        select(TimeOff).where(
            TimeOff.id == time_off_id,
            TimeOff.user_id == current_user.id,
        )
    )
    time_off = result.scalar_one_or_none()

    if not time_off:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time-off block not found",
        )

    await db.delete(time_off)
    await db.commit()
    return None


# ============ SPECIFIC AVAILABILITY ENDPOINTS ============


@router.get(
    "/specific",
    response_model=list[SpecificAvailabilityResponse],
    summary="List specific availability",
)
async def list_specific_availability(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    upcoming_only: bool = Query(True, description="Only show future availability"),
):
    """
    List all specific availability (overrides) for the current therapist.
    """
    query = select(SpecificAvailability).where(
        SpecificAvailability.user_id == current_user.id
    )

    if upcoming_only:
        query = query.where(SpecificAvailability.end_datetime >= datetime.utcnow())

    query = query.order_by(SpecificAvailability.start_datetime)
    result = await db.execute(query)
    blocks = result.scalars().all()
    return [SpecificAvailabilityResponse.model_validate(b) for b in blocks]


@router.post(
    "/specific",
    response_model=SpecificAvailabilityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create specific availablity",
)
async def create_specific_availability(
    block_data: SpecificAvailabilityCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new specific availability block (e.g. for a retreat).
    schedule_id=None means it applies to ALL schedules.
    """
    # If schedule_id provided, verify it belongs to user
    if block_data.schedule_id:
        schedule_result = await db.execute(
            select(AvailabilitySchedule).where(
                AvailabilitySchedule.id == block_data.schedule_id,
                AvailabilitySchedule.user_id == current_user.id,
            )
        )
        if not schedule_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Schedule not found or does not belong to you",
            )

    block = SpecificAvailability(
        user_id=current_user.id,
        schedule_id=block_data.schedule_id,
        start_datetime=block_data.start_datetime,
        end_datetime=block_data.end_datetime,
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return SpecificAvailabilityResponse.model_validate(block)


@router.delete(
    "/specific/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete specific availability",
)
async def delete_specific_availability(
    block_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a specific availability block.
    """
    result = await db.execute(
        select(SpecificAvailability).where(
            SpecificAvailability.id == block_id,
            SpecificAvailability.user_id == current_user.id,
        )
    )
    block = result.scalar_one_or_none()

    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specific availability block not found",
        )

    await db.delete(block)
    await db.commit()
    return None


# ============ SLOTS ENDPOINT ============


class SlotResponse(BaseModel):
    """Schema for a time slot."""

    start: datetime
    end: datetime
    therapist_id: uuid.UUID


@router.get("/slots", response_model=list[SlotResponse], summary="Get available slots")
async def get_available_slots(
    service_id: uuid.UUID = Query(..., description="Service to book"),
    therapist_id: uuid.UUID = Query(..., description="Therapist to book with"),
    start_date: date = Query(..., description="Start of date range (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End of date range (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get available time slots for a therapist and service.

    This is a PUBLIC endpoint (no auth required) for the booking widget.
    Returns slots that are:
    - Within the therapist's availability blocks
    - Not blocked by time-off
    - Not already booked
    """
    # Validate therapist exists
    therapist_result = await db.execute(select(User).where(User.id == therapist_id))
    if not therapist_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Therapist not found",
        )

    slot_service = SlotService(db)
    slots = await slot_service.get_available_slots(
        therapist_id=therapist_id,
        service_id=service_id,
        start_date=start_date,
        end_date=end_date,
    )

    return [
        SlotResponse(
            start=slot.start,
            end=slot.end,
            therapist_id=slot.therapist_id,
        )
        for slot in slots
    ]
