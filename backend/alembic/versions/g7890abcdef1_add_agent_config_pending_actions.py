"""Add agent_config and pending_actions table

Revision ID: g7890abcdef1
Revises: 38323a7a5a29
Create Date: 2025-12-22

v0.9.9.10 - Agent Personality & Draft Mode
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers
revision = "g7890abcdef1"
down_revision = "38323a7a5a29"  # leads table migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add agent_config to automation_rules
    op.add_column(
        "automation_rules",
        sa.Column("agent_config", JSONB, nullable=True),
    )

    # 2. Create pending_actions table
    op.create_table(
        "pending_actions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "rule_id",
            UUID(as_uuid=True),
            sa.ForeignKey("automation_rules.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column("recipient_id", UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("recipient_type", sa.String(20), nullable=False),
        sa.Column("recipient_name", sa.String(255), nullable=False),
        sa.Column("recipient_email", sa.String(255), nullable=True),
        sa.Column("draft_content", JSONB, nullable=False, server_default="{}"),
        sa.Column("ai_generated_content", JSONB, nullable=True),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="PENDING",
            index=True,
        ),
        sa.Column(
            "created_by_event_id",
            UUID(as_uuid=True),
            sa.ForeignKey("system_events.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "approved_by_user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("pending_actions")
    op.drop_column("automation_rules", "agent_config")
