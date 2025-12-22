"""add automation execution logs

Revision ID: e426eeae86b3
Revises: add_stripe_org_fields
Create Date: 2025-12-16 09:16:26.158966

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e426eeae86b3"
down_revision: Union[str, Sequence[str], None] = "add_stripe_org_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "automation_execution_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("automation_rule_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=True),
        sa.Column("trigger_event", sa.String(length=100), nullable=False),
        sa.Column(
            "trigger_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "actions_executed", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("execution_time_ms", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["automation_rule_id"], ["automation_rules.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_automation_execution_logs_automation_rule_id"),
        "automation_execution_logs",
        ["automation_rule_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_automation_execution_logs_created_at"),
        "automation_execution_logs",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_automation_execution_logs_organization_id"),
        "automation_execution_logs",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_automation_execution_logs_patient_id"),
        "automation_execution_logs",
        ["patient_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_automation_execution_logs_status"),
        "automation_execution_logs",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_automation_execution_logs_status"),
        table_name="automation_execution_logs",
    )
    op.drop_index(
        op.f("ix_automation_execution_logs_patient_id"),
        table_name="automation_execution_logs",
    )
    op.drop_index(
        op.f("ix_automation_execution_logs_organization_id"),
        table_name="automation_execution_logs",
    )
    op.drop_index(
        op.f("ix_automation_execution_logs_created_at"),
        table_name="automation_execution_logs",
    )
    op.drop_index(
        op.f("ix_automation_execution_logs_automation_rule_id"),
        table_name="automation_execution_logs",
    )
    op.drop_table("automation_execution_logs")
