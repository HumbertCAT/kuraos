"""Public Forms Gateway - No authentication required.

These endpoints are accessed via public tokens for form submission.
Security: Token validation includes expiration check.
"""

from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Any, Dict

from app.db.base import get_db
from app.db.models import (
    FormTemplate,
    FormAssignment,
    FormAssignmentStatus,
    ClinicalEntry,
    EntryType,
    Patient,
    Lead,
    LeadStatus,
)
from app.services.forms import (
    get_assignment_by_token,
    mark_assignment_opened,
    mark_assignment_completed,
    evaluate_risk,
    get_template_by_public_token,
    find_or_create_patient,
    create_assignment,
)
from app.services.automation_engine import fire_event
from app.schemas.automation_types import TriggerEvent


router = APIRouter()


# ============ Schemas ============


class PublicFormResponse(BaseModel):
    """Schema returned to public form page."""

    title: str
    description: str | None
    schema: Dict[str, Any]
    therapy_type: str
    form_type: str
    patient_first_name: str
    expires_at: str


class FormSubmissionRequest(BaseModel):
    """Submitted form data."""

    answers: Dict[str, Any]


class FormSubmissionResponse(BaseModel):
    """Response after form submission."""

    success: bool
    message: str
    risk_level: str
    requires_review: bool = False
    is_flagged: bool = False


# ============ Public Endpoints ============


@router.get("/{token}", response_model=PublicFormResponse)
async def get_public_form(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get form schema for public rendering.

    Security: Validates token and expiration before returning data.
    """
    # Get and validate assignment (includes expiration check)
    assignment = await get_assignment_by_token(db, token)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or has expired",
        )

    # Mark as opened if first view
    await mark_assignment_opened(db, assignment)

    # Get template
    template_result = await db.execute(
        select(FormTemplate).where(FormTemplate.id == assignment.template_id)
    )
    template = template_result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form template not found",
        )

    # Get patient first name for personalization
    patient_result = await db.execute(
        select(Patient).where(Patient.id == assignment.patient_id)
    )
    patient = patient_result.scalar_one()

    return PublicFormResponse(
        title=template.title,
        description=template.description,
        schema=template.schema,
        therapy_type=template.therapy_type.value,
        form_type=template.form_type.value,
        patient_first_name=patient.first_name,
        expires_at=assignment.valid_until.isoformat(),
    )


@router.post("/{token}", response_model=FormSubmissionResponse)
async def submit_public_form(
    token: str,
    submission: FormSubmissionRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Submit completed form.

    Creates a ClinicalEntry with type FORM_SUBMISSION.
    Marks assignment as completed.
    """
    # Get and validate assignment
    assignment = await get_assignment_by_token(db, token)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or has expired",
        )

    # Get template for risk level
    template_result = await db.execute(
        select(FormTemplate).where(FormTemplate.id == assignment.template_id)
    )
    template = template_result.scalar_one()

    # Evaluate risk with full logic
    risk_result = evaluate_risk(
        submission_data=submission.answers,
        template_schema=template.schema or {},
        template_risk_level=template.risk_level.value,
    )

    risk_level = risk_result["risk_level"]
    flags = risk_result["flags"]
    requires_review = risk_result["requires_review"]
    is_flagged = len(flags) > 0

    # Create ClinicalEntry with form submission
    clinical_entry = ClinicalEntry(
        patient_id=assignment.patient_id,
        entry_type=EntryType.FORM_SUBMISSION,
        content=None,  # Form answers stored in metadata
        entry_metadata={
            "form_template_id": str(template.id),
            "form_title": template.title,
            "answers": submission.answers,
            "risk_level": risk_level,
            "risk_flags": flags,
            "requires_review": requires_review,
            "is_flagged": is_flagged,
            "assignment_id": str(assignment.id),
            "submitted_at": datetime.utcnow().isoformat(),
        },
    )

    db.add(clinical_entry)

    # AUTO-SYNC: Copy birth data from form answers to Patient profile
    # Magic field IDs that trigger automatic profile updates
    answers = submission.answers
    patient_updates = {}

    if "birth_date" in answers and answers["birth_date"]:
        try:
            # Parse date string to datetime
            from datetime import datetime as dt

            patient_updates["birth_date"] = dt.fromisoformat(answers["birth_date"])
        except (ValueError, TypeError):
            pass  # Skip invalid date

    if "birth_time" in answers and answers["birth_time"]:
        patient_updates["birth_time"] = str(answers["birth_time"])

    if "birth_place" in answers and answers["birth_place"]:
        patient_updates["birth_place"] = str(answers["birth_place"])

    # Apply updates to patient if any birth data was provided
    if patient_updates:
        patient_result = await db.execute(
            select(Patient).where(Patient.id == assignment.patient_id)
        )
        patient = patient_result.scalar_one()
        for key, value in patient_updates.items():
            setattr(patient, key, value)

    # Mark assignment as completed
    await mark_assignment_completed(db, assignment)

    await db.commit()

    # Get patient for automation event (need name and email for emails)
    patient_for_event = await db.execute(
        select(Patient).where(Patient.id == assignment.patient_id)
    )
    patient = patient_for_event.scalar_one_or_none()

    # Fire automation event (Hito 2: Hardcoded rules)
    try:
        await fire_event(
            db=db,
            event_type=TriggerEvent.FORM_SUBMISSION_COMPLETED,
            payload={
                "patient_id": str(assignment.patient_id),
                "patient_name": f"{patient.first_name} {patient.last_name}"
                if patient
                else "Paciente",
                "patient_email": patient.email if patient else None,
                "form_template_id": str(template.id),
                "form_title": template.title,
                "risk_analysis": {
                    "level": risk_level,
                    "flags": flags,
                    "requires_review": requires_review,
                },
            },
            organization_id=template.organization_id,
            entity_type="form_submission",
            entity_id=clinical_entry.id,
        )
    except Exception as e:
        # Don't fail the request if automation fails
        import logging

        logging.error(f"Automation event failed: {e}")

    # Determine response message based on risk
    if risk_level == "CRITICAL":
        message = "Thank you. Based on your responses, we need to review your application before proceeding. Your therapist will contact you shortly."
    elif requires_review:
        message = (
            "Form submitted successfully. Your therapist will review your responses."
        )
    else:
        message = "Form submitted successfully"

    return FormSubmissionResponse(
        success=True,
        message=message,
        risk_level=risk_level,
        requires_review=requires_review,
        is_flagged=is_flagged,
    )


# ============ Public Lead Gen Endpoints (No Assignment Required) ============


class PublicLeadFormRequest(BaseModel):
    """Submitted lead gen form - requires email and name."""

    email: str
    name: str
    answers: Dict[str, Any]


@router.get("/public/{public_token}", response_model=PublicFormResponse)
async def get_public_lead_form(
    public_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get form schema for public lead gen (Instagram link).

    No patient assignment needed - anyone with link can access.
    """
    template = await get_template_by_public_token(db, public_token)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or is not active",
        )

    return PublicFormResponse(
        title=template.title,
        description=template.description,
        schema=template.schema,
        therapy_type=template.therapy_type.value,
        form_type=template.form_type.value,
        patient_first_name="",  # Unknown for lead gen
        expires_at="",  # No expiration for public templates
    )


@router.post("/public/{public_token}", response_model=FormSubmissionResponse)
async def submit_public_lead_form(
    public_token: str,
    submission: PublicLeadFormRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit public form - creates Lead OR Patient based on template.target_entity.

    THE FORK:
    - If template.target_entity == 'LEAD': Create Lead, emit LEAD_CREATED, return.
    - If template.target_entity == 'PATIENT' (default): Create Patient and ClinicalEntry.
    """
    template = await get_template_by_public_token(db, public_token)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Form not found or is not active",
        )

    if not template.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public forms must belong to an organization",
        )

    # ============ THE FORK ============
    if template.target_entity == "LEAD":
        # === LEAD PATH: Create Lead, emit event, return early ===

        # Parse name into first/last
        name_parts = submission.name.strip().split(" ", 1) if submission.name else [""]
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Check if Lead with this email already exists
        existing_lead_result = await db.execute(
            select(Lead).where(
                Lead.organization_id == template.organization_id,
                Lead.email == submission.email,
            )
        )
        existing_lead = existing_lead_result.scalar_one_or_none()

        if existing_lead:
            # Lead exists - update and return success
            return FormSubmissionResponse(
                success=True,
                message="Thank you! We already have your information and will be in touch soon.",
                risk_level="LOW",
                requires_review=False,
                is_flagged=False,
            )

        # Create new Lead
        new_lead = Lead(
            organization_id=template.organization_id,
            first_name=first_name,
            last_name=last_name,
            email=submission.email,
            phone=submission.answers.get("phone", ""),
            source=f"Form: {template.title}",
            status=LeadStatus.NEW,
            notes="Submitted via public form",
            form_data=submission.answers,  # Clinical data in structured JSONB
        )
        db.add(new_lead)
        await db.commit()
        await db.refresh(new_lead)

        # Emit LEAD_CREATED event for automation
        from app.services.automation_engine import emit_event

        await emit_event(
            db=db,
            event_type=TriggerEvent.LEAD_CREATED,
            organization_id=template.organization_id,
            entity_id=new_lead.id,
            entity_type="lead",
            payload={
                "lead_id": str(new_lead.id),
                "first_name": first_name,
                "last_name": last_name,
                "email": submission.email,
                "phone": new_lead.phone,
                "source": new_lead.source,
            },
        )

        return FormSubmissionResponse(
            success=True,
            message="Thank you for your interest! We will contact you shortly.",
            risk_level="LOW",
            requires_review=False,
            is_flagged=False,
        )

    # === PATIENT PATH (default): Continue with existing logic ===
    # Find or create patient
    patient, is_new = await find_or_create_patient(
        db=db,
        organization_id=template.organization_id,
        email=submission.email,
        name=submission.name,
    )

    # Evaluate risk
    risk_result = evaluate_risk(
        submission_data=submission.answers,
        template_schema=template.schema or {},
        template_risk_level=template.risk_level.value,
    )

    risk_level = risk_result["risk_level"]
    flags = risk_result["flags"]
    requires_review = risk_result["requires_review"]
    is_flagged = len(flags) > 0

    # Create ClinicalEntry
    clinical_entry = ClinicalEntry(
        patient_id=patient.id,
        entry_type=EntryType.FORM_SUBMISSION,
        content=None,
        entry_metadata={
            "form_template_id": str(template.id),
            "form_title": template.title,
            "answers": submission.answers,
            "risk_level": risk_level,
            "risk_flags": flags,
            "requires_review": requires_review,
            "is_flagged": is_flagged,
            "is_lead_gen": True,
            "is_new_patient": is_new,
            "submitted_at": datetime.utcnow().isoformat(),
        },
    )
    db.add(clinical_entry)

    # Create retroactive assignment for tracking
    assignment = FormAssignment(
        patient_id=patient.id,
        template_id=template.id,
        token=f"lead_{public_token}_{patient.id}",
        status=FormAssignmentStatus.COMPLETED,
        valid_until=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )
    db.add(assignment)

    # Auto-sync birth data if present
    answers = submission.answers
    if "birth_date" in answers and answers["birth_date"]:
        try:
            from datetime import datetime as dt

            patient.birth_date = dt.fromisoformat(answers["birth_date"])
        except (ValueError, TypeError):
            pass

    if "birth_time" in answers and answers["birth_time"]:
        patient.birth_time = str(answers["birth_time"])

    if "birth_place" in answers and answers["birth_place"]:
        patient.birth_place = str(answers["birth_place"])

    await db.commit()

    # Determine response message
    if risk_level == "CRITICAL":
        message = "Thank you. Based on your responses, we need to review your application. We will contact you shortly."
    elif is_new:
        message = (
            "Welcome! Your information has been received. We will be in touch soon."
        )
    else:
        message = "Form submitted successfully. Thank you for your response."

    return FormSubmissionResponse(
        success=True,
        message=message,
        risk_level=risk_level,
        requires_review=requires_review,
        is_flagged=is_flagged,
    )
