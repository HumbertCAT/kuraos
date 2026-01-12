"""
SemanticShield: Vertex AI Safety Settings Manager
=================================================
Layer 2 of Next-Gen Shield. Contextual harm detection.

Provides unit-specific safety thresholds:
- STANDARD (strict): For general assistants (Helper, Pulse)
- CLINICAL (permissive input): For clinical units (Sentinel, Oracle)

The clinical profile allows reading risk mentions (suicidal ideation, etc.)
but blocks generating harmful content.

Usage:
    shield = SemanticShield()
    settings = shield.get_safety_settings("sentinel")
    # Returns permissive config for clinical analysis
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from enum import Enum

logger = logging.getLogger(__name__)


class HarmCategory(str, Enum):
    """Vertex AI Harm Categories."""

    DANGEROUS_CONTENT = "HARM_CATEGORY_DANGEROUS_CONTENT"
    HATE_SPEECH = "HARM_CATEGORY_HATE_SPEECH"
    HARASSMENT = "HARM_CATEGORY_HARASSMENT"
    SEXUALLY_EXPLICIT = "HARM_CATEGORY_SEXUALLY_EXPLICIT"


class HarmBlockThreshold(str, Enum):
    """Vertex AI Block Thresholds."""

    BLOCK_NONE = "BLOCK_NONE"
    BLOCK_ONLY_HIGH = "BLOCK_ONLY_HIGH"
    BLOCK_MEDIUM_AND_ABOVE = "BLOCK_MEDIUM_AND_ABOVE"
    BLOCK_LOW_AND_ABOVE = "BLOCK_LOW_AND_ABOVE"


@dataclass
class SafetyRating:
    """Individual safety rating for a category."""

    category: str
    probability: str
    blocked: bool = False


@dataclass
class SafetyResponse:
    """Response from safety-checked generation."""

    text: str
    safety_ratings: List[SafetyRating]
    blocked: bool


class RiskDetectedException(Exception):
    """Raised when high-risk content is detected."""

    def __init__(
        self,
        reason: str,
        safety_ratings: List[Any],
        message: str = "High-risk content detected",
    ):
        self.reason = reason
        self.safety_ratings = safety_ratings
        super().__init__(message)


# Clinical units that need permissive input analysis
CLINICAL_UNITS = {"sentinel", "oracle", "cortex"}

# Standard units with strict safety
STANDARD_UNITS = {"pulse", "now", "helper", "memo", "coach", "default"}


class SemanticShield:
    """
    Vertex AI Safety Settings Manager.

    Provides differentiated safety profiles:
    - STANDARD: Strict blocking for general assistants
    - CLINICAL: Permissive input for clinical risk analysis
    """

    # Standard profile: Block aggressively
    STANDARD_SAFETY_SETTINGS = {
        HarmCategory.DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        HarmCategory.HATE_SPEECH: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        HarmCategory.HARASSMENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        HarmCategory.SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    }

    # Clinical profile: Permissive input, strict output
    # Allows reading risk content (suicidal ideation, etc.) for detection
    CLINICAL_SAFETY_SETTINGS = {
        HarmCategory.DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        HarmCategory.HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        HarmCategory.HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        HarmCategory.SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    }

    def __init__(self):
        """Initialize SemanticShield."""
        logger.info("[SemanticShield] Initialized with STANDARD and CLINICAL profiles")

    def get_safety_settings(self, unit: str) -> Dict[HarmCategory, HarmBlockThreshold]:
        """
        Get safety settings for an AletheIA unit.

        Args:
            unit: AletheIA unit name (case-insensitive)

        Returns:
            Dictionary of HarmCategory -> HarmBlockThreshold
        """
        unit_lower = unit.lower() if unit else "default"

        if unit_lower in CLINICAL_UNITS:
            logger.debug(f"[SemanticShield] Using CLINICAL profile for unit: {unit}")
            return self.CLINICAL_SAFETY_SETTINGS.copy()

        logger.debug(f"[SemanticShield] Using STANDARD profile for unit: {unit}")
        return self.STANDARD_SAFETY_SETTINGS.copy()

    def get_vertex_safety_settings(self, unit: str) -> List[Dict[str, Any]]:
        """
        Get safety settings in Vertex AI GenerativeModel format.

        Args:
            unit: AletheIA unit name

        Returns:
            List of safety setting dicts for Vertex AI
        """
        settings = self.get_safety_settings(unit)

        return [
            {
                "category": category.value,
                "threshold": threshold.value,
            }
            for category, threshold in settings.items()
        ]

    def is_clinical_unit(self, unit: str) -> bool:
        """Check if a unit uses clinical (permissive) safety profile."""
        return unit.lower() in CLINICAL_UNITS if unit else False
