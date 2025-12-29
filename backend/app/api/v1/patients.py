"""Patient CRUD endpoints."""

from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.db.base import get_db
from app.db.models import Patient
from app.api.deps import CurrentUser
from app.api.v1.patient_schemas import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse,
)

router = APIRouter()


@router.get("/", response_model=PatientListResponse, summary="List patients")
async def list_patients(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name or email"),
    status_filter: Optional[str] = Query(
        None,
        description="Filter by journey status (e.g., BLOCKED_MEDICAL, AWAITING_PAYMENT)",
    ),
):
    """
    List all patients for the current user's organization.
    Supports pagination, search, and status filtering.
    """
    from sqlalchemy import text

    # Base query filtered by organization
    query = select(Patient).where(
        Patient.organization_id == current_user.organization_id
    )

    # Apply search filter
    if search:
        search_filter = or_(
            Patient.first_name.ilike(f"%{search}%"),
            Patient.last_name.ilike(f"%{search}%"),
            Patient.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)

    # Apply status filter (searches in any journey's status)
    if status_filter:
        # Use PostgreSQL JSONB text search - finds if any value in the JSONB contains the status
        # This handles multi-journey case: {"intake": "BLOCKED", "booking": "CONFIRMED"}
        status_condition = text("journey_status::text LIKE :status_pattern").bindparams(
            status_pattern=f'%"{status_filter}"%'
        )
        query = query.where(status_condition)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    query = query.order_by(Patient.created_at.desc())

    result = await db.execute(query)
    patients = result.scalars().all()

    return PatientListResponse(
        patients=[PatientResponse.model_validate(p) for p in patients],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post(
    "/",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create patient",
)
async def create_patient(
    patient_data: PatientCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new patient in the current user's organization.
    """
    from app.db.models import Organization, OrgTier
    from app.services.settings import get_setting_int

    # Get organization to check tier and limits
    org_result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = org_result.scalar_one_or_none()

    # Check patient limit based on tier
    if org:
        # Get limit from system_settings based on tier
        tier_limit_key = f"TIER_USERS_LIMIT_{org.tier.value}"
        limit = await get_setting_int(
            db, tier_limit_key, 999
        )  # Default high if not set

        # Count current active patients
        patient_count_result = await db.execute(
            select(func.count()).where(
                Patient.organization_id == current_user.organization_id
            )
        )
        patient_count = patient_count_result.scalar() or 0

        if patient_count >= limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "PLAN_LIMIT_REACHED",
                    "message": f"Patient limit reached ({limit}). Upgrade to add more patients.",
                    "current": patient_count,
                    "limit": limit,
                    "tier": org.tier.value,
                },
            )

    # Check if patient with same email already exists in org
    if patient_data.email:
        existing = await db.execute(
            select(Patient).where(
                Patient.email == patient_data.email,
                Patient.organization_id == current_user.organization_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient with this email already exists",
            )

    patient = Patient(
        **patient_data.model_dump(),
        organization_id=current_user.organization_id,
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)

    return PatientResponse.model_validate(patient)


@router.get("/{patient_id}", response_model=PatientResponse, summary="Get patient")
async def get_patient(
    patient_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific patient by ID.
    Only returns patients from the current user's organization.
    """
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    return PatientResponse.model_validate(patient)


@router.put("/{patient_id}", response_model=PatientResponse, summary="Update patient")
async def update_patient(
    patient_id: uuid.UUID,
    patient_data: PatientUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing patient.
    Only updates patients from the current user's organization.
    """
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    # Update only provided fields
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)

    return PatientResponse.model_validate(patient)


@router.delete(
    "/{patient_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete patient"
)
async def delete_patient(
    patient_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a patient.
    Only deletes patients from the current user's organization.
    """
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    await db.delete(patient)
    await db.commit()

    return None
