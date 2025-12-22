"""Risk Detection Service for Clinical Notes (v0.9.2).

Simple keyword-based risk detection for session notes.
In a future version, this could be replaced with AI-powered analysis.
"""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)


# Risk keywords in multiple languages (Spanish + English)
RISK_KEYWORDS = [
    # Suicidal ideation
    "suicid",
    "suicide",
    "suicida",
    "quitarme la vida",
    "matarme",
    # Self-harm
    "harm",
    "autolesion",
    "cortarme",
    "hacerme daño",
    # Crisis
    "crisis",
    "emergencia",
    "emergency",
    "urgente",
    # Death wishes
    "morir",
    "muerte",
    "kill",
    "die",
    "quiero morir",
    # Hopelessness
    "sin esperanza",
    "hopeless",
    "sin salida",
    "no way out",
    # Violence
    "violencia",
    "violence",
    "pegar",
    "golpear",
]


async def detect_risk_keywords(text: Optional[str]) -> bool:
    """
    Check if text contains risk keywords.

    Args:
        text: The clinical note content

    Returns:
        True if any risk keyword is found
    """
    if not text:
        return False

    text_lower = text.lower()

    for keyword in RISK_KEYWORDS:
        if keyword in text_lower:
            logger.warning(f"Risk keyword detected: '{keyword}'")
            return True

    return False


async def extract_risk_keywords(text: Optional[str]) -> list[str]:
    """
    Extract all risk keywords found in text.

    Args:
        text: The clinical note content

    Returns:
        List of found keywords (for logging/alerts)
    """
    if not text:
        return []

    text_lower = text.lower()
    found = []

    for keyword in RISK_KEYWORDS:
        if keyword in text_lower:
            found.append(keyword)

    return found
