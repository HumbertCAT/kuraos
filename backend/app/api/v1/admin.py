"""Admin API endpoints for SuperUser management."""

import uuid
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.base import get_db
from app.db.models import Organization, User, SystemSetting, OrgTier
from app.api.deps import CurrentUser


router = APIRouter()


# ============ Guards ============


async def require_superuser(current_user: CurrentUser) -> User:
    """Dependency that requires the current user to be a superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser access required",
        )
    return current_user


# ============ Schemas ============


class SettingResponse(BaseModel):
    key: str
    value: Any
    description: Optional[str]


class SettingUpdate(BaseModel):
    value: Any
    description: Optional[str] = None


class OrganizationAdminResponse(BaseModel):
    id: uuid.UUID
    name: str
    tier: str
    terminology_preference: str = "CLIENT"
    ai_credits_monthly_quota: int
    ai_credits_purchased: int
    ai_credits_used_this_month: int
    patient_count: int

    class Config:
        from_attributes = True


class OrganizationUpdate(BaseModel):
    tier: Optional[str] = None
    terminology_preference: Optional[str] = None
    ai_credits_monthly_quota: Optional[int] = None


class AddCreditsRequest(BaseModel):
    credits: int


# ============ Settings Endpoints ============


@router.get("/settings", response_model=list[SettingResponse])
async def list_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all system settings. Requires superuser."""
    result = await db.execute(select(SystemSetting))
    settings = result.scalars().all()
    return [
        SettingResponse(key=s.key, value=s.value, description=s.description)
        for s in settings
    ]


@router.patch("/settings/{key}", response_model=SettingResponse)
async def update_setting(
    key: str,
    data: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update a system setting. Requires superuser."""
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()

    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found",
        )

    setting.value = data.value
    if data.description is not None:
        setting.description = data.description

    await db.commit()
    await db.refresh(setting)

    return SettingResponse(
        key=setting.key, value=setting.value, description=setting.description
    )


# ============ Organizations Endpoints ============


@router.get("/organizations", response_model=list[OrganizationAdminResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """List all organizations with usage stats. Requires superuser."""
    from sqlalchemy import func
    from app.db.models import Patient

    result = await db.execute(select(Organization))
    orgs = result.scalars().all()

    responses = []
    for org in orgs:
        # Count patients for this org
        patient_count_result = await db.execute(
            select(func.count()).where(Patient.organization_id == org.id)
        )
        patient_count = patient_count_result.scalar() or 0

        responses.append(
            OrganizationAdminResponse(
                id=org.id,
                name=org.name,
                tier=org.tier.value,
                terminology_preference=org.terminology_preference.value
                if org.terminology_preference
                else "CLIENT",
                ai_credits_monthly_quota=org.ai_credits_monthly_quota,
                ai_credits_purchased=org.ai_credits_purchased,
                ai_credits_used_this_month=org.ai_credits_used_this_month,
                patient_count=patient_count,
            )
        )

    return responses


@router.patch("/organizations/{org_id}", response_model=OrganizationAdminResponse)
async def update_organization(
    org_id: uuid.UUID,
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Update an organization (tier, quota). Requires superuser."""
    from sqlalchemy import func
    from app.db.models import Patient

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    if data.tier is not None:
        try:
            org.tier = OrgTier(data.tier)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tier. Must be one of: {[t.value for t in OrgTier]}",
            )

    if data.terminology_preference is not None:
        from app.db.models import TerminologyPreference

        try:
            org.terminology_preference = TerminologyPreference(
                data.terminology_preference
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid terminology. Must be one of: {[t.value for t in TerminologyPreference]}",
            )

    if data.ai_credits_monthly_quota is not None:
        org.ai_credits_monthly_quota = data.ai_credits_monthly_quota

    await db.commit()
    await db.refresh(org)

    # Count patients
    patient_count_result = await db.execute(
        select(func.count()).where(Patient.organization_id == org.id)
    )
    patient_count = patient_count_result.scalar() or 0

    return OrganizationAdminResponse(
        id=org.id,
        name=org.name,
        tier=org.tier.value,
        terminology_preference=org.terminology_preference.value,
        ai_credits_monthly_quota=org.ai_credits_monthly_quota,
        ai_credits_purchased=org.ai_credits_purchased,
        ai_credits_used_this_month=org.ai_credits_used_this_month,
        patient_count=patient_count,
    )


@router.post("/organizations/{org_id}/add-credits")
async def add_credits(
    org_id: uuid.UUID,
    data: AddCreditsRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """Add purchased credits to an organization. Requires superuser."""
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    org.ai_credits_purchased += data.credits
    await db.commit()

    return {
        "message": f"Added {data.credits} credits",
        "new_balance": org.ai_credits_purchased,
    }


class ThemeConfigUpdate(BaseModel):
    """CSS theme variables to persist. Supports flat or nested {light, dark} structure."""

    theme_config: dict[str, Any]


@router.patch("/organizations/{org_id}/theme")
async def update_theme_config(
    org_id: uuid.UUID,
    data: ThemeConfigUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Update organization theme config. Requires org membership."""
    # Allow org members (not just superusers) to update their own theme
    if current_user.organization_id != org_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own organization's theme",
        )

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    org.theme_config = data.theme_config

    # If superuser, also update GLOBAL_THEME for all users
    if current_user.is_superuser:
        global_setting = await db.execute(
            select(SystemSetting).where(SystemSetting.key == "GLOBAL_THEME")
        )
        setting = global_setting.scalar_one_or_none()
        if setting:
            setting.value = data.theme_config
        else:
            db.add(
                SystemSetting(
                    key="GLOBAL_THEME",
                    value=data.theme_config,
                    description="Default theme for all organizations",
                )
            )

    await db.commit()

    message = "Theme saved successfully"
    if current_user.is_superuser:
        message += " (also applied as global default)"

    return {"success": True, "message": message}


# ============ Automation Endpoints (v0.9.2) ============


@router.post("/trigger-cron")
async def force_cron_execution(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """
    DEMO ONLY: Force execution of stale journey monitor NOW.

    Use this in demos instead of waiting for the hourly scheduler.
    Requires superuser.
    """
    from app.workers.stale_journey_monitor import check_stale_journeys

    result = await check_stale_journeys(db)

    return {
        "status": "executed",
        "result": result,
    }


@router.post("/trigger-conversation-analysis")
async def force_conversation_analysis(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """
    DEMO ONLY: Force execution of WhatsApp conversation analyzer NOW.

    Use this in demos instead of waiting for the 6AM scheduler.
    Requires superuser.
    """
    from app.workers.conversation_analyzer import analyze_daily_conversations

    result = await analyze_daily_conversations(db)

    return {
        "status": "executed",
        "analyzed": result.get("analyzed", 0),
        "risks_detected": result.get("risks_detected", 0),
    }
