"""
Cortex Orchestrator - Pipeline Execution Engine

The main entry point for executing cognitive pipelines.
Loads configurations from AIPipelineConfig and executes
stages sequentially with privacy enforcement.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AIPipelineConfig, Patient, Organization
from app.services.cortex.context import PatientEventContext
from app.services.cortex.privacy import PrivacyResolver, PipelineFinalizer
from app.services.cortex.stages import get_step, StepExecutionError

if TYPE_CHECKING:
    from app.services.storage import GCSService

logger = logging.getLogger(__name__)


class PipelineExecutionError(Exception):
    """Raised when a pipeline execution fails."""

    def __init__(self, pipeline_name: str, message: str, step: str = None):
        self.pipeline_name = pipeline_name
        self.failed_step = step
        super().__init__(f"Pipeline '{pipeline_name}' failed: {message}")


class CortexOrchestrator:
    """
    Orchestrates the execution of cognitive pipelines.

    Workflow:
    1. Load pipeline configuration from database
    2. Initialize PatientEventContext with resources
    3. Resolve privacy tier via PrivacyResolver
    4. Execute each stage sequentially
    5. Apply privacy enforcement via PipelineFinalizer
    6. Return results

    Usage:
        orchestrator = CortexOrchestrator(db_session, gcs_service)
        result = await orchestrator.run_pipeline(
            pipeline_name="session_analysis",
            patient=patient,
            organization=organization,
            resources={"audio:session": "gs://kura-vault/..."}
        )
    """

    def __init__(self, db: AsyncSession, gcs_service: "GCSService" = None):
        self.db = db
        self.gcs_service = gcs_service
        self.finalizer = PipelineFinalizer()

    async def run_pipeline(
        self,
        pipeline_name: str,
        patient: Patient,
        organization: Organization,
        resources: Dict[str, str] = None,
        input_data: Dict[str, Any] = None,
        clinical_entry_id: uuid.UUID = None,
    ) -> Dict[str, Any]:
        """
        Execute a named pipeline.

        Args:
            pipeline_name: Name of the pipeline in AIPipelineConfig
            patient: The patient record for context
            organization: The organization record for privacy resolution
            resources: Dict of resource URIs to load into context
            input_data: Additional input data (e.g., form submissions)
            clinical_entry_id: Optional linked clinical entry

        Returns:
            Dict with:
                - outputs: All stage outputs
                - privacy_tier: Applied privacy tier
                - finalization: Privacy enforcement actions taken

        Raises:
            PipelineExecutionError: If the pipeline fails
        """
        start_time = datetime.now(timezone.utc)

        # 1. Load pipeline config
        config = await self._load_pipeline(pipeline_name)
        if not config:
            raise PipelineExecutionError(
                pipeline_name, f"Pipeline '{pipeline_name}' not found in database"
            )

        if not config.is_active:
            raise PipelineExecutionError(
                pipeline_name, f"Pipeline '{pipeline_name}' is disabled"
            )

        logger.info(f"🧠 Cortex: Starting pipeline '{pipeline_name}'")

        # 2. Initialize context
        context = PatientEventContext(
            patient_id=patient.id,
            organization_id=organization.id,
            clinical_entry_id=clinical_entry_id,
        )
        context.pipeline_name = pipeline_name
        context.started_at = start_time.isoformat()

        # Add resources to context
        if resources:
            for key, uri in resources.items():
                context.add_evidence(key, uri)

        # Add input data if provided
        if input_data:
            context.add_output("input", "form_data", input_data)

        # 3. Resolve privacy tier
        context.resolved_tier = PrivacyResolver.resolve(patient, organization)
        logger.info(f"🔐 Privacy tier resolved: {context.resolved_tier.value}")

        # Check if pipeline requires specific tier
        if config.privacy_tier_required:
            # GHOST is most restrictive, LEGACY is least
            tier_order = {"GHOST": 0, "STANDARD": 1, "LEGACY": 2}
            resolved_level = tier_order.get(context.resolved_tier.value, 1)
            required_level = tier_order.get(config.privacy_tier_required.value, 1)

            if resolved_level > required_level:
                raise PipelineExecutionError(
                    pipeline_name,
                    f"Pipeline requires {config.privacy_tier_required.value} tier, "
                    f"but patient has {context.resolved_tier.value}",
                )

        # 4. Execute stages
        stages = config.stages or []
        for i, stage_config in enumerate(stages):
            step_type = stage_config.get("step")
            if not step_type:
                logger.warning(f"Stage {i} missing 'step' key, skipping")
                continue

            try:
                logger.info(f"  → Stage {i + 1}/{len(stages)}: {step_type}")
                step = get_step(step_type)

                # Pass config to step if it accepts it
                if hasattr(step, "model") and "model" in stage_config:
                    step.model = stage_config["model"]
                if hasattr(step, "prompt_key") and "prompt_key" in stage_config:
                    step.prompt_key = stage_config["prompt_key"]

                await step.execute(context)

            except StepExecutionError as e:
                logger.error(f"  ✗ Stage {step_type} failed: {e}")
                raise PipelineExecutionError(pipeline_name, str(e), step=step_type)
            except Exception as e:
                logger.error(f"  ✗ Unexpected error in {step_type}: {e}")
                raise PipelineExecutionError(pipeline_name, str(e), step=step_type)

        logger.info(f"  ✓ All {len(stages)} stages complete")

        # 5. Apply privacy enforcement
        finalization_result = {"skipped": True}
        if self.gcs_service:
            try:
                finalization_result = await self.finalizer.finalize(
                    context, self.gcs_service
                )
                logger.info(f"🔐 Privacy enforcement: {finalization_result}")
            except Exception as e:
                logger.error(f"Privacy enforcement failed: {e}")
                finalization_result = {"error": str(e)}

        # 6. Build result
        elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()

        result = {
            "pipeline_name": pipeline_name,
            "patient_id": str(patient.id),
            "organization_id": str(organization.id),
            "clinical_entry_id": str(clinical_entry_id) if clinical_entry_id else None,
            "privacy_tier": context.resolved_tier.value,
            "outputs": context.outputs,
            "finalization": finalization_result,
            "elapsed_seconds": round(elapsed, 2),
            "stages_executed": len(stages),
        }

        logger.info(f"🧠 Cortex: Pipeline '{pipeline_name}' complete in {elapsed:.2f}s")

        return result

    async def _load_pipeline(self, name: str) -> Optional[AIPipelineConfig]:
        """Load a pipeline configuration by name."""
        stmt = select(AIPipelineConfig).where(AIPipelineConfig.name == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_pipelines(self, active_only: bool = True) -> list:
        """List available pipeline configurations."""
        stmt = select(AIPipelineConfig)
        if active_only:
            stmt = stmt.where(AIPipelineConfig.is_active == True)
        result = await self.db.execute(stmt)
        return result.scalars().all()
