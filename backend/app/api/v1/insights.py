"""
Patient Insights API

Provides AI-powered clinical insights for patients using AletheIA/Gemini.
Includes caching to avoid regenerating on every page load.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.db.base import get_db
from app.api.deps import get_current_user
from app.db.models import User

router = APIRouter(prefix="/insights", tags=["Insights"])

# Cache duration: insights are considered fresh for 1 hour
CACHE_DURATION_HOURS = 1


class AlertItem(BaseModel):
    type: str  # "critical", "warning", "info"
    message: str


class PatientInsightsResponse(BaseModel):
    summary: str
    alerts: List[AlertItem]
    suggestions: List[str]
    engagementScore: int
    riskLevel: str  # "low", "medium", "high"
    keyThemes: List[str]
    lastAnalysis: Optional[str] = None
    cached: bool = False


@router.post("/patient/{patient_id}", response_model=PatientInsightsResponse)
async def get_patient_insights(
    patient_id: UUID,
    refresh: bool = Query(False, description="Force regenerate insights"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI-powered clinical insights for a patient.

    Uses caching to avoid regenerating on every page load.
    Pass refresh=true to force regeneration.

    Uses AletheIA/Gemini to analyze:
    - Patient journey status
    - Recent clinical entries
    - Booking history

    Returns actionable insights for the therapist.
    """
    from sqlalchemy import select
    from app.db.models import Patient, ClinicalEntry, Booking
    from app.services.aletheia import get_aletheia

    # Fetch patient
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Check cache first (if not forcing refresh)
    if not refresh and patient.last_insight_json:
        cache_age = datetime.now(timezone.utc) - patient.last_insight_at.replace(
            tzinfo=timezone.utc
        )
        if cache_age < timedelta(hours=CACHE_DURATION_HOURS):
            # Return cached insights
            cached_data = patient.last_insight_json.copy()
            cached_data["cached"] = True
            cached_data["lastAnalysis"] = (
                patient.last_insight_at.isoformat() if patient.last_insight_at else None
            )
            return PatientInsightsResponse(**cached_data)

    # Fetch recent entries (last 5)
    entries_result = await db.execute(
        select(ClinicalEntry)
        .where(ClinicalEntry.patient_id == patient_id)
        .order_by(ClinicalEntry.created_at.desc())
        .limit(5)
    )
    entries = entries_result.scalars().all()

    # Fetch upcoming bookings
    bookings_result = await db.execute(
        select(Booking)
        .where(Booking.patient_id == patient_id)
        .order_by(Booking.start_time.desc())
        .limit(5)
    )
    bookings = bookings_result.scalars().all()

    # Get AletheIA service
    aletheia = get_aletheia()

    insights_data = None

    if aletheia:
        try:
            insights_data = await aletheia.generate_patient_insights(
                patient=patient,
                entries=entries,
                bookings=bookings,
            )
        except Exception as e:
            print(f"AletheIA error: {e}")
            # Will use fallback below

    # Fallback to rule-based if AI failed or unavailable
    if not insights_data:
        fallback_response = _generate_fallback_insights(patient, entries, bookings)
        insights_data = fallback_response.model_dump()

    # Save to cache
    patient.last_insight_json = {
        k: v for k, v in insights_data.items() if k not in ("cached", "lastAnalysis")
    }
    patient.last_insight_at = datetime.now(timezone.utc)
    await db.commit()

    # Add metadata
    insights_data["cached"] = False
    insights_data["lastAnalysis"] = patient.last_insight_at.isoformat()

    return PatientInsightsResponse(**insights_data)


def _generate_fallback_insights(patient, entries, bookings) -> PatientInsightsResponse:
    """Generate rule-based insights when AI is unavailable."""
    first_name = patient.first_name
    alerts = []
    suggestions = []
    key_themes = []

    # Analyze journey status
    if patient.journey_status:
        for journey, status in patient.journey_status.items():
            if status in ("BLOCKED_MEDICAL", "BLOCKED_HIGH_RISK"):
                alerts.append(
                    AlertItem(
                        type="critical",
                        message=f"⛔ Bloqueado en {journey.replace('_', ' ')} - Requiere revisión manual.",
                    )
                )
                key_themes.append("Bloqueo médico")
            elif status == "STAGNATION_ALERT":
                alerts.append(
                    AlertItem(
                        type="warning",
                        message="⚠️ Sin actividad reciente - Considera contactar para seguimiento.",
                    )
                )
                key_themes.append("Estancamiento")
            elif status == "AWAITING_PAYMENT":
                alerts.append(
                    AlertItem(
                        type="info",
                        message="💳 Pago pendiente - Recordatorio enviado automáticamente.",
                    )
                )
                key_themes.append("Pago pendiente")

    # Suggestions based on state
    if not entries:
        suggestions.append(
            "Añade una nota inicial sobre tus primeras impresiones del paciente."
        )

    if not bookings:
        suggestions.append(
            "Este paciente no tiene reservas activas. ¿Quizás programar una sesión?"
        )

    # Calculate engagement score
    engagement = 50
    if entries:
        engagement += 20
    if bookings:
        engagement += 15
    if any(a.type == "critical" for a in alerts):
        engagement -= 20
    if any(a.type == "warning" for a in alerts):
        engagement -= 10
    engagement = max(0, min(100, engagement))

    # Determine risk level
    risk = "low"
    if any(a.type == "critical" for a in alerts):
        risk = "high"
    elif any(a.type == "warning" for a in alerts):
        risk = "medium"

    # Generate summary
    if any(a.type == "critical" for a in alerts):
        summary = (
            f"{first_name} tiene una alerta crítica que requiere tu atención inmediata."
        )
    elif patient.journey_status:
        stage = list(patient.journey_status.values())[0].replace("_", " ").lower()
        summary = f"{first_name} está actualmente en fase de {stage}."
    else:
        summary = f"{first_name} es un paciente nuevo sin historial registrado."

    if not key_themes:
        key_themes = ["Nuevo paciente"]

    return PatientInsightsResponse(
        summary=summary,
        alerts=alerts,
        suggestions=suggestions[:3],
        engagementScore=engagement,
        riskLevel=risk,
        keyThemes=key_themes,
        lastAnalysis=datetime.utcnow().isoformat() if entries else None,
        cached=False,
    )


# ============ Daily Briefing (Chief of Staff) ============


class DailyBriefingResponse(BaseModel):
    """Response from daily briefing endpoint."""

    audio_url: Optional[str] = None
    text_script: str
    generated_at: str
    cached: bool = False


@router.get("/daily-briefing", response_model=DailyBriefingResponse)
async def get_daily_briefing(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get personalized daily audio briefing for the therapist.

    Returns:
    - audio_url: URL to mp3 file (if TTS available)
    - text_script: The briefing text
    - generated_at: When the briefing was generated
    - cached: Whether this was served from cache

    The briefing summarizes:
    - Today's appointments
    - High-risk patients with sessions today
    - Recent payments
    - Pending agent actions
    """
    from app.services.briefing_engine import get_daily_briefing as generate_briefing

    try:
        result = await generate_briefing(
            db=db,
            user_id=current_user.id,
            organization_id=current_user.organization_id,
        )

        return DailyBriefingResponse(
            audio_url=result.get("audio_url"),
            text_script=result.get("text_script", ""),
            generated_at=result.get("generated_at", ""),
            cached=result.get("cached", False),
        )

    except Exception as e:
        import logging

        logging.error(f"Daily briefing generation failed: {e}")
        raise HTTPException(
            status_code=500, detail="Error generating daily briefing. Please try again."
        )
