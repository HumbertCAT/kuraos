"""Dashboard endpoints for therapist command center.

Provides aggregated, pre-computed data for the dashboard UI.
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.db.models import Booking, BookingStatus, Patient, ServiceType, User
from app.api.deps import get_current_user

router = APIRouter()


# ============================================================================
# Schemas
# ============================================================================


class BookingSummary(BaseModel):
    id: UUID
    start_time: datetime
    service_name: str


class PatientSummary(BaseModel):
    id: UUID
    name: str
    initials: str
    avatar_url: Optional[str] = None


class InsightData(BaseModel):
    available: bool
    type: str  # 'warning', 'info', 'success'
    message: str
    last_updated: Optional[str] = None


class FocusResponse(BaseModel):
    has_session: bool
    booking: Optional[BookingSummary] = None
    patient: Optional[PatientSummary] = None
    insight: Optional[InsightData] = None


# ============================================================================
# Helper Functions
# ============================================================================


def _get_initials(name: str) -> str:
    """Extract initials from full name."""
    parts = name.split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    elif len(parts) == 1:
        return parts[0][:2].upper()
    return "??"


def _format_time_ago(dt: datetime) -> str:
    """Format datetime as human-readable 'X ago' string."""
    now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.utcnow()
    diff = now - dt

    if diff < timedelta(hours=1):
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes}m ago"
    elif diff < timedelta(days=1):
        hours = int(diff.total_seconds() / 3600)
        return f"{hours}h ago"
    else:
        days = diff.days
        return f"{days}d ago"


def _calculate_insight_type(risk_score: int) -> str:
    """Determine insight severity from risk score."""
    if risk_score >= 70:
        return "warning"
    elif risk_score >= 40:
        return "info"
    return "success"


# ============================================================================
# Endpoints
# ============================================================================


@router.get("/focus", response_model=FocusResponse)
async def get_dashboard_focus(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the next upcoming session with patient insight for the dashboard.

    Returns the next booking (after now) with patient info and their
    last AletheIA insight for quick context before session.
    """
    now = datetime.utcnow()

    # Query: Next upcoming booking with patient eager loaded
    query = (
        select(Booking)
        .options(
            selectinload(Booking.patient),
            selectinload(Booking.service_type),
        )
        .where(
            Booking.organization_id == current_user.organization_id,
            Booking.start_time > now,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
        )
        .order_by(Booking.start_time.asc())
        .limit(1)
    )

    result = await db.execute(query)
    booking = result.scalar_one_or_none()

    # No upcoming sessions
    if not booking:
        return FocusResponse(has_session=False)

    patient = booking.patient
    service = booking.service_type

    # Build patient summary
    full_name = f"{patient.first_name} {patient.last_name}"
    patient_summary = PatientSummary(
        id=patient.id,
        name=full_name,
        initials=_get_initials(full_name),
        avatar_url=patient.profile_image_url,
    )

    # Build booking summary
    booking_summary = BookingSummary(
        id=booking.id,
        start_time=booking.start_time,
        service_name=service.title if service else "Session",
    )

    # Build insight from patient.last_insight_json
    insight_data = None
    if patient.last_insight_json:
        insight_json = patient.last_insight_json
        risk_score = insight_json.get("risk_score", 0)
        message = (
            insight_json.get("summary")
            or insight_json.get("topic")
            or "Análisis disponible"
        )

        # Truncate message if too long
        if len(message) > 60:
            message = message[:57] + "..."

        insight_data = InsightData(
            available=True,
            type=_calculate_insight_type(risk_score),
            message=message,
            last_updated=_format_time_ago(patient.last_insight_at)
            if patient.last_insight_at
            else None,
        )
    else:
        insight_data = InsightData(
            available=False,
            type="info",
            message="Sin análisis previos",
            last_updated=None,
        )

    return FocusResponse(
        has_session=True,
        booking=booking_summary,
        patient=patient_summary,
        insight=insight_data,
    )
