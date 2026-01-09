"""Meta Cloud API Webhook Endpoint.

Receives incoming WhatsApp/Instagram messages from Meta and stores them
in MessageLog for later analysis by AletheIA.

v1.6.5: Phase 1 - Unified Gateway
- Webhook verification challenge (GET)
- Inbound message processing (POST)
- HMAC-SHA256 signature validation
- Identity resolution via IdentityResolver

Supports:
- Text messages
- Media messages (future: transcription)
"""

import hashlib
import hmac
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query, Request, HTTPException, Depends
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import settings

# v1.6.5 Phase 1: MessageLog and IdentityResolver imports removed
# Will be added back in Phase 2 when we implement patient lookup by phone

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
    """Process a single Meta message.

    Args:
        message: Message object from Meta
        contacts: Contact info array
        object_type: "whatsapp_business_account" or "instagram"
        db: Database session
    """
    # Extract message details
    msg_id = message.get("id", "")
    msg_type = message.get("type", "text")
    wa_id = message.get("from", "")  # Phone number in E.164 format
    timestamp = message.get("timestamp", "")

    # Get message content based on type
    content = ""
    if msg_type == "text":
        content = message.get("text", {}).get("body", "")
    elif msg_type == "image":
        content = "[📷 Image]"
    elif msg_type == "audio":
        content = "[🎤 Audio]"  # Future: Whisper transcription
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

    # Determine source
    source = "whatsapp_meta" if "whatsapp" in object_type else "instagram"

    # v1.6.5 Phase 1: Log message (Identity Resolution deferred to Phase 2)
    # Phase 2 will lookup patient by phone across all orgs and resolve identity
    phone_formatted = f"+{wa_id}" if not wa_id.startswith("+") else wa_id

    logger.info(
        f"📩 Meta Message via {source} from [{phone_formatted}]: "
        f"type={msg_type}, len={len(content)} chars"
    )

    # TODO Phase 2: Lookup patient by phone, resolve identity, store in MessageLog
    # For now, just acknowledge receipt
    logger.info(f"📝 Message logged (Phase 1 - no storage): {phone_formatted}")
