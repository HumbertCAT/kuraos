"""
AI Provider Base Classes

Abstract base class and response dataclass for all AI model providers.
Implements the Provider Pattern for multi-model support.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class AIResponse:
    """Standardized response from any AI provider."""

    text: str
    tokens_input: int
    tokens_output: int
    model_id: str
    provider_id: str


class AIProvider(ABC):
    """
    Abstract base class for all AI model providers.

    Implementations:
        - GeminiProvider: Google Gemini via direct API
        - ClaudeProvider: Anthropic Claude via Vertex AI (Phase 3)
        - LlamaProvider: Meta Llama via Vertex AI (Phase 3)
    """

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """
        Unique identifier for the provider.
        Examples: 'vertex-google', 'vertex-anthropic', 'vertex-meta'
        """
        pass

    @property
    @abstractmethod
    def model_id(self) -> str:
        """
        Full model identifier.
        Examples: 'gemini-2.5-flash', 'claude-3-5-sonnet-v2'
        """
        pass

    @abstractmethod
    async def analyze_text(self, content: str, system_prompt: str) -> AIResponse:
        """
        Analyze text content with a system prompt.

        Args:
            content: The text content to analyze
            system_prompt: System instructions for the model

        Returns:
            AIResponse with analysis text and token counts
        """
        pass

    @abstractmethod
    async def analyze_multimodal(
        self,
        content: Optional[bytes],
        mime_type: str,
        prompt: str,
        gcs_uri: Optional[str] = None,
    ) -> AIResponse:
        """
        Analyze multimodal content (audio, image, document).

        Supports two patterns:
        - INLINE: Pass bytes directly (max 20MB for Vertex AI)
        - REFERENCE: Pass GCS URI for large files (no size limit)

        Args:
            content: Binary content of the file (None if using gcs_uri)
            mime_type: MIME type of the content
            prompt: Analysis instructions
            gcs_uri: Optional GCS path (gs://bucket/path) for large files

        Returns:
            AIResponse with analysis text and token counts
        """
        pass

    def supports_audio(self) -> bool:
        """
        Check if provider supports native audio analysis.

        Override in providers that support direct audio input.
        Used by factory for smart routing.

        Returns:
            True if provider can process audio natively
        """
        return False

    @abstractmethod
    def get_cost_structure(self) -> dict:
        """
        Get pricing structure for this model.

        Returns:
            dict with 'input' and 'output' prices per 1M tokens in USD
            Example: {'input': 0.075, 'output': 0.30}
        """
        pass
