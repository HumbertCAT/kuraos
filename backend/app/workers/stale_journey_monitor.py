"""Stale Journey Monitor - Temporal Engine for v0.9.2.

This worker runs periodically (via APScheduler) to detect patients
stuck in a journey stage for too long and trigger reminder actions.

Philosophy: The system should "persist" - actively pursuing patients
who haven't completed their journey (payment, feedback, etc.)
"""

import logging
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import SystemEventLog, EventStatus
from app.services.email import email_service
from app.schemas.automation_types import TriggerEvent

logger = logging.getLogger(__name__)


# ============ STALE JOURNEY RULES ============
# These rules define when a patient is "stuck" and needs a reminder.
# Covers all 4 demo archetypes.

STALE_RULES = [
    # === PSYCHEDELIC THERAPY (retreat_ibiza_2025) ===
    {
        "journey_key": "retreat_ibiza_2025",
        "stage": "AWAITING_PAYMENT",
        "max_hours": 48,
        "action": "send_payment_reminder",
        "email_subject": "⏰ Recordatorio: Completa tu reserva del Retiro",
    },
    {
        "journey_key": "retreat_ibiza_2025",
        "stage": "PREPARATION_PHASE",
        "max_hours": 168,  # 7 days
        "action": "send_preparation_reminder",
        "email_subject": "🧘 Recordatorio: Tu preparación pre-retiro",
    },
    # === ASTROLOGY (carta_natal) ===
    {
        "journey_key": "carta_natal",
        "stage": "AWAITING_BIRTH_DATA",
        "max_hours": 24,
        "action": "send_data_reminder",
        "email_subject": "📅 Necesitamos tus datos de nacimiento",
    },
    # === COACHING (despertar_8s) ===
    {
        "journey_key": "despertar_8s",
        "stage": "ONBOARDING",
        "max_hours": 168,  # 7 days without activity in onboarding
        "action": "send_engagement_reminder",
        "email_subject": "💪 ¿Todo bien? Te echamos de menos",
    },
    {
        "journey_key": "despertar_8s",
        "stage": "DEEP_DIVE",
        "max_hours": 336,  # 14 days
        "action": "send_stagnation_alert",
        "email_subject": "⚠️ Llevas tiempo sin avanzar - ¿Hablamos?",
    },
    # === YOGA (yoga_urban_om) ===
    {
        "journey_key": "yoga_urban_om",
        "stage": "AWAITING_WAIVER",
        "max_hours": 24,
        "action": "send_waiver_reminder",
        "email_subject": "📝 Firma tu waiver antes de la clase",
    },
    # === LEGACY (intake - for older data) ===
    {
        "journey_key": "intake",
        "stage": "AWAITING_PAYMENT",
        "max_hours": 48,
        "action": "send_payment_reminder",
        "email_subject": "⏰ Recordatorio: Completa tu reserva",
    },
]


# ============ CORE WORKER FUNCTION ============


async def check_stale_journeys(db: AsyncSession) -> dict:
    """
    Find patients stuck in a stage for too long and trigger actions.

    This is called by APScheduler every hour (or manually via admin endpoint).

    Returns:
        dict with counts of patients processed per rule
    """
    results = {"processed": 0, "rules_triggered": {}}

    for rule in STALE_RULES:
        # Find patients stuck in this stage beyond the threshold
        stale_patients = await _find_stale_patients(
            db=db,
            journey_key=rule["journey_key"],
            stage=rule["stage"],
            max_hours=rule["max_hours"],
        )

        rule_key = f"{rule['journey_key']}.{rule['stage']}"
        results["rules_triggered"][rule_key] = len(stale_patients)

        for patient_data in stale_patients:
            try:
                await _execute_stale_action(
                    db=db,
                    patient_data=patient_data,
                    rule=rule,
                )
                results["processed"] += 1
            except Exception as e:
                logger.error(
                    f"Failed to process stale patient {patient_data['id']}: {e}"
                )

    logger.info(f"Stale journey check completed: {results}")
    return results


async def _find_stale_patients(
    db: AsyncSession,
    journey_key: str,
    stage: str,
    max_hours: int,
) -> list[dict]:
    """
    Query patients who have been in a specific stage for > max_hours.

    Uses journey_logs to determine when they entered this stage.
    Falls back to checking if no reminder was sent recently.
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=max_hours)

    # Query: Find patients in this stage whose last transition was before cutoff
    # AND who haven't received a reminder for this stage recently (24h)
    query = text("""
        WITH latest_transitions AS (
            SELECT DISTINCT ON (patient_id)
                patient_id,
                to_stage,
                changed_at
            FROM journey_logs
            WHERE journey_key = :journey_key
            ORDER BY patient_id, changed_at DESC
        ),
        recent_reminders AS (
            SELECT entity_id as patient_id
            FROM system_events
            WHERE event_type = 'JOURNEY_STAGE_TIMEOUT'
            AND payload->>'journey_key' = :journey_key
            AND payload->>'stage' = :stage
            AND created_at > NOW() - INTERVAL '24 hours'
        )
        SELECT 
            p.id,
            p.first_name,
            p.last_name,
            p.email,
            p.organization_id,
            lt.changed_at as entered_stage_at
        FROM patients p
        JOIN latest_transitions lt ON p.id = lt.patient_id
        LEFT JOIN recent_reminders rr ON p.id = rr.patient_id
        WHERE lt.to_stage = :stage
        AND lt.changed_at < :cutoff_time
        AND rr.patient_id IS NULL
        AND p.email IS NOT NULL
    """)

    result = await db.execute(
        query,
        {
            "journey_key": journey_key,
            "stage": stage,
            "cutoff_time": cutoff_time,
        },
    )

    rows = result.fetchall()
    return [
        {
            "id": row.id,
            "first_name": row.first_name,
            "last_name": row.last_name,
            "email": row.email,
            "organization_id": row.organization_id,
            "entered_stage_at": row.entered_stage_at,
        }
        for row in rows
    ]


async def _execute_stale_action(
    db: AsyncSession,
    patient_data: dict,
    rule: dict,
):
    """
    Execute the action for a stale patient (send reminder email).
    Logs a JOURNEY_STAGE_TIMEOUT event for audit.
    """
    from app.core.config import settings

    patient_id = patient_data["id"]
    organization_id = patient_data["organization_id"]

    # 1. Log the timeout event
    event = SystemEventLog(
        organization_id=organization_id,
        event_type=TriggerEvent.JOURNEY_STAGE_TIMEOUT.value
        if hasattr(TriggerEvent, "JOURNEY_STAGE_TIMEOUT")
        else "JOURNEY_STAGE_TIMEOUT",
        payload={
            "patient_id": str(patient_id),
            "journey_key": rule["journey_key"],
            "stage": rule["stage"],
            "hours_stale": rule["max_hours"],
            "action": rule["action"],
        },
        status=EventStatus.PROCESSED,
        entity_type="patient",
        entity_id=patient_id,
    )
    db.add(event)

    # 2. Send reminder email based on action type
    patient_name = f"{patient_data['first_name']} {patient_data['last_name']}"
    email_subject = rule.get("email_subject", "⏰ Recordatorio de TherapistOS")

    # Build appropriate link based on action
    action = rule["action"]
    if action in ["send_payment_reminder"]:
        action_link = f"{settings.FRONTEND_URL}/public/booking?patient={patient_id}"
        link_text = "Completar Reserva"
    elif action in ["send_waiver_reminder"]:
        action_link = f"{settings.FRONTEND_URL}/public/waiver?patient={patient_id}"
        link_text = "Firmar Waiver"
    elif action in ["send_data_reminder"]:
        action_link = f"{settings.FRONTEND_URL}/public/form?patient={patient_id}"
        link_text = "Completar Formulario"
    else:
        # Generic reminder (engagement, stagnation alerts)
        action_link = f"{settings.FRONTEND_URL}/contact"
        link_text = "Contactar"

    await email_service.send_automation_email(
        to_email=patient_data["email"],
        to_name=patient_name,
        subject=email_subject,
        template_type="patient_accepted",  # Reuse existing template for now
        context={
            "name": patient_name,
            "payment_link": action_link,  # Template uses 'payment_link' for CTA
        },
    )

    logger.info(
        f"Stale action executed for patient {patient_id}: {action} ({rule['journey_key']}.{rule['stage']})"
    )

    await db.commit()


# ============ LEAD STAGNATION MONITOR ============


async def check_stale_leads(db: AsyncSession) -> dict:
    """
    Find leads that have been inactive for too long and trigger LEAD_STAGED_TIMEOUT.

    This enables the "Agente Fantasma" to send follow-up messages to cold leads.

    Rules:
    - Leads with status IN (NEW, CONTACTED, QUALIFIED)
    - updated_at < NOW - 48 hours
    - No LEAD_STAGED_TIMEOUT event for this lead in past 24h (anti-spam)

    Returns:
        dict with count of stale leads processed
    """
    from app.db.models import Lead, LeadStatus

    STALE_THRESHOLD_HOURS = 48  # Lead considered stale after 48h without activity
    REMINDER_COOLDOWN_HOURS = 24  # Don't spam - wait 24h between timeout events

    cutoff_time = datetime.utcnow() - timedelta(hours=STALE_THRESHOLD_HOURS)
    reminder_cutoff = datetime.utcnow() - timedelta(hours=REMINDER_COOLDOWN_HOURS)

    results = {"stale_leads_found": 0, "events_triggered": 0}

    # Query: Find stale leads not recently alerted
    query = text("""
        WITH recent_timeout_events AS (
            SELECT DISTINCT entity_id as lead_id
            FROM system_events
            WHERE event_type = 'LEAD_STAGED_TIMEOUT'
            AND created_at > :reminder_cutoff
        )
        SELECT 
            l.id,
            l.first_name,
            l.last_name,
            l.email,
            l.phone,
            l.status,
            l.source,
            l.organization_id,
            l.updated_at
        FROM leads l
        LEFT JOIN recent_timeout_events rte ON l.id = rte.lead_id
        WHERE l.status IN ('NEW', 'CONTACTED', 'QUALIFIED')
        AND l.updated_at < :cutoff_time
        AND rte.lead_id IS NULL
        AND l.email IS NOT NULL
    """)

    result = await db.execute(
        query,
        {
            "cutoff_time": cutoff_time,
            "reminder_cutoff": reminder_cutoff,
        },
    )

    stale_leads = result.fetchall()
    results["stale_leads_found"] = len(stale_leads)

    for lead_row in stale_leads:
        try:
            # Calculate hours stale
            hours_stale = (
                datetime.utcnow() - lead_row.updated_at
            ).total_seconds() / 3600

            # Log the LEAD_STAGED_TIMEOUT event
            event = SystemEventLog(
                organization_id=lead_row.organization_id,
                event_type=TriggerEvent.LEAD_STAGED_TIMEOUT.value,
                payload={
                    "lead_id": str(lead_row.id),
                    "first_name": lead_row.first_name,
                    "last_name": lead_row.last_name,
                    "email": lead_row.email,
                    "phone": lead_row.phone or "",
                    "status": lead_row.status,
                    "source": lead_row.source or "",
                    "hours_stale": round(hours_stale, 1),
                },
                status=EventStatus.PENDING,
                entity_type="lead",
                entity_id=lead_row.id,
            )
            db.add(event)

            # Process via automation engine (will trigger Agente Fantasma rules)
            from app.services.automation_engine import emit_event

            await emit_event(
                db=db,
                event_type=TriggerEvent.LEAD_STAGED_TIMEOUT,
                organization_id=lead_row.organization_id,
                entity_id=lead_row.id,
                entity_type="lead",
                payload={
                    "lead_id": str(lead_row.id),
                    "first_name": lead_row.first_name,
                    "last_name": lead_row.last_name,
                    "email": lead_row.email,
                    "phone": lead_row.phone or "",
                    "status": lead_row.status,
                    "source": lead_row.source or "",
                    "hours_stale": round(hours_stale, 1),
                },
            )

            results["events_triggered"] += 1
            logger.info(
                f"LEAD_STAGED_TIMEOUT triggered for lead {lead_row.id} "
                f"({lead_row.first_name} {lead_row.last_name}, {round(hours_stale)}h stale)"
            )

        except Exception as e:
            logger.error(f"Failed to process stale lead {lead_row.id}: {e}")

    await db.commit()
    logger.info(f"Stale leads check completed: {results}")
    return results
