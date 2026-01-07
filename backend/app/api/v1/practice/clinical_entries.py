"""Clinical Entry CRUD endpoints for patient timeline.

v1.5.5: HARD SWITCH to Cortex. All analysis routes through ClinicalService.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models import ClinicalEntry, Patient, EntryType, UserRole
from app.services.clinical_service import ClinicalService

# v1.3.3: Map EntryType to AI task routing keys
ENTRY_TYPE_TO_TASK: dict[EntryType, str] = {
    EntryType.SESSION_NOTE: "clinical_analysis",  # → ORACLE
    EntryType.AUDIO: "audio_synthesis",  # → VOICE
    EntryType.DOCUMENT: "document_analysis",  # → SCAN
    EntryType.AI_ANALYSIS: "clinical_analysis",  # fallback
}
from app.api.deps import CurrentUser, CurrentClinicalUser
from .clinical_entry_schemas import (
    ClinicalEntryCreate,
    ClinicalEntryUpdate,
    ClinicalEntryResponse,
    ClinicalEntryListResponse,
)

router = APIRouter()


@router.post(
    "/", response_model=ClinicalEntryResponse, status_code=status.HTTP_201_CREATED
)
async def create_clinical_entry(
    entry_data: ClinicalEntryCreate,
    background_tasks: BackgroundTasks,
    current_user: CurrentClinicalUser,  # RBAC: Only OWNER/THERAPIST can create
    db: AsyncSession = Depends(get_db),
):
    """Create a new clinical entry for a patient."""
    # Verify patient belongs to user's organization
    patient_result = await db.execute(
        select(Patient).where(
            Patient.id == entry_data.patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    patient = patient_result.scalar_one_or_none()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    # Validate entry_type
    try:
        entry_type = EntryType(entry_data.entry_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid entry_type. Must be one of: {[e.value for e in EntryType]}",
        )

    entry = ClinicalEntry(
        patient_id=entry_data.patient_id,
        author_id=current_user.id,
        entry_type=entry_type,
        content=entry_data.content,
        entry_metadata=entry_data.entry_metadata,
        is_private=entry_data.is_private,
        happened_at=entry_data.happened_at,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    # v0.9.2: Fire automation event for SESSION_NOTE with risk detection
    if entry_type == EntryType.SESSION_NOTE and entry.content:
        try:
            from app.services.risk_detector import (
                detect_risk_keywords,
                extract_risk_keywords,
            )
            from app.services.automation_engine import fire_event
            from app.schemas.automation_types import TriggerEvent

            has_risk = await detect_risk_keywords(entry.content)

            if has_risk:
                risk_keywords = await extract_risk_keywords(entry.content)
                await fire_event(
                    db=db,
                    event_type=TriggerEvent.RISK_DETECTED_IN_NOTE,
                    payload={
                        "patient_id": str(entry.patient_id),
                        "patient_name": f"{patient.first_name} {patient.last_name}",
                        "clinical_entry_id": str(entry.id),
                        "excerpt": entry.content[:200]
                        if len(entry.content) > 200
                        else entry.content,
                        "risk_keywords": risk_keywords,
                        "author_name": current_user.full_name,
                    },
                    organization_id=current_user.organization_id,
                    entity_type="clinical_entry",
                    entity_id=entry.id,
                )
        except Exception as e:
            import logging

            logging.error(f"Risk detection automation failed: {e}")

    # v1.0.7: Queue anonymization for The Vault (GDPR-compliant IP preservation)
    if entry.content:
        from app.services.data_sanitizer import sanitize_and_store_background

        background_tasks.add_task(
            sanitize_and_store_background,
            content=entry.content,
            metadata=entry.entry_metadata or {},
            source_type="CLINICAL_NOTE",
        )

    return ClinicalEntryResponse.model_validate(entry)


@router.get("/patient/{patient_id}", response_model=ClinicalEntryListResponse)
async def list_patient_entries(
    patient_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List all clinical entries for a patient, ordered by happened_at DESC."""
    # Verify patient belongs to user's organization
    patient = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    if not patient.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    # Get entries ordered by happened_at DESC
    # PRIVACY FILTER: Only show entries that are:
    # 1. Public (is_private=False), OR
    # 2. Authored by current user, OR
    # 3. Current user is OWNER (can see all for supervision)
    from sqlalchemy import or_

    base_query = select(ClinicalEntry).where(ClinicalEntry.patient_id == patient_id)

    # Apply privacy filter unless user is OWNER
    if current_user.role != UserRole.OWNER:
        base_query = base_query.where(
            or_(
                ~ClinicalEntry.is_private,  # Public notes
                ClinicalEntry.author_id == current_user.id,
            )
        )

    query = base_query.order_by(ClinicalEntry.happened_at.desc())

    result = await db.execute(query)
    entries = result.scalars().all()

    return ClinicalEntryListResponse(
        entries=[ClinicalEntryResponse.model_validate(e) for e in entries],
        total=len(entries),
    )


@router.patch("/{entry_id}", response_model=ClinicalEntryResponse)
async def update_clinical_entry(
    entry_id: uuid.UUID,
    entry_data: ClinicalEntryUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update a clinical entry."""
    # Get entry and verify ownership via patient's organization
    result = await db.execute(
        select(ClinicalEntry)
        .join(Patient)
        .where(
            ClinicalEntry.id == entry_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical entry not found",
        )

    # Update only provided fields
    update_dict = entry_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)

    return ClinicalEntryResponse.model_validate(entry)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_clinical_entry(
    entry_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Delete a clinical entry."""
    result = await db.execute(
        select(ClinicalEntry)
        .join(Patient)
        .where(
            ClinicalEntry.id == entry_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical entry not found",
        )

    await db.delete(entry)
    await db.commit()

    return None


@router.post(
    "/{entry_id}/analyze",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=ClinicalEntryResponse,
)
async def analyze_clinical_entry(
    entry_id: uuid.UUID,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Queue AI analysis on a clinical entry using AletheIA.

    Returns 202 Accepted immediately. Frontend should poll until
    processing_status changes from PENDING/PROCESSING to COMPLETED/FAILED.
    """
    from app.db.models import ProcessingStatus

    # Get entry and verify ownership via patient's organization
    result = await db.execute(
        select(ClinicalEntry)
        .join(Patient)
        .where(
            ClinicalEntry.id == entry_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clinical entry not found",
        )

    # Don't analyze AI_ANALYSIS entries
    if entry.entry_type == EntryType.AI_ANALYSIS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot analyze an AI_ANALYSIS entry",
        )

    # Don't start new analysis if one is already in progress (unless stale)
    if entry.processing_status in (
        ProcessingStatus.PENDING,
        ProcessingStatus.PROCESSING,
    ):
        # Check if analysis is stale (stuck for more than 5 minutes)
        from datetime import datetime, timedelta

        cutoff = datetime.utcnow() - timedelta(minutes=5)
        if entry.updated_at and entry.updated_at > cutoff:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Analysis already in progress",
            )
        # If stale, allow retry by continuing

    # Set status to PENDING and queue background task
    entry.processing_status = ProcessingStatus.PENDING
    entry.processing_error = None
    await db.commit()
    await db.refresh(entry)

    # v1.5.5: HARD SWITCH - Direct to Cortex
    clinical_service = ClinicalService(db)
    background_tasks.add_task(
        clinical_service.process_entry_async,
        entry_id=entry.id,
        user_id=current_user.id,
    )

    return ClinicalEntryResponse.model_validate(entry)


async def run_analysis_task(entry_id: uuid.UUID, user_id: uuid.UUID):
    """
    ⚠️ DEPRECATED v1.5.5 - Use ClinicalService.process_entry_async instead.

    This legacy function is kept for reference only.
    All new analysis flows go through CortexOrchestrator via ClinicalService.

    Original: Background task to run AI analysis with REAL token-based cost accounting.
    v1.1.1 CLEAN LEDGER: Uses ProviderFactory + CostLedger for accurate billing.
    """
    import warnings

    warnings.warn(
        "run_analysis_task is deprecated. Use ClinicalService.process_entry_async",
        DeprecationWarning,
    )
    from app.db.base import get_session_factory
    from app.services.ai import ProviderFactory, CostLedger
    from app.services.ai.base import AIResponse
    from app.services.ai.prompts import (
        CLINICAL_SYSTEM_PROMPT,
        AUDIO_SYNTHESIS_PROMPT,
        DOCUMENT_ANALYSIS_PROMPT,
    )
    from app.db.models import (
        ProcessingStatus,
        ClinicalEntry,
        Organization,
        AiUsageLog,
        Patient,
        EntryType,
    )
    from app.core.config import settings
    from decimal import Decimal

    factory = get_session_factory()
    async with factory() as db:
        entry = None
        org = None
        try:
            # Get entry
            result = await db.execute(
                select(ClinicalEntry).where(ClinicalEntry.id == entry_id)
            )
            entry = result.scalar_one_or_none()
            if not entry:
                return

            # Get patient → organization
            patient_result = await db.execute(
                select(Patient).where(Patient.id == entry.patient_id)
            )
            patient = patient_result.scalar_one_or_none()
            if not patient:
                return

            org_result = await db.execute(
                select(Organization).where(Organization.id == patient.organization_id)
            )
            org = org_result.scalar_one_or_none()
            if not org:
                return

            # Update status to PROCESSING
            entry.processing_status = ProcessingStatus.PROCESSING
            await db.commit()

            # ============================================================
            # v1.3.3: Get routed provider based on entry type
            # v1.4.12: Crystal Mind - Light Memory context injection
            # ============================================================
            # Determine task_type FIRST from entry type
            task_type = ENTRY_TYPE_TO_TASK.get(entry.entry_type, "clinical_analysis")

            # Build context for prompt template (Light Memory)
            prompt_context = {
                "patient_name": patient.name if patient else None,
            }

            # Inject last session summary if available (from previous AI analysis)
            if patient and patient.last_insight_json:
                last_insight = patient.last_insight_json
                if isinstance(last_insight, dict):
                    prompt_context["last_session_summary"] = last_insight.get(
                        "summary", last_insight.get("clinical_reasoning", "")
                    )

            # Get routed provider (reads AI_TASK_ROUTING from SystemSettings)
            provider = await ProviderFactory.get_provider_for_task(
                task_type, db, prompt_context=prompt_context
            )

            # Determine prompt based on entry type
            if entry.entry_type == EntryType.SESSION_NOTE:
                prompt = CLINICAL_SYSTEM_PROMPT
                content = entry.content or ""

                # Text analysis
                response = await provider.analyze_text(content, prompt)

            elif entry.entry_type == EntryType.AUDIO:
                # v1.4.11 Crystal Mind: Smart routing by audio duration
                metadata = entry.entry_metadata or {}
                duration_seconds = metadata.get("duration_seconds", 0)

                # Route short audios (<15 min) to MEMO, longer to VOICE
                MEMO_THRESHOLD = 15 * 60  # 15 minutes in seconds

                if duration_seconds and duration_seconds < MEMO_THRESHOLD:
                    # Short audio → MEMO (faster, structured output)
                    audio_task_type = "audio_memo"
                    import logging

                    logging.info(
                        f"Short audio ({duration_seconds / 60:.1f} min), routing to MEMO"
                    )
                else:
                    # Long audio or unknown duration → VOICE (full synthesis)
                    audio_task_type = "audio_synthesis"
                    if not duration_seconds:
                        import logging

                        logging.info(
                            f"Audio duration unknown, defaulting to VOICE for safety"
                        )

                # Get provider for the routed task (with patient context)
                provider = await ProviderFactory.get_provider_for_task(
                    audio_task_type, db, prompt_context=prompt_context
                )

                # Get prompt from provider's system instruction (already rendered)
                from app.services.ai.prompts import AUDIO_SYNTHESIS_PROMPT

                prompt = (
                    AUDIO_SYNTHESIS_PROMPT  # Fallback (provider has the real prompt)
                )

                # Get audio file path
                file_url = metadata.get("file_url", "")

                if file_url:
                    import os

                    # Extract filename from URL and build path
                    filename = os.path.basename(file_url)
                    audio_path = os.path.join("/app/static/uploads", filename)

                    if os.path.exists(audio_path):
                        with open(audio_path, "rb") as f:
                            audio_bytes = f.read()

                        # Detect MIME type from extension
                        extension = os.path.splitext(audio_path)[1].lower()
                        mime_map = {
                            ".webm": "audio/webm",
                            ".mp3": "audio/mpeg",
                            ".wav": "audio/wav",
                            ".m4a": "audio/mp4",
                            ".ogg": "audio/ogg",
                            ".flac": "audio/flac",
                        }
                        mime_type = mime_map.get(extension, "audio/webm")

                        # v1.4.2: Route large files through GCS
                        LARGE_FILE_THRESHOLD = 20 * 1024 * 1024  # 20MB

                        if len(audio_bytes) > LARGE_FILE_THRESHOLD:
                            # Large file: upload to Vault first, then reference
                            from app.services.storage import vault_storage
                            import logging

                            logging.info(
                                f"Large audio detected ({len(audio_bytes) / 1024 / 1024:.1f}MB), "
                                f"routing through GCS"
                            )
                            gcs_uri = vault_storage.upload_temp_media(
                                audio_bytes, filename, mime_type
                            )
                            response = await provider.analyze_multimodal(
                                content=None,  # No inline content
                                mime_type=mime_type,
                                prompt=prompt,
                                gcs_uri=gcs_uri,  # Reference GCS
                            )
                        else:
                            # Small file: inline (fast path)
                            response = await provider.analyze_multimodal(
                                audio_bytes, mime_type, prompt
                            )
                    else:
                        response = AIResponse(
                            text=f"Audio file not found: {filename}",
                            tokens_input=0,
                            tokens_output=0,
                            model_id="error",
                            provider_id="error",
                        )
                else:
                    response = AIResponse(
                        text="No audio file_url in metadata",
                        tokens_input=0,
                        tokens_output=0,
                        model_id="error",
                        provider_id="error",
                    )

            elif entry.entry_type == EntryType.DOCUMENT:
                task_type = "document_analysis"
                prompt = DOCUMENT_ANALYSIS_PROMPT

                # Get document file - same logic as audio
                metadata = entry.entry_metadata or {}
                file_url = metadata.get("file_url", "")

                if file_url:
                    import os

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
                        response = AIResponse(
                            text=f"Document file not found: {filename}",
                            tokens_input=0,
                            tokens_output=0,
                            model_id="error",
                            provider_id="error",
                        )
                else:
                    response = AIResponse(
                        text="No document file_url in metadata",
                        tokens_input=0,
                        tokens_output=0,
                        model_id="error",
                        provider_id="error",
                    )
            else:
                # Fallback for other types
                task_type = f"analysis_{entry.entry_type.value.lower()}"
                content = entry.content or str(entry.entry_metadata or {})
                response = await provider.analyze_text(content, CLINICAL_SYSTEM_PROMPT)

            # ============================================================
            # COST LEDGER: Log REAL tokens and calculate costs
            # ============================================================
            costs = CostLedger.calculate_cost(response)

            # Create detailed usage log
            usage_log = AiUsageLog(
                id=uuid.uuid4(),
                organization_id=org.id,
                user_id=user_id,
                patient_id=patient.id,
                clinical_entry_id=entry.id,
                provider=response.provider_id,
                model_id=response.model_id,
                task_type=task_type,
                tokens_input=costs["tokens_input"],
                tokens_output=costs["tokens_output"],
                cost_provider_usd=float(costs["cost_provider_usd"]),
                cost_user_credits=float(costs["cost_user_credits"]),
                # Legacy field for backwards compatibility
                credits_cost=int(costs["cost_user_credits"] * 100),  # cents
                activity_type=task_type,
            )
            db.add(usage_log)

            # Cost tracking is now done via AiUsageLog.cost_provider_usd
            # Spend limits are controlled via TIER_AI_SPEND_LIMIT_* in system_settings

            # ============================================================
            # SAVE RESULT
            # ============================================================
            analysis_result = {
                "id": str(uuid.uuid4()),
                "date": entry.created_at.isoformat() if entry.created_at else None,
                "text": response.text,
                "model": response.model_id,
                "tokens": {
                    "input": response.tokens_input,
                    "output": response.tokens_output,
                },
                "cost_usd": float(costs["cost_provider_usd"]),
            }

            current_metadata = entry.entry_metadata or {}
            current_analyses = current_metadata.get("ai_analyses", [])
            current_analyses.append(analysis_result)

            entry.entry_metadata = {
                **current_metadata,
                "ai_analyses": current_analyses,
            }
            entry.processing_status = ProcessingStatus.COMPLETED
            entry.processing_error = None

            await db.commit()

        except Exception as e:
            import traceback

            traceback.print_exc()
            if entry:
                entry.processing_status = ProcessingStatus.FAILED
                entry.processing_error = str(e)
                await db.commit()
