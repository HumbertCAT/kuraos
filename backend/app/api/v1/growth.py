"""Referral/Growth system endpoints - The Mycelium Protocol."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.database import get_db
from backend.app.db.models import Organization, User
from backend.app.api.v1.auth import get_current_user

router = APIRouter()


# ============================================================================
# Schemas
# ============================================================================


class ReferredOrgSummary(BaseModel):
    """Summary of an organization referred by the current user."""

    id: str
    name: str
    joined_at: datetime
    status: str  # "ACTIVE", "TRIAL", etc.
    karma_earned: int  # Always 100 for now

    class Config:
        from_attributes = True


class ReferralStatsResponse(BaseModel):
    """Full referral statistics for the Growth Station."""

    total_referred: int
    total_active: int
    current_karma: int
    referral_code: str
    referral_history: List[ReferredOrgSummary]


# ============================================================================
# Endpoints
# ============================================================================


@router.get(
    "/stats", response_model=ReferralStatsResponse, summary="Get referral stats"
)
async def get_referral_stats(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Get full referral statistics for the Growth Station.

    Returns:
        - Total organizations referred
        - Number of active referrals
        - Current karma score
        - Referral code
        - History of all referred organizations
    """
    # Get current user's organization
    current_org = await db.get(Organization, current_user.organization_id)

    if not current_org:
        return ReferralStatsResponse(
            total_referred=0,
            total_active=0,
            current_karma=0,
            referral_code="",
            referral_history=[],
        )

    # Find all orgs referred by current user's org
    result = await db.execute(
        select(Organization)
        .where(Organization.referred_by_id == current_user.organization_id)
        .order_by(Organization.created_at.desc())
    )
    referred_orgs = result.scalars().all()

    # Build history
    referral_history = [
        ReferredOrgSummary(
            id=str(org.id),
            name=org.name,
            joined_at=org.created_at,
            status="ACTIVE",  # Simplified for now, can enhance with real status
            karma_earned=100,  # Fixed reward per referral
        )
        for org in referred_orgs
    ]

    return ReferralStatsResponse(
        total_referred=len(referred_orgs),
        total_active=len([o for o in referred_orgs]),  # All active for now
        current_karma=current_org.karma_score,
        referral_code=current_org.referral_code or "",
        referral_history=referral_history,
    )


@router.get("/referral-code", summary="Get referral code")
async def get_referral_code(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get the organization's referral code."""
    org = await db.get(Organization, current_user.organization_id)
    return {"referral_code": org.referral_code if org else None}


@router.get("/referrals", summary="List referrals")
async def list_referrals(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """List organizations referred by this organization."""
    result = await db.execute(
        select(Organization)
        .where(Organization.referred_by_id == current_user.organization_id)
        .order_by(Organization.created_at.desc())
    )
    referred_orgs = result.scalars().all()

    return {
        "referrals": [
            {
                "id": str(org.id),
                "name": org.name,
                "joined_at": org.created_at.isoformat(),
                "karma_earned": 100,
            }
            for org in referred_orgs
        ]
    }
