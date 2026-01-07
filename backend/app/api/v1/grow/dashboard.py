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
from app.db.models import Booking, BookingStatus, User
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


def _calculate_insight_type(risk_score: float) -> str:
    """Determine insight severity from risk score (handles 0-1 and 0-100 scales)."""
    # 0.0 to 1.0 Scale (New Cortex Standard)
    if 0.0 < risk_score <= 1.0:
        if risk_score > 0.6:
            return "warning"
        elif risk_score > 0.4:
            return "info"
        return "success"

    # 0 to 100 Scale (Legacy)
    if risk_score >= 70:
        return "warning"
    elif risk_score >= 40:
        return "info"
    return "success"


# ============================================================================
# Endpoints
# ============================================================================


# ============================================================================
# Credits Balance
# ============================================================================


class CreditsBalanceResponse(BaseModel):
    credits_used: float  # KC consumed this month
    credits_limit: float  # KC limit based on tier
    usage_percent: float  # 0-100
    tier: str  # BUILDER, PRO, CENTER
    is_low_balance: bool  # True if usage > 80%


@router.get("/credits/balance", response_model=CreditsBalanceResponse)
async def get_credits_balance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current organization's Kura Credits balance for the billing period.

    Returns:
        - credits_used: Total KC consumed this month
        - credits_limit: Monthly KC limit based on tier
        - usage_percent: Percentage of limit used (0-100)
        - is_low_balance: True if usage exceeds 80%
    """
    from sqlalchemy import func
    from app.db.models import AiUsageLog, Organization
    from app.services.settings import get_setting

    org_id = current_user.organization_id

    # Get organization tier
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    tier = org.tier if org and org.tier else "BUILDER"

    # Get credit rate and tier limit
    credit_rate = await get_setting(db, "KURA_CREDIT_RATE", default=1000)
    spend_limit_eur = await get_setting(db, f"TIER_AI_SPEND_LIMIT_{tier}", default=10)
    credits_limit = float(spend_limit_eur) * float(
        credit_rate
    )  # Convert EUR limit to KC

    # Calculate usage for current month
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    usage_result = await db.execute(
        select(func.sum(AiUsageLog.cost_user_credits)).where(
            AiUsageLog.organization_id == org_id,
            AiUsageLog.created_at >= month_start,
            AiUsageLog.cost_user_credits >= 0,  # Exclude grants (negative values)
        )
    )
    credits_used = float(usage_result.scalar_one() or 0)

    usage_percent = (credits_used / credits_limit * 100) if credits_limit > 0 else 0

    return CreditsBalanceResponse(
        credits_used=round(credits_used, 2),
        credits_limit=round(credits_limit, 2),
        usage_percent=round(usage_percent, 1),
        tier=tier,
        is_low_balance=usage_percent > 80,
    )


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

        # v1.5.9: Robust mapping for both legacy and Cortex formats
        # We handle cases where data might be nested or flat
        metrics = (
            insight_json.get("metrics", {})
            if isinstance(insight_json.get("metrics"), dict)
            else {}
        )
        soap = (
            insight_json.get("soap_note", {})
            if isinstance(insight_json.get("soap_note"), dict)
            else {}
        )

        # Risk Score extraction
        risk_score = metrics.get("risk_score") or insight_json.get("risk_score") or 0.0

        # Message/Brief extraction
        message = (
            soap.get("summary")
            or soap.get("assessment")
            or soap.get("subjective")
            or insight_json.get("summary")
            or insight_json.get("topic")
            or "Análisis disponible"
        )

        # Truncate message if too long for the Focus Card UI
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
