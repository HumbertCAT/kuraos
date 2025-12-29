"""
AI Provider Factory

Smart routing factory for selecting the appropriate AI provider
based on model specification and task requirements.
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.ai.base import AIProvider


class ProviderFactory:
    """
    Factory for AI provider selection with smart routing.

    Supports model specifications in two formats:
        - New format: 'provider:model' (e.g., 'gemini:2.5-flash')
        - Legacy format: 'model-name' (e.g., 'gemini-2.5-flash')
    """

    @classmethod
    def get_provider(cls, model_spec: str) -> "AIProvider":
        """
        Get AI provider instance for the given model specification.

        Args:
            model_spec: Model identifier in 'provider:model' or legacy format

        Returns:
            Configured AIProvider instance

        Raises:
            ValueError: If provider is unknown

        Examples:
            >>> ProviderFactory.get_provider('gemini:2.5-flash')
            >>> ProviderFactory.get_provider('gemini-2.5-flash')  # backwards compat
        """
        # Lazy import to avoid circular dependencies
        from app.services.ai.providers.gemini import GeminiProvider

        # Parse model specification
        if ":" in model_spec:
            # New format: provider:model
            provider_name, model_suffix = model_spec.split(":", 1)
            full_model = f"{provider_name}-{model_suffix}"
        else:
            # Legacy format: infer provider from prefix
            full_model = model_spec
            provider_name = model_spec.split("-")[0]

        # Provider registry
        providers = {
            "gemini": GeminiProvider,
            # Phase 3: Add these when implemented
            # "claude": ClaudeProvider,
            # "llama": LlamaProvider,
            # "mistral": MistralProvider,
        }

        provider_class = providers.get(provider_name)
        if not provider_class:
            raise ValueError(
                f"Unknown provider: {provider_name}. "
                f"Available: {list(providers.keys())}"
            )

        return provider_class(full_model)

    @classmethod
    def get_audio_provider(cls, preferred: str) -> "AIProvider":
        """
        Get a provider that supports audio analysis.

        If the preferred provider doesn't support audio,
        falls back to Gemini 2.5 Flash.

        Args:
            preferred: Preferred model specification

        Returns:
            AIProvider that supports audio analysis
        """
        from app.services.ai.providers.gemini import GeminiProvider

        provider = cls.get_provider(preferred)

        if provider.supports_audio():
            return provider

        # Fallback to Gemini for audio tasks
        return GeminiProvider("gemini-2.5-flash")

    @classmethod
    def list_available_models(cls) -> list[dict]:
        """
        List all available models with their capabilities.

        Returns:
            List of model info dicts with id, provider, supports_audio, cost
        """
        from app.services.ai.providers.gemini import GeminiProvider

        models = []

        # Gemini models (2025)
        gemini_models = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.5-flash-lite",
            "gemini-3-pro",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
        ]
        for model_id in gemini_models:
            try:
                provider = GeminiProvider(model_id)
                models.append({
                    "id": model_id,
                    "provider": provider.provider_id,
                    "supports_audio": provider.supports_audio(),
                    "cost": provider.get_cost_structure(),
                })
            except Exception:
                pass  # Skip if model initialization fails

        # Phase 3: Add Claude, Llama, Mistral models

        return models
