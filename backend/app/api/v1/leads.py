"""Lead Management API - CRM before clinical conversion.

GDPR compliant: No clinical data stored in leads table.
Flow: Lead (sales) → convert → Patient (clinical)
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.models import Lead, LeadStatus, Patient
from app.api.deps import CurrentUser

router = APIRouter(prefix="/leads", tags=["leads"])


# ============ SCHEMAS ============


class LeadCreate(BaseModel):
    """Create a new lead manually."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    source: str = Field("Manual", max_length=50)
    source_details: Optional[dict] = None
    notes: Optional[str] = None


class LeadUpdate(BaseModel):
    """Update lead fields (including drag-drop status change)."""

    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    status: Optional[LeadStatus] = None
    notes: Optional[str] = None


class LeadResponse(BaseModel):
    """Lead response for API."""

    id: UUID
    organization_id: UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: LeadStatus
    source: str
    source_details: Optional[dict] = None
    notes: Optional[str] = None
    converted_patient_id: Optional[UUID] = None
    converted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LeadConvertResponse(BaseModel):
    """Response after converting lead to patient."""

    lead_id: UUID
    patient_id: UUID
    message: str


class LeadListResponse(BaseModel):
    """Paginated lead list."""

    leads: List[LeadResponse]
    total: int


# ============ ENDPOINTS ============


@router.get("", response_model=LeadListResponse)
async def list_leads(
    status: Optional[LeadStatus] = Query(None, description="Filter by status"),
    include_archived: bool = Query(False, description="Include CONVERTED and LOST"),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """List leads for organization.

    By default, excludes CONVERTED and LOST leads (Kanban hygiene).
    Use include_archived=true to see all.
    """
    query = select(Lead).where(Lead.organization_id == current_user.organization_id)

    if status:
        query = query.where(Lead.status == status)
    elif not include_archived:
        # Default: only show active pipeline (NEW, CONTACTED, QUALIFIED)
        query = query.where(
            Lead.status.in_([
                LeadStatus.NEW,
                LeadStatus.CONTACTED,
                LeadStatus.QUALIFIED,
            ])
        )

    query = query.order_by(Lead.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    leads = result.scalars().all()

    # Count total (for pagination)
    count_query = select(Lead).where(
        Lead.organization_id == current_user.organization_id
    )
    if status:
        count_query = count_query.where(Lead.status == status)
    elif not include_archived:
        count_query = count_query.where(
            Lead.status.in_([
                LeadStatus.NEW,
                LeadStatus.CONTACTED,
                LeadStatus.QUALIFIED,
            ])
        )

    count_result = await db.execute(count_query)
    total = len(count_result.scalars().all())

    return LeadListResponse(leads=leads, total=total)


@router.post("", response_model=LeadResponse)
async def create_lead(
    data: LeadCreate,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a new lead manually."""
    lead = Lead(
        organization_id=current_user.organization_id,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
        source=data.source,
        source_details=data.source_details,
        notes=data.notes,
        status=LeadStatus.NEW,
    )

    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    print(f"✅ Lead {lead.id} created, now emitting event...")
    import sys

    sys.stdout.flush()

    # Emit LEAD_CREATED event for automation engine
    from app.services.automation_engine import emit_event
    from app.schemas.automation_types import TriggerEvent

    try:
        await emit_event(
            db=db,
            event_type=TriggerEvent.LEAD_CREATED,
            organization_id=current_user.organization_id,
            entity_id=lead.id,
            entity_type="lead",
            payload={
                "lead_id": str(lead.id),
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "email": lead.email,
                "phone": lead.phone,
                "source": lead.source,
            },
        )
        print(f"✅ Event emitted successfully for lead {lead.id}")
    except Exception as e:
        print(f"❌ Error emitting event: {e}")
        import traceback

        traceback.print_exc()

    return lead


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    data: LeadUpdate,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Update lead fields (supports drag-drop status change)."""
    query = select(Lead).where(
        Lead.id == lead_id,
        Lead.organization_id == current_user.organization_id,
    )
    result = await db.execute(query)
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Don't allow modifying converted leads
    if lead.status == LeadStatus.CONVERTED and data.status != LeadStatus.CONVERTED:
        raise HTTPException(
            status_code=400, detail="Cannot modify status of converted lead"
        )

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)

    return lead


@router.post("/{lead_id}/convert", response_model=LeadConvertResponse)
async def convert_lead_to_patient(
    lead_id: UUID,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Convert lead to patient.

    Memory Handover: Lead notes are preserved in patient's profile_data
    as 'initial_notes' for clinical context continuity.
    """
    # Get lead
    query = select(Lead).where(
        Lead.id == lead_id,
        Lead.organization_id == current_user.organization_id,
    )
    result = await db.execute(query)
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if lead.status == LeadStatus.CONVERTED:
        raise HTTPException(
            status_code=400,
            detail="Lead already converted",
            headers={"X-Patient-Id": str(lead.converted_patient_id)},
        )

    # Create patient from lead data
    # Memory Handover: preserve notes and source info
    profile_data = {
        "referral_source": lead.source,
        "source_details": lead.source_details,
        "initial_notes": lead.notes,  # Critical: preserve sales context
        "converted_from_lead": str(lead.id),
        "converted_at": datetime.utcnow().isoformat(),
    }

    patient = Patient(
        organization_id=current_user.organization_id,
        first_name=lead.first_name,
        last_name=lead.last_name,
        email=lead.email,
        phone=lead.phone,
        language="es",  # Default, can be changed later
        profile_data=profile_data,
    )

    db.add(patient)
    await db.flush()  # Get patient ID

    # Update lead to CONVERTED
    lead.status = LeadStatus.CONVERTED
    lead.converted_patient_id = patient.id
    lead.converted_at = datetime.utcnow()

    await db.commit()
    await db.refresh(lead)
    await db.refresh(patient)

    return LeadConvertResponse(
        lead_id=lead.id,
        patient_id=patient.id,
        message=f"Successfully converted {lead.first_name} {lead.last_name} to patient",
    )


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: UUID,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Get single lead by ID."""
    query = select(Lead).where(
        Lead.id == lead_id,
        Lead.organization_id == current_user.organization_id,
    )
    result = await db.execute(query)
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return lead


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: UUID,
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Delete a lead.

    Cannot delete leads that have been converted to patients.
    Also cleans up any pending_actions referencing this lead.
    """
    query = select(Lead).where(
        Lead.id == lead_id,
        Lead.organization_id == current_user.organization_id,
    )
    result = await db.execute(query)
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if lead.status == LeadStatus.CONVERTED:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete converted lead. Delete the patient instead.",
        )

    # Cascade delete: Remove any pending_actions referencing this lead
    from app.db.models import PendingAction
    from sqlalchemy import delete

    await db.execute(
        delete(PendingAction).where(
            PendingAction.recipient_id == lead_id,
            PendingAction.recipient_type == "lead",
        )
    )

    await db.delete(lead)
    await db.commit()

    return None
