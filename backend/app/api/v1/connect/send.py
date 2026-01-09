"""Connect API endpoints.

v1.6.8: The Voice - Outbound messaging with Safety Switch.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.db.models import User, Patient, Identity
from app.services.connect.outbound_service import (
    send_aletheia_response,
    OutboundDecision,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/connect", tags=["Connect"])


class SendMessageRequest(BaseModel):
    """Request to send a message via Meta."""

    patient_id: UUID
    message: str = Field(..., min_length=1, max_length=4096)
    risk_level: str = Field(
        default="LOW", description="Risk level: LOW/MODERATE/HIGH/CRITICAL"
    )
    auto_mode: bool = Field(
        default=False, description="Send immediately (True) or save as draft (False)"
    )


class SendMessageResponse(BaseModel):
    """Response from send message."""

    decision: str
    sent: bool
    message_id: str | None
    error: str | None
    draft_saved: bool


@router.post("/send", response_model=SendMessageResponse)
async def send_message_endpoint(
    request: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to a patient via Meta WhatsApp/Instagram.

    Implements the Safety Switch:
    - HIGH/CRITICAL risk messages are blocked and saved as drafts
    - Messages to patients with CLOSED window are blocked
    - Draft mode (default) saves for human review
    """
    # Get patient with identity
    patient = await db.get(Patient, request.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Verify user has access to patient's organization
    if patient.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get patient's identity for phone number
    if not patient.identity_id:
        raise HTTPException(
            status_code=400, detail="Patient has no linked identity (no phone number)"
        )

    identity = await db.get(Identity, patient.identity_id)
    if not identity or not identity.primary_phone:
        raise HTTPException(
            status_code=400, detail="Patient identity has no phone number"
        )

    # Send via outbound service
    result = await send_aletheia_response(
        identity_id=identity.id,
        patient_id=patient.id,
        organization_id=patient.organization_id,
        phone=identity.primary_phone,
        response_text=request.message,
        risk_level=request.risk_level,
        agent_auto_mode=request.auto_mode,
        db=db,
    )

    return SendMessageResponse(
        decision=result["decision"],
        sent=result["sent"],
        message_id=result.get("message_id"),
        error=result.get("error"),
        draft_saved=result["decision"] != OutboundDecision.SEND.value
        and not result["sent"],
    )
