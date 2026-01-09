"""Meta Cloud API Webhook Endpoint.

Receives incoming WhatsApp/Instagram messages from Meta and stores them
in MessageLog for later analysis by AletheIA.

v1.6.5: Phase 1 - Unified Gateway
- Webhook verification challenge (GET)
- Inbound message processing (POST)
- HMAC-SHA256 signature validation

v1.6.6: Phase 2 - The Chronos Logic
- Global phone lookup via IdentityResolver
- MessageLog storage with patient context
- Session window tracking (24h WhatsApp / 7d Instagram)

v1.6.7: Phase 3 - Deep Listening
- Download ephemeral media (audio/image) before URL expires
- Store in GCS (The Vault)
- Transcribe audio via Whisper
"""

import hashlib
import hmac
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Query, Request, HTTPException, Depends
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import settings
from app.db.models import Identity, Patient, Lead, MessageLog, MessageDirection
from app.services.identity_resolver import IdentityResolver
from app.services.connect.meta_service import update_session
from app.services.connect.meta_media import meta_media_service
from app.services.transcription import transcribe_audio, is_audio_message
from app.services.storage import vault_storage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify Meta webhook signature using HMAC-SHA256.

    Args:
        payload: Raw request body bytes
        signature: X-Hub-Signature-256 header value (sha256=...)

    Returns:
        True if signature is valid, False otherwise
    """
    if not settings.META_APP_SECRET:
        logger.warning(
            "⚠️ META_APP_SECRET not configured, skipping signature validation"
        )
        return True  # Allow in development

    if not signature or not signature.startswith("sha256="):
        return False

    expected_signature = hmac.new(
        settings.META_APP_SECRET.encode("utf-8"), payload, hashlib.sha256
    ).hexdigest()

    received_signature = signature[7:]  # Remove "sha256=" prefix
    return hmac.compare_digest(expected_signature, received_signature)


@router.get("/meta")
async def meta_webhook_verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Meta Webhook Verification Challenge.

    Meta sends a GET request to verify webhook ownership:
    - hub.mode: Should be "subscribe"
    - hub.verify_token: Must match our META_VERIFY_TOKEN
    - hub.challenge: Random string to echo back

    Returns the challenge as plain text on success.
    """
    logger.info(f"🔐 Meta webhook verification: mode={hub_mode}")

    # Validate required parameters
    if hub_mode != "subscribe":
        logger.warning(f"❌ Invalid hub.mode: {hub_mode}")
        raise HTTPException(status_code=403, detail="Invalid mode")

    # Check verify token
    if not settings.META_VERIFY_TOKEN:
        logger.error("❌ META_VERIFY_TOKEN not configured")
        raise HTTPException(status_code=500, detail="Webhook not configured")

    if hub_verify_token != settings.META_VERIFY_TOKEN:
        logger.warning("❌ Invalid verify_token")
        raise HTTPException(status_code=403, detail="Invalid verify token")

    logger.info("✅ Meta webhook verified successfully")
    return PlainTextResponse(content=hub_challenge)


@router.post("/meta")
async def meta_webhook_inbound(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Process inbound WhatsApp/Instagram messages from Meta.

    Meta sends a POST with JSON payload containing:
    - object: "whatsapp_business_account" or "instagram"
    - entry[]: Array of entries
      - changes[]: Array of changes
        - value.messages[]: Array of messages (what we care about)
        - value.statuses[]: Status updates (ignored in Phase 1)

    Security:
    - Validates X-Hub-Signature-256 header
    - Returns 200 quickly to avoid Meta retries
    """
    # Get raw body for signature validation
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")

    # Validate signature
    if not verify_signature(body, signature):
        logger.warning("❌ Invalid Meta webhook signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Parse JSON payload
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"❌ Failed to parse Meta payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Get object type
    object_type = payload.get("object", "unknown")
    logger.info(f"📩 Meta webhook received: object={object_type}")

    # Process entries
    entries = payload.get("entry", [])
    messages_processed = 0

    for entry in entries:
        changes = entry.get("changes", [])

        for change in changes:
            value = change.get("value", {})

            # Skip status updates (sent, delivered, read)
            if "statuses" in value:
                logger.debug("⏭️ Skipping status update")
                continue

            # Process messages
            messages = value.get("messages", [])
            contacts = value.get("contacts", [])

            for message in messages:
                await process_meta_message(
                    message=message,
                    contacts=contacts,
                    object_type=object_type,
                    db=db,
                )
                messages_processed += 1

    logger.info(f"✅ Processed {messages_processed} messages from Meta")
    return JSONResponse(content={"status": "ok"})


async def process_meta_message(
    message: dict,
    contacts: list,
    object_type: str,
    db: AsyncSession,
):
    """Process a single Meta message (v1.6.7 Deep Listening).

    Args:
        message: Message object from Meta
        contacts: Contact info array
        object_type: "whatsapp_business_account" or "instagram"
        db: Database session

    Flow:
        1. Extract message details
        2. If audio/image: Download immediately (5min expiry!)
        3. Store media in GCS
        4. Transcribe audio
        5. Global phone lookup → find Identity
        6. Store in MessageLog with media_url
        7. Update session window
    """
    # Extract message details
    msg_id = message.get("id", "")
    msg_type = message.get("type", "text")
    wa_id = message.get("from", "")  # Phone number in E.164 format
    timestamp = message.get("timestamp", "")

    # v1.6.7: Media handling variables
    media_id = None
    media_url = None  # GCS URI
    mime_type = None
    content = ""

    # Process based on message type
    if msg_type == "text":
        content = message.get("text", {}).get("body", "")

    elif msg_type == "audio":
        # v1.6.7 Deep Listening: Download and transcribe
        media_id = message.get("audio", {}).get("id")
        if media_id:
            try:
                logger.info(f"🎤 Audio message received, downloading immediately...")

                # Step 1: Download from Meta (URL expires in 5min!)
                audio_bytes, mime_type = await meta_media_service.download_media(
                    media_id
                )

                # Step 2: Store in GCS (permanent)
                date_str = datetime.utcnow().strftime("%Y-%m-%d")
                ext = ".ogg" if "ogg" in mime_type else ".mp3"
                gcs_filename = f"connect/meta/{date_str}/{media_id}{ext}"
                media_url = vault_storage.upload_file(
                    audio_bytes, gcs_filename, mime_type, prefix=""
                )
                logger.info(f"📦 Stored in GCS: {media_url}")

                # Step 3: Transcribe with Whisper
                content = await transcribe_audio(
                    source=audio_bytes,
                    content_type=mime_type,
                )
                logger.info(f"📝 Transcription: {content[:100]}...")

            except Exception as e:
                logger.error(f"❌ Audio processing failed: {e}")
                content = f"[🎤 AUDIO SIN TRANSCRIBIR] (Error: {str(e)[:50]})"
        else:
            content = "[🎤 Audio] (no media_id)"

    elif msg_type == "image":
        media_id = message.get("image", {}).get("id")
        if media_id:
            try:
                logger.info(f"📷 Image message received, downloading...")

                # Download and store
                image_bytes, mime_type = await meta_media_service.download_media(
                    media_id
                )
                date_str = datetime.utcnow().strftime("%Y-%m-%d")
                ext = ".jpg" if "jpeg" in mime_type else ".png"
                gcs_filename = f"connect/meta/{date_str}/{media_id}{ext}"
                media_url = vault_storage.upload_file(
                    image_bytes, gcs_filename, mime_type, prefix=""
                )
                logger.info(f"📦 Stored image in GCS: {media_url}")
                content = "[📷 Image]"

            except Exception as e:
                logger.error(f"❌ Image download failed: {e}")
                content = "[📷 Image] (download failed)"
        else:
            content = "[📷 Image]"

    elif msg_type == "video":
        content = "[🎬 Video]"
    elif msg_type == "document":
        content = "[📄 Document]"
    elif msg_type == "location":
        content = "[📍 Location]"
    elif msg_type == "button":
        content = message.get("button", {}).get("text", "[Button]")
    elif msg_type == "interactive":
        content = "[Interactive Response]"
    else:
        content = f"[{msg_type}]"

    # Skip empty messages
    if not content and not wa_id:
        logger.warning("⚠️ Empty message received, skipping")
        return

    # Determine provider
    provider = "instagram" if "instagram" in object_type.lower() else "whatsapp"

    # Format phone for lookup
    phone_formatted = f"+{wa_id}" if not wa_id.startswith("+") else wa_id

    logger.info(
        f"📩 Meta Message via {provider} from [{phone_formatted}]: "
        f"type={msg_type}, len={len(content)} chars"
    )

    # v1.6.6: Global phone lookup to find Identity
    resolver = IdentityResolver(db, UUID("00000000-0000-0000-0000-000000000000"))
    identity = await resolver.find_by_phone_global(phone_formatted)

    patient = None
    organization_id = None

    if identity:
        # Update session window (Chronos Logic)
        await update_session(identity, provider, db)

        # Try to find linked Patient for MessageLog context
        patient_result = await db.execute(
            select(Patient)
            .where(Patient.identity_id == identity.id)
            .order_by(Patient.created_at.desc())
            .limit(1)
        )
        patient = patient_result.scalar_one_or_none()

        if patient:
            organization_id = patient.organization_id
            logger.info(
                f"📇 Resolved: Identity[{identity.id}] → "
                f"Patient[{patient.id}] in Org[{organization_id}]"
            )
        else:
            # Check for Lead
            lead_result = await db.execute(
                select(Lead)
                .where(Lead.identity_id == identity.id)
                .order_by(Lead.created_at.desc())
                .limit(1)
            )
            lead = lead_result.scalar_one_or_none()
            if lead:
                organization_id = lead.organization_id
                logger.info(
                    f"📇 Resolved: Identity[{identity.id}] → "
                    f"Lead[{lead.id}] in Org[{organization_id}] (no patient)"
                )
    else:
        logger.info(f"📝 Unknown sender: {phone_formatted} (no identity found)")

    # Store message in MessageLog if we have patient context
    if patient and organization_id:
        message_log = MessageLog(
            organization_id=organization_id,
            patient_id=patient.id,
            direction=MessageDirection.INBOUND,
            content=content,
            provider_id=msg_id,
            status="RECEIVED",
            # v1.6.7 Deep Listening fields
            media_id=media_id,
            media_url=media_url,
            mime_type=mime_type,
        )
        db.add(message_log)
        await db.commit()
        logger.info(f"✅ Stored in MessageLog for Patient[{patient.id}]")
    else:
        # Log for audit but don't store (no patient context)
        logger.info(f"📝 Message logged (no patient context): {phone_formatted}")
