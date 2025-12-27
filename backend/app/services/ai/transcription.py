"""
Vertex AI Speech Transcription Service

High-quality audio transcription using Vertex AI Speech-to-Text v2 (Chirp USM).
Provides multilingual support with state-of-the-art accuracy.
"""

import asyncio
from typing import Optional
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class TranscriptionResult:
    """Result from audio transcription."""

    text: str
    confidence: float
    language: str
    duration_seconds: Optional[float] = None


class TranscriptionService:
    """
    Audio transcription using Vertex AI Speech-to-Text v2.

    Uses the Chirp (USM) model for state-of-the-art multilingual transcription.

    Features:
        - Auto-language detection (Spanish, English, etc.)
        - Automatic punctuation
        - High accuracy on diverse accents
        - No local GPU/RAM requirements

    Alternative: For sessions where only AI insights are needed (not full transcription),
    use GeminiProvider.analyze_multimodal() for direct audio analysis.
    """

    def __init__(self):
        """Initialize Speech-to-Text client."""
        self._client = None
        self._project_id = getattr(settings, "GCP_PROJECT_ID", None)
        self._region = getattr(settings, "GCP_REGION", "us-central1")

    @property
    def client(self):
        """Lazy-load Speech client."""
        if self._client is None:
            try:
                from google.cloud import speech_v2 as speech

                self._client = speech.SpeechClient()
            except ImportError:
                raise ImportError(
                    "google-cloud-speech is required for transcription. "
                    "Install with: pip install google-cloud-speech"
                )
        return self._client

    async def transcribe(
        self,
        audio_content: bytes,
        mime_type: str,
        language_hints: list[str] = None,
    ) -> TranscriptionResult:
        """
        Transcribe audio using Chirp (USM) model.

        Args:
            audio_content: Binary audio data
            mime_type: MIME type of audio (audio/webm, audio/mp3, etc.)
            language_hints: Optional language hints (e.g., ["es-ES", "en-US"])

        Returns:
            TranscriptionResult with text, confidence, and detected language
        """
        from google.cloud import speech_v2 as speech

        if not self._project_id:
            raise ValueError(
                "GCP_PROJECT_ID is required for Vertex AI Speech. "
                "Set it in your environment configuration."
            )

        # Default to Spanish + English if no hints provided
        language_codes = language_hints or ["es-ES", "en-US", "ca-ES"]

        # Configure recognition
        config = speech.RecognitionConfig(
            auto_decoding_config=speech.AutoDetectDecodingConfig(),
            language_codes=language_codes,
            model="chirp_2",  # Vertex AI Universal Speech Model
            features=speech.RecognitionFeatures(
                enable_automatic_punctuation=True,
            ),
        )

        # Use global recognizer for best availability
        recognizer = f"projects/{self._project_id}/locations/global/recognizers/_"

        request = speech.RecognizeRequest(
            recognizer=recognizer,
            config=config,
            content=audio_content,
        )

        # Run synchronous API call in thread pool
        response = await asyncio.to_thread(self.client.recognize, request)

        # Extract results
        if not response.results:
            return TranscriptionResult(
                text="",
                confidence=0.0,
                language="unknown",
            )

        # Concatenate all transcript parts
        full_text = " ".join([
            result.alternatives[0].transcript
            for result in response.results
            if result.alternatives
        ])

        # Get confidence and language from first result
        first_result = response.results[0]
        confidence = (
            first_result.alternatives[0].confidence
            if first_result.alternatives
            else 0.0
        )
        language = getattr(first_result, "language_code", "unknown")

        return TranscriptionResult(
            text=full_text.strip(),
            confidence=confidence,
            language=language,
        )

    async def transcribe_long_audio(
        self,
        gcs_uri: str,
        language_hints: list[str] = None,
    ) -> TranscriptionResult:
        """
        Transcribe long audio files (>1 minute) from Cloud Storage.

        For audio files longer than 60 seconds, use this method with
        the audio stored in Google Cloud Storage.

        Args:
            gcs_uri: GCS URI (e.g., "gs://bucket/audio.webm")
            language_hints: Optional language hints

        Returns:
            TranscriptionResult with full transcription
        """
        from google.cloud import speech_v2 as speech

        if not self._project_id:
            raise ValueError("GCP_PROJECT_ID is required")

        language_codes = language_hints or ["es-ES", "en-US"]

        config = speech.RecognitionConfig(
            auto_decoding_config=speech.AutoDetectDecodingConfig(),
            language_codes=language_codes,
            model="chirp_2",
            features=speech.RecognitionFeatures(
                enable_automatic_punctuation=True,
            ),
        )

        recognizer = f"projects/{self._project_id}/locations/global/recognizers/_"

        # For long audio, use BatchRecognize
        files = [speech.BatchRecognizeFileMetadata(uri=gcs_uri)]

        request = speech.BatchRecognizeRequest(
            recognizer=recognizer,
            config=config,
            files=files,
            recognition_output_config=speech.RecognitionOutputConfig(
                inline_response_config=speech.InlineOutputConfig(),
            ),
        )

        # BatchRecognize returns a long-running operation
        operation = await asyncio.to_thread(self.client.batch_recognize, request)

        # Wait for completion (this can take several minutes for long audio)
        response = await asyncio.to_thread(operation.result, timeout=600)

        # Extract results from batch response
        all_text = []
        for file_result in response.results.values():
            for result in file_result.transcript.results:
                if result.alternatives:
                    all_text.append(result.alternatives[0].transcript)

        return TranscriptionResult(
            text=" ".join(all_text).strip(),
            confidence=0.9,  # Batch doesn't return per-segment confidence
            language=language_codes[0],
        )


# Singleton instance
_transcription_service: Optional[TranscriptionService] = None


def get_transcription_service() -> TranscriptionService:
    """Get or create the TranscriptionService instance."""
    global _transcription_service

    if _transcription_service is None:
        _transcription_service = TranscriptionService()

    return _transcription_service
