"""
Clinical Service - Cortex-Native Clinical Entry Processing

Kura Cortex v1.5.4 - Cerebral Integration

This service replaces direct AletheIA calls with CortexOrchestrator pipelines.
Implements tier-aware pipeline selection and the Content Gatekeeper (GEM Amendment).

Usage:
    clinical_service = ClinicalService(db)
    result = await clinical_service.process_entry(entry, patient, org)
"""

import logging
import uuid
from typing import Optional, Dict, Any
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    ClinicalEntry,
    Patient,
    Organization,
    EntryType,
    ProcessingStatus,
    PrivacyTier,
)
from app.services.cortex import CortexOrchestrator, PrivacyResolver
from app.services.storage import StorageService

logger = logging.getLogger(__name__)


# Ghost Protocol placeholder text
GHOST_CONTENT_PLACEHOLDER = "[CONTENIDO EFÍMERO ELIMINADO - GHOST PROTOCOL]"


@dataclass
class ProcessingResult:
    """Result from clinical entry processing."""

    success: bool
    pipeline_name: str
    privacy_tier: str
    is_ghost: bool
    insights: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ClinicalService:
    """
    Facade for clinical entry operations using Cortex.

    Orchestrates the full lifecycle of clinical entry analysis:
    1. Resolve privacy tier for patient/org
    2. Select appropriate pipeline based on entry type + tier
    3. Execute via CortexOrchestrator
    4. Update entry with results (respecting Ghost Protocol)

    GEM Amendments Implemented:
    - Content Gatekeeper: Never stores content in DB for GHOST tier
    - Uses placeholder text for GHOST entries
    """

    def __init__(self, db: AsyncSession, gcs_service: StorageService = None):
        self.db = db
        self.gcs_service = gcs_service
        self.orchestrator = CortexOrchestrator(db, gcs_service)

    async def process_entry(
        self,
        entry: ClinicalEntry,
        patient: Patient,
        organization: Organization,
        file_path: Optional[str] = None,
    ) -> ProcessingResult:
        """
        Process a clinical entry through the Cortex pipeline.

        Args:
            entry: ClinicalEntry to process
            patient: Patient record
            organization: Organization record
            file_path: Optional path to uploaded file (audio/document)

        Returns:
            ProcessingResult with processing outcome
        """
        # Mark as processing
        entry.processing_status = ProcessingStatus.PROCESSING
        await self.db.flush()

        try:
            # 1. Resolve privacy tier
            tier = PrivacyResolver.resolve(patient, organization)
            is_ghost = tier == PrivacyTier.GHOST

            logger.info(
                f"Processing entry {entry.id} for patient {patient.id} "
                f"(tier={tier.value}, ghost={is_ghost})"
            )

            # 2. Select pipeline
            pipeline = self._select_pipeline(entry.entry_type, tier)

            # 3. Build resources
            resources = self._build_resources(entry, file_path)

            # 4. Build input data
            input_data = None
            if entry.content and not is_ghost:
                input_data = {"text_content": entry.content}

            # 5. Execute via Cortex
            result = await self.orchestrator.run_pipeline(
                pipeline_name=pipeline,
                patient=patient,
                organization=organization,
                resources=resources,
                input_data=input_data,
                clinical_entry_id=entry.id,
            )

            # 6. Update entry with results (Content Gatekeeper)
            await self._update_entry(entry, patient, result, tier, pipeline)

            return ProcessingResult(
                success=True,
                pipeline_name=pipeline,
                privacy_tier=tier.value,
                is_ghost=is_ghost,
                insights=result.get("outputs", {}).get("analyze"),
            )

        except Exception as e:
            logger.error(f"Failed to process entry {entry.id}: {e}")
            entry.processing_status = ProcessingStatus.FAILED
            entry.processing_error = str(e)[:500]  # Limit error length
            await self.db.flush()

            return ProcessingResult(
                success=False,
                pipeline_name="unknown",
                privacy_tier="unknown",
                is_ghost=False,
                error=str(e),
            )

    def _select_pipeline(self, entry_type: EntryType, tier: PrivacyTier) -> str:
        """
        Select the appropriate pipeline based on entry type and privacy tier.

        For GHOST tier, we use specialized pipelines that minimize persistence.
        """
        # GHOST tier gets dedicated ghost pipelines for audio
        if tier == PrivacyTier.GHOST:
            if entry_type == EntryType.AUDIO:
                return "ghost_session_v1"
            # For text/documents in ghost mode, use standard but content won't be saved
            return "clinical_soap_v1"

        # Standard pipeline mapping
        pipeline_map = {
            EntryType.SESSION_NOTE: "clinical_soap_v1",
            EntryType.AUDIO: "audio_session_v1",
            EntryType.DOCUMENT: "document_ocr_v1",
            EntryType.FORM_SUBMISSION: "clinical_soap_v1",
            EntryType.AI_ANALYSIS: "clinical_soap_v1",  # Re-analysis
            EntryType.ASSESSMENT: "clinical_soap_v1",
        }

        return pipeline_map.get(entry_type, "clinical_soap_v1")

    def _build_resources(
        self,
        entry: ClinicalEntry,
        file_path: Optional[str] = None,
    ) -> Dict[str, str]:
        """Build resource dict for pipeline execution."""
        resources = {}

        # Check for file in metadata
        metadata = entry.entry_metadata or {}
        file_url = metadata.get("file_url")

        # Prioritize explicit file_path, then metadata
        actual_path = file_path or file_url

        if actual_path:
            if entry.entry_type == EntryType.AUDIO:
                resources["audio:session"] = actual_path
            elif entry.entry_type == EntryType.DOCUMENT:
                resources["document:upload"] = actual_path

        return resources

    async def _update_entry(
        self,
        entry: ClinicalEntry,
        patient: Patient,
        result: Dict[str, Any],
        tier: PrivacyTier,
        pipeline: str,
    ):
        """
        Update entry with processing results.

        GEM Amendment - Content Gatekeeper:
        For GHOST tier, we NEVER store the transcript/content in the database.
        Instead, we use a placeholder and only store the final insights.

        v1.5.7: Also updates patient.last_insight_json for timeline display.
        """
        is_ghost = tier == PrivacyTier.GHOST

        # Set Cortex metadata
        entry.is_ghost = is_ghost
        entry.pipeline_name = pipeline

        # Content Gatekeeper: Handle content based on tier
        if is_ghost:
            # NEVER store actual content for GHOST entries
            entry.content = GHOST_CONTENT_PLACEHOLDER
            logger.info(
                f"🔐 GHOST: Content replaced with placeholder for entry {entry.id}"
            )
        else:
            # For non-GHOST, we can store transcript if available
            outputs = result.get("outputs", {})
            if "transcribe" in outputs:
                transcript_data = outputs.get("transcribe", {})
                if (
                    isinstance(transcript_data, dict)
                    and "transcript" in transcript_data
                ):
                    # Only set content if entry didn't have content before
                    if not entry.content:
                        entry.content = transcript_data["transcript"]

        # Store AI insights in metadata
        metadata = entry.entry_metadata or {}

        # Extract insights from pipeline outputs
        outputs = result.get("outputs", {})

        # v1.5.9: Insight Splitter Logic (Cortex -> Sentinel Pulse)
        if "analyze" in outputs:
            analysis_data = outputs.get("analyze", {})
            # AnalyzeStep outputs analysis_json
            analysis_json = analysis_data.get("analysis_json", {})

            if isinstance(analysis_json, dict) and "soap_note" in analysis_json:
                # 1. Timeline Update (Senses)
                metadata["ai_insights"] = analysis_json["soap_note"]

                # 2. Sentinel Pulse Update (Heart)
                if "metrics" in analysis_json:
                    metrics = analysis_json["metrics"]
                    # Build insight object compatible with PatientInsightsResponse
                    risk_score = metrics.get("risk_score", 0.0)
                    risk_level = "NONE"
                    if risk_score > 0.8:
                        risk_level = "CRITICAL"
                    elif risk_score > 0.6:
                        risk_level = "HIGH"
                    elif risk_score > 0.4:
                        risk_level = "MEDIUM"
                    elif risk_score > 0.2:
                        risk_level = "LOW"

                    patient.last_insight_json = {
                        "summary": analysis_json["soap_note"].get("summary", ""),
                        "alerts": [],  # Could be expanded later
                        "suggestions": [
                            analysis_json["soap_note"].get("therapeutic_plan", "")
                        ],
                        "engagement_score": int(
                            metrics.get("engagement_score", 0.5) * 100
                        ),
                        "risk_level": risk_level,
                        "risk_score": risk_score,
                        "key_themes": [
                            analysis_json["soap_note"].get("observations", "")
                        ],
                    }
                    patient.last_insight_at = datetime.now(timezone.utc)
                    logger.info(f"❤️ Sentinel Pulse updated for patient {patient.id}")
            # v1.5.9-hf1: Handle Ghost extraction for both legacy and structured formats
            if is_ghost:
                # Preferred: summary from new soap_note structure
                summary = ""
                if isinstance(analysis_json, dict) and "soap_note" in analysis_json:
                    summary = analysis_json["soap_note"].get("summary", "")
                else:
                    summary = analysis_data.get("summary", "")

                metadata["ai_insights"] = {
                    "summary": summary,
                    "ghost_mode": True,
                    "redacted": True,
                }
            elif isinstance(analysis_json, dict) and "soap_note" in analysis_json:
                # STANDARD structured update
                metadata["ai_insights"] = analysis_json["soap_note"]

                # ... metrics logic handled above in my last search ...
                # (Applying only the relevant part of the fix)

        # Store triage results if available
        if "triage" in outputs and not is_ghost:
            metadata["risk_triage"] = outputs.get("triage", {})

        # Pipeline metadata
        metadata["cortex"] = {
            "pipeline": pipeline,
            "tier": tier.value,
            "elapsed_seconds": result.get("elapsed_seconds"),
            "finalization": result.get("finalization"),
        }

        entry.entry_metadata = metadata
        entry.processing_status = ProcessingStatus.COMPLETED
        entry.processing_error = None

        await self.db.flush()
        logger.info(
            f"✅ Entry {entry.id} updated (pipeline={pipeline}, ghost={is_ghost})"
        )

    async def process_entry_async(
        self,
        entry_id: uuid.UUID,
        user_id: uuid.UUID,
    ):
        """
        Background task wrapper for process_entry.

        Loads all required entities and processes the entry.
        Used by FastAPI BackgroundTasks.
        """
        from sqlalchemy import select
        from app.db.models import User

        # Load entry
        result = await self.db.execute(
            select(ClinicalEntry).where(ClinicalEntry.id == entry_id)
        )
        entry = result.scalar_one_or_none()

        if not entry:
            logger.error(f"Entry {entry_id} not found for async processing")
            return

        # Load patient
        result = await self.db.execute(
            select(Patient).where(Patient.id == entry.patient_id)
        )
        patient = result.scalar_one_or_none()

        if not patient:
            logger.error(f"Patient {entry.patient_id} not found")
            entry.processing_status = ProcessingStatus.FAILED
            entry.processing_error = "Patient not found"
            await self.db.commit()
            return

        # Load organization via patient
        result = await self.db.execute(
            select(Organization).where(Organization.id == patient.organization_id)
        )
        organization = result.scalar_one_or_none()

        if not organization:
            logger.error(f"Organization {patient.organization_id} not found")
            entry.processing_status = ProcessingStatus.FAILED
            entry.processing_error = "Organization not found"
            await self.db.commit()
            return

        # Process
        await self.process_entry(entry, patient, organization)
        await self.db.commit()
