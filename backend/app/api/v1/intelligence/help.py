"""
Help API - Chat endpoint for the AI assistant.

This endpoint is FREE/UNLIMITED for all tiers (retention infrastructure).
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.models import User, HelpQueryLog
from app.services.help_assistant import help_assistant

router = APIRouter(prefix="/help", tags=["Help"])
logger = logging.getLogger(__name__)

# Create synchronous engine for background tasks (async doesn't work in threads)
sync_database_url = str(settings.DATABASE_URL).replace("+asyncpg", "")
sync_engine = create_engine(sync_database_url, pool_pre_ping=True)
SyncSessionLocal = sessionmaker(bind=sync_engine, autoflush=False, autocommit=False)


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class HelpChatRequest(BaseModel):
    message: str
    current_route: str = "/dashboard"
    history: Optional[List[ChatMessage]] = None


class HelpChatResponse(BaseModel):
    response: str


def log_query_background(
    user_id,
    org_id,
    query_text: str,
    current_route: str,
    detected_topic: Optional[str],
):
    """
    Log query in background task using synchronous session.

    BackgroundTasks run in a thread pool, so we use sync SQLAlchemy.
    """
    db: Session = SyncSessionLocal()
    try:
        query_log = HelpQueryLog(
            user_id=user_id,
            org_id=org_id,
            query_text=query_text[:500],
            current_route=current_route,
            detected_topic=detected_topic,
        )
        db.add(query_log)
        db.commit()
        logger.info(f"Logged help query: topic={detected_topic}")
    except Exception as e:
        logger.error(f"Failed to log help query: {e}")
        db.rollback()
    finally:
        db.close()


def log_ai_usage_background(
    org_id,
    user_id,
    model_id: str,
    tokens_in: int,
    tokens_out: int,
):
    """
    Log AI usage for HELPER in background task.

    v1.3.5: Free for user (cost_user_credits=0) but tracks real provider cost.
    """
    import uuid
    from decimal import Decimal
    from app.db.models import AiUsageLog
    from app.services.ai.ledger import CostLedger

    db: Session = SyncSessionLocal()
    try:
        pricing = CostLedger.PRICING.get(model_id, CostLedger.DEFAULT_PRICING)
        cost_provider = (Decimal(tokens_in) / Decimal("1000000")) * pricing["input"] + (
            Decimal(tokens_out) / Decimal("1000000")
        ) * pricing["output"]

        log = AiUsageLog(
            id=uuid.uuid4(),
            organization_id=org_id,
            user_id=user_id,
            provider="vertex_ai",
            model_id=model_id,
            task_type="help_bot",
            activity_type="help_bot",  # v1.5.9-hf13: Fix NotNullViolation
            tokens_input=tokens_in,
            tokens_output=tokens_out,
            cost_provider_usd=float(cost_provider),
            cost_user_credits=0.0,  # Free for user
        )
        db.add(log)
        db.commit()
        logger.info(
            f"Logged HELPER usage: {tokens_in}+{tokens_out} tokens, €{cost_provider:.6f}"
        )
    except Exception as e:
        logger.error(f"Failed to log HELPER usage: {e}")
        db.rollback()
    finally:
        db.close()


@router.post("/chat", response_model=HelpChatResponse)
async def chat_with_assistant(
    request: HelpChatRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """
    Chat with the KuraOS AI assistant.

    FREE/UNLIMITED for all tiers - this is retention infrastructure.
    Query logging runs in background for analytics.
    """
    # Log query in background (non-blocking)
    detected_topic = detect_topic(request.message)
    background_tasks.add_task(
        log_query_background,
        user_id=current_user.id,
        org_id=current_user.organization_id,
        query_text=request.message,
        current_route=request.current_route,
        detected_topic=detected_topic,
    )

    # Build context
    history = None
    if request.history:
        history = [{"role": m.role, "content": m.content} for m in request.history]

    # Call Gemini (returns tuple: text, tokens_in, tokens_out, model_id)
    result = await help_assistant.chat(
        message=request.message,
        locale=current_user.locale or "es",
        user_name=current_user.full_name or "Usuario",
        tier="BUILDER",  # Simplified to avoid lazy loading
        route=request.current_route,
        history=history,
    )

    # v1.3.5: Unpack result and log AI usage (free for user, cost for us)
    if isinstance(result, tuple):
        response_text, tokens_in, tokens_out, model_id = result
        # Log in background (non-blocking, sync session)
        background_tasks.add_task(
            log_ai_usage_background,
            org_id=current_user.organization_id,
            user_id=current_user.id,
            model_id=model_id,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
        )
    else:
        response_text = result  # Fallback for error cases

    return HelpChatResponse(response=response_text)


def detect_topic(message: str) -> Optional[str]:
    """Simple keyword-based topic detection for analytics."""
    message_lower = message.lower()

    topics = {
        "billing": ["factura", "pago", "plan", "suscripción", "crédito", "precio"],
        "patients": ["paciente", "cliente", "perfil", "crear paciente"],
        "forms": ["formulario", "intake", "enviar formulario"],
        "bookings": ["reserva", "cita", "calendario", "servicio"],
        "whatsapp": ["whatsapp", "mensaje", "chat"],
        "ai": ["ia", "análisis", "aletheia", "inteligencia"],
        "audio": ["audio", "grabar", "grabación", "voz"],
    }

    for topic, keywords in topics.items():
        if any(kw in message_lower for kw in keywords):
            return topic

    return None
