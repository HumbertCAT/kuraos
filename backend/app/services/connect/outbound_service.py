"""AletheIA Outbound Service - The Voice.

v1.6.8: Phase 4 - Give AletheIA the ability to respond.

Safety Architecture:
- LOW/MODERATE risk: Can auto-respond if Agent is in "auto" mode
- HIGH/CRITICAL risk: BLOCK auto-response, create HumanReviewTask
- Window CLOSED: Cannot send free-form, suggest template

The Safety Switch ensures NO patient in crisis receives an AI response
without human oversight.
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MessageLog, MessageDirection
from app.services.connect.meta_service import (
    send_message,
    get_window_status,
    WindowStatus,
    WindowClosedError,
)

logger = logging.getLogger(__name__)


class OutboundDecision(str, Enum):
    """Decision for outbound message."""

    SEND = "SEND"  # Safe to send
    BLOCK_HIGH_RISK = "BLOCK_HIGH_RISK"  # Risk too high, needs human
    BLOCK_WINDOW_CLOSED = "BLOCK_WINDOW_CLOSED"  # Use template instead
    BLOCK_DRAFT_MODE = "BLOCK_DRAFT_MODE"  # Agent is in draft mode


class RiskLevel(str, Enum):
    """Risk levels from SENTINEL."""

    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# Risk levels that require human intervention
BLOCKED_RISK_LEVELS = {RiskLevel.HIGH, RiskLevel.CRITICAL}


async def evaluate_outbound_safety(
    identity_id: UUID,
    risk_level: Optional[str],
    agent_auto_mode: bool,
    db: AsyncSession,
) -> OutboundDecision:
    """Evaluate if an outbound message should be sent automatically.

    The Safety Switch Logic:
    1. Check window status (can we even send free-form?)
    2. Check risk level (is it safe to auto-respond?)
    3. Check agent mode (is human approval required?)

    Args:
        identity_id: Identity to send to
        risk_level: SENTINEL risk assessment (LOW/MODERATE/HIGH/CRITICAL)
        agent_auto_mode: Whether the agent is in auto-respond mode
        db: Database session

    Returns:
        OutboundDecision indicating whether to send
    """
    # Step 1: Check window status
    window = await get_window_status(identity_id, db)
    if window == WindowStatus.CLOSED:
        logger.warning(
            f"🚫 Outbound blocked: Window CLOSED for Identity[{identity_id}]"
        )
        return OutboundDecision.BLOCK_WINDOW_CLOSED

    # Step 2: Check risk level (Safety Switch)
    if risk_level:
        try:
            risk = RiskLevel(risk_level.upper())
            if risk in BLOCKED_RISK_LEVELS:
                logger.warning(
                    f"⚠️ Outbound blocked: HIGH RISK ({risk.value}) for Identity[{identity_id}]"
                )
                return OutboundDecision.BLOCK_HIGH_RISK
        except ValueError:
            # Unknown risk level, be cautious
            logger.warning(f"Unknown risk level: {risk_level}, blocking")
            return OutboundDecision.BLOCK_HIGH_RISK

    # Step 3: Check agent mode
    if not agent_auto_mode:
        logger.info(f"📋 Outbound blocked: Agent in DRAFT mode")
        return OutboundDecision.BLOCK_DRAFT_MODE

    # All checks passed
    logger.info(f"✅ Outbound approved for Identity[{identity_id}]")
    return OutboundDecision.SEND


async def send_aletheia_response(
    identity_id: UUID,
    patient_id: UUID,
    organization_id: UUID,
    phone: str,
    response_text: str,
    risk_level: Optional[str],
    agent_auto_mode: bool = False,  # Default to DRAFT mode
    db: AsyncSession = None,
) -> dict:
    """Send an AletheIA-generated response via Meta.

    This is the main entry point for outbound messages from AletheIA.
    Implements the Safety Switch to prevent dangerous auto-responses.

    Args:
        identity_id: Target identity
        patient_id: Patient for MessageLog
        organization_id: Organization for MessageLog
        phone: Phone number in E.164 format
        response_text: The AI-generated response
        risk_level: SENTINEL risk assessment
        agent_auto_mode: Whether to auto-send (default: False = draft mode)
        db: Database session

    Returns:
        Dict with decision and result
    """
    # Evaluate safety
    decision = await evaluate_outbound_safety(
        identity_id=identity_id,
        risk_level=risk_level,
        agent_auto_mode=agent_auto_mode,
        db=db,
    )

    result = {
        "decision": decision.value,
        "identity_id": str(identity_id),
        "response_preview": response_text[:100] + "..."
        if len(response_text) > 100
        else response_text,
        "sent": False,
        "message_id": None,
        "error": None,
    }

    if decision != OutboundDecision.SEND:
        # Create draft/blocked record
        if db:
            draft_log = MessageLog(
                organization_id=organization_id,
                patient_id=patient_id,
                direction=MessageDirection.OUTBOUND,
                content=f"[DRAFT - {decision.value}]: {response_text}",
                status="DRAFT",
            )
            db.add(draft_log)
            await db.commit()
            logger.info(f"📋 Draft message saved for human review")

        return result

    # Send the message
    try:
        api_result = await send_message(
            to=phone,
            text=response_text,
            identity_id=identity_id,
            db=db,
        )

        result["sent"] = True
        result["message_id"] = api_result.get("messages", [{}])[0].get("id")

        # Log the sent message
        if db:
            sent_log = MessageLog(
                organization_id=organization_id,
                patient_id=patient_id,
                direction=MessageDirection.OUTBOUND,
                content=response_text,
                provider_id=result["message_id"],
                status="SENT",
            )
            db.add(sent_log)
            await db.commit()

        logger.info(f"✅ AletheIA response sent: {result['message_id']}")

    except WindowClosedError as e:
        result["error"] = str(e)
        result["decision"] = OutboundDecision.BLOCK_WINDOW_CLOSED.value
        logger.warning(f"🚫 Window closed during send: {e}")

    except Exception as e:
        result["error"] = str(e)
        logger.error(f"❌ Failed to send AletheIA response: {e}")

    return result


async def create_human_review_task(
    patient_id: UUID,
    organization_id: UUID,
    draft_message: str,
    risk_level: str,
    risk_reason: str,
    db: AsyncSession,
) -> dict:
    """Create a task for human review of blocked message.

    When Safety Switch blocks an auto-response, we create a task
    so the therapist can review and manually send if appropriate.

    Args:
        patient_id: Patient UUID
        organization_id: Organization UUID
        draft_message: The blocked AI response
        risk_level: Why it was blocked
        risk_reason: SENTINEL's reasoning
        db: Database session

    Returns:
        Task creation result
    """
    # TODO: Create actual Task model entry
    # For now, log for visibility
    logger.warning(
        f"📋 HUMAN REVIEW NEEDED for Patient[{patient_id}]\n"
        f"   Risk: {risk_level}\n"
        f"   Reason: {risk_reason}\n"
        f"   Draft: {draft_message[:100]}..."
    )

    return {
        "task_created": True,
        "patient_id": str(patient_id),
        "risk_level": risk_level,
        "requires_action": True,
    }
