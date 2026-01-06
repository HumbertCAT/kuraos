"""
Vertex AI Provider

Google Gemini implementation via Vertex AI SDK.
Uses Application Default Credentials (ADC) for authentication.
Supports text analysis and native audio/multimodal processing.
"""

import asyncio
import tempfile
import os
from typing import Optional

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
        "gemini-2.5-pro": {"input": 1.25, "output": 10.00},
        "gemini-2.5-flash": {"input": 0.15, "output": 0.60},
        "gemini-2.5-flash-lite": {"input": 0.10, "output": 0.40},
        "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
        "gemini-2.0-flash-lite": {"input": 0.075, "output": 0.30},
    }

    # Models that support native audio input
    AUDIO_CAPABLE_MODELS = {
        "gemini-3-pro",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
    }

    _initialized = False

    def __init__(self, model_name: str):
        """
        Initialize Vertex AI provider with specified model.

        Args:
            model_name: Full model name (e.g., 'gemini-2.5-flash')
        """
        self._model_name = model_name
        self._model: Optional[GenerativeModel] = None

        # Initialize Vertex AI SDK once per process
        if not VertexAIProvider._initialized:
            project = settings.GOOGLE_PROJECT_ID
            location = settings.GOOGLE_LOCATION

            if not project:
                raise ValueError(
                    "GOOGLE_PROJECT_ID is not configured. "
                    "Set it in environment or config for Vertex AI."
                )

            vertexai.init(project=project, location=location)
            VertexAIProvider._initialized = True

    @property
    def model(self) -> GenerativeModel:
        """Lazy-load the GenerativeModel."""
        if self._model is None:
            self._model = GenerativeModel(
                model_name=self._model_name,
                safety_settings=[
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
                ],
                generation_config={
                    "temperature": 0.4,
                    "top_p": 0.95,
                    "max_output_tokens": 8192,
                },
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

    async def analyze_text(self, content: str, system_prompt: str) -> AIResponse:
        """
        Analyze text content with system prompt.

        Args:
            content: Text to analyze
            system_prompt: System instructions

        Returns:
            AIResponse with analysis and token counts
        """
        # Vertex AI uses generate_content_async for async
        response = await self.model.generate_content_async([system_prompt, content])

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

    async def analyze_multimodal(
        self, content: bytes, mime_type: str, prompt: str
    ) -> AIResponse:
        """
        Analyze multimodal content (audio, image, document).

        Args:
            content: Binary file content
            mime_type: MIME type of the content
            prompt: Analysis instructions

        Returns:
            AIResponse with analysis and token counts
        """
        # Create Part from binary data
        media_part = Part.from_data(data=content, mime_type=mime_type)

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
