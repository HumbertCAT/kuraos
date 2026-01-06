"""Referral/Growth system endpoints - The Mycelium Protocol."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.models import Organization, User, ReferralConversion
from app.api.deps import get_current_user

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
    bonus_patient_slots: int  # v1.3.7: Extra slots from referrals
    credits_earned: float  # v1.3.7: Total KC earned from referrals
    referral_code: str
    referral_history: List[ReferredOrgSummary]


class RedeemRequest(BaseModel):
    """Request to redeem a reward from the catalog."""

    reward_id: str  # 'ai-tokens', 'extra-patient', 'sentinel-pulse'


class RedeemResponse(BaseModel):
    """Response after successful redemption."""

    success: bool
    message: str
    karma_remaining: int
    reward_applied: str


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

    # v1.3.7: Get total credits earned from conversions
    from sqlalchemy import func

    credits_result = await db.execute(
        select(func.sum(ReferralConversion.credits_awarded)).where(
            ReferralConversion.referrer_org_id == current_user.organization_id
        )
    )
    credits_earned = float(credits_result.scalar() or 0)

    return ReferralStatsResponse(
        total_referred=len(referred_orgs),
        total_active=len([o for o in referred_orgs if o.tier.value != "BUILDER"]),
        current_karma=current_org.karma_score,
        bonus_patient_slots=current_org.bonus_patient_slots,
        credits_earned=credits_earned,
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


# Reward catalog - synced with frontend RewardsCatalog.tsx
REWARD_CATALOG = {
    "ai-tokens": {
        "name": "+1000 AI Tokens",
        "cost": 300,
        "tier": "CENTER",
        "action": "credits",
        "value": 10000,  # 10K KC (~10€)
    },
    "extra-patient": {
        "name": "+1 Patient Slot",
        "cost": 100,
        "tier": "BUILDER",
        "action": "slot",
        "value": 1,
    },
    "sentinel-pulse": {
        "name": "Sentinel Pulse",
        "cost": 500,
        "tier": "PRO",
        "action": "feature",
        "value": "sentinel_pulse",
    },
}


@router.post("/redeem", response_model=RedeemResponse, summary="Redeem a reward")
async def redeem_reward(
    request: RedeemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Redeem a reward from the karma catalog.

    - Verifies karma balance
    - Deducts karma cost
    - Applies reward (credits, slots, features)
    """
    from fastapi import HTTPException
    from decimal import Decimal
    from app.services.growth import grant_referral_credits

    # Get organization
    org = await db.get(Organization, current_user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Validate reward exists
    reward = REWARD_CATALOG.get(request.reward_id)
    if not reward:
        raise HTTPException(status_code=400, detail="Invalid reward ID")

    # Check karma balance
    if org.karma_score < reward["cost"]:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient karma. Need {reward['cost']}, have {org.karma_score}",
        )

    # Deduct karma
    org.karma_score -= reward["cost"]

    # Apply reward based on action type
    if reward["action"] == "credits":
        await grant_referral_credits(db, str(org.id), Decimal(str(reward["value"])))
        reward_desc = f"+{reward['value']:,} Kura Credits"
    elif reward["action"] == "slot":
        org.bonus_patient_slots += reward["value"]
        reward_desc = f"+{reward['value']} patient slot"
    elif reward["action"] == "feature":
        # Future: unlock feature flags in org.settings
        reward_desc = f"Feature: {reward['value']}"
    else:
        reward_desc = reward["name"]

    await db.commit()
    await db.refresh(org)

    return RedeemResponse(
        success=True,
        message=f"Successfully redeemed: {reward['name']}",
        karma_remaining=org.karma_score,
        reward_applied=reward_desc,
    )
