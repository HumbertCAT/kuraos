"""
Kura Cortex - Cognitive Pipeline Engine

v1.5.0: Foundation for DAG-based AI processing with Privacy Tiers.
v1.5.1: Orchestration and Pipeline Steps.

This module orchestrates clinical AI workflows with:
- Privacy-first data handling (GHOST/STANDARD/LEGACY tiers)
- Pass-by-reference pattern for HIPAA compliance
- Configurable pipeline stages via AIPipelineConfig
- Factory-based step registration

Usage:
    from app.services.cortex import CortexOrchestrator

    orchestrator = CortexOrchestrator(db_session, gcs_service)
    result = await orchestrator.run_pipeline(
        pipeline_name="session_analysis",
        patient=patient,
        organization=organization,
        resources={"audio:session": "gs://kura-vault/..."}
    )
"""

from app.services.cortex.context import PatientEventContext
from app.services.cortex.privacy import PrivacyResolver, PipelineFinalizer
from app.services.cortex.orchestrator import CortexOrchestrator, PipelineExecutionError

__all__ = [
    # Core
    "CortexOrchestrator",
    "PatientEventContext",
    # Privacy
    "PrivacyResolver",
    "PipelineFinalizer",
    # Errors
    "PipelineExecutionError",
]
