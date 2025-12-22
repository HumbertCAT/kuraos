"""Twilio WhatsApp Webhook Endpoint.

Receives incoming WhatsApp messages from Twilio and stores them
in MessageLog for later analysis by AletheIA.

Supports:
- Text messages (Body)
- Audio messages (transcribed via Whisper)
"""

import logging
from typing import Optional

from fastapi import APIRouter, Form, Depends
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import settings
from app.db.models import Patient, MessageLog, MessageDirection
from app.services.transcription import transcribe_audio, is_audio_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


# TwiML empty response (acknowledges receipt without replying)
TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


@router.post("/twilio/whatsapp")
async def twilio_whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(""),  # May be empty for media-only messages
    MessageSid: str = Form(None),
    # Media fields (audio, images, etc.)
    NumMedia: int = Form(0),
    MediaUrl0: Optional[str] = Form(None),
    MediaContentType0: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Receive incoming WhatsApp message from Twilio.

    Twilio sends POST with application/x-www-form-urlencoded:
    - From: "whatsapp:+34666555444"
    - Body: Message text content (may be empty for media)
    - MessageSid: Unique message ID
    - NumMedia: Number of media attachments
    - MediaUrl0: URL to first media file
    - MediaContentType0: MIME type of first media

    We:
    1. Clean the phone number (remove 'whatsapp:' prefix)
    2. Look up the patient by phone
    3. If audio, transcribe with Whisper
    4. Store the message in MessageLog
    5. Return empty TwiML (no auto-reply)
    """
    # Clean phone number: "whatsapp:+34666555444" -> "+34666555444"
    phone_clean = From.replace("whatsapp:", "").strip()

    # Determine message content
    content = Body.strip() if Body else ""

    # Handle audio messages
    if NumMedia > 0 and MediaUrl0 and is_audio_message(MediaContentType0):
        logger.info(f"🎤 Audio message from {phone_clean}, transcribing...")

        # Build Twilio auth for media download
        twilio_auth = None
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            twilio_auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        # Transcribe the audio
        transcribed = await transcribe_audio(MediaUrl0, twilio_auth)

        # Combine with any text content
        if content:
            content = f"{content}\n\n{transcribed}"
        else:
            content = transcribed

        logger.info(f"📝 Transcription: {content[:80]}...")

    # Skip if no content at all
    if not content:
        logger.warning(f"⚠️ Empty message from {phone_clean}, skipping")
        return Response(content=TWIML_EMPTY, media_type="application/xml")

    logger.info(f"📱 WhatsApp from {phone_clean}: {content[:50]}...")

    # Look up patient by phone number
    result = await db.execute(select(Patient).where(Patient.phone == phone_clean))
    patient = result.scalar_one_or_none()

    if not patient:
        # Unknown sender - log warning but return 200 to not block Twilio
        logger.warning(f"⚠️ Unknown WhatsApp sender: {phone_clean}")
        return Response(content=TWIML_EMPTY, media_type="application/xml")

    # Check for duplicate message (Twilio can retry)
    if MessageSid:
        existing = await db.execute(
            select(MessageLog).where(MessageLog.provider_id == MessageSid)
        )
        if existing.scalar_one_or_none():
            logger.info(f"Duplicate message {MessageSid}, skipping")
            return Response(content=TWIML_EMPTY, media_type="application/xml")

    # Store message
    message = MessageLog(
        organization_id=patient.organization_id,
        patient_id=patient.id,
        direction=MessageDirection.INBOUND,
        content=content,
        provider_id=MessageSid,
        status="RECEIVED",
    )
    db.add(message)
    await db.commit()

    logger.info(
        f"✅ Stored message from patient {patient.first_name} {patient.last_name}"
    )

    # Return empty TwiML (no auto-reply for now)
    return Response(content=TWIML_EMPTY, media_type="application/xml")
