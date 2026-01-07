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
    def get_provider(
        cls,
        model_spec: str,
        system_instruction: str = None,
        temperature: float = None,
        max_output_tokens: int = None,
        safety_settings: dict = None,
    ) -> "AIProvider":
        """
        Get AI provider instance for the given model specification.

        Args:
            model_spec: Model identifier in 'provider:model' or legacy format
            system_instruction: Native system instruction for model (ADR-021)
            temperature: Generation temperature (v1.4.5)
            max_output_tokens: Max response tokens (v1.4.5)
            safety_settings: Vertex AI safety settings dict (v1.4.5)

        Returns:
            Configured AIProvider instance

        Raises:
            ValueError: If provider is unknown

        Examples:
            >>> ProviderFactory.get_provider('gemini:2.5-flash')
            >>> ProviderFactory.get_provider('gemini-2.5-flash')  # backwards compat
        """
        # Lazy imports to avoid circular dependencies
        from app.core.config import settings

        # Parse model specification
        if ":" in model_spec:
            # New format: provider:model
            provider_name, model_suffix = model_spec.split(":", 1)
            full_model = f"{provider_name}-{model_suffix}"
        else:
            # Legacy format: infer provider from prefix
            full_model = model_spec
            provider_name = model_spec.split("-")[0]

        # v1.4.0: Route Gemini models through Vertex AI when enabled
        if settings.VERTEX_AI_ENABLED and provider_name == "gemini":
            from app.services.ai.providers.vertex import VertexAIProvider

            return VertexAIProvider(
                full_model,
                system_instruction=system_instruction,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                safety_settings=safety_settings,
            )

        # Legacy path: Direct API via google-generativeai
        from app.services.ai.providers.gemini import GeminiProvider

        # Provider registry (for non-Gemini models in future)
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
        prompt_context: dict = None,
    ) -> "AIProvider":
        """
        Get the configured AI provider for a specific task type.

        v1.4.4: Now renders system_instruction from Jinja2 templates.

        Args:
            task_type: The task type (e.g., 'clinical_analysis', 'chat', 'triage')
            db_session: Optional database session (creates one if not provided)
            prompt_context: Variables to inject into prompt template

        Returns:
            Configured AIProvider instance for the task

        Examples:
            >>> provider = await ProviderFactory.get_provider_for_task('clinical_analysis')
            >>> provider = await ProviderFactory.get_provider_for_task('triage')  # Uses Pro
        """
        from sqlalchemy import select
        from app.db.models import SystemSetting
        from app.services.ai_governance import get_task_config

        default_model = "gemini-2.5-flash"
        model_id = default_model
        temperature = None
        max_tokens = None
        safety_settings = None
        db_template = None  # v1.4.6: Editable prompt template

        try:
            # v1.4.5: Get config from ai_governance service (cached + fallback)
            if db_session:
                task_config = await get_task_config(db_session, task_type)
                model_id = task_config.get("model_id", default_model)
                temperature = task_config.get("temperature")
                max_tokens = task_config.get("max_output_tokens")
                safety_settings = task_config.get("safety_settings")
                db_template = task_config.get("system_prompt_template")  # v1.4.6
            else:
                # Fallback to routing config if no session
                from app.db.base import get_session_factory

                factory = get_session_factory()
                async with factory() as session:
                    task_config = await get_task_config(session, task_type)
                    model_id = task_config.get("model_id", default_model)
                    temperature = task_config.get("temperature")
                    max_tokens = task_config.get("max_output_tokens")
                    safety_settings = task_config.get("safety_settings")
                    db_template = task_config.get("system_prompt_template")  # v1.4.6

        except Exception as e:
            import logging

            logging.getLogger(__name__).warning(
                f"Failed to load task config, using defaults: {e}"
            )

        # v1.4.4: Render system instruction from template
        # v1.4.6: Now supports DB-stored editable templates
        from app.services.ai.render import get_system_prompt

        system_instruction = get_system_prompt(
            task_type, prompt_context, db_template=db_template
        )

        # v1.4.5: Pass temperature, max_tokens, safety_settings to provider
        return cls.get_provider(
            model_id,
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_tokens,
            safety_settings=safety_settings,
        )

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
            "briefing": "gemini-2.5-flash",
            "ai_enhancement": "gemini-2.5-flash-lite",
        }

        try:
            if db_session:
                result = await db_session.execute(
                    select(SystemSetting).where(SystemSetting.key == "AI_TASK_ROUTING")
                )
                setting = result.scalar_one_or_none()
            else:
                from app.db.base import get_session_factory

                factory = get_session_factory()
                async with factory() as session:
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
