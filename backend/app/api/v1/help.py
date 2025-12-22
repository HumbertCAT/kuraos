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

    # Call Gemini 2.5 Flash
    response = await help_assistant.chat(
        message=request.message,
        locale=current_user.locale or "es",
        user_name=current_user.full_name or "Usuario",
        tier="BUILDER",  # Simplified to avoid lazy loading
        route=request.current_route,
        history=history,
    )

    return HelpChatResponse(response=response)


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
