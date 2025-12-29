"""Add tier configuration to system_settings

Revision ID: m3456ghij7890
Revises: 8c20ee5434b8
Create Date: 2024-12-29

This migration adds tier-specific limits and pricing to system_settings.
These are system configuration values, not demo data.
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "m3456ghij7890"
down_revision: Union[str, None] = "8c20ee5434b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add tier configuration settings."""
    # Insert tier limits, stripe fees, and AI credits into system_settings
    # Using INSERT ... ON CONFLICT to be idempotent
    op.execute("""
        INSERT INTO system_settings (key, value, description)
        VALUES 
            ('TIER_USERS_LIMIT_BUILDER', '3', 'Max active patients for BUILDER tier'),
            ('TIER_USERS_LIMIT_PRO', '50', 'Max active patients for PRO tier'),
            ('TIER_USERS_LIMIT_CENTER', '150', 'Max active patients for CENTER tier'),
            ('TIER_STRIPE_FEE_BUILDER', '0.05', 'Stripe commission rate for BUILDER tier (5%)'),
            ('TIER_STRIPE_FEE_PRO', '0.02', 'Stripe commission rate for PRO tier (2%)'),
            ('TIER_STRIPE_FEE_CENTER', '0.01', 'Stripe commission rate for CENTER tier (1%)'),
            ('TIER_AI_CREDITS_BUILDER', '100', 'Monthly AI credits for BUILDER tier'),
            ('TIER_AI_CREDITS_PRO', '500', 'Monthly AI credits for PRO tier'),
            ('TIER_AI_CREDITS_CENTER', '2000', 'Monthly AI credits for CENTER tier')
        ON CONFLICT (key) DO NOTHING;
    """)


def downgrade() -> None:
    """Remove tier configuration settings."""
    op.execute("""
        DELETE FROM system_settings 
        WHERE key IN (
            'TIER_USERS_LIMIT_BUILDER', 'TIER_USERS_LIMIT_PRO', 'TIER_USERS_LIMIT_CENTER',
            'TIER_STRIPE_FEE_BUILDER', 'TIER_STRIPE_FEE_PRO', 'TIER_STRIPE_FEE_CENTER',
            'TIER_AI_CREDITS_BUILDER', 'TIER_AI_CREDITS_PRO', 'TIER_AI_CREDITS_CENTER'
        );
    """)
