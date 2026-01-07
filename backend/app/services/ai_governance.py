"""AI Governance Service for v1.4.5 - Runtime Task Configuration.

Provides:
- Cached config retrieval (LRU with TTL)
- Safety mode mapping to Vertex AI constants
- Fallback to hardcoded defaults
- Change history tracking
"""

from datetime import datetime
from decimal import Decimal
from functools import lru_cache
from typing import Optional

from cachetools import TTLCache
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AiTaskConfig, AiTaskConfigHistory, SafetyMode, User

import logging

logger = logging.getLogger(__name__)


# =============================================================================
# Constants
# =============================================================================

# LRU Cache with 5-minute TTL (300 seconds)
_config_cache: TTLCache = TTLCache(maxsize=50, ttl=300)


def get_safety_mapping(safety_mode: SafetyMode) -> dict:
    """Get Vertex AI safety settings for a safety mode.

    Uses lazy import to avoid import errors when Vertex AI SDK not available.
    """
    try:
        from vertexai.generative_models import HarmCategory, HarmBlockThreshold

        mappings = {
            SafetyMode.CLINICAL: {
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            SafetyMode.STANDARD: {
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            SafetyMode.STRICT: {
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
        }
        return mappings.get(safety_mode, mappings[SafetyMode.CLINICAL])
    except ImportError:
        logger.warning("Vertex AI SDK not available, returning empty safety settings")
        return {}


# Hardcoded fallback defaults (Architect Clause #3)
DEFAULT_CONFIGS = {
    "clinical_analysis": {
        "model_id": "gemini-2.5-pro",
        "temperature": Decimal("0.70"),
        "max_output_tokens": 4096,
        "safety_mode": SafetyMode.CLINICAL,
    },
    "audio_synthesis": {
        "model_id": "gemini-2.5-flash",
        "temperature": Decimal("0.70"),
        "max_output_tokens": 4096,
        "safety_mode": SafetyMode.CLINICAL,
    },
    "document_analysis": {
        "model_id": "gemini-2.5-flash",
        "temperature": Decimal("0.70"),
        "max_output_tokens": 2048,
        "safety_mode": SafetyMode.CLINICAL,
    },
    "form_analysis": {
        "model_id": "gemini-2.5-flash",
        "temperature": Decimal("0.70"),
        "max_output_tokens": 2048,
        "safety_mode": SafetyMode.CLINICAL,
    },
    "triage": {
        "model_id": "gemini-2.5-flash",
        "temperature": Decimal("0.50"),
        "max_output_tokens": 2048,
        "safety_mode": SafetyMode.CLINICAL,
    },
    "chat": {
        "model_id": "gemini-2.5-flash",
        "temperature": Decimal("0.70"),
        "max_output_tokens": 2048,
        "safety_mode": SafetyMode.CLINICAL,
    },
    "help_bot": {
        "model_id": "gemini-2.5-flash-lite",
        "temperature": Decimal("0.30"),
        "max_output_tokens": 1024,
        "safety_mode": SafetyMode.STRICT,
    },
    "transcription": {
        "model_id": "gemini-2.5-flash",
        "temperature": Decimal("0.30"),
        "max_output_tokens": 4096,
        "safety_mode": SafetyMode.CLINICAL,
    },
    "briefing": {
        "model_id": "gemini-2.5-flash",
        "temperature": Decimal("0.70"),
        "max_output_tokens": 2048,
        "safety_mode": SafetyMode.CLINICAL,
    },
}


# =============================================================================
# Config Retrieval (with Cache + Fallback)
# =============================================================================


async def get_task_config(db: AsyncSession, task_type: str) -> dict:
    """Get AI config for a task type with caching and fallback.

    Priority:
    1. LRU Cache (if not expired)
    2. Database lookup
    3. Hardcoded defaults (fallback)

    Returns dict with: model_id, temperature, max_output_tokens, safety_settings
    """
    # Check cache first (Architect Clause #2)
    if task_type in _config_cache:
        logger.debug(f"Config cache hit for {task_type}")
        return _config_cache[task_type]

    # Try database
    try:
        result = await db.execute(
            select(AiTaskConfig).where(AiTaskConfig.task_type == task_type)
        )
        config = result.scalar_one_or_none()

        if config:
            config_dict = {
                "model_id": config.model_id,
                "temperature": float(config.temperature),
                "max_output_tokens": config.max_output_tokens,
                "safety_settings": get_safety_mapping(config.safety_mode),
                "system_prompt_template": config.system_prompt_template,  # v1.4.6
            }
            _config_cache[task_type] = config_dict
            logger.debug(f"Loaded config from DB for {task_type}")
            return config_dict
    except Exception as e:
        logger.warning(f"Failed to load config from DB for {task_type}: {e}")

    # Fallback to defaults (Architect Clause #3)
    defaults = DEFAULT_CONFIGS.get(task_type, DEFAULT_CONFIGS["clinical_analysis"])
    config_dict = {
        "model_id": defaults["model_id"],
        "temperature": float(defaults["temperature"]),
        "max_output_tokens": defaults["max_output_tokens"],
        "safety_settings": get_safety_mapping(defaults["safety_mode"]),
    }
    logger.info(f"Using fallback config for {task_type}")
    return config_dict


def invalidate_cache(task_type: Optional[str] = None) -> None:
    """Invalidate config cache, optionally for a specific task."""
    if task_type:
        _config_cache.pop(task_type, None)
        logger.info(f"Invalidated cache for {task_type}")
    else:
        _config_cache.clear()
        logger.info("Invalidated all config cache")


# =============================================================================
# Config Management
# =============================================================================


async def update_task_config(
    db: AsyncSession,
    task_type: str,
    user: User,
    model_id: Optional[str] = None,
    temperature: Optional[float] = None,
    max_output_tokens: Optional[int] = None,
    safety_mode: Optional[SafetyMode] = None,
    system_prompt_template: Optional[str] = None,  # v1.4.6
) -> AiTaskConfig:
    """Update task config and log changes to history."""

    result = await db.execute(
        select(AiTaskConfig).where(AiTaskConfig.task_type == task_type)
    )
    config = result.scalar_one_or_none()

    if not config:
        # Create new config
        config = AiTaskConfig(
            task_type=task_type,
            model_id=model_id
            or DEFAULT_CONFIGS.get(task_type, {}).get("model_id", "gemini-2.5-flash"),
            temperature=Decimal(str(temperature)) if temperature else Decimal("0.70"),
            max_output_tokens=max_output_tokens or 2048,
            safety_mode=safety_mode or SafetyMode.CLINICAL,
            system_prompt_template=system_prompt_template,  # v1.4.6
            updated_by_id=user.id,
        )
        db.add(config)
    else:
        # Update existing config and log changes
        changes = []

        if model_id is not None and config.model_id != model_id:
            changes.append(("model_id", config.model_id, model_id))
            config.model_id = model_id

        if temperature is not None and float(config.temperature) != temperature:
            changes.append(("temperature", str(config.temperature), str(temperature)))
            config.temperature = Decimal(str(temperature))

        if (
            max_output_tokens is not None
            and config.max_output_tokens != max_output_tokens
        ):
            changes.append((
                "max_output_tokens",
                str(config.max_output_tokens),
                str(max_output_tokens),
            ))
            config.max_output_tokens = max_output_tokens

        if safety_mode is not None and config.safety_mode != safety_mode:
            changes.append(("safety_mode", config.safety_mode.value, safety_mode.value))
            config.safety_mode = safety_mode

        # v1.4.6: Update prompt template
        if (
            system_prompt_template is not None
            and config.system_prompt_template != system_prompt_template
        ):
            old_preview = (config.system_prompt_template or "")[:50]
            new_preview = system_prompt_template[:50]
            changes.append((
                "system_prompt_template",
                f"{old_preview}...",
                f"{new_preview}...",
            ))
            config.system_prompt_template = system_prompt_template

        config.updated_by_id = user.id

        # Log all changes to history
        for field, old_val, new_val in changes:
            history = AiTaskConfigHistory(
                task_type=task_type,
                field_changed=field,
                old_value=old_val,
                new_value=new_val,
                changed_by_id=user.id,
            )
            db.add(history)

    await db.commit()
    await db.refresh(config)

    # Invalidate cache
    invalidate_cache(task_type)

    return config


async def get_task_config_history(
    db: AsyncSession, task_type: str, limit: int = 20
) -> list[AiTaskConfigHistory]:
    """Get recent config changes for a task."""
    result = await db.execute(
        select(AiTaskConfigHistory)
        .where(AiTaskConfigHistory.task_type == task_type)
        .order_by(AiTaskConfigHistory.changed_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_all_task_configs(db: AsyncSession) -> list[AiTaskConfig]:
    """Get all task configs."""
    result = await db.execute(select(AiTaskConfig).order_by(AiTaskConfig.task_type))
    return list(result.scalars().all())
