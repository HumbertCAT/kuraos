"""
Cortex Adapter - Bridge between Legacy and Cortex Pipelines

Provides a unified interface that routes to either:
- Legacy: ProviderFactory + inline processing
- Cortex: CortexOrchestrator with full pipeline

Used by the run_analysis_task to support gradual migration.
"""

import uuid
import logging
from typing import Optional, TYPE_CHECKING
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.cortex.switch import should_use_cortex

if TYPE_CHECKING:
    from app.db.models import ClinicalEntry, Patient, Organization

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """Unified result from either legacy or Cortex analysis."""

    text: str
    model_id: str
    provider_id: str
    tokens_input: int
    tokens_output: int
    pipeline: str  # "legacy" or "cortex"
    metadata: dict = None

    def __post_init__(self):
        self.metadata = self.metadata or {}


async def analyze_clinical_entry(
    entry: "ClinicalEntry",
    patient: "Patient",
    organization: "Organization",
    user_id: uuid.UUID,
    db: AsyncSession,
    prompt_context: dict = None,
) -> AnalysisResult:
    """
    Analyze a clinical entry using either legacy or Cortex pipeline.

    This is the main entry point for the strangler pattern. It checks
    the switch and routes to the appropriate pipeline.

    Args:
        entry: ClinicalEntry to analyze
        patient: Patient record
        organization: Organization record
        user_id: ID of user triggering analysis
        db: Database session
        prompt_context: Optional context for prompt rendering

    Returns:
        AnalysisResult with analysis text and metadata
    """
    from app.db.models import EntryType

    # Determine task type from entry type
    task_type_map = {
        EntryType.SESSION_NOTE: "clinical_analysis",
        EntryType.AUDIO: "audio_synthesis",
        EntryType.DOCUMENT: "document_analysis",
    }
    task_type = task_type_map.get(entry.entry_type, "clinical_analysis")

    # Check strangler switch
    use_cortex = await should_use_cortex(str(organization.id), task_type, db)

    if use_cortex:
        logger.info(f"Routing entry {entry.id} to Cortex pipeline")
        return await _analyze_with_cortex(
            entry, patient, organization, user_id, db, task_type, prompt_context
        )
    else:
        logger.debug(f"Routing entry {entry.id} to legacy pipeline")
        return await _analyze_with_legacy(
            entry, patient, organization, user_id, db, task_type, prompt_context
        )


async def _analyze_with_cortex(
    entry: "ClinicalEntry",
    patient: "Patient",
    organization: "Organization",
    user_id: uuid.UUID,
    db: AsyncSession,
    task_type: str,
    prompt_context: dict = None,
) -> AnalysisResult:
    """
    Analyze using CortexOrchestrator.

    Maps entry types to pipeline names:
    - SESSION_NOTE → session_analysis (text only, no pipeline needed yet)
    - AUDIO → session_analysis
    - DOCUMENT → grapho_digitization
    """
    from app.services.cortex import CortexOrchestrator
    from app.db.models import EntryType

    # Map entry type to pipeline
    pipeline_map = {
        EntryType.SESSION_NOTE: "clinical_intake",  # Text → analysis
        EntryType.AUDIO: "session_analysis",  # Audio → transcribe → analyze
        EntryType.DOCUMENT: "grapho_digitization",  # Image → OCR
    }
    pipeline_name = pipeline_map.get(entry.entry_type, "clinical_intake")

    # Build resources
    resources = {}
    input_data = {}

    if entry.entry_type == EntryType.AUDIO:
        metadata = entry.entry_metadata or {}
        file_url = metadata.get("file_url", "")
        if file_url:
            # Convert local path to GCS URI if needed
            # For now, use the local path (Cortex steps handle both)
            resources["audio:session"] = file_url

    elif entry.entry_type == EntryType.DOCUMENT:
        metadata = entry.entry_metadata or {}
        file_url = metadata.get("file_url", "")
        if file_url:
            resources["document:upload"] = file_url

    else:  # SESSION_NOTE or text-based
        input_data["text_content"] = entry.content or ""

    try:
        orchestrator = CortexOrchestrator(db)

        result = await orchestrator.run_pipeline(
            pipeline_name=pipeline_name,
            patient=patient,
            organization=organization,
            resources=resources,
            input_data=input_data if input_data else None,
            clinical_entry_id=entry.id,
        )

        # Extract text from outputs
        outputs = result.get("outputs", {})

        # Try to get final analysis text
        text = ""
        if "analyze" in outputs:
            analysis = outputs["analyze"]
            if isinstance(analysis, dict):
                text = analysis.get("analysis_json", {})
                if isinstance(text, dict):
                    text = str(text)  # Convert dict to string
                else:
                    text = str(text)
        elif "transcribe" in outputs:
            text = outputs["transcribe"].get("transcript", "")
        elif "ocr" in outputs:
            text = outputs["ocr"].get("extracted_text", "")

        if not text:
            text = str(outputs)

        return AnalysisResult(
            text=text,
            model_id=f"cortex:{pipeline_name}",
            provider_id="cortex",
            tokens_input=0,  # Cortex handles internally
            tokens_output=0,
            pipeline="cortex",
            metadata={
                "pipeline_name": pipeline_name,
                "privacy_tier": result.get("privacy_tier"),
                "elapsed_seconds": result.get("elapsed_seconds"),
                "stages_executed": result.get("stages_executed"),
                "outputs": outputs,
            },
        )

    except Exception as e:
        logger.error(f"Cortex pipeline failed, falling back to legacy: {e}")
        # Fallback to legacy on error
        return await _analyze_with_legacy(
            entry, patient, organization, user_id, db, task_type, prompt_context
        )


async def _analyze_with_legacy(
    entry: "ClinicalEntry",
    patient: "Patient",
    organization: "Organization",
    user_id: uuid.UUID,
    db: AsyncSession,
    task_type: str,
    prompt_context: dict = None,
) -> AnalysisResult:
    """
    Analyze using legacy ProviderFactory.

    This is the existing implementation extracted from run_analysis_task.
    """
    from app.services.ai import ProviderFactory
    from app.services.ai.prompts import (
        CLINICAL_SYSTEM_PROMPT,
        AUDIO_SYNTHESIS_PROMPT,
        DOCUMENT_ANALYSIS_PROMPT,
    )
    from app.db.models import EntryType
    import os

    # Get routed provider
    provider = await ProviderFactory.get_provider_for_task(
        task_type, db, prompt_context=prompt_context
    )

    if entry.entry_type == EntryType.SESSION_NOTE:
        prompt = CLINICAL_SYSTEM_PROMPT
        content = entry.content or ""
        response = await provider.analyze_text(content, prompt)

    elif entry.entry_type == EntryType.AUDIO:
        prompt = AUDIO_SYNTHESIS_PROMPT
        metadata = entry.entry_metadata or {}
        file_url = metadata.get("file_url", "")

        if file_url:
            filename = os.path.basename(file_url)
            audio_path = os.path.join("/app/static/uploads", filename)

            if os.path.exists(audio_path):
                with open(audio_path, "rb") as f:
                    audio_bytes = f.read()

                extension = os.path.splitext(audio_path)[1].lower()
                mime_map = {
                    ".webm": "audio/webm",
                    ".mp3": "audio/mpeg",
                    ".wav": "audio/wav",
                    ".m4a": "audio/mp4",
                }
                mime_type = mime_map.get(extension, "audio/webm")

                response = await provider.analyze_multimodal(
                    audio_bytes, mime_type, prompt
                )
            else:
                from app.services.ai.base import AIResponse

                response = AIResponse(
                    text=f"Audio file not found: {filename}",
                    tokens_input=0,
                    tokens_output=0,
                    model_id="error",
                    provider_id="error",
                )
        else:
            from app.services.ai.base import AIResponse

            response = AIResponse(
                text="No audio file_url in metadata",
                tokens_input=0,
                tokens_output=0,
                model_id="error",
                provider_id="error",
            )

    elif entry.entry_type == EntryType.DOCUMENT:
        prompt = DOCUMENT_ANALYSIS_PROMPT
        metadata = entry.entry_metadata or {}
        file_url = metadata.get("file_url", "")

        if file_url:
            filename = os.path.basename(file_url)
            doc_path = os.path.join("/app/static/uploads", filename)

            if os.path.exists(doc_path):
                with open(doc_path, "rb") as f:
                    doc_bytes = f.read()
                mime_type = metadata.get("content_type", "application/pdf")
                response = await provider.analyze_multimodal(
                    doc_bytes, mime_type, prompt
                )
            else:
                from app.services.ai.base import AIResponse

                response = AIResponse(
                    text=f"Document file not found: {filename}",
                    tokens_input=0,
                    tokens_output=0,
                    model_id="error",
                    provider_id="error",
                )
        else:
            from app.services.ai.base import AIResponse

            response = AIResponse(
                text="No document file_url in metadata",
                tokens_input=0,
                tokens_output=0,
                model_id="error",
                provider_id="error",
            )
    else:
        # Fallback
        content = entry.content or str(entry.entry_metadata or {})
        response = await provider.analyze_text(content, CLINICAL_SYSTEM_PROMPT)

    return AnalysisResult(
        text=response.text,
        model_id=response.model_id,
        provider_id=response.provider_id,
        tokens_input=response.tokens_input,
        tokens_output=response.tokens_output,
        pipeline="legacy",
        metadata={
            "task_type": task_type,
        },
    )
