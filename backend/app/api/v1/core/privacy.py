"""
Privacy Settings API - Kura Cortex v1.5

Endpoints for configuring privacy tiers at organization and patient level.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.base import get_db
from app.db.models import Organization, Patient, PrivacyTier
from app.api.deps import CurrentUser
from app.services.cortex.privacy import PrivacyResolver


router = APIRouter()


# ============ Schemas ============


class PrivacyTierUpdate(BaseModel):
    """Update privacy tier setting."""

    privacy_tier: str  # "GHOST" | "STANDARD" | "LEGACY"


class OrganizationPrivacyResponse(BaseModel):
    """Organization privacy configuration."""

    organization_id: uuid.UUID
    country_code: str
    default_privacy_tier: Optional[str]
    country_default_tier: str  # What tier would apply if no org default

    class Config:
        from_attributes = True


class PatientPrivacyResponse(BaseModel):
    """Patient privacy configuration with resolved tier."""

    patient_id: uuid.UUID
    privacy_tier_override: Optional[str]
    resolved_tier: str
    resolution_source: str  # "patient_override" | "org_default" | "country_default"
    country_code: str

    class Config:
        from_attributes = True


# ============ Organization Privacy Endpoints ============


@router.get("/org/privacy", response_model=OrganizationPrivacyResponse)
async def get_org_privacy_settings(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get organization's privacy configuration.

    Returns the current privacy settings and the country-based default.
    """
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Get country default
    country = getattr(org, "country_code", None) or "ES"
    country_default = PrivacyResolver.COUNTRY_DEFAULTS.get(
        country.upper(), PrivacyResolver.DEFAULT_TIER
    )

    return {
        "organization_id": org.id,
        "country_code": country,
        "default_privacy_tier": org.default_privacy_tier.value
        if org.default_privacy_tier
        else None,
        "country_default_tier": country_default.value,
    }


@router.patch("/org/privacy", response_model=OrganizationPrivacyResponse)
async def update_org_privacy_settings(
    data: PrivacyTierUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Update organization's default privacy tier.

    This affects all patients in the organization who don't have a personal override.

    Valid tiers:
    - GHOST: Maximum privacy (RAM-only, delete all raw data)
    - STANDARD: GDPR default (keep transcript, delete raw audio)
    - LEGACY: Archive mode (move raw to cold storage for AI training)
    """
    # Validate tier
    try:
        tier = PrivacyTier(data.privacy_tier.upper())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid privacy_tier. Must be one of: GHOST, STANDARD, LEGACY",
        )

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Update
    org.default_privacy_tier = tier
    await db.commit()

    # Get country default for response
    country = getattr(org, "country_code", None) or "ES"
    country_default = PrivacyResolver.COUNTRY_DEFAULTS.get(
        country.upper(), PrivacyResolver.DEFAULT_TIER
    )

    return {
        "organization_id": org.id,
        "country_code": country,
        "default_privacy_tier": tier.value,
        "country_default_tier": country_default.value,
    }


# ============ Patient Privacy Endpoints ============


@router.get("/patients/{patient_id}/privacy", response_model=PatientPrivacyResponse)
async def get_patient_privacy(
    patient_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Get patient's resolved privacy tier.

    Returns the effective tier after waterfall resolution:
    1. Patient override (if set)
    2. Organization default (if set)
    3. Country-based default
    """
    # Fetch patient
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Fetch org
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    # Resolve and explain
    explanation = PrivacyResolver.explain(patient, org)

    return {
        "patient_id": patient.id,
        "privacy_tier_override": patient.privacy_tier_override.value
        if patient.privacy_tier_override
        else None,
        "resolved_tier": explanation["resolved_tier"],
        "resolution_source": explanation["source"],
        "country_code": explanation["country_code"] or "ES",
    }


@router.patch("/patients/{patient_id}/privacy", response_model=PatientPrivacyResponse)
async def update_patient_privacy(
    patient_id: uuid.UUID,
    data: PrivacyTierUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Set patient's privacy tier override.

    This overrides the organization's default and country-based default.
    Use this for patients who explicitly request specific privacy handling.

    Valid tiers:
    - GHOST: Maximum privacy (RAM-only, no data retained)
    - STANDARD: GDPR default (transcripts kept, raw audio deleted)
    - LEGACY: Archive mode (raw audio moved to cold storage)
    """
    # Validate tier
    try:
        tier = PrivacyTier(data.privacy_tier.upper())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid privacy_tier. Must be one of: GHOST, STANDARD, LEGACY",
        )

    # Fetch patient
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Update
    patient.privacy_tier_override = tier
    await db.commit()

    # Fetch org for explanation
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    # Resolve and explain
    explanation = PrivacyResolver.explain(patient, org)

    return {
        "patient_id": patient.id,
        "privacy_tier_override": tier.value,
        "resolved_tier": explanation["resolved_tier"],
        "resolution_source": explanation["source"],
        "country_code": explanation["country_code"] or "ES",
    }


@router.delete("/patients/{patient_id}/privacy", response_model=PatientPrivacyResponse)
async def clear_patient_privacy_override(
    patient_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """
    Remove patient's privacy tier override.

    After this, the patient will use the organization's default or country-based default.
    """
    # Fetch patient
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.organization_id == current_user.organization_id,
        )
    )
    patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Clear override
    patient.privacy_tier_override = None
    await db.commit()

    # Fetch org for explanation
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    # Resolve and explain
    explanation = PrivacyResolver.explain(patient, org)

    return {
        "patient_id": patient.id,
        "privacy_tier_override": None,
        "resolved_tier": explanation["resolved_tier"],
        "resolution_source": explanation["source"],
        "country_code": explanation["country_code"] or "ES",
    }
