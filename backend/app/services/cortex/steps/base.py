"""
Pipeline Step Interface - Abstract Base Class

All pipeline steps must implement this interface to be
orchestrated by the CortexOrchestrator.
"""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.cortex.context import PatientEventContext


class PipelineStep(ABC):
    """
    Abstract base class for all pipeline stages.

    Each step receives the shared PatientEventContext and
    writes its outputs back to it. Steps read from
    `context.get_secure_payload()` and write via
    `context.add_output()`.

    Implementations:
    - TranscribeStep: Audio → Text
    - AnalyzeStep: Text → SOAP/Insights
    - OCRStep: Image → Text
    - TriageStep: Text → Risk Assessment
    """

    # Unique identifier for this step type
    step_type: str = "base"

    @abstractmethod
    async def execute(self, context: "PatientEventContext") -> None:
        """
        Execute the pipeline step.

        Args:
            context: Shared execution context with resources and outputs.
                    Read input via context.get_secure_payload("perception")
                    Write output via context.add_output(self.step_type, key, value)

        Raises:
            StepExecutionError: If the step fails
        """
        pass

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} step_type={self.step_type}>"


class StepExecutionError(Exception):
    """Raised when a pipeline step fails execution."""

    def __init__(self, step_type: str, message: str, cause: Exception = None):
        self.step_type = step_type
        self.cause = cause
        super().__init__(f"Step '{step_type}' failed: {message}")
