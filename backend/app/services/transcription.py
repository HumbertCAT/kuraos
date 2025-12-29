"""Audio Transcription Service using OpenAI Whisper.

Transcribes WhatsApp audio messages for AletheIA analysis.
"""

import logging
import tempfile
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

import httpx
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

# Supported audio content types from WhatsApp/Twilio
AUDIO_CONTENT_TYPES = {
    "audio/ogg",
    "audio/ogg; codecs=opus",
    "audio/mpeg",
    "audio/mp4",
    "audio/amr",
    "audio/x-m4a",
    "audio/aac",
}

# Whisper pricing: $0.006 per minute = $0.0001 per second
WHISPER_COST_PER_SECOND = Decimal("0.0001")


def is_audio_message(content_type: Optional[str]) -> bool:
    """Check if the content type is a supported audio format."""
    if not content_type:
        return False
    # Handle content types with parameters (e.g., "audio/ogg; codecs=opus")
    base_type = content_type.split(";")[0].strip().lower()
    return base_type.startswith("audio/")


async def log_whisper_usage(
    db,
    organization_id: str,
    audio_duration_seconds: int,
    user_id: Optional[str] = None,
    patient_id: Optional[str] = None,
):
    """
    Log Whisper transcription usage to ai_usage_logs.

    Args:
        db: Database session
        organization_id: UUID of the organization
        audio_duration_seconds: Duration of audio in seconds
        user_id: Optional user UUID
        patient_id: Optional patient UUID
    """
    try:
        from app.db.models import AiUsageLog

        # Calculate cost (Whisper charges $0.006/minute)
        cost_provider = Decimal(audio_duration_seconds) * WHISPER_COST_PER_SECOND
        margin = Decimal("1.5")  # Default margin
        cost_user = cost_provider * margin

        log = AiUsageLog(
            id=uuid.uuid4(),
            created_at=datetime.utcnow(),
            organization_id=organization_id,
            user_id=user_id,
            patient_id=patient_id,
            provider="openai",
            model_id="whisper-1",
            task_type="transcription",
            tokens_input=audio_duration_seconds,  # Using seconds as "tokens"
            tokens_output=0,
            cost_provider_usd=float(cost_provider),
            cost_user_credits=float(cost_user),
        )

        db.add(log)
        await db.flush()
        logger.info(
            f"📊 Logged Whisper usage: {audio_duration_seconds}s, ${cost_provider:.4f}"
        )
    except Exception as e:
        logger.warning(f"Failed to log Whisper usage: {e}")


def _estimate_audio_duration(file_size_bytes: int, content_type: str) -> int:
    """
    Estimate audio duration from file size.

    Uses approximate bitrates for common formats.
    Returns duration in seconds.
    """
    # Approximate bitrates (bits per second)
    bitrate_map = {
        "audio/ogg": 64000,  # ~64 kbps typical for voice
        "audio/mpeg": 128000,  # ~128 kbps for mp3
        "audio/mp4": 96000,  # ~96 kbps for m4a
        "audio/amr": 12200,  # AMR narrow band
        "audio/aac": 96000,  # ~96 kbps
    }

    base_type = content_type.split(";")[0].strip().lower()
    bitrate = bitrate_map.get(base_type, 64000)  # Default to 64kbps

    # Duration = (file_size * 8) / bitrate
    duration_seconds = (file_size_bytes * 8) / bitrate
    return max(1, int(duration_seconds))  # Minimum 1 second


async def transcribe_audio(
    media_url: str,
    twilio_auth: tuple = None,
    db=None,
    organization_id: str = None,
    user_id: str = None,
    patient_id: str = None,
) -> str:
    """
    Download audio from Twilio and transcribe using OpenAI Whisper.

    Args:
        media_url: URL to the audio file from Twilio
        twilio_auth: Optional (account_sid, auth_token) for authenticated download
        db: Optional database session for logging usage
        organization_id: Optional org UUID for logging
        user_id: Optional user UUID for logging
        patient_id: Optional patient UUID for logging

    Returns:
        Transcribed text with [🎤 AUDIO] prefix, or error message
    """
    try:
        # Download audio from Twilio
        async with httpx.AsyncClient(timeout=30.0) as client:
            logger.info(f"📥 Downloading audio from Twilio...")
            logger.info(f"📍 URL: {media_url}")
            logger.info(f"🔐 Auth provided: {twilio_auth is not None}")

            # Twilio media always requires Basic Auth
            if twilio_auth:
                auth = httpx.BasicAuth(twilio_auth[0], twilio_auth[1])
                logger.info(f"🔐 Using auth with SID: {twilio_auth[0][:10]}...")
                response = await client.get(media_url, auth=auth, follow_redirects=True)
            else:
                logger.warning("⚠️ No Twilio auth provided, trying without...")
                response = await client.get(media_url, follow_redirects=True)

            logger.info(f"📊 Response status: {response.status_code}")

            if response.status_code != 200:
                logger.warning(f"Failed to download audio: HTTP {response.status_code}")
                logger.warning(
                    f"Response body: {response.text[:200] if response.text else 'empty'}"
                )
                return f"[🎤 AUDIO SIN TRANSCRIBIR] (Error de descarga: {response.status_code})"

            audio_data = response.content
            content_type = response.headers.get("content-type", "audio/ogg")

        # Estimate duration for cost tracking
        audio_duration = _estimate_audio_duration(len(audio_data), content_type)

        # Determine file extension from content type
        ext_map = {
            "audio/ogg": ".ogg",
            "audio/mpeg": ".mp3",
            "audio/mp4": ".m4a",
            "audio/amr": ".amr",
            "audio/x-m4a": ".m4a",
            "audio/aac": ".aac",
        }
        base_type = content_type.split(";")[0].strip().lower()
        extension = ext_map.get(base_type, ".ogg")

        # Write to temp file (Whisper API needs file-like object)
        with tempfile.NamedTemporaryFile(suffix=extension, delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        # Transcribe with Whisper
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            with open(tmp_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="es",  # Spanish - can be made dynamic later
                )

            transcribed_text = transcript.text.strip()
            logger.info("✅ Audio transcribed successfully")

            # Log usage if db context provided
            if db and organization_id:
                await log_whisper_usage(
                    db=db,
                    organization_id=organization_id,
                    audio_duration_seconds=audio_duration,
                    user_id=user_id,
                    patient_id=patient_id,
                )

            return f"[🎤 AUDIO]: {transcribed_text}"

        finally:
            # Clean up temp file
            import os

            try:
                os.unlink(tmp_path)
            except:
                pass

    except Exception as e:
        logger.error(f"❌ Audio transcription failed: {e}")
        return f"[🎤 AUDIO SIN TRANSCRIBIR] (Error: {str(e)[:50]})"
