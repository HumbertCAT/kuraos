"""
Gemini AI Provider

Google Gemini implementation via direct API.
Supports text analysis and native audio/multimodal processing.
"""

import os
import tempfile
import asyncio
from typing import Optional

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from app.services.ai.base import AIProvider, AIResponse
from app.core.config import settings


class GeminiProvider(AIProvider):
    """
    Google Gemini provider via direct API (google-generativeai SDK).

    Supports:
        - Text analysis with clinical prompts
        - Native audio analysis (Gemini 2.5+ only)
        - Document/image analysis

    Models:
        - gemini-2.5-flash: Fast, cost-effective, audio support
        - gemini-2.5-pro: Higher quality, complex reasoning
        - gemini-3-pro-preview: Latest preview model
    """

    # Pricing per 1M tokens (USD) - December 2024
    COST_STRUCTURE = {
        "gemini-2.5-flash": {"input": 0.075, "output": 0.30},
        "gemini-2.5-pro": {"input": 1.25, "output": 5.00},
        "gemini-3-pro-preview": {"input": 1.25, "output": 5.00},
        "gemini-2.0-flash": {"input": 0.075, "output": 0.30},
    }

    # Models that support native audio input
    AUDIO_CAPABLE_MODELS = {
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
    }

    def __init__(self, model_name: str):
        """
        Initialize Gemini provider with specified model.

        Args:
            model_name: Full model name (e.g., 'gemini-2.5-flash')
        """
        self._model_name = model_name

        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not configured")

        genai.configure(api_key=settings.GOOGLE_API_KEY)

        # Configure model with clinical-appropriate safety settings
        self._model = genai.GenerativeModel(
            model_name=model_name,
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            },
            generation_config={
                "temperature": 0.4,
                "top_p": 0.95,
                "max_output_tokens": 8192,
            },
        )

    @property
    def provider_id(self) -> str:
        return "vertex-google"

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
        # Run synchronous Gemini call in thread pool
        response = await asyncio.to_thread(
            self._model.generate_content, [system_prompt, content]
        )

        # Extract token counts from usage metadata
        tokens_input = getattr(response.usage_metadata, "prompt_token_count", 0)
        tokens_output = getattr(response.usage_metadata, "candidates_token_count", 0)

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
        # Write content to temp file for upload
        extension = self._get_extension(mime_type)

        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        try:
            # Upload file to Gemini File API
            uploaded_file = await asyncio.to_thread(
                genai.upload_file, temp_path, mime_type=mime_type
            )

            # Wait for file to be processed
            await self._wait_for_file_processing(uploaded_file)

            # Generate analysis
            response = await asyncio.to_thread(
                self._model.generate_content, [prompt, uploaded_file]
            )

            # Cleanup uploaded file
            try:
                await asyncio.to_thread(genai.delete_file, uploaded_file.name)
            except Exception:
                pass  # Ignore cleanup errors

            tokens_input = getattr(response.usage_metadata, "prompt_token_count", 0)
            tokens_output = getattr(
                response.usage_metadata, "candidates_token_count", 0
            )

            return AIResponse(
                text=response.text,
                tokens_input=tokens_input,
                tokens_output=tokens_output,
                model_id=self._model_name,
                provider_id=self.provider_id,
            )

        finally:
            # Clean up temp file
            try:
                os.unlink(temp_path)
            except Exception:
                pass

    async def _wait_for_file_processing(
        self, uploaded_file, max_wait: int = 60
    ) -> None:
        """Wait for Gemini to process uploaded file."""
        import time

        wait_time = 0
        while uploaded_file.state.name == "PROCESSING" and wait_time < max_wait:
            await asyncio.sleep(2)
            wait_time += 2
            uploaded_file = await asyncio.to_thread(genai.get_file, uploaded_file.name)

        if uploaded_file.state.name != "ACTIVE":
            raise RuntimeError(
                f"File processing failed. State: {uploaded_file.state.name}"
            )

    @staticmethod
    def _get_extension(mime_type: str) -> str:
        """Get file extension for MIME type."""
        extensions = {
            "audio/webm": ".webm",
            "audio/mp3": ".mp3",
            "audio/mpeg": ".mp3",
            "audio/wav": ".wav",
            "audio/m4a": ".m4a",
            "audio/flac": ".flac",
            "image/png": ".png",
            "image/jpeg": ".jpg",
            "image/webp": ".webp",
            "application/pdf": ".pdf",
        }
        return extensions.get(mime_type, ".bin")
