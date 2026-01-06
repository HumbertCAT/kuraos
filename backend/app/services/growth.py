"""Growth Engine Service (v1.3.7)

The Mycelium Engine - Automated viral referral loop.

When a referred organization completes registration, this service:
1. Injects Kura Credits to the referrer
2. Increases karma score
3. Adds bonus patient slots
4. Records the conversion for tracking
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Organization,
    ReferralConversion,
    RewardType,
    ConversionStatus,
    AiUsageLog,
)

logger = logging.getLogger(__name__)

# === REWARD CONFIGURATION ===
# v1.3.7: Adjusted per GEM Architect feedback (10K KC = ~10€)
REFERRAL_REWARD_CREDITS = Decimal("10000")  # 10K Kura Credits
REFERRAL_REWARD_SLOTS = 1  # +1 patient slot
REFERRAL_KARMA_POINTS = 100  # Karma score increase


async def grant_referral_credits(
    db: AsyncSession,
    organization_id: str,
    credits: Decimal,
) -> AiUsageLog:
    """
    Grant Kura Credits as a referral reward.

    Uses negative cost_user_credits to represent incoming credits (accounting "haber").
    """
    import uuid

    log = AiUsageLog(
        id=uuid.uuid4(),
        organization_id=organization_id,
        task_type="referral_reward",
        provider="kura-growth",
        model_id="mycelium-v1",
        tokens_input=0,
        tokens_output=0,
        cost_provider_usd=0,  # No real cost
        cost_user_credits=float(-credits),  # Negative = credit injection
    )
    db.add(log)
    return log


async def process_referral_conversion(
    db: AsyncSession,
    referee_org: Organization,
) -> Optional[ReferralConversion]:
    """
    Process referral rewards when a new org completes registration.

    Called from auth.py after successful user+org creation.

    Args:
        db: Database session
        referee_org: The newly registered organization

    Returns:
        ReferralConversion record if rewards were granted, None otherwise
    """
    import uuid

    # 1. Check if this org was referred
    if not referee_org.referred_by_id:
        logger.debug(f"Org {referee_org.id} was not referred, skipping")
        return None

    # 2. Check if already processed (prevent double rewards)
    existing = await db.execute(
        select(ReferralConversion).where(
            ReferralConversion.referee_org_id == referee_org.id
        )
    )
    if existing.scalar_one_or_none():
        logger.warning(f"Referral conversion already exists for org {referee_org.id}")
        return None

    # 3. Get referrer organization
    referrer = await db.get(Organization, referee_org.referred_by_id)
    if not referrer:
        logger.error(f"Referrer org {referee_org.referred_by_id} not found")
        return None

    logger.info(
        f"Processing referral: {referrer.name} -> {referee_org.name} "
        f"(+{REFERRAL_REWARD_CREDITS} KC, +{REFERRAL_REWARD_SLOTS} slot)"
    )

    # 4. Grant credits to referrer
    await grant_referral_credits(db, str(referrer.id), REFERRAL_REWARD_CREDITS)

    # 5. Increase karma score + patient slots (GEM FIX: include slots)
    referrer.karma_score += REFERRAL_KARMA_POINTS
    referrer.bonus_patient_slots += REFERRAL_REWARD_SLOTS

    # 6. Record the conversion
    conversion = ReferralConversion(
        id=uuid.uuid4(),
        referrer_org_id=referrer.id,
        referee_org_id=referee_org.id,
        reward_type=RewardType.BOTH,
        credits_awarded=float(REFERRAL_REWARD_CREDITS),
        status=ConversionStatus.PAID,
        converted_at=datetime.utcnow(),
        paid_at=datetime.utcnow(),
    )
    db.add(conversion)

    await db.commit()
    await db.refresh(referrer)

    logger.info(
        f"✅ Referral reward granted to {referrer.name}: "
        f"karma={referrer.karma_score}, slots={referrer.bonus_patient_slots}"
    )

    return conversion
