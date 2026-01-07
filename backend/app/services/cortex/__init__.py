"""
Kura Cortex - Cognitive Pipeline Engine

v1.5.0: Foundation for DAG-based AI processing with Privacy Tiers.
v1.5.1: Orchestration and Pipeline Steps.
v1.5.2: API Layer for privacy configuration.
v1.5.3: Strangler Switch for gradual migration.

This module orchestrates clinical AI workflows with:
- Privacy-first data handling (GHOST/STANDARD/LEGACY tiers)
- Pass-by-reference pattern for HIPAA compliance
- Configurable pipeline stages via AIPipelineConfig
- Factory-based step registration
- Strangler pattern for legacy migration

Usage:
    from app.services.cortex import CortexOrchestrator, should_use_cortex

    # Check if we should use Cortex
    if await should_use_cortex(org_id, "audio_synthesis", db):
        orchestrator = CortexOrchestrator(db_session)
        result = await orchestrator.run_pipeline(...)
"""

from app.services.cortex.context import PatientEventContext
from app.services.cortex.privacy import PrivacyResolver, PipelineFinalizer
from app.services.cortex.orchestrator import CortexOrchestrator, PipelineExecutionError
from app.services.cortex.switch import CortexSwitch, should_use_cortex, SwitchState
from app.services.cortex.adapter import analyze_clinical_entry, AnalysisResult

__all__ = [
    # Core
    "CortexOrchestrator",
    "PatientEventContext",
    # Privacy
    "PrivacyResolver",
    "PipelineFinalizer",
    # Strangler Switch
    "CortexSwitch",
    "should_use_cortex",
    "SwitchState",
    # Adapter
    "analyze_clinical_entry",
    "AnalysisResult",
    # Errors
    "PipelineExecutionError",
]
