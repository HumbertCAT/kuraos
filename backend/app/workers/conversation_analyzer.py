"""Conversation Analyzer Worker.

This worker runs periodically (via APScheduler) to analyze
WhatsApp conversations using AletheIA and detect risk patterns.

Batch processing approach:
1. Find patients with messages in last 24h without analysis for today
2. Build chat transcript from MessageLog
3. Call AletheIA for sentiment/risk analysis
4. Store results in DailyConversationAnalysis
5. Trigger RISK_DETECTED_IN_CHAT event if risks found
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    MessageLog,
    DailyConversationAnalysis,
    Patient,
    MessageDirection,
)
from app.services.aletheia import get_aletheia
from app.services.automation_engine import AutomationEngine

logger = logging.getLogger(__name__)


async def analyze_daily_conversations(db: AsyncSession) -> dict:
    """
    Analyze WhatsApp conversations from the last 24 hours.

    This is called by APScheduler daily (or manually via admin endpoint).

    Returns:
        dict with stats: {"analyzed": int, "risks_detected": int}
    """
    logger.info("🔍 Starting daily conversation analysis...")

    # Get current date (UTC) for analysis
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(hours=24)

    # Find patients with messages in last 24h
    # who don't have an analysis for today yet
    patients_with_messages = await db.execute(
        select(MessageLog.patient_id, MessageLog.organization_id)
        .where(MessageLog.timestamp >= yesterday)
        .group_by(MessageLog.patient_id, MessageLog.organization_id)
    )
    patient_rows = patients_with_messages.all()

    if not patient_rows:
        logger.info("No new messages to analyze")
        return {"analyzed": 0, "risks_detected": 0}

    analyzed = 0
    risks_detected = 0
    aletheia = get_aletheia()

    for patient_id, org_id in patient_rows:
        # Check if already analyzed today
        existing = await db.execute(
            select(DailyConversationAnalysis).where(
                and_(
                    DailyConversationAnalysis.patient_id == patient_id,
                    DailyConversationAnalysis.date >= today,
                )
            )
        )
        if existing.scalar_one_or_none():
            logger.debug(f"Patient {patient_id} already analyzed today")
            continue

        # Get messages for this patient from last 24h
        messages_result = await db.execute(
            select(MessageLog)
            .where(
                and_(
                    MessageLog.patient_id == patient_id,
                    MessageLog.timestamp >= yesterday,
                )
            )
            .order_by(MessageLog.timestamp)
        )
        messages = messages_result.scalars().all()

        if not messages:
            continue

        # Build transcript
        transcript_lines = []
        for msg in messages:
            sender = (
                "Paciente" if msg.direction == MessageDirection.INBOUND else "Sistema"
            )
            transcript_lines.append(f"{sender}: {msg.content}")

        transcript = "\n".join(transcript_lines)

        # Analyze with AletheIA
        try:
            # v1.3.5: Set context and use await (now async)
            aletheia.set_context(db=db, organization_id=org_id, patient_id=patient_id)
            result = await aletheia.analyze_chat_transcript(transcript)
        except Exception as e:
            logger.error(f"Analysis failed for patient {patient_id}: {e}")
            continue

        # Store analysis
        analysis = DailyConversationAnalysis(
            organization_id=org_id,
            patient_id=patient_id,
            date=today,
            summary=result["summary"],
            sentiment_score=result["sentiment_score"],
            emotional_state=result["emotional_state"],
            risk_flags=result["risk_flags"],
            suggestion=result["suggestion"],
            message_count=len(messages),
        )
        db.add(analysis)
        await db.commit()

        analyzed += 1
        logger.info(
            f"✅ Analyzed patient {patient_id}: "
            f"sentiment={result['sentiment_score']:.2f}, "
            f"risks={len(result['risk_flags'])}"
        )

        # Trigger automation if risks detected
        if result["risk_flags"]:
            risks_detected += 1
            try:
                engine = AutomationEngine(db)
                await engine.process_event(
                    event_type="RISK_DETECTED_IN_CHAT",
                    payload={
                        "patient_id": str(patient_id),
                        "organization_id": str(org_id),
                        "risk_flags": result["risk_flags"],
                        "sentiment_score": result["sentiment_score"],
                        "summary": result["summary"],
                    },
                    organization_id=org_id,
                    patient_id=patient_id,
                )
            except Exception as e:
                logger.error(f"Failed to trigger automation: {e}")

    logger.info(
        f"📊 Daily analysis complete: {analyzed} analyzed, {risks_detected} with risks"
    )
    return {"analyzed": analyzed, "risks_detected": risks_detected}
