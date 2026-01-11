"""Patient Monitoring API Endpoints.

Provides WhatsApp conversation analysis data for the frontend:
- GET /patients/{id}/monitoring/analyses - Daily analyses list
- GET /patients/{id}/monitoring/messages - Raw message logs
- POST /admin/run-conversation-analyzer - Manual trigger (demo)
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.db.models import (
    User,
    Patient,
    MessageLog,
    DailyConversationAnalysis,
)

router = APIRouter(prefix="/patients", tags=["Monitoring"])


# ============ Schemas ============


class DailyAnalysisResponse(BaseModel):
    """Response for a single daily analysis."""

    id: UUID
    date: datetime
    summary: str
    sentiment_score: float
    emotional_state: Optional[str]
    risk_flags: list
    suggestion: Optional[str]
    message_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysesListResponse(BaseModel):
    """Response for list of analyses."""

    analyses: list[DailyAnalysisResponse]


class MessageLogResponse(BaseModel):
    """Response for a single message."""

    id: UUID
    direction: str
    content: str
    timestamp: datetime
    status: str

    class Config:
        from_attributes = True


class MessagesListResponse(BaseModel):
    """Response for list of messages."""

    messages: list[MessageLogResponse]


# ============ Endpoints ============


@router.get("/{patient_id}/monitoring/analyses", response_model=AnalysesListResponse)
async def get_patient_analyses(
    patient_id: UUID,
    days: int = Query(default=7, le=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get daily conversation analyses for a patient."""
    from sqlalchemy import func

    # Verify patient belongs to org
    patient_result = await db.execute(
        select(Patient).where(
            and_(
                Patient.id == patient_id,
                Patient.organization_id == current_user.organization_id,
            )
        )
    )
    if not patient_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get analyses from last N days
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(DailyConversationAnalysis)
        .where(
            and_(
                DailyConversationAnalysis.patient_id == patient_id,
                DailyConversationAnalysis.date >= since,
            )
        )
        .order_by(DailyConversationAnalysis.date.desc())
    )
    analyses = result.scalars().all()

    # Get real-time message counts per day
    enriched = []
    for a in analyses:
        # Count messages for this analysis date (same day)
        day_start = a.date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count_result = await db.execute(
            select(func.count(MessageLog.id)).where(
                and_(
                    MessageLog.patient_id == patient_id,
                    MessageLog.timestamp >= day_start,
                    MessageLog.timestamp < day_end,
                )
            )
        )
        real_count = count_result.scalar() or a.message_count

        enriched.append(
            DailyAnalysisResponse(
                id=a.id,
                date=a.date,
                summary=a.summary,
                sentiment_score=a.sentiment_score,
                emotional_state=a.emotional_state,
                risk_flags=a.risk_flags,
                suggestion=a.suggestion,
                message_count=real_count,
                created_at=a.created_at,
            )
        )

    return {"analyses": enriched}


@router.get("/{patient_id}/monitoring/messages", response_model=MessagesListResponse)
async def get_patient_messages(
    patient_id: UUID,
    days: int = Query(default=7, le=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get raw WhatsApp messages for a patient.

    TD-115: Also includes messages linked to patient's identity_id,
    which covers pre-conversion Lead messages.
    """
    from sqlalchemy import or_

    # Verify patient belongs to org and get identity_id
    patient_result = await db.execute(
        select(Patient).where(
            and_(
                Patient.id == patient_id,
                Patient.organization_id == current_user.organization_id,
            )
        )
    )
    patient = patient_result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get messages from last N days
    since = datetime.utcnow() - timedelta(days=days)

    # TD-115: Query by patient_id OR identity_id (for Lead history)
    # IMPORTANT: Only add identity_id clause if patient has one to prevent NULL matches
    clauses = [MessageLog.patient_id == patient_id]
    if patient.identity_id:
        clauses.append(MessageLog.identity_id == patient.identity_id)

    result = await db.execute(
        select(MessageLog)
        .where(
            and_(
                or_(*clauses),
                MessageLog.timestamp >= since,
            )
        )
        .order_by(MessageLog.timestamp.desc())
    )
    messages = result.scalars().all()

    return {
        "messages": [
            MessageLogResponse(
                id=m.id,
                direction=m.direction.value,
                content=m.content,
                timestamp=m.timestamp,
                status=m.status,
            )
            for m in messages
        ]
    }


# ============ Global Risk Alerts (Dashboard) ============


class RiskAlertResponse(BaseModel):
    """Risk alert for dashboard."""

    id: UUID
    patient_id: UUID
    patient_name: str
    date: datetime
    summary: str
    sentiment_score: float
    emotional_state: Optional[str]
    risk_flags: list
    suggestion: Optional[str]

    class Config:
        from_attributes = True


class RiskAlertsListResponse(BaseModel):
    """Response for list of risk alerts."""

    alerts: list[RiskAlertResponse]


# Create a separate router for organization-level monitoring
org_router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


@org_router.get("/risk-alerts", response_model=RiskAlertsListResponse)
async def get_organization_risk_alerts(
    hours: int = Query(default=24, le=168),  # Max 1 week
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all risk alerts for the organization from last N hours.

    Used by dashboard to show critical WhatsApp alerts in AletheIA Suggestions.
    Returns analyses that have non-empty risk_flags.
    """
    from sqlalchemy.orm import joinedload

    since = datetime.utcnow() - timedelta(hours=hours)

    # Get analyses with risks, joined with patient for name
    result = await db.execute(
        select(DailyConversationAnalysis)
        .join(Patient, DailyConversationAnalysis.patient_id == Patient.id)
        .where(
            and_(
                DailyConversationAnalysis.organization_id
                == current_user.organization_id,
                DailyConversationAnalysis.date >= since,
                DailyConversationAnalysis.risk_flags != [],  # Only with risks
            )
        )
        .order_by(DailyConversationAnalysis.date.desc())
    )
    analyses = result.scalars().all()

    # Fetch patient names
    patient_ids = [a.patient_id for a in analyses]
    if patient_ids:
        patients_result = await db.execute(
            select(Patient).where(Patient.id.in_(patient_ids))
        )
        patients = {p.id: p for p in patients_result.scalars().all()}
    else:
        patients = {}

    alerts = []
    for a in analyses:
        patient = patients.get(a.patient_id)
        patient_name = (
            f"{patient.first_name} {patient.last_name}" if patient else "Paciente"
        )

        alerts.append(
            RiskAlertResponse(
                id=a.id,
                patient_id=a.patient_id,
                patient_name=patient_name,
                date=a.date,
                summary=a.summary,
                sentiment_score=a.sentiment_score,
                emotional_state=a.emotional_state,
                risk_flags=a.risk_flags,
                suggestion=a.suggestion,
            )
        )

    return {"alerts": alerts}
