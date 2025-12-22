"""Forms API endpoints for dashboard (authenticated)."""

import secrets
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.base import get_db
from app.db.models import FormTemplate, FormAssignment, Patient
from app.api.deps import CurrentUser
from app.services.forms import clone_template, create_assignment


router = APIRouter()


# ============ Schemas ============


class FormTemplateResponse(BaseModel):
    id: uuid.UUID
    organization_id: Optional[uuid.UUID]
    title: str
    description: Optional[str]
    risk_level: str
    therapy_type: str
    form_type: str
    is_system: bool
    is_active: bool
    public_token: Optional[str] = None
    config: Optional[dict] = None

    class Config:
        from_attributes = True


class FormTemplateListResponse(BaseModel):
    templates: List[FormTemplateResponse]


class FormAssignmentCreate(BaseModel):
    patient_id: uuid.UUID
    template_id: uuid.UUID
    valid_days: int = 7


class FormAssignmentResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    template_id: uuid.UUID
    status: str
    token: str
    valid_until: str
    public_url: str

    class Config:
        from_attributes = True


class FormAssignmentListResponse(BaseModel):
    assignments: List[FormAssignmentResponse]


# ============ System Templates ============


@router.get("/templates/system", response_model=FormTemplateListResponse)
async def list_system_templates(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List all available system templates."""
    result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.organization_id.is_(None),
            FormTemplate.is_active == True,
        )
    )
    templates = result.scalars().all()

    return FormTemplateListResponse(
        templates=[
            FormTemplateResponse(
                id=t.id,
                organization_id=t.organization_id,
                title=t.title,
                description=t.description,
                risk_level=t.risk_level.value,
                therapy_type=t.therapy_type.value,
                form_type=t.form_type.value,
                is_system=t.is_system,
                is_active=t.is_active,
            )
            for t in templates
        ]
    )


@router.post("/templates/clone/{template_id}", response_model=FormTemplateResponse)
async def clone_system_template(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Clone a system template to the user's organization."""
    try:
        cloned = await clone_template(
            db=db,
            system_template_id=template_id,
            organization_id=current_user.organization_id,
        )
        return FormTemplateResponse(
            id=cloned.id,
            organization_id=cloned.organization_id,
            title=cloned.title,
            description=cloned.description,
            risk_level=cloned.risk_level.value,
            therapy_type=cloned.therapy_type.value,
            form_type=cloned.form_type.value,
            is_system=cloned.is_system,
            is_active=cloned.is_active,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============ Organization Templates ============


@router.get("/templates", response_model=FormTemplateListResponse)
async def list_org_templates(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List templates owned by the user's organization."""
    result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.organization_id == current_user.organization_id,
            FormTemplate.is_active == True,
        )
    )
    templates = result.scalars().all()

    return FormTemplateListResponse(
        templates=[
            FormTemplateResponse(
                id=t.id,
                organization_id=t.organization_id,
                title=t.title,
                description=t.description,
                risk_level=t.risk_level.value,
                therapy_type=t.therapy_type.value,
                form_type=t.form_type.value,
                is_system=t.is_system,
                is_active=t.is_active,
                public_token=t.public_token,
            )
            for t in templates
        ]
    )


class OrgTemplateUpdate(BaseModel):
    """Schema for updating organization template."""

    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/templates/{template_id}")
async def get_org_template(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get details of a template owned by the user's organization."""
    result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.id == template_id,
            FormTemplate.organization_id == current_user.organization_id,
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return {
        "id": template.id,
        "title": template.title,
        "description": template.description,
        "risk_level": template.risk_level.value,
        "therapy_type": template.therapy_type.value,
        "form_type": template.form_type.value,
        "schema": template.schema,
        "public_token": template.public_token,
        "is_active": template.is_active,
    }


class OrgTemplateFullUpdate(BaseModel):
    """Full update schema with tier validation."""

    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    risk_level: Optional[str] = None
    therapy_type: Optional[str] = None
    form_type: Optional[str] = None
    schema: Optional[dict] = None


@router.put("/templates/{template_id}")
async def update_org_template(
    template_id: uuid.UUID,
    data: OrgTemplateFullUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update a template owned by the user's organization.

    Tier-based permissions:
    - BUILDER: can only update is_active
    - PRO: can update title, description, risk_level, therapy_type, form_type
    - CENTER: can update everything including schema
    """
    from app.db.models import Organization, OrgTier

    result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.id == template_id,
            FormTemplate.organization_id == current_user.organization_id,
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Get organization tier
    org_result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = org_result.scalar_one_or_none()
    tier = org.tier if org else OrgTier.BUILDER

    # All tiers can update is_active
    if data.is_active is not None:
        template.is_active = data.is_active

    # PRO and CENTER can update config fields
    if tier in (OrgTier.PRO, OrgTier.CENTER):
        if data.title is not None:
            template.title = data.title
        if data.description is not None:
            template.description = data.description
        if data.risk_level is not None:
            template.risk_level = data.risk_level
        if data.therapy_type is not None:
            template.therapy_type = data.therapy_type
        if data.form_type is not None:
            template.form_type = data.form_type

    # Only CENTER can update schema
    if tier == OrgTier.CENTER and data.schema is not None:
        template.schema = data.schema

    await db.commit()
    await db.refresh(template)

    return {
        "id": template.id,
        "title": template.title,
        "description": template.description,
        "risk_level": template.risk_level,
        "therapy_type": template.therapy_type,
        "form_type": template.form_type,
        "schema": template.schema,
        "public_token": template.public_token,
        "is_active": template.is_active,
    }


@router.post("/templates/{template_id}/publish")
async def publish_org_template(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Toggle publish status of an organization template."""
    result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.id == template_id,
            FormTemplate.organization_id == current_user.organization_id,
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Toggle: if has token, remove it; otherwise generate new one
    if template.public_token:
        template.public_token = None
        action = "unpublished"
    else:
        template.public_token = secrets.token_urlsafe(16)
        action = "published"

    await db.commit()
    await db.refresh(template)

    return {
        "public_token": template.public_token,
        "action": action,
    }


@router.post("/templates/{template_id}/duplicate")
async def duplicate_org_template(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Duplicate a template to create a copy owned by the user's organization."""
    result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.id == template_id,
            FormTemplate.organization_id == current_user.organization_id,
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Create a copy
    new_template = FormTemplate(
        organization_id=current_user.organization_id,
        title=f"{template.title} (Copia)",
        description=template.description,
        schema=template.schema,
        risk_level=template.risk_level,
        therapy_type=template.therapy_type,
        form_type=template.form_type,
        is_active=False,  # Start inactive
        public_token=None,  # Not published
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)

    return {
        "id": new_template.id,
        "title": new_template.title,
        "message": "Template duplicated successfully",
    }


# ============ Assignments ============


@router.post("/assignments", response_model=FormAssignmentResponse)
async def create_form_assignment(
    data: FormAssignmentCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Create a form assignment for a patient."""
    # Verify patient belongs to user's organization
    patient_result = await db.execute(
        select(Patient).where(
            Patient.id == data.patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    if not patient_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    # Verify template belongs to org (or is system)
    template_result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.id == data.template_id,
            (
                (FormTemplate.organization_id == current_user.organization_id)
                | (FormTemplate.organization_id.is_(None))
            ),
        )
    )
    if not template_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Template not found")

    try:
        assignment = await create_assignment(
            db=db,
            patient_id=data.patient_id,
            template_id=data.template_id,
            valid_days=data.valid_days,
        )

        return FormAssignmentResponse(
            id=assignment.id,
            patient_id=assignment.patient_id,
            template_id=assignment.template_id,
            status=assignment.status.value,
            token=assignment.token,
            valid_until=assignment.valid_until.isoformat(),
            public_url=f"/f/{assignment.token}",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/assignments/{patient_id}", response_model=FormAssignmentListResponse)
async def list_patient_assignments(
    patient_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List form assignments for a specific patient."""
    # Verify patient belongs to user's organization
    patient_result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    if not patient_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    result = await db.execute(
        select(FormAssignment).where(FormAssignment.patient_id == patient_id)
    )
    assignments = result.scalars().all()

    return FormAssignmentListResponse(
        assignments=[
            FormAssignmentResponse(
                id=a.id,
                patient_id=a.patient_id,
                template_id=a.template_id,
                status=a.status.value,
                token=a.token,
                valid_until=a.valid_until.isoformat(),
                public_url=f"/f/{a.token}",
            )
            for a in assignments
        ]
    )


class AssignmentWithPatient(BaseModel):
    """Assignment response including patient name for submissions view."""

    id: uuid.UUID
    patient_id: uuid.UUID
    patient_name: str
    status: str
    created_at: str
    completed_at: Optional[str]
    risk_level: Optional[str]


class TemplateAssignmentsResponse(BaseModel):
    assignments: List[AssignmentWithPatient]


@router.get(
    "/assignments/template/{template_id}", response_model=TemplateAssignmentsResponse
)
async def list_template_assignments(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List all form assignments for a specific template (for submissions view)."""
    # Verify template belongs to user's organization
    template_result = await db.execute(
        select(FormTemplate).where(
            FormTemplate.id == template_id,
            FormTemplate.organization_id == current_user.organization_id,
        )
    )
    if not template_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Template not found")

    # Get assignments with patient info
    result = await db.execute(
        select(FormAssignment, Patient)
        .join(Patient, FormAssignment.patient_id == Patient.id)
        .where(FormAssignment.template_id == template_id)
        .order_by(FormAssignment.created_at.desc())
    )
    rows = result.all()

    return TemplateAssignmentsResponse(
        assignments=[
            AssignmentWithPatient(
                id=a.id,
                patient_id=a.patient_id,
                patient_name=f"{p.first_name} {p.last_name}".strip() or p.email,
                status=a.status.value,
                created_at=a.created_at.isoformat() if a.created_at else "",
                completed_at=a.completed_at.isoformat() if a.completed_at else None,
                risk_level=None,  # TODO: Get from clinical entry if exists
            )
            for a, p in rows
        ]
    )


# ============ Admin Template Management (Super Admin) ============


class TemplateCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    schema: dict = {}
    risk_level: str = "LOW"
    therapy_type: str = "GENERAL"
    form_type: str = "INTAKE"
    config: Optional[dict] = None


class TemplateUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    schema: Optional[dict] = None
    risk_level: Optional[str] = None
    therapy_type: Optional[str] = None
    form_type: Optional[str] = None
    is_active: Optional[bool] = None
    config: Optional[dict] = None


class TemplateDetailResponse(BaseModel):
    id: uuid.UUID
    organization_id: Optional[uuid.UUID]
    title: str
    description: Optional[str]
    schema: dict
    risk_level: str
    therapy_type: str
    form_type: str
    public_token: Optional[str]
    is_active: bool
    is_system: bool
    config: Optional[dict] = None

    class Config:
        from_attributes = True


class PublicTokenResponse(BaseModel):
    public_token: Optional[str]
    public_url: Optional[str]


@router.get("/admin/templates", response_model=FormTemplateListResponse)
async def admin_list_templates(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """List all templates (Super Admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    result = await db.execute(select(FormTemplate))
    templates = result.scalars().all()

    return FormTemplateListResponse(
        templates=[
            FormTemplateResponse(
                id=t.id,
                organization_id=t.organization_id,
                title=t.title,
                description=t.description,
                risk_level=t.risk_level.value,
                therapy_type=t.therapy_type.value,
                form_type=t.form_type.value,
                is_system=t.organization_id is None,
                is_active=t.is_active,
            )
            for t in templates
        ]
    )


@router.get("/admin/templates/{template_id}", response_model=TemplateDetailResponse)
async def admin_get_template(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get full template details including schema (Super Admin)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    result = await db.execute(
        select(FormTemplate).where(FormTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return TemplateDetailResponse(
        id=template.id,
        organization_id=template.organization_id,
        title=template.title,
        description=template.description,
        schema=template.schema or {},
        risk_level=template.risk_level.value,
        therapy_type=template.therapy_type.value,
        form_type=template.form_type.value,
        public_token=template.public_token,
        is_active=template.is_active,
        is_system=template.organization_id is None,
        config=template.config,
    )


@router.post("/admin/templates", response_model=TemplateDetailResponse)
async def admin_create_template(
    data: TemplateCreateRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Create a new system template (Super Admin)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    from app.db.models import (
        RiskLevel,
        TherapyType,
        FormType,
    )

    template = FormTemplate(
        organization_id=None,  # System template
        title=data.title,
        description=data.description,
        schema=data.schema,
        risk_level=RiskLevel(data.risk_level),
        therapy_type=TherapyType(data.therapy_type),
        form_type=FormType(data.form_type),
        config=data.config,
        is_active=True,
    )

    db.add(template)
    await db.commit()
    await db.refresh(template)

    return TemplateDetailResponse(
        id=template.id,
        organization_id=template.organization_id,
        title=template.title,
        description=template.description,
        schema=template.schema or {},
        risk_level=template.risk_level.value,
        therapy_type=template.therapy_type.value,
        form_type=template.form_type.value,
        public_token=template.public_token,
        is_active=template.is_active,
        is_system=template.organization_id is None,
        config=template.config,
    )


@router.put("/admin/templates/{template_id}", response_model=TemplateDetailResponse)
async def admin_update_template(
    template_id: uuid.UUID,
    data: TemplateUpdateRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update template including full schema (Super Admin)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    result = await db.execute(
        select(FormTemplate).where(FormTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    from app.db.models import (
        RiskLevel,
        TherapyType,
        FormType,
    )

    if data.title is not None:
        template.title = data.title
    if data.description is not None:
        template.description = data.description
    if data.schema is not None:
        template.schema = data.schema
    if data.risk_level is not None:
        template.risk_level = RiskLevel(data.risk_level)
    if data.therapy_type is not None:
        template.therapy_type = TherapyType(data.therapy_type)
    if data.form_type is not None:
        template.form_type = FormType(data.form_type)
    if data.is_active is not None:
        template.is_active = data.is_active
    if data.config is not None:
        template.config = data.config

    await db.commit()
    await db.refresh(template)

    return TemplateDetailResponse(
        id=template.id,
        organization_id=template.organization_id,
        title=template.title,
        description=template.description,
        schema=template.schema or {},
        risk_level=template.risk_level.value,
        therapy_type=template.therapy_type.value,
        form_type=template.form_type.value,
        public_token=template.public_token,
        is_active=template.is_active,
        is_system=template.organization_id is None,
        config=template.config,
    )


@router.post(
    "/admin/templates/{template_id}/publish", response_model=PublicTokenResponse
)
async def admin_toggle_public_token(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Toggle public access token for a template (Super Admin)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    result = await db.execute(
        select(FormTemplate).where(FormTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    from app.db.models import RiskLevel
    import secrets

    # Safety check - cannot publish CRITICAL risk templates
    if template.risk_level == RiskLevel.CRITICAL:
        raise HTTPException(
            status_code=400,
            detail="Cannot create public link for CRITICAL risk templates",
        )

    # Cannot publish system templates - they must belong to an organization
    # because lead gen creates patients that need an organization_id
    if not template.organization_id:
        raise HTTPException(
            status_code=400,
            detail="System templates cannot be published. Clone to an organization first.",
        )

    # Toggle: if has token, remove it; if not, generate one
    if template.public_token:
        template.public_token = None
        await db.commit()
        return PublicTokenResponse(public_token=None, public_url=None)
    else:
        template.public_token = secrets.token_urlsafe(16)
        await db.commit()
        return PublicTokenResponse(
            public_token=template.public_token,
            public_url=f"/f/public/{template.public_token}",
        )


@router.delete("/admin/templates/{template_id}")
async def admin_delete_template(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Delete a template (Super Admin)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    result = await db.execute(
        select(FormTemplate).where(FormTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    await db.delete(template)
    await db.commit()

    return {"message": "Template deleted successfully"}


@router.post(
    "/admin/templates/{template_id}/clone", response_model=TemplateDetailResponse
)
async def admin_clone_template(
    template_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Clone a system template to the user's organization.

    This allows therapists to customize system templates and publish them
    for lead generation (which requires an organization_id).
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=400,
            detail="User must belong to an organization to clone templates",
        )

    try:
        cloned = await clone_template(
            db=db,
            system_template_id=template_id,
            organization_id=current_user.organization_id,
        )

        return TemplateDetailResponse(
            id=cloned.id,
            organization_id=cloned.organization_id,
            title=cloned.title,
            description=cloned.description,
            schema=cloned.schema or {},
            risk_level=cloned.risk_level.value,
            therapy_type=cloned.therapy_type.value,
            form_type=cloned.form_type.value,
            public_token=cloned.public_token,
            is_active=cloned.is_active,
            is_system=cloned.organization_id is None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
