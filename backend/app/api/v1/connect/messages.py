"""Connect Messages API - Chat history for Visual Interface.

v1.7.0: Phase 5 - The Visual Interface.
"""

import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.api.deps import get_db, get_current_user
from app.db.models import User, MessageLog, Identity, Patient, Lead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/connect", tags=["Connect"])


class MessageResponse(BaseModel):
    """Single message in chat history."""

    id: UUID
    direction: str  # INBOUND or OUTBOUND
    content: str
    status: str
    timestamp: datetime
    media_url: Optional[str] = None
    mime_type: Optional[str] = None

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """Chat history with metadata."""

    messages: List[MessageResponse]
    unread_count: int
    window_status: str  # OPEN, CLOSED, UNKNOWN
    patient_id: Optional[UUID] = None
    identity_phone: Optional[str] = None


@router.get("/messages/{identity_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    identity_id: UUID,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get chat history for an identity.

    Returns messages ordered by timestamp DESC (newest first).
    Includes window status and unread count.
    """
    # Get identity and verify access
    identity = await db.get(Identity, identity_id)
    if not identity:
        raise HTTPException(status_code=404, detail="Identity not found")

    if identity.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Find linked patient
    patient_result = await db.execute(
        select(Patient)
        .where(Patient.identity_id == identity_id)
        .where(Patient.organization_id == current_user.organization_id)
        .limit(1)
    )
    patient = patient_result.scalar_one_or_none()

    # Get messages for this identity's phone
    # Messages are linked to patient_id, so we need to find via patient
    messages = []
    if patient:
        result = await db.execute(
            select(MessageLog)
            .where(MessageLog.patient_id == patient.id)
            .where(MessageLog.organization_id == current_user.organization_id)
            .order_by(desc(MessageLog.timestamp))
            .limit(limit)
        )
        messages = result.scalars().all()

    # Calculate unread count (INBOUND messages after last OUTBOUND)
    unread_count = 0
    last_outbound_time = None
    for msg in messages:
        if msg.direction.value == "OUTBOUND":
            last_outbound_time = msg.timestamp
            break

    if last_outbound_time:
        for msg in messages:
            if msg.direction.value == "INBOUND" and msg.timestamp > last_outbound_time:
                unread_count += 1
    else:
        # No outbound yet, count all inbound as unread
        unread_count = sum(1 for m in messages if m.direction.value == "INBOUND")

    # Calculate window status
    window_status = "UNKNOWN"
    if identity.last_meta_interaction_at:
        from datetime import timezone, timedelta

        now = datetime.now(timezone.utc)
        window_hours = (
            24 if identity.meta_provider == "whatsapp" else 168
        )  # 7 days for IG
        window_end = identity.last_meta_interaction_at + timedelta(hours=window_hours)

        window_status = "OPEN" if now < window_end else "CLOSED"

    return ChatHistoryResponse(
        messages=[
            MessageResponse(
                id=m.id,
                direction=m.direction.value,
                content=m.content,
                status=m.status,
                timestamp=m.timestamp,
                media_url=m.media_url,
                mime_type=m.mime_type,
            )
            for m in reversed(messages)  # Oldest first for UI rendering
        ],
        unread_count=unread_count,
        window_status=window_status,
        patient_id=patient.id if patient else None,
        identity_phone=identity.primary_phone,
    )
