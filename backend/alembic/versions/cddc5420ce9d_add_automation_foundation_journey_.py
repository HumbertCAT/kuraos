"""Add automation foundation (journey_status, system_events)

Revision ID: cddc5420ce9d
Revises: a4c09c2393e0
Create Date: 2025-12-14 07:30:53.832067

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "cddc5420ce9d"
down_revision: Union[str, Sequence[str], None] = "a4c09c2393e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add automation foundation for v0.9.0."""
    # 1. Create EventStatus enum type (if not exists)
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT 1 FROM pg_type WHERE typname = 'eventstatus'")
    )
    if not result.fetchone():
        op.execute(
            "CREATE TYPE eventstatus AS ENUM ('PENDING', 'PROCESSED', 'IGNORED', 'FAILED')"
        )

    # 2. Create system_events table (audit log)
    op.create_table(
        "system_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(
                "PENDING",
                "PROCESSED",
                "IGNORED",
                "FAILED",
                name="eventstatus",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("entity_type", sa.String(length=50), nullable=True),
        sa.Column("entity_id", sa.Uuid(), nullable=True),
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
        op.f("ix_system_events_event_type"),
        "system_events",
        ["event_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_system_events_organization_id"),
        "system_events",
        ["organization_id"],
        unique=False,
    )

    # 3. Add journey_status column to patients (for state machine queries)
    op.add_column(
        "patients",
        sa.Column(
            "journey_status",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("patients", "journey_status")
    op.drop_index(op.f("ix_system_events_organization_id"), table_name="system_events")
    op.drop_index(op.f("ix_system_events_event_type"), table_name="system_events")
    op.drop_table("system_events")

    # Drop enum type
    op.execute("DROP TYPE IF EXISTS eventstatus")
