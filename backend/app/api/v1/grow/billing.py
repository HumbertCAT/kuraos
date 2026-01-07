"""SaaS Billing endpoints - subscription management."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.base import get_db
from app.db.models import Organization, OrgTier, User
from app.api.deps import get_current_user
from app.services.stripe_service import StripeService

router = APIRouter()
logger = logging.getLogger(__name__)


class CheckoutSessionRequest(BaseModel):
    """Request to create checkout session for tier upgrade."""

    target_tier: str  # "PRO" or "CENTER"


class CheckoutSessionResponse(BaseModel):
    """Response with Stripe checkout URL."""

    url: str


class PortalResponse(BaseModel):
    """Response with Stripe customer portal URL."""

    url: str


class BillingStatusResponse(BaseModel):
    """Current billing status."""

    tier: str
    has_subscription: bool
    stripe_publishable_key: str | None


@router.get("/status", response_model=BillingStatusResponse)
async def get_billing_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current billing status for the organization."""
    from sqlalchemy import select

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    return BillingStatusResponse(
        tier=org.tier.value,
        has_subscription=org.stripe_subscription_id is not None,
        stripe_publishable_key=settings.STRIPE_PUBLISHABLE_KEY,
    )


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create Stripe Checkout session for tier upgrade.

    Only BUILDER tier can upgrade. PRO/CENTER should use portal.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe not configured",
        )

    # Validate target tier
    try:
        target_tier = OrgTier(request.target_tier)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier: {request.target_tier}",
        )

    if target_tier == OrgTier.BUILDER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot checkout for free tier",
        )

    # Get organization
    from sqlalchemy import select

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Already has subscription? Use portal instead
    if org.stripe_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already has subscription. Use /billing/portal to manage.",
        )

    stripe_service = StripeService(db)

    try:
        url = await stripe_service.create_checkout_session(
            org=org,
            target_tier=target_tier,
            success_url=f"{settings.FRONTEND_URL}/{settings.DEFAULT_LOCALE}/settings/plan?success=true",
            cancel_url=f"{settings.FRONTEND_URL}/{settings.DEFAULT_LOCALE}/settings/plan?canceled=true",
        )
        return CheckoutSessionResponse(url=url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Checkout session error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/portal", response_model=PortalResponse)
async def create_customer_portal(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create Stripe Customer Portal session.

    Allows managing payment methods and canceling subscription.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe not configured",
        )

    # Get organization
    from sqlalchemy import select

    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not org.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No billing history found",
        )

    stripe_service = StripeService(db)

    try:
        url = await stripe_service.create_customer_portal(
            org=org,
            return_url=f"{settings.FRONTEND_URL}/{settings.DEFAULT_LOCALE}/settings/plan",
        )
        return PortalResponse(url=url)
    except Exception as e:
        logger.error(f"Portal error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create portal session")
