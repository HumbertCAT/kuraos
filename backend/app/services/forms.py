"""Forms service for template cloning and assignment management."""

import secrets
from datetime import datetime, timedelta
from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import (
    FormTemplate,
    FormAssignment,
    FormAssignmentStatus,
    Patient,
    RiskLevel,
)


def generate_token() -> str:
    """Generate a URL-safe token for public form access."""
    return secrets.token_urlsafe(32)


def generate_short_token() -> str:
    """Generate a shorter URL-safe token for public template links."""
    return secrets.token_urlsafe(16)


async def clone_template(
    db: AsyncSession,
    system_template_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> FormTemplate:
    """Clone a system template to an organization.

    Creates a copy of the template with the organization_id set.
    """
    # Get the system template
    result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.id == system_template_id,
            FormTemplate.organization_id.is_(None),  # Must be system template
        )
    )
    system_template = result.scalar_one_or_none()

    if not system_template:
        raise ValueError("System template not found")

    # Create a copy for the organization
    cloned_template = FormTemplate(
        organization_id=organization_id,
        title=f"{system_template.title} (Copy)",
        description=system_template.description,
        schema=system_template.schema.copy() if system_template.schema else {},
        risk_level=system_template.risk_level,
        therapy_type=system_template.therapy_type,
        form_type=system_template.form_type,
        is_active=True,
    )

    db.add(cloned_template)
    await db.commit()
    await db.refresh(cloned_template)

    return cloned_template


async def generate_public_token_for_template(
    db: AsyncSession,
    template_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> str:
    """Generate a public access token for a template (Instagram link).

    Only allowed if risk_level is not CRITICAL (safety first).
    """
    result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.id == template_id,
            FormTemplate.organization_id == organization_id,
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise ValueError("Template not found")

    if template.risk_level == RiskLevel.CRITICAL:
        raise ValueError("Cannot create public link for CRITICAL risk templates")

    # Generate and set public token
    public_token = generate_short_token()
    template.public_token = public_token
    await db.commit()

    return public_token


async def get_template_by_public_token(
    db: AsyncSession,
    public_token: str,
) -> FormTemplate | None:
    """Get a template by its public access token."""
    result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.public_token == public_token,
            FormTemplate.is_active == True,
        )
    )
    return result.scalar_one_or_none()


async def find_or_create_patient(
    db: AsyncSession,
    organization_id: uuid.UUID,
    email: str,
    name: str,
) -> tuple[Patient, bool]:
    """Find existing patient by email or create new one.

    Returns (patient, is_new) tuple.
    """
    # Split name into first/last
    name_parts = name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Try to find existing patient
    result = await db.execute(
        select(Patient).where(
            Patient.organization_id == organization_id,
            Patient.email == email.lower().strip(),
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        return (existing, False)

    # Create new patient
    new_patient = Patient(
        organization_id=organization_id,
        first_name=first_name,
        last_name=last_name,
        email=email.lower().strip(),
    )
    db.add(new_patient)
    await db.flush()  # Get ID without full commit

    return (new_patient, True)


async def create_assignment(
    db: AsyncSession,
    patient_id: uuid.UUID,
    template_id: uuid.UUID,
    valid_days: int = 7,
) -> FormAssignment:
    """Create a form assignment with a secure token.

    The assignment links a patient to a form template with a public access token.
    """
    # Verify patient exists
    patient_result = await db.execute(select(Patient).where(Patient.id == patient_id))
    if not patient_result.scalar_one_or_none():
        raise ValueError("Patient not found")

    # Verify template exists
    template_result = await db.execute(
        select(FormTemplate).where(FormTemplate.id == template_id)
    )
    if not template_result.scalar_one_or_none():
        raise ValueError("Template not found")

    # Create assignment
    assignment = FormAssignment(
        patient_id=patient_id,
        template_id=template_id,
        token=generate_token(),
        valid_until=datetime.utcnow() + timedelta(days=valid_days),
    )

    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    return assignment


async def get_assignment_by_token(
    db: AsyncSession,
    token: str,
) -> FormAssignment | None:
    """Get a form assignment by its public access token.

    Returns None if token is invalid or expired.
    """
    result = await db.execute(
        select(FormAssignment).where(
            FormAssignment.token == token,
            FormAssignment.valid_until > datetime.utcnow(),
            FormAssignment.status != FormAssignmentStatus.COMPLETED,
            FormAssignment.status != FormAssignmentStatus.EXPIRED,
        )
    )
    return result.scalar_one_or_none()


async def mark_assignment_opened(
    db: AsyncSession,
    assignment: FormAssignment,
) -> None:
    """Mark an assignment as opened (first view)."""
    if assignment.status == FormAssignmentStatus.SENT:
        assignment.status = FormAssignmentStatus.OPENED
        assignment.opened_at = datetime.utcnow()
        await db.commit()


async def mark_assignment_completed(
    db: AsyncSession,
    assignment: FormAssignment,
) -> None:
    """Mark an assignment as completed."""
    assignment.status = FormAssignmentStatus.COMPLETED
    assignment.completed_at = datetime.utcnow()
    await db.commit()


def evaluate_risk(
    submission_data: dict,
    template_schema: dict,
    template_risk_level: str,
) -> dict:
    """Evaluate risk based on submission answers and template schema.

    Processes MEDICAL_BOOLEAN fields to detect safety flags.
    Returns a dict with risk level and any flags found.

    Args:
        submission_data: The form answers
        template_schema: The form template schema with field definitions
        template_risk_level: Base risk level from template (LOW, MEDIUM, HIGH, CRITICAL)

    Returns:
        {
            "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
            "flags": [{"field_id": "...", "field_label": "...", "reason": "..."}],
            "requires_review": bool
        }
    """
    flags = []
    risk_level = template_risk_level
    fields = template_schema.get("fields", [])

    # Create a lookup for field definitions
    field_map = {f["id"]: f for f in fields}

    # Check each answer for medical flags
    for field_id, answer in submission_data.items():
        field_def = field_map.get(field_id, {})
        field_type = field_def.get("type", "")
        field_label = field_def.get("label", field_id)

        # MEDICAL_BOOLEAN: If user answers True, it's a potential risk
        if field_type == "medical_boolean" and answer is True:
            flags.append({
                "field_id": field_id,
                "field_label": field_label,
                "reason": "User answered YES to medical screening question",
            })

            # Check if this field has a critical flag
            if field_def.get("critical", False):
                risk_level = "CRITICAL"
            elif risk_level in ("LOW", "MEDIUM"):
                risk_level = "HIGH"

    # If template is HIGH risk but no specific flags, mark for manual review
    requires_review = False
    if template_risk_level in ("HIGH", "CRITICAL") and not flags:
        requires_review = True
        if risk_level == "LOW":
            risk_level = "MEDIUM"

    # Any flags require review
    if flags:
        requires_review = True

    return {
        "risk_level": risk_level,
        "flags": flags,
        "requires_review": requires_review,
    }


# High-risk keywords to scan in free-text answers
RISK_KEYWORDS = [
    "ssri",
    "ssris",
    "maoi",
    "maois",
    "lithium",
    "psychosis",
    "psychotic",
    "schizophrenia",
    "bipolar",
    "suicidal",
    "suicide",
    "self-harm",
    "hospitalized",
    "seizure",
    "epilepsy",
    "heart condition",
    "cardiac",
]


def scan_text_for_risks(text: str) -> list:
    """Scan free-text answers for high-risk keywords.

    Returns list of detected keywords.
    """
    if not text:
        return []

    text_lower = text.lower()
    detected = []

    for keyword in RISK_KEYWORDS:
        if keyword in text_lower:
            detected.append(keyword)

    return detected
