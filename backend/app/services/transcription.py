"""Audio Transcription Service using OpenAI Whisper.

Transcribes WhatsApp audio messages for AletheIA analysis.
"""

import logging
import tempfile
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


def is_audio_message(content_type: Optional[str]) -> bool:
    """Check if the content type is a supported audio format."""
    if not content_type:
        return False
    # Handle content types with parameters (e.g., "audio/ogg; codecs=opus")
    base_type = content_type.split(";")[0].strip().lower()
    return base_type.startswith("audio/")


async def transcribe_audio(media_url: str, twilio_auth: tuple = None) -> str:
    """
    Download audio from Twilio and transcribe using OpenAI Whisper.

    Args:
        media_url: URL to the audio file from Twilio
        twilio_auth: Optional (account_sid, auth_token) for authenticated download

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
