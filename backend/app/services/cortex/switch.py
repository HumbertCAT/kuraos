"""
Strangler Switch - Feature Flag for Cortex Migration

Controls traffic routing between legacy AletheIA and new Cortex engine.
Implements gradual rollout with configurable percentages.

Usage:
    from app.services.cortex.switch import should_use_cortex, CortexSwitch

    if await should_use_cortex(org_id, "audio_synthesis"):
        # Use CortexOrchestrator
        result = await orchestrator.run_pipeline(...)
    else:
        # Use legacy ProviderFactory
        result = await provider.analyze_multimodal(...)
"""

import logging
import random
from typing import Optional
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)


class SwitchState(str, Enum):
    """Strangler switch states."""

    OFF = "off"  # 100% legacy
    SHADOW = "shadow"  # Cortex runs but result discarded (testing)
    CANARY = "canary"  # Small percentage to Cortex
    ROLLOUT = "rollout"  # Gradual increase
    FULL = "full"  # 100% Cortex


@dataclass
class SwitchConfig:
    """Configuration for strangler switch."""

    state: SwitchState = SwitchState.OFF
    percentage: int = 0  # 0-100 for canary/rollout
    org_allowlist: list[str] = None  # Org IDs for early access
    org_blocklist: list[str] = None  # Org IDs to exclude

    def __post_init__(self):
        self.org_allowlist = self.org_allowlist or []
        self.org_blocklist = self.org_blocklist or []


class CortexSwitch:
    """
    Strangler pattern switch for Cortex migration.

    Controls which requests go to Cortex vs. legacy pipeline.
    Allows for gradual rollout with rollback capability.
    """

    # Default config - start with OFF
    _config: SwitchConfig = SwitchConfig()

    # Task-specific overrides
    _task_configs: dict[str, SwitchConfig] = {}

    # System settings key
    SETTINGS_KEY = "CORTEX_SWITCH_CONFIG"

    @classmethod
    async def should_use_cortex(
        cls,
        org_id: str,
        task_type: str,
        db: AsyncSession = None,
    ) -> bool:
        """
        Determine if a request should use Cortex.

        Args:
            org_id: Organization UUID string
            task_type: AI task type (e.g., "audio_synthesis")
            db: Optional database session for dynamic config

        Returns:
            True if request should use Cortex, False for legacy
        """
        # Load config from database if available
        config = await cls._get_config(task_type, db)

        # Check blocklist first
        if org_id in config.org_blocklist:
            logger.debug(f"Org {org_id} in blocklist, using legacy")
            return False

        # Check allowlist (early access)
        if org_id in config.org_allowlist:
            logger.debug(f"Org {org_id} in allowlist, using Cortex")
            return True

        # State-based routing
        if config.state == SwitchState.OFF:
            return False

        if config.state == SwitchState.FULL:
            return True

        if config.state == SwitchState.SHADOW:
            # Shadow mode: always return False but log that we would use Cortex
            logger.info(f"Shadow mode: would route {task_type} to Cortex")
            return False

        if config.state in (SwitchState.CANARY, SwitchState.ROLLOUT):
            # Percentage-based routing
            roll = random.randint(1, 100)
            should_route = roll <= config.percentage
            logger.debug(
                f"Canary roll: {roll} <= {config.percentage}% = {should_route}"
            )
            return should_route

        return False

    @classmethod
    async def _get_config(cls, task_type: str, db: AsyncSession = None) -> SwitchConfig:
        """Get config for a task type, falling back to default."""
        # Check task-specific override
        if task_type in cls._task_configs:
            return cls._task_configs[task_type]

        # Try loading from database
        if db:
            try:
                from app.db.models import SystemSetting

                result = await db.execute(
                    select(SystemSetting).where(SystemSetting.key == cls.SETTINGS_KEY)
                )
                setting = result.scalar_one_or_none()

                if setting and isinstance(setting.value, dict):
                    # Parse config from JSON
                    data = setting.value

                    # Get task-specific or global config
                    task_data = data.get(task_type, data.get("global", {}))

                    cls._config = SwitchConfig(
                        state=SwitchState(task_data.get("state", "off")),
                        percentage=task_data.get("percentage", 0),
                        org_allowlist=task_data.get("org_allowlist", []),
                        org_blocklist=task_data.get("org_blocklist", []),
                    )
            except Exception as e:
                logger.warning(f"Failed to load switch config: {e}")

        return cls._config

    @classmethod
    def set_state(cls, state: SwitchState, percentage: int = 0):
        """Set global switch state (for testing/admin)."""
        cls._config = SwitchConfig(state=state, percentage=percentage)
        logger.info(f"Cortex switch set to: {state.value} ({percentage}%)")

    @classmethod
    def set_task_state(cls, task_type: str, state: SwitchState, percentage: int = 0):
        """Set switch state for a specific task type."""
        cls._task_configs[task_type] = SwitchConfig(state=state, percentage=percentage)
        logger.info(f"Cortex switch for {task_type}: {state.value} ({percentage}%)")

    @classmethod
    def add_to_allowlist(cls, org_id: str):
        """Add an organization to Cortex early access."""
        if org_id not in cls._config.org_allowlist:
            cls._config.org_allowlist.append(org_id)
            logger.info(f"Added org {org_id} to Cortex allowlist")

    @classmethod
    def remove_from_allowlist(cls, org_id: str):
        """Remove an organization from allowlist."""
        if org_id in cls._config.org_allowlist:
            cls._config.org_allowlist.remove(org_id)
            logger.info(f"Removed org {org_id} from Cortex allowlist")

    @classmethod
    def get_status(cls) -> dict:
        """Get current switch status for monitoring."""
        return {
            "global": {
                "state": cls._config.state.value,
                "percentage": cls._config.percentage,
                "allowlist_count": len(cls._config.org_allowlist),
                "blocklist_count": len(cls._config.org_blocklist),
            },
            "task_overrides": {
                task: {
                    "state": cfg.state.value,
                    "percentage": cfg.percentage,
                }
                for task, cfg in cls._task_configs.items()
            },
        }


# Convenience function
async def should_use_cortex(
    org_id: str,
    task_type: str,
    db: AsyncSession = None,
) -> bool:
    """Shorthand for CortexSwitch.should_use_cortex()"""
    return await CortexSwitch.should_use_cortex(org_id, task_type, db)
