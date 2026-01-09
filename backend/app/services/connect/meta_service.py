"""Meta Cloud API Service.

v1.6.6: The Chronos Logic - Session window management for WhatsApp/Instagram.

Handles:
- Window status calculation (24h WhatsApp / 7d Instagram)
- Outbound message sending with window validation
- Session tracking updates

Business Rules:
- WhatsApp: 24-hour Customer Service Window
- Instagram: 7-day Human Agent Tag window
- Outside window: Must use pre-approved template messages
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import Identity

logger = logging.getLogger(__name__)


class WindowStatus(str, Enum):
    """Meta messaging window status.

    OPEN: WhatsApp 24h window is active, can send free-form messages
    IG_EXTENDED: Instagram 7-day window is active (Human Agent Tag)
    CLOSED: Window expired, must use template messages
    """

    OPEN = "OPEN"
    IG_EXTENDED = "IG_EXTENDED"
    CLOSED = "CLOSED"


class WindowClosedError(Exception):
    """Raised when trying to send message outside the allowed window."""

    pass


async def get_window_status(identity_id: UUID, db: AsyncSession) -> WindowStatus:
    """Check if the messaging window is open for an identity.

    Args:
        identity_id: The identity to check
        db: Database session

    Returns:
        WindowStatus indicating if free-form messaging is allowed

    Logic:
        - WhatsApp: 24-hour window from last customer message
        - Instagram: 7-day window (Human Agent Tag)
    """
    identity = await db.get(Identity, identity_id)

    if not identity or not identity.last_meta_interaction_at:
        return WindowStatus.CLOSED

    elapsed = datetime.utcnow() - identity.last_meta_interaction_at
    provider = identity.meta_provider or "whatsapp"  # Default to restrictive

    # Instagram has 7-day Human Agent Tag window
    limit = timedelta(days=7) if provider == "instagram" else timedelta(hours=24)

    if elapsed < limit:
        return (
            WindowStatus.IG_EXTENDED if provider == "instagram" else WindowStatus.OPEN
        )

    return WindowStatus.CLOSED


async def update_session(
    identity: Identity,
    provider: str,
    db: AsyncSession,
) -> None:
    """Update identity's Meta session tracking.

    Called when receiving an inbound message to refresh the window.

    Args:
        identity: The identity that sent a message
        provider: "whatsapp" or "instagram"
        db: Database session
    """
    identity.last_meta_interaction_at = datetime.utcnow()
    identity.meta_provider = provider
    await db.commit()

    logger.info(
        f"🕐 Session updated for Identity[{identity.id}]: "
        f"provider={provider}, window=OPEN"
    )


async def send_message(
    to: str,
    text: str,
    identity_id: UUID,
    db: AsyncSession,
) -> dict:
    """Send WhatsApp/Instagram message via Meta Cloud API.

    Safety: Checks window status before sending.

    Args:
        to: Recipient phone number (E.164 format)
        text: Message text to send
        identity_id: Identity to check window for
        db: Database session

    Returns:
        Meta API response dict

    Raises:
        WindowClosedError: If 24h/7d window is closed
    """
    status = await get_window_status(identity_id, db)

    if status == WindowStatus.CLOSED:
        logger.warning(
            f"🚫 Window CLOSED for Identity[{identity_id}], cannot send free-form message"
        )
        raise WindowClosedError(
            "Messaging window closed. Use template message to re-engage."
        )

    logger.info(f"📤 Sending message to {to} (window={status.value})")

    # POST to Meta Graph API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://graph.facebook.com/v22.0/{settings.META_PHONE_NUMBER_ID}/messages",
            json={
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to,
                "type": "text",
                "text": {"body": text},
            },
            headers={
                "Authorization": f"Bearer {settings.META_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
        )

    result = response.json()

    if response.status_code == 200:
        logger.info(
            f"✅ Message sent successfully: {result.get('messages', [{}])[0].get('id')}"
        )
    else:
        logger.error(f"❌ Failed to send message: {result}")

    return result
