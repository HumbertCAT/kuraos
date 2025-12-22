"""add_schedule_calendar_sync

Revision ID: c6f0b381121c
Revises: ba8e903ef964
Create Date: 2025-12-13 20:01:42.723464

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c6f0b381121c"
down_revision: Union[str, Sequence[str], None] = "ba8e903ef964"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Only add the schedule_calendar_syncs table
    op.create_table(
        "schedule_calendar_syncs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("schedule_id", sa.Uuid(), nullable=False),
        sa.Column(
            "blocking_calendar_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("booking_calendar_id", sa.String(length=255), nullable=False),
        sa.Column("sync_enabled", sa.Boolean(), nullable=False),
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
            ["schedule_id"], ["availability_schedules.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_schedule_calendar_syncs_schedule_id"),
        "schedule_calendar_syncs",
        ["schedule_id"],
        unique=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_schedule_calendar_syncs_schedule_id"),
        table_name="schedule_calendar_syncs",
    )
    op.drop_table("schedule_calendar_syncs")
