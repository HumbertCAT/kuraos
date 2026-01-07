"""Availability Schedules API endpoints.

CRUD operations for managing multiple availability schedules per therapist.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.api.deps import get_current_user
from app.db.models import User, AvailabilitySchedule, AvailabilityBlock

router = APIRouter()


# ============ SCHEMAS ============


class ScheduleCreate(BaseModel):
    name: str


class ScheduleUpdate(BaseModel):
    name: str


class ScheduleResponse(BaseModel):
    id: UUID
    name: str
    is_default: bool
    blocks_count: int = 0

    class Config:
        from_attributes = True


# ============ ENDPOINTS ============


@router.get("/", response_model=list[ScheduleResponse])
async def list_schedules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all availability schedules for the current user."""
    result = await db.execute(
        select(AvailabilitySchedule)
        .where(AvailabilitySchedule.user_id == current_user.id)
        .order_by(AvailabilitySchedule.is_default.desc(), AvailabilitySchedule.name)
    )
    schedules = result.scalars().all()

    # Count blocks per schedule
    response = []
    for schedule in schedules:
        blocks_result = await db.execute(
            select(AvailabilityBlock).where(
                AvailabilityBlock.schedule_id == schedule.id
            )
        )
        blocks_count = len(blocks_result.scalars().all())
        response.append(
            ScheduleResponse(
                id=schedule.id,
                name=schedule.name,
                is_default=schedule.is_default,
                blocks_count=blocks_count,
            )
        )

    return response


@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    data: ScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new availability schedule."""
    # Check if user has any schedules - first one is default
    existing = await db.execute(
        select(AvailabilitySchedule).where(
            AvailabilitySchedule.user_id == current_user.id
        )
    )
    is_first = len(existing.scalars().all()) == 0

    schedule = AvailabilitySchedule(
        user_id=current_user.id,
        name=data.name,
        is_default=is_first,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)

    return ScheduleResponse(
        id=schedule.id,
        name=schedule.name,
        is_default=schedule.is_default,
        blocks_count=0,
    )


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: UUID,
    data: ScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an availability schedule's name."""
    result = await db.execute(
        select(AvailabilitySchedule).where(
            AvailabilitySchedule.id == schedule_id,
            AvailabilitySchedule.user_id == current_user.id,
        )
    )
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    schedule.name = data.name
    await db.commit()
    await db.refresh(schedule)

    # Count blocks
    blocks_result = await db.execute(
        select(AvailabilityBlock).where(AvailabilityBlock.schedule_id == schedule.id)
    )
    blocks_count = len(blocks_result.scalars().all())

    return ScheduleResponse(
        id=schedule.id,
        name=schedule.name,
        is_default=schedule.is_default,
        blocks_count=blocks_count,
    )


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an availability schedule (cannot delete default)."""
    result = await db.execute(
        select(AvailabilitySchedule).where(
            AvailabilitySchedule.id == schedule_id,
            AvailabilitySchedule.user_id == current_user.id,
        )
    )
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    if schedule.is_default:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete default schedule. Set another as default first.",
        )

    await db.delete(schedule)
    await db.commit()


@router.post("/{schedule_id}/set-default", response_model=ScheduleResponse)
async def set_default_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set a schedule as the default for this user."""
    # Get the schedule
    result = await db.execute(
        select(AvailabilitySchedule).where(
            AvailabilitySchedule.id == schedule_id,
            AvailabilitySchedule.user_id == current_user.id,
        )
    )
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Unset current default
    all_schedules = await db.execute(
        select(AvailabilitySchedule).where(
            AvailabilitySchedule.user_id == current_user.id
        )
    )
    for s in all_schedules.scalars().all():
        s.is_default = s.id == schedule_id

    await db.commit()
    await db.refresh(schedule)

    # Count blocks
    blocks_result = await db.execute(
        select(AvailabilityBlock).where(AvailabilityBlock.schedule_id == schedule.id)
    )
    blocks_count = len(blocks_result.scalars().all())

    return ScheduleResponse(
        id=schedule.id,
        name=schedule.name,
        is_default=schedule.is_default,
        blocks_count=blocks_count,
    )
