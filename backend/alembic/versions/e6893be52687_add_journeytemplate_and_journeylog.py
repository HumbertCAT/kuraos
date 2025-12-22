"""Add JourneyTemplate and JourneyLog

Revision ID: e6893be52687
Revises: cddc5420ce9d
Create Date: 2025-12-14 08:30:29.326046

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e6893be52687"
down_revision: Union[str, Sequence[str], None] = "cddc5420ce9d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add Journey models for v0.9.2."""
    # 1. Create journey_templates table
    op.create_table(
        "journey_templates",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column(
            "allowed_stages", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column("initial_stage", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_journey_templates_key"), "journey_templates", ["key"], unique=False
    )
    op.create_index(
        "ix_journey_templates_org_key",
        "journey_templates",
        ["organization_id", "key"],
        unique=True,
    )
    op.create_index(
        op.f("ix_journey_templates_organization_id"),
        "journey_templates",
        ["organization_id"],
        unique=False,
    )

    # 2. Create journey_logs table (audit trail)
    op.create_table(
        "journey_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column("journey_key", sa.String(length=100), nullable=False),
        sa.Column("from_stage", sa.String(length=50), nullable=True),
        sa.Column("to_stage", sa.String(length=50), nullable=False),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("trigger_event_id", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["patients.id"],
        ),
        sa.ForeignKeyConstraint(
            ["trigger_event_id"],
            ["system_events.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_journey_logs_journey_key"),
        "journey_logs",
        ["journey_key"],
        unique=False,
    )
    op.create_index(
        op.f("ix_journey_logs_patient_id"), "journey_logs", ["patient_id"], unique=False
    )
    op.create_index(
        "ix_journey_logs_patient_key_time",
        "journey_logs",
        ["patient_id", "journey_key", "changed_at"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_journey_logs_patient_key_time", table_name="journey_logs")
    op.drop_index(op.f("ix_journey_logs_patient_id"), table_name="journey_logs")
    op.drop_index(op.f("ix_journey_logs_journey_key"), table_name="journey_logs")
    op.drop_table("journey_logs")
    op.drop_index(
        op.f("ix_journey_templates_organization_id"), table_name="journey_templates"
    )
    op.drop_index("ix_journey_templates_org_key", table_name="journey_templates")
    op.drop_index(op.f("ix_journey_templates_key"), table_name="journey_templates")
    op.drop_table("journey_templates")
