"""
AletheIA Units - Semantic AI Task Taxonomy

Defines the 8 intelligence units that power Kura OS:
- SENTINEL: Risk screening (PROTECTED - cannot route to lite models)
- ORACLE: Clinical analysis
- NOW: Daily briefing
- PULSE: Chat sentiment
- SCRIBE: Transcription (PROTECTED - fixed to Whisper)
- VOICE: Audio synthesis
- SCAN: Document & form analysis
- HELPER: Platform support

v1.3.0: Initial taxonomy layer
"""

from enum import Enum


class AletheIAUnit(str, Enum):
    """Semantic names for AI task types."""

    SENTINEL = "sentinel"  # triage - Risk screening (PROTECTED)
    ORACLE = "oracle"  # clinical_analysis - Session notes
    NOW = "now"  # briefing - Daily summary
    PULSE = "pulse"  # chat - WhatsApp sentiment
    SCRIBE = "scribe"  # transcription - STT (PROTECTED)
    VOICE = "voice"  # audio_synthesis - Voice notes
    SCAN = "scan"  # document_analysis + form_analysis
    HELPER = "helper"  # help_bot - Platform support


# Bidirectional mapping: Unit <-> Legacy task_type
UNIT_TO_TASK: dict[AletheIAUnit, str] = {
    AletheIAUnit.SENTINEL: "triage",
    AletheIAUnit.ORACLE: "clinical_analysis",
    AletheIAUnit.NOW: "briefing",
    AletheIAUnit.PULSE: "chat",
    AletheIAUnit.SCRIBE: "transcription",
    AletheIAUnit.VOICE: "audio_synthesis",
    AletheIAUnit.SCAN: "document_analysis",
    AletheIAUnit.HELPER: "help_bot",
}

TASK_TO_UNIT: dict[str, AletheIAUnit] = {v: k for k, v in UNIT_TO_TASK.items()}

# Also map form_analysis to SCAN
TASK_TO_UNIT["form_analysis"] = AletheIAUnit.SCAN


# Protected units - cannot be routed to lite/flash models
PROTECTED_UNITS: set[AletheIAUnit] = {
    AletheIAUnit.SENTINEL,  # Risk screening requires Pro model
    AletheIAUnit.SCRIBE,  # Transcription fixed to Whisper
}


# UI Display labels
UNIT_LABELS: dict[AletheIAUnit, dict[str, str]] = {
    AletheIAUnit.SENTINEL: {
        "label": "AletheIA Sentinel",
        "description": "Risk screening (critical)",
    },
    AletheIAUnit.ORACLE: {
        "label": "AletheIA Oracle",
        "description": "Therapy session notes",
    },
    AletheIAUnit.NOW: {
        "label": "AletheIA Now",
        "description": "Morning summary",
    },
    AletheIAUnit.PULSE: {
        "label": "AletheIA Pulse",
        "description": "WhatsApp monitoring",
    },
    AletheIAUnit.SCRIBE: {
        "label": "AletheIA Scribe",
        "description": "Audio to text (STT)",
    },
    AletheIAUnit.VOICE: {
        "label": "AletheIA Voice",
        "description": "Voice note analysis",
    },
    AletheIAUnit.SCAN: {
        "label": "AletheIA Scan",
        "description": "PDFs, images & forms",
    },
    AletheIAUnit.HELPER: {
        "label": "AletheIA Helper",
        "description": "Platform support",
    },
}
