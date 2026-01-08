"""Contacts API - 360° Contact View Endpoints.

Unified contact timeline across Lead/Patient/Follower domains.
v1.6.4: The Identity Vault
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models import User, Identity, Lead, Patient
from app.services.identity_resolver import IdentityResolver

router = APIRouter()


@router.get(
    "/{identity_id}",
    summary="Get unified contact view (360°)",
    description="Returns all interactions for a contact across Lead/Patient domains",
)
async def get_contact_timeline(
    identity_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get 360° contact view: unified timeline across all domains.

    Returns:
        {
            "identity_id": "uuid...",
            "primary_email": "john@example.com",
            "primary_phone": "+34600123456",
            "leads": [...],
            "patients": [...],
            "total_interactions": 5,
            "first_contact": "2026-01-01T00:00:00Z",
            "last_activity": "2026-01-08T12:00:00Z"
        }
    """
    # Fetch identity
    result = await db.execute(
        select(Identity).where(
            Identity.id == identity_id,
            Identity.organization_id == current_user.organization_id,
        )
    )
    identity = result.scalar_one_or_none()

    if not identity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Identity {identity_id} not found",
        )

    # Use IdentityResolver to get timeline
    resolver = IdentityResolver(db, current_user.organization_id)
    timeline = await resolver.get_unified_timeline(identity_id)

    # Add identity metadata
    return {
        **timeline,
        "primary_email": identity.primary_email,
        "primary_phone": identity.primary_phone,
        "created_at": identity.created_at.isoformat(),
    }


@router.get(
    "/{identity_id}/leads",
    summary="Get all leads for a contact",
    description="Returns all Lead records linked to this identity",
)
async def get_contact_leads(
    identity_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all leads for a specific identity."""
    # Verify identity exists and belongs to org
    result = await db.execute(
        select(Identity).where(
            Identity.id == identity_id,
            Identity.organization_id == current_user.organization_id,
        )
    )
    identity = result.scalar_one_or_none()

    if not identity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Identity {identity_id} not found",
        )

    # Get all leads
    leads_result = await db.execute(
        select(Lead)
        .where(Lead.identity_id == identity_id)
        .order_by(Lead.created_at.desc())
    )
    leads = leads_result.scalars().all()

    return {"identity_id": str(identity_id), "leads": leads, "count": len(leads)}


@router.get(
    "/{identity_id}/patients",
    summary="Get all patients for a contact",
    description="Returns all Patient records linked to this identity",
)
async def get_contact_patients(
    identity_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all patients for a specific identity."""
    # Verify identity exists and belongs to org
    result = await db.execute(
        select(Identity).where(
            Identity.id == identity_id,
            Identity.organization_id == current_user.organization_id,
        )
    )
    identity = result.scalar_one_or_none()

    if not identity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Identity {identity_id} not found",
        )

    # Get all patients
    patients_result = await db.execute(
        select(Patient)
        .where(Patient.identity_id == identity_id)
        .order_by(Patient.created_at.desc())
    )
    patients = patients_result.scalars().all()

    return {
        "identity_id": str(identity_id),
        "patients": patients,
        "count": len(patients),
    }


@router.get(
    "",
    summary="Search identities",
    description="Search for identities by email or phone",
)
async def search_identities(
    email: Optional[str] = None,
    phone: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search for identities by email or phone.

    Useful for finding if a contact already exists before creating a new one.
    """
    if not email and not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of email or phone must be provided",
        )

    # Normalize search criteria
    resolver = IdentityResolver(db, current_user.organization_id)
    norm_email = resolver.normalize_email(email) if email else None
    norm_phone = resolver.normalize_phone(phone) if phone else None

    # Build query
    query = select(Identity).where(
        Identity.organization_id == current_user.organization_id,
        Identity.is_merged == False,
    )

    if norm_email and norm_phone:
        # Both provided - OR condition
        from sqlalchemy import or_

        query = query.where(
            or_(
                Identity.primary_email == norm_email,
                Identity.primary_phone == norm_phone,
            )
        )
    elif norm_email:
        query = query.where(Identity.primary_email == norm_email)
    elif norm_phone:
        query = query.where(Identity.primary_phone == norm_phone)

    result = await db.execute(query)
    identities = result.scalars().all()

    return {
        "query": {"email": norm_email, "phone": norm_phone},
        "results": identities,
        "count": len(identities),
    }
