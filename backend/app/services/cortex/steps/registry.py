"""
Step Registry - Factory for creating pipeline steps.

Maps step type strings from AIPipelineConfig.stages to
actual step implementations.
"""

from typing import Dict, Type, TYPE_CHECKING

from app.services.cortex.steps.base import PipelineStep

if TYPE_CHECKING:
    pass

# Registry of step type → step class
_STEP_REGISTRY: Dict[str, Type[PipelineStep]] = {}


def register_step(step_type: str):
    """
    Decorator to register a step class.

    Usage:
        @register_step("transcribe")
        class TranscribeStep(PipelineStep):
            ...
    """

    def decorator(cls: Type[PipelineStep]):
        cls.step_type = step_type
        _STEP_REGISTRY[step_type] = cls
        return cls

    return decorator


def get_step(step_type: str) -> PipelineStep:
    """
    Get a step instance by type.

    Args:
        step_type: The type identifier (e.g., "transcribe", "analyze")

    Returns:
        An instance of the registered step class

    Raises:
        ValueError: If the step type is not registered
    """
    if step_type not in _STEP_REGISTRY:
        available = ", ".join(_STEP_REGISTRY.keys())
        raise ValueError(f"Unknown step type '{step_type}'. Available: {available}")
    return _STEP_REGISTRY[step_type]()


def list_steps() -> Dict[str, Type[PipelineStep]]:
    """Get all registered steps."""
    return _STEP_REGISTRY.copy()
