"""
Next-Gen Shield: Safety & Privacy Layer
=======================================
WU-016: Two-layer protection for clinical AI inference.

Components:
- PrivacyShield: Cloud DLP for PII sanitization
- SemanticShield: Vertex AI Safety Settings
- NextGenShieldController: Orchestrator

Usage:
    from app.services.safety import NextGenShieldController

    shield = NextGenShieldController(project_id="kura-os-prod")
    result = await shield.process_input(raw_text, unit="sentinel", patient_id=uuid)
"""

from .privacy_shield import PrivacyShield, SanitizedResult
from .semantic_shield import SemanticShield, SafetyResponse, RiskDetectedException
from .shield_controller import NextGenShieldController, ShieldedInput, ShieldedOutput

__all__ = [
    "PrivacyShield",
    "SanitizedResult",
    "SemanticShield",
    "SafetyResponse",
    "RiskDetectedException",
    "NextGenShieldController",
    "ShieldedInput",
    "ShieldedOutput",
]
