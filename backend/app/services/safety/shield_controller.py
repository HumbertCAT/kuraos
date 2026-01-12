"""
NextGenShieldController: The Orchestrator
==========================================
Main entry point for Next-Gen Shield (WU-016).

Coordinates PrivacyShield (Layer 1) and SemanticShield (Layer 2)
to provide complete protection for clinical AI inference.

Usage:
    from app.services.safety import NextGenShieldController

    shield = NextGenShieldController(project_id="kura-os-prod")

    # Process input before LLM
    shielded = await shield.process_input(
        raw_text="Me llamo Juan y quiero acabar con todo",
        unit="sentinel",
    )
    # shielded.sanitized_text = "Me llamo [PERSON_NAME] y quiero acabar con todo"

    # Get safety settings for generation
    settings = shield.get_generation_safety_settings("sentinel")
"""

import logging
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from uuid import UUID

from .privacy_shield import PrivacyShield, SanitizedResult
from .semantic_shield import SemanticShield, HarmCategory, HarmBlockThreshold

logger = logging.getLogger(__name__)


@dataclass
class ShieldedInput:
    """Result of input processing through Shield."""

    sanitized_text: str
    pii_detected: bool
    pii_types: List[str]
    ready_for_inference: bool
    original_length: int
    sanitized_length: int


@dataclass
class ShieldedOutput:
    """Result of output processing through Shield."""

    text: str
    safety_passed: bool
    risk_level: str  # "low", "medium", "high"


class NextGenShieldController:
    """
    Orchestrator for Next-Gen Shield.

    Combines:
    - Layer 1: PrivacyShield (Cloud DLP) for PII sanitization
    - Layer 2: SemanticShield (Vertex AI Safety) for harm detection

    Implements fail-safe logic: If DLP fails, continues with warning (fail-open).
    """

    def __init__(self, project_id: Optional[str] = None):
        """
        Initialize NextGenShieldController.

        Args:
            project_id: GCP project ID. If None, uses environment default.
        """
        import os

        self.project_id = project_id or os.environ.get(
            "GOOGLE_CLOUD_PROJECT", "kura-os-prod"
        )

        # Initialize both shields
        self.privacy_shield = PrivacyShield(self.project_id)
        self.semantic_shield = SemanticShield()

        logger.info(
            f"[NextGenShieldController] Initialized for project: {self.project_id}"
        )

    async def process_input(
        self,
        raw_text: str,
        unit: str,
        patient_id: Optional[UUID] = None,
    ) -> ShieldedInput:
        """
        Process input through Layer 1 (Privacy Shield).

        Sanitizes PII before the text reaches the LLM.

        Args:
            raw_text: Raw user/patient input
            unit: AletheIA unit name (affects logging)
            patient_id: For audit logging

        Returns:
            ShieldedInput with sanitized text and metadata
        """
        # Layer 1: Privacy Shield (PII sanitization)
        sanitized = await self.privacy_shield.sanitize_input(raw_text)

        # Audit log if PII detected
        if sanitized.findings_count > 0:
            logger.info(
                f"[AUDIT] PII Detected and Masked | "
                f"unit={unit} | "
                f"patient_id={patient_id} | "
                f"types={sanitized.pii_types_found} | "
                f"count={sanitized.findings_count}"
            )

        return ShieldedInput(
            sanitized_text=sanitized.sanitized_text,
            pii_detected=sanitized.findings_count > 0,
            pii_types=sanitized.pii_types_found,
            ready_for_inference=True,
            original_length=sanitized.original_length,
            sanitized_length=sanitized.sanitized_length,
        )

    def get_generation_safety_settings(self, unit: str) -> List[Dict[str, Any]]:
        """
        Get safety settings for Vertex AI generation.

        Args:
            unit: AletheIA unit name

        Returns:
            List of safety setting dicts for Vertex AI GenerativeModel
        """
        return self.semantic_shield.get_vertex_safety_settings(unit)

    def get_safety_config(self, unit: str) -> Dict[HarmCategory, HarmBlockThreshold]:
        """
        Get raw safety configuration for a unit.

        Args:
            unit: AletheIA unit name

        Returns:
            Dictionary of HarmCategory -> HarmBlockThreshold
        """
        return self.semantic_shield.get_safety_settings(unit)

    def is_clinical_context(self, unit: str) -> bool:
        """
        Check if the unit operates in clinical context.

        Clinical context allows permissive input analysis.

        Args:
            unit: AletheIA unit name

        Returns:
            True if unit uses clinical safety profile
        """
        return self.semantic_shield.is_clinical_unit(unit)

    async def process_clinical_input(
        self,
        raw_text: str,
        unit: str,
        patient_id: Optional[UUID] = None,
    ) -> ShieldedInput:
        """
        Alias for process_input with clinical context awareness.

        Logs additional context for clinical units.
        """
        result = await self.process_input(raw_text, unit, patient_id)

        if self.is_clinical_context(unit):
            logger.debug(
                f"[NextGenShieldController] Clinical context active for unit={unit} | "
                f"pii_detected={result.pii_detected}"
            )

        return result


# Convenience function for quick shield access
async def shield_input(
    text: str,
    unit: str = "default",
    project_id: Optional[str] = None,
) -> ShieldedInput:
    """
    Quick utility to shield input text.

    Creates a temporary controller - for production use, prefer
    dependency injection with a singleton controller.

    Args:
        text: Raw text to sanitize
        unit: AletheIA unit name
        project_id: GCP project ID

    Returns:
        ShieldedInput with sanitized text
    """
    controller = NextGenShieldController(project_id)
    return await controller.process_input(text, unit)
