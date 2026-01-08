"""
Vertex AI Provider

Google Gemini implementation via Vertex AI SDK.
Uses Application Default Credentials (ADC) for authentication.
Supports text analysis and native audio/multimodal processing.
"""

import asyncio
import tempfile
import os
import logging
from typing import Optional

import google.auth
import vertexai
from vertexai.generative_models import (
    GenerativeModel,
    Part,
    SafetySetting,
    HarmCategory,
    HarmBlockThreshold,
)

from app.services.ai.base import AIProvider, AIResponse
from app.core.config import settings


logger = logging.getLogger(__name__)


def _resolve_project_id() -> str:
    """
    Resolve Google Cloud project ID with fallback chain.

    Priority:
    1. Explicit GOOGLE_PROJECT_ID env var / settings
    2. Auto-detect from ADC (Application Default Credentials)

    This makes Cloud Run deployments work automatically without
    requiring explicit configuration.
    """
    # Try explicit config first
    if settings.GOOGLE_PROJECT_ID:
        return settings.GOOGLE_PROJECT_ID

    # Fallback: infer from ADC (works in Cloud Run natively)
    try:
        _, project = google.auth.default()
        if project:
            return project
    except Exception:
        pass

    raise ValueError(
        "Could not determine Google Cloud project ID. "
        "Set GOOGLE_PROJECT_ID environment variable or ensure "
        "Application Default Credentials are configured."
    )


class VertexAIProvider(AIProvider):
    """
    Google Gemini provider via Vertex AI SDK.

    Uses ADC (Application Default Credentials) - no API key needed.
    In Cloud Run, authentication is automatic via the service account.

    Supports:
        - Text analysis with clinical prompts
        - Native audio analysis (Gemini 2.5+ only)
        - Document/image analysis

    Models:
        - gemini-2.5-flash: Fast, cost-effective, audio support (DEFAULT)
        - gemini-2.5-pro: Higher quality, complex reasoning
        - gemini-2.5-flash-lite: Ultra-efficient for high throughput
    """

    # Pricing per 1M tokens (USD) - Same as public API
    COST_STRUCTURE = {
        "gemini-3-pro": {"input": 2.00, "output": 12.00},
        "gemini-3-flash": {"input": 0.10, "output": 0.40},
        "gemini-2.5-pro": {"input": 1.25, "output": 10.00},
        "gemini-2.5-flash": {"input": 0.15, "output": 0.60},
        "gemini-2.5-flash-lite": {"input": 0.10, "output": 0.40},
        "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
        "gemini-2.0-flash-lite": {"input": 0.075, "output": 0.30},
    }

    AUDIO_CAPABLE_MODELS = {
        "gemini-3-pro",
        "gemini-3-flash",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
    }

    _initialized = False

    def __init__(
        self,
        model_name: str,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None,
        safety_settings: Optional[dict] = None,
        response_schema: Optional[dict] = None,  # v1.4.9 Crystal Mind: JSON mode
    ):
        """
        Initialize Vertex AI provider with specified model.

        Args:
            model_name: Full model name (e.g., 'gemini-2.5-flash')
            system_instruction: Native system instruction for model persona (ADR-021)
            temperature: Generation temperature (v1.4.5, default 0.7)
            max_output_tokens: Max response tokens (v1.4.5, default 2048)
            safety_settings: Dict mapping HarmCategory -> HarmBlockThreshold (v1.4.5)
            response_schema: Pydantic schema dict for JSON mode (v1.4.9 Crystal Mind)
        """
        self._model_name = model_name
        self._system_instruction = system_instruction
        self._temperature = temperature if temperature is not None else 0.7
        self._max_output_tokens = (
            max_output_tokens if max_output_tokens is not None else 2048
        )
        self._safety_settings = safety_settings  # Dict from ai_governance
        self._response_schema = response_schema  # v1.4.9: JSON structured output
        self._model: Optional[GenerativeModel] = None

        # Initialize Vertex AI SDK once per process
        if not VertexAIProvider._initialized:
            project = _resolve_project_id()
            location = settings.GOOGLE_LOCATION

            vertexai.init(project=project, location=location)
            VertexAIProvider._initialized = True

    @property
    def model(self) -> GenerativeModel:
        """Lazy-load the GenerativeModel with optional system instruction."""
        if self._model is None:
            # v1.4.5: Build safety settings from governance config or use defaults
            if self._safety_settings:
                safety_list = [
                    SafetySetting(category=category, threshold=threshold)
                    for category, threshold in self._safety_settings.items()
                ]
            else:
                # Default: permissive for clinical content
                safety_list = [
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold=HarmBlockThreshold.OFF,
                    ),
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold=HarmBlockThreshold.OFF,
                    ),
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold=HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    ),
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold=HarmBlockThreshold.OFF,
                    ),
                ]

            # v1.4.9: Build generation config with optional JSON mode
            gen_config = {
                "temperature": self._temperature,
                "top_p": 0.95,
                "max_output_tokens": self._max_output_tokens,
            }

            # Crystal Mind: Enable JSON structured output
            if self._response_schema:
                gen_config["response_mime_type"] = "application/json"
                gen_config["response_schema"] = self._response_schema

            self._model = GenerativeModel(
                model_name=self._model_name,
                system_instruction=self._system_instruction,  # ADR-021: Native
                safety_settings=safety_list,
                generation_config=gen_config,
            )
        return self._model

    @property
    def provider_id(self) -> str:
        """Unique provider identifier for logging/billing."""
        return "vertex_ai"  # Distinct from legacy "google" for observability

    @property
    def model_id(self) -> str:
        return self._model_name

    def supports_audio(self) -> bool:
        """Gemini 2.5+ supports native audio analysis."""
        return self._model_name in self.AUDIO_CAPABLE_MODELS

    def get_cost_structure(self) -> dict:
        """Get pricing for this model."""
        return self.COST_STRUCTURE.get(
            self._model_name,
            {"input": 0.10, "output": 0.40},  # Default fallback
        )

    async def analyze_text(self, content: str, system_prompt: str = None) -> AIResponse:
        """
        Analyze text content with system prompt.

        v1.4.4: Supports two patterns:
        - NATIVE: system_instruction set in constructor (preferred)
        - LEGACY: system_prompt passed as parameter (backwards compat)

        Args:
            content: Text to analyze
            system_prompt: System instructions (optional if using native)

        Returns:
            AIResponse with analysis and token counts
        """
        # Build content parts
        if self._system_instruction:
            # ADR-021: System instruction is native, just send content
            parts = [content]
        elif system_prompt:
            # Legacy: concatenate prompt with content
            parts = [system_prompt, content]
        else:
            # No instruction at all
            parts = [content]

        response = await self.model.generate_content_async(parts)

        # Extract token counts from usage metadata
        usage = response.usage_metadata
        tokens_input = usage.prompt_token_count if usage else 0
        tokens_output = usage.candidates_token_count if usage else 0

        return AIResponse(
            text=response.text,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            model_id=self._model_name,
            provider_id=self.provider_id,
        )

    async def _read_local_file(self, path_uri: str) -> bytes:
        """Helper to read local files from /static/uploads/ or direct paths."""
        import aiofiles
        from pathlib import Path

        # Handle /static/uploads/ paths by prepending the static directory
        if path_uri.startswith("/static/"):
            # In production, static files are served from backend/static/ or /app/static
            local_path = Path("/app/static") / path_uri.replace("/static/", "")
            if not local_path.exists():
                local_path = Path("static") / path_uri.replace("/static/", "")
        else:
            local_path = Path(path_uri)

        if not local_path.exists():
            import os

            # v1.5.9-hf1: Enhanced logging for path resolution
            abs_path = local_path.absolute()
            cwd = os.getcwd()
            logger.error(
                f"❌ Local file NOT FOUND: {local_path} (Absolute: {abs_path}, CWD: {cwd})"
            )
            raise FileNotFoundError(
                f"Local file not found for AI analysis: {local_path}"
            )

        logger.info(f"📂 Reading local file for AI: {local_path}")
        async with aiofiles.open(local_path, "rb") as f:
            return await f.read()

    async def analyze_image(self, image_uri: str, prompt: str) -> dict:
        """
        Analyze an image for OCR or clinical document understanding.

        Supports GCS URIs and Local Paths.
        """
        import mimetypes

        # Determine mime type robustly
        mime_type, _ = mimetypes.guess_type(image_uri)
        if not mime_type:
            ext = image_uri.lower().rsplit(".", 1)[-1] if "." in image_uri else "png"
            mime_type = f"image/{ext}" if ext != "pdf" else "application/pdf"

        if image_uri.startswith("gs://"):
            response = await self.analyze_multimodal(
                content=None, mime_type=mime_type, prompt=prompt, gcs_uri=image_uri
            )
        else:
            content = await self._read_local_file(image_uri)
            response = await self.analyze_multimodal(
                content=content, mime_type=mime_type, prompt=prompt, gcs_uri=None
            )

        return {
            "text": response.text,
            "document_type": "clinical_document",
            "confidence": 0.95,
        }

    async def analyze_multimodal(
        self,
        content: Optional[bytes],
        mime_type: str,
        prompt: str,
        gcs_uri: Optional[str] = None,
    ) -> AIResponse:
        """
        Analyze multimodal content via Bytes (Inline) or GCS URI (Reference).

        Supports two patterns:
        - INLINE: For files <20MB, pass bytes directly (fast, no GCS needed)
        - REFERENCE: For files >20MB, upload to GCS first, pass gs:// URI

        Args:
            content: Binary content (max 20MB). None if using gcs_uri.
            mime_type: MIME type (e.g., 'audio/mp3', 'image/png')
            prompt: Analysis instructions
            gcs_uri: GCS path (gs://bucket/path). No size limit. Preferred for audio.

        Returns:
            AIResponse with analysis and token counts

        Examples:
            # Small image (inline)
            await provider.analyze_multimodal(image_bytes, "image/png", "Describe")

            # Large audio session (reference)
            await provider.analyze_multimodal(
                content=None,
                mime_type="audio/mp3",
                prompt="Transcribe and analyze",
                gcs_uri="gs://kura-production-vault/audio/session_123.mp3"
            )
        """
        if gcs_uri:
            # ✅ REFERENCE PATTERN: For large files stored in GCS
            # Vertex reads directly from bucket (data sovereignty)
            media_part = Part.from_uri(uri=gcs_uri, mime_type=mime_type)
        elif content:
            # ⚠️ INLINE PATTERN: For small files (<20MB)
            media_part = Part.from_data(data=content, mime_type=mime_type)
        else:
            raise ValueError("Must provide either 'content' bytes or 'gcs_uri'.")

        # Generate analysis
        response = await self.model.generate_content_async([prompt, media_part])

        usage = response.usage_metadata
        tokens_input = usage.prompt_token_count if usage else 0
        tokens_output = usage.candidates_token_count if usage else 0

        return AIResponse(
            text=response.text,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            model_id=self._model_name,
            provider_id=self.provider_id,
        )

    async def transcribe_audio(self, audio_uri: str, language: str = "es") -> dict:
        """
        Transcribe audio from a GCS URI or local file path.

        v1.5.9: Uses Gemini's native audio understanding for transcription.
        Supports both GCS URIs (gs://) and local paths (/static/uploads/).

        Model Routing (Cognitive Integrity):
        - Files > 15MB (~15 min) are routed to gemini-2.5-pro.
        - Files <= 15MB use the default model (Flash).
        """
        # Determine mime type from URI extension
        mime_map = {
            ".mp3": "audio/mp3",
            ".m4a": "audio/mp4",
            ".wav": "audio/wav",
            ".ogg": "audio/ogg",
            ".webm": "audio/webm",
            ".flac": "audio/flac",
        }
        ext = audio_uri.lower().rsplit(".", 1)[-1] if "." in audio_uri else "mp3"
        mime_type = mime_map.get(f".{ext}", "audio/mp3")

        transcription_prompt = f"""Transcribe this audio file completely and accurately.
Output ONLY the verbatim transcription text, nothing else.
Language: {language}
Do not add any explanations, timestamps, or speaker labels.
Just output the exact words spoken."""

        # Check if GCS URI or local path
        if audio_uri.startswith("gs://"):
            # v1.5.9-hf9: Unified Pro Routing
            logger.info(f"🚀 Processing GCS audio ({audio_uri}) via Gemini 2.5 Pro")
            pro_model = GenerativeModel("gemini-2.5-pro")
            media_part = Part.from_uri(uri=audio_uri, mime_type=mime_type)

            response = await pro_model.generate_content_async([
                transcription_prompt,
                media_part,
            ])

            return {
                "text": response.text,
                "duration": None,
                "language": language,
                "model_id": "gemini-2.5-pro",
                "tokens_input": getattr(
                    response.usage_metadata, "prompt_token_count", 0
                ),
                "tokens_output": getattr(
                    response.usage_metadata, "candidates_token_count", 0
                ),
            }
        else:
            # Local path: Read bytes via helper
            content = await self._read_local_file(audio_uri)

            # Routing Logic: > 15MB (approx 15 min at 128kbps) -> Switch to PRO
            if len(content) > 15 * 1024 * 1024 and "pro" not in self._model_name:
                logger.info(
                    f"🔄 Routing long audio ({len(content)} bytes) to gemini-2.5-pro"
                )
                pro_model = GenerativeModel("gemini-2.5-pro")

                try:
                    media_part = Part.from_data(data=content, mime_type=mime_type)
                    resp = await pro_model.generate_content_async([
                        transcription_prompt,
                        media_part,
                    ])

                    return {
                        "text": resp.text,
                        "duration": None,
                        "language": language,
                        "model_id": "gemini-2.5-pro",
                        "tokens_input": getattr(
                            resp.usage_metadata, "prompt_token_count", 0
                        ),
                        "tokens_output": getattr(
                            resp.usage_metadata, "candidates_token_count", 0
                        ),
                    }
                except Exception as e:
                    logger.warning(
                        f"⚠️ Routing to Pro failed ({e}). Falling back to {self._model_name}"
                    )
                    # Proceed to default logic below

            # Default logic (Flash)
            response = await self.analyze_multimodal(
                content=content,
                mime_type=mime_type,
                prompt=transcription_prompt,
                gcs_uri=None,
            )

        return {
            "text": response.text,
            "duration": None,  # Gemini doesn't provide duration directly
            "language": language,
        }
