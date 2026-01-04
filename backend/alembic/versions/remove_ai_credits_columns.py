"""Drop AI credits columns from organizations

Revision ID: remove_ai_credits_columns
Revises: (will be auto-filled)
Create Date: 2026-01-04

v1.2.0: Deprecating AI Credits system
Moving to pure USD Spend Limit model via TIER_AI_SPEND_LIMIT_*
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision = "drop_ai_credits_v120"
down_revision = "cd40ac38c48c"  # add_karma_score_to_organization (actual head)
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Drop deprecated AI credits columns from organizations table."""
    # Drop columns that stored the old credit-based system
    op.drop_column("organizations", "ai_credits_monthly_quota")
    op.drop_column("organizations", "ai_credits_purchased")
    op.drop_column("organizations", "ai_credits_used_this_month")
    op.drop_column("organizations", "credits_reset_at")


def downgrade() -> None:
    """Restore AI credits columns (for rollback only)."""
    op.add_column(
        "organizations",
        sa.Column(
            "ai_credits_monthly_quota",
            sa.Integer(),
            nullable=False,
            server_default="100",
        ),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "ai_credits_purchased", sa.Integer(), nullable=False, server_default="0"
        ),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "ai_credits_used_this_month",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "organizations",
        sa.Column("credits_reset_at", sa.DateTime(timezone=True), nullable=True),
    )
