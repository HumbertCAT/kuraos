"""Stripe service for SaaS billing and Connect marketplace."""

import logging
from typing import Optional
import stripe

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.models import Organization, OrgTier

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


# Tier to Price ID mapping
TIER_PRICE_MAP = {
    OrgTier.PRO: settings.STRIPE_PRICE_ID_PRO,
    OrgTier.CENTER: settings.STRIPE_PRICE_ID_CENTER,
}

# Default commission rates (can be overridden by system_settings)
DEFAULT_COMMISSION_RATES = {
    OrgTier.BUILDER: 0.05,  # 5% for free tier
    OrgTier.PRO: 0.03,  # 3% for PRO
    OrgTier.CENTER: 0.02,  # 2% for CENTER
}


class StripeService:
    """Centralized Stripe operations for TherapistOS."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_customer(self, org: Organization) -> str:
        """Get existing Stripe customer or create new one."""
        if org.stripe_customer_id:
            return org.stripe_customer_id

        # Get org owner email
        from app.db.models import User, UserRole

        result = await self.db.execute(
            select(User).where(
                User.organization_id == org.id, User.role == UserRole.OWNER
            )
        )
        owner = result.scalar_one_or_none()

        customer = stripe.Customer.create(
            email=owner.email if owner else None,
            name=org.name,
            metadata={
                "org_id": str(org.id),
                "org_name": org.name,
            },
        )

        org.stripe_customer_id = customer.id
        await self.db.commit()

        return customer.id

    async def create_checkout_session(
        self,
        org: Organization,
        target_tier: OrgTier,
        success_url: str,
        cancel_url: str,
    ) -> str:
        """Create Stripe Checkout session for tier upgrade.

        Returns: Checkout session URL
        """
        price_id = TIER_PRICE_MAP.get(target_tier)
        if not price_id:
            raise ValueError(f"No price configured for tier: {target_tier}")

        customer_id = await self.get_or_create_customer(org)

        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "org_id": str(org.id),
                "target_tier": target_tier.value,
            },
            subscription_data={
                "metadata": {
                    "org_id": str(org.id),
                    "target_tier": target_tier.value,
                }
            },
        )

        return session.url

    async def create_customer_portal(
        self,
        org: Organization,
        return_url: str,
    ) -> str:
        """Create Stripe Customer Portal session.

        Returns: Portal session URL
        """
        if not org.stripe_customer_id:
            raise ValueError("Organization has no Stripe customer")

        session = stripe.billing_portal.Session.create(
            customer=org.stripe_customer_id,
            return_url=return_url,
        )

        return session.url

    async def create_connect_account(
        self,
        org: Organization,
        refresh_url: str,
        return_url: str,
    ) -> str:
        """Create Stripe Connect account and onboarding link.

        Returns: Account onboarding URL
        """
        # Create Connect account if not exists
        if not org.stripe_connect_id:
            account = stripe.Account.create(
                type="standard",
                metadata={
                    "org_id": str(org.id),
                    "org_name": org.name,
                },
            )
            org.stripe_connect_id = account.id
            await self.db.commit()

        # Create account link for onboarding
        account_link = stripe.AccountLink.create(
            account=org.stripe_connect_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )

        return account_link.url

    async def verify_connect_account(self, org: Organization) -> bool:
        """Verify if Connect account has completed onboarding.

        Returns: True if account is ready to receive payments
        """
        if not org.stripe_connect_id:
            return False

        account = stripe.Account.retrieve(org.stripe_connect_id)

        # Check if account has completed onboarding
        is_enabled = (
            account.charges_enabled
            and account.payouts_enabled
            and account.details_submitted
        )

        if is_enabled != org.stripe_connect_enabled:
            org.stripe_connect_enabled = is_enabled
            await self.db.commit()

        return is_enabled

    def get_commission_rate(self, tier: OrgTier) -> float:
        """Get commission rate for a tier.

        TODO: Read from system_settings table for dynamic rates.
        For now, uses default rates.
        """
        return DEFAULT_COMMISSION_RATES.get(tier, 0.05)

    def calculate_application_fee(
        self,
        amount_cents: int,
        tier: OrgTier,
    ) -> int:
        """Calculate application fee for a payment.

        Returns: Fee amount in cents
        """
        rate = self.get_commission_rate(tier)
        return int(amount_cents * rate)


# Webhook handlers (called from payments.py)


async def handle_checkout_completed(
    db: AsyncSession,
    session: stripe.checkout.Session,
) -> None:
    """Handle successful checkout session completion."""
    if session.mode != "subscription":
        return

    org_id = session.metadata.get("org_id")
    target_tier = session.metadata.get("target_tier")
    subscription_id = session.subscription

    if not org_id or not target_tier:
        logger.warning(f"Checkout session missing metadata: {session.id}")
        return

    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()

    if not org:
        logger.error(f"Organization not found: {org_id}")
        return

    # Upgrade tier
    org.tier = OrgTier(target_tier)
    org.stripe_subscription_id = subscription_id

    # Update AI credits based on tier
    # TODO: Read from TIER_AI_CREDITS_{tier} in system_settings
    if org.tier == OrgTier.PRO:
        org.ai_credits_monthly_quota = 500
    elif org.tier == OrgTier.CENTER:
        org.ai_credits_monthly_quota = 2000

    await db.commit()
    logger.info(f"Organization {org_id} upgraded to {target_tier}")


async def handle_subscription_deleted(
    db: AsyncSession,
    subscription: stripe.Subscription,
) -> None:
    """Handle subscription cancellation - downgrade to BUILDER."""
    org_id = subscription.metadata.get("org_id")

    if not org_id:
        # Try to find by subscription ID
        result = await db.execute(
            select(Organization).where(
                Organization.stripe_subscription_id == subscription.id
            )
        )
        org = result.scalar_one_or_none()
    else:
        result = await db.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalar_one_or_none()

    if not org:
        logger.warning(f"Organization not found for subscription: {subscription.id}")
        return

    # Downgrade to BUILDER
    org.tier = OrgTier.BUILDER
    org.stripe_subscription_id = None
    org.ai_credits_monthly_quota = 100  # Reset to free tier quota

    await db.commit()
    logger.info(f"Organization {org.id} downgraded to BUILDER")
