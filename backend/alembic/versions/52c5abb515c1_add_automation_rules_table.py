"""add_automation_rules_table

Revision ID: 52c5abb515c1
Revises: 98138315b4f8
Create Date: 2025-12-14 18:28:00.337978

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "52c5abb515c1"
down_revision: Union[str, Sequence[str], None] = "98138315b4f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add automation_rules table for Playbook Marketplace."""
    op.create_table(
        "automation_rules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("icon", sa.String(length=50), nullable=False, server_default="Zap"),
        sa.Column("trigger_event", sa.String(length=100), nullable=False),
        sa.Column(
            "conditions",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "actions",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "is_system_template", sa.Boolean(), nullable=False, server_default="false"
        ),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("cloned_from_id", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["cloned_from_id"],
            ["automation_rules.id"],
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_automation_rules_is_system_template"),
        "automation_rules",
        ["is_system_template"],
        unique=False,
    )
    op.create_index(
        op.f("ix_automation_rules_organization_id"),
        "automation_rules",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_automation_rules_trigger_event"),
        "automation_rules",
        ["trigger_event"],
        unique=False,
    )


def downgrade() -> None:
    """Remove automation_rules table."""
    op.drop_index(
        op.f("ix_automation_rules_trigger_event"), table_name="automation_rules"
    )
    op.drop_index(
        op.f("ix_automation_rules_organization_id"), table_name="automation_rules"
    )
    op.drop_index(
        op.f("ix_automation_rules_is_system_template"), table_name="automation_rules"
    )
    op.drop_table("automation_rules")
