"""Clinical Entry CRUD endpoints for patient timeline."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.db.models import ClinicalEntry, Patient, EntryType, UserRole
from app.api.deps import CurrentUser, CurrentClinicalUser
from app.api.v1.clinical_entry_schemas import (
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

    # Add background task
    background_tasks.add_task(
        run_analysis_task,
        entry_id=entry.id,
        user_id=current_user.id,
    )

    return ClinicalEntryResponse.model_validate(entry)


async def run_analysis_task(entry_id: uuid.UUID, user_id: uuid.UUID):
    """Background task to run AI analysis with credit deduction."""
    from app.db.base import AsyncSessionLocal
    from app.services.aletheia import get_aletheia
    from app.services.settings import get_setting_int
    from app.db.models import (
        ProcessingStatus,
        ClinicalEntry,
        Organization,
        AiUsageLog,
        Patient,
        EntryType,
    )

    async with AsyncSessionLocal() as db:
        entry = None
        org = None
        try:
            # Get entry with patient -> organization
            result = await db.execute(
                select(ClinicalEntry).options().where(ClinicalEntry.id == entry_id)
            )
            entry = result.scalar_one_or_none()

            if not entry:
                return

            # Get patient to find organization
            patient_result = await db.execute(
                select(Patient).where(Patient.id == entry.patient_id)
            )
            patient = patient_result.scalar_one_or_none()
            if not patient:
                return

            # Get organization
            org_result = await db.execute(
                select(Organization).where(Organization.id == patient.organization_id)
            )
            org = org_result.scalar_one_or_none()
            if not org:
                return

            # Determine cost based on entry type
            if entry.entry_type == EntryType.SESSION_NOTE:
                cost = await get_setting_int(db, "AI_COST_TEXT", 5)
                activity_type = "analysis_text"
            elif entry.entry_type == EntryType.AUDIO:
                # Check if it's a live recording or uploaded file
                metadata = entry.entry_metadata or {}
                filename = metadata.get("filename", "")
                # Live recordings typically start with "audio_" (from AudioRecorder)
                if filename.startswith("audio_"):
                    cost = await get_setting_int(db, "AI_COST_AUDIO_LIVE", 10)
                    activity_type = "analysis_audio_live"
                else:
                    cost = await get_setting_int(db, "AI_COST_AUDIO_FILE", 20)
                    activity_type = "analysis_audio_file"
            elif entry.entry_type == EntryType.DOCUMENT:
                # Images (from PhotoCapture) have filenames starting with "photo_"
                metadata = entry.entry_metadata or {}
                content_type = metadata.get("content_type", "")
                if content_type.startswith("image/"):
                    cost = await get_setting_int(db, "AI_COST_IMAGE", 5)
                    activity_type = "analysis_image"
                else:
                    cost = await get_setting_int(db, "AI_COST_TEXT", 5)
                    activity_type = "analysis_document"
            else:
                cost = await get_setting_int(db, "AI_COST_TEXT", 5)
                activity_type = f"analysis_{entry.entry_type.value.lower()}"

            # Calculate available credits
            remaining_monthly = (
                org.ai_credits_monthly_quota - org.ai_credits_used_this_month
            )
            total_available = remaining_monthly + org.ai_credits_purchased

            # Check if enough credits
            if total_available < cost:
                entry.processing_status = ProcessingStatus.FAILED
                entry.processing_error = (
                    f"Insufficient credits. Need {cost}, have {total_available}."
                )
                await db.commit()
                return

            # Update status to PROCESSING
            entry.processing_status = ProcessingStatus.PROCESSING
            await db.commit()

            # Run analysis
            aletheia = get_aletheia()

            # Get model from system_settings (admin panel override)
            from app.services.settings import get_setting_str

            ai_model = await get_setting_str(db, "AI_MODEL", "gemini-2.5-flash")

            analysis_result = await aletheia.analyze(entry, model_name=ai_model)

            # Deduct credits: use monthly quota first, then purchased
            if remaining_monthly >= cost:
                org.ai_credits_used_this_month += cost
            else:
                # Use remaining monthly + dip into purchased
                shortfall = cost - remaining_monthly
                org.ai_credits_used_this_month = org.ai_credits_monthly_quota
                org.ai_credits_purchased -= shortfall

            # Log usage
            usage_log = AiUsageLog(
                organization_id=org.id,
                user_id=user_id,
                entry_id=entry.id,
                credits_cost=cost,
                activity_type=activity_type,
            )
            db.add(usage_log)

            # Append result to ai_analyses
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
            # Update status to FAILED
            if entry:
                entry.processing_status = ProcessingStatus.FAILED
                entry.processing_error = str(e)
                await db.commit()
