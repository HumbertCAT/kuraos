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

        # OpenAI Whisper (audio transcription) - $0.006 per minute
        # Displaying as cost per 1M "tokens" (where 1 token = 1 second)
        # 1M seconds = 16,666 minutes × $0.006 = $100
        models.append({
            "id": "whisper-1",
            "provider": "openai",
            "supports_audio": True,
            "cost": {"input": 6.00, "output": 0},  # $6.00 per 1M seconds ≈ $0.006/min
        })

        # Phase 3: Add Claude, Llama, Mistral models

        return models

    @classmethod
    async def get_provider_for_task(
        cls,
        task_type: str,
        db_session=None,
    ) -> "AIProvider":
        """
        Get the configured AI provider for a specific task type.

        Reads from AI_TASK_ROUTING in system_settings.
        Falls back to gemini-2.5-flash if task not configured.

        Args:
            task_type: The task type (e.g., 'clinical_analysis', 'chat', 'triage')
            db_session: Optional database session (creates one if not provided)

        Returns:
            Configured AIProvider instance for the task

        Examples:
            >>> provider = await ProviderFactory.get_provider_for_task('clinical_analysis')
            >>> provider = await ProviderFactory.get_provider_for_task('triage')  # Uses Pro
        """
        from sqlalchemy import select
        from app.db.models import SystemSetting

        default_model = "gemini-2.5-flash"
        model_id = default_model

        try:
            # Get routing config from database
            if db_session:
                result = await db_session.execute(
                    select(SystemSetting).where(SystemSetting.key == "AI_TASK_ROUTING")
                )
                routing_setting = result.scalar_one_or_none()
            else:
                # Create session if not provided
                from app.db.base import AsyncSessionLocal

                async with AsyncSessionLocal() as session:
                    result = await session.execute(
                        select(SystemSetting).where(
                            SystemSetting.key == "AI_TASK_ROUTING"
                        )
                    )
                    routing_setting = result.scalar_one_or_none()

            if routing_setting and routing_setting.value:
                routing_map = routing_setting.value
                model_id = routing_map.get(task_type, default_model)

        except Exception as e:
            import logging

            logging.getLogger(__name__).warning(
                f"Failed to load task routing, using default: {e}"
            )

        return cls.get_provider(model_id)

    @classmethod
    async def get_routing_config(cls, db_session=None) -> dict:
        """
        Get the current task routing configuration.

        Returns:
            Dict mapping task_type -> model_id
        """
        from sqlalchemy import select
        from app.db.models import SystemSetting

        default_routing = {
            "transcription": "whisper-1",
            "clinical_analysis": "gemini-2.5-flash",
            "chat": "gemini-2.5-flash-lite",
            "triage": "gemini-2.5-pro",
        }

        try:
            if db_session:
                result = await db_session.execute(
                    select(SystemSetting).where(SystemSetting.key == "AI_TASK_ROUTING")
                )
                setting = result.scalar_one_or_none()
            else:
                from app.db.base import AsyncSessionLocal

                async with AsyncSessionLocal() as session:
                    result = await session.execute(
                        select(SystemSetting).where(
                            SystemSetting.key == "AI_TASK_ROUTING"
                        )
                    )
                    setting = result.scalar_one_or_none()

            if setting and setting.value:
                return setting.value

        except Exception:
            pass

        return default_routing
