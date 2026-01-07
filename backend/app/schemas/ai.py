"""
AletheIA v2 Response Schemas - Structured AI Outputs

Crystal Mind Project (v1.4.9+): JSON-first responses for UI reactivity.
Transforms AI from "text generator" to "data engine".
"""

from enum import Enum
from typing import Literal, Optional
from pydantic import BaseModel, Field


# =============================================================================
# SENTINEL v2 - Risk Assessment (v1.4.9)
# =============================================================================


class RiskCategory(str, Enum):
    """Risk categories with clinical nuance for psychedelic therapy."""

    SUICIDE_SELF_HARM = "SUICIDE_SELF_HARM"
    HOMICIDE_VIOLENCE = "HOMICIDE_VIOLENCE"
    SUBSTANCE_ABUSE = "SUBSTANCE_ABUSE"
    MEDICAL_EMERGENCY = "MEDICAL_EMERGENCY"
    PSYCHOTIC_EPISODE = "PSYCHOTIC_EPISODE"
    INTEGRATION_CRISIS = "INTEGRATION_CRISIS"  # Crucial: Ego death ≠ Suicide
    NONE = "NONE"


class SentinelResponse(BaseModel):
    """
    Structured risk assessment from SENTINEL unit.

    Distinguishes between:
    - Integration challenges (ego dissolution, spiritual emergence)
    - Psychiatric emergencies (imminent harm, active ideation with plan)
    """

    risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = Field(
        description="Overall risk severity"
    )
    primary_category: RiskCategory = Field(description="Primary risk category detected")
    confidence_score: float = Field(
        ge=0.0, le=1.0, description="Model confidence in assessment (0.0-1.0)"
    )
    detected_quote: Optional[str] = Field(
        default=None, description="Exact quote that triggered the assessment"
    )
    clinical_reasoning: str = Field(
        description="IFS/Trauma-informed explanation of the assessment"
    )
    recommended_action: Literal["MONITOR", "CHECK_IN", "CRITICAL_INTERVENTION"] = Field(
        description="Recommended therapist action"
    )


# =============================================================================
# MEMO v1 - Quick Audio Notes (v1.4.10)
# =============================================================================


class MemoResponse(BaseModel):
    """
    Structured extraction from short voice notes (<15 minutes).

    NOT a full session analysis - focused on actionable data.
    """

    summary: str = Field(max_length=200, description="One-sentence summary of the note")
    key_data: list[str] = Field(
        default_factory=list,
        description="Extracted hard data: medications, dates, names",
    )
    action_items: list[str] = Field(
        default_factory=list, description="Tasks for the therapist to complete"
    )
    emotional_tone: Literal["POSITIVE", "NEUTRAL", "CONCERNED", "URGENT"] = Field(
        default="NEUTRAL", description="Overall emotional tone of the note"
    )


# =============================================================================
# ORACLE v2 - Clinical Analysis (Future: v1.4.13+)
# =============================================================================


class OracleResponse(BaseModel):
    """
    Structured clinical analysis (placeholder for future migration).
    """

    summary: str
    themes: list[str]
    risk_indicators: list[str]
    therapeutic_suggestions: list[str]
    sentiment_score: float = Field(ge=-1.0, le=1.0)


# =============================================================================
# JSON Parsing Utilities
# =============================================================================


def clean_json_string(raw: str) -> str:
    """
    Clean LLM response that may be wrapped in markdown code blocks.

    Vertex AI sometimes returns:
    ```json
    {"key": "value"}
    ```

    This utility strips the backticks for Pydantic parsing.
    """
    text = raw.strip()

    # Remove ```json ... ``` wrapper
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


def parse_sentinel_response(raw: str) -> SentinelResponse:
    """
    Parse SENTINEL response with fallback handling.

    Returns:
        Validated SentinelResponse

    Raises:
        ValidationError if JSON is invalid
    """
    cleaned = clean_json_string(raw)
    return SentinelResponse.model_validate_json(cleaned)


def parse_memo_response(raw: str) -> MemoResponse:
    """
    Parse MEMO response with fallback handling.
    """
    cleaned = clean_json_string(raw)
    return MemoResponse.model_validate_json(cleaned)
