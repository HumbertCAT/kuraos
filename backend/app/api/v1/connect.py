"""Stripe Connect endpoints - therapist payout onboarding."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.base import get_db
from app.db.models import Organization, User
from app.api.deps import get_current_user
from app.services.stripe_service import StripeService

router = APIRouter()
logger = logging.getLogger(__name__)


class OnboardingResponse(BaseModel):
    """Response with Stripe Connect onboarding URL."""

    url: str


class ConnectStatusResponse(BaseModel):
    """Current Connect account status."""

    has_account: bool
    is_enabled: bool
    connect_id: str | None


@router.get("/status", response_model=ConnectStatusResponse)
async def get_connect_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get Stripe Connect status for the organization."""
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Refresh status from Stripe if we have an account
    if org.stripe_connect_id:
        stripe_service = StripeService(db)
        await stripe_service.verify_connect_account(org)

    return ConnectStatusResponse(
        has_account=org.stripe_connect_id is not None,
        is_enabled=org.stripe_connect_enabled,
        connect_id=org.stripe_connect_id,
    )


@router.post("/onboarding", response_model=OnboardingResponse)
async def create_connect_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create Stripe Connect account and onboarding link.

    Therapists use this to connect their bank account and receive payments.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe not configured",
        )

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Already enabled? No need to onboard again
    if org.stripe_connect_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connect account already active",
        )

    stripe_service = StripeService(db)

    try:
        url = await stripe_service.create_connect_account(
            org=org,
            refresh_url=f"{settings.FRONTEND_URL}/settings/payments?refresh=true",
            return_url=f"{settings.FRONTEND_URL}/api/connect/callback?org_id={org.id}",
        )
        return OnboardingResponse(url=url)
    except Exception as e:
        logger.error(f"Connect onboarding error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create onboarding link")


@router.get("/callback")
async def connect_callback(
    org_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Callback from Stripe Connect onboarding.

    Verifies account status and redirects to frontend.
    """
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()

    if not org:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/settings/payments?error=org_not_found",
            status_code=status.HTTP_302_FOUND,
        )

    stripe_service = StripeService(db)
    is_enabled = await stripe_service.verify_connect_account(org)

    if is_enabled:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/settings/payments?success=true",
            status_code=status.HTTP_302_FOUND,
        )
    else:
        # Not fully onboarded yet - redirect back to continue
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/settings/payments?incomplete=true",
            status_code=status.HTTP_302_FOUND,
        )
