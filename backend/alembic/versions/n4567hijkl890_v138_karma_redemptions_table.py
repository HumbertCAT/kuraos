"""v1.3.8 karma_redemptions table

Revision ID: n4567hijkl890
Revises: 4d941a79878b
Create Date: 2026-01-06 04:05:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "n4567hijkl890"
down_revision: Union[str, None] = "4d941a79878b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type
    op.execute(
        "CREATE TYPE redemptiontype AS ENUM ('AI_TOKENS', 'EXTRA_PATIENT', 'FEATURE')"
    )

    # Create karma_redemptions table
    op.create_table(
        "karma_redemptions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("reward_id", sa.String(50), nullable=False),
        sa.Column(
            "redemption_type",
            postgresql.ENUM(
                "AI_TOKENS",
                "EXTRA_PATIENT",
                "FEATURE",
                name="redemptiontype",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("karma_cost", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "value_granted", sa.Numeric(12, 2), nullable=False, server_default="0"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_karma_redemptions_organization_id"),
        "karma_redemptions",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_karma_redemptions_reward_id"),
        "karma_redemptions",
        ["reward_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_karma_redemptions_reward_id"), table_name="karma_redemptions"
    )
    op.drop_index(
        op.f("ix_karma_redemptions_organization_id"), table_name="karma_redemptions"
    )
    op.drop_table("karma_redemptions")
    op.execute("DROP TYPE IF EXISTS redemptiontype")
