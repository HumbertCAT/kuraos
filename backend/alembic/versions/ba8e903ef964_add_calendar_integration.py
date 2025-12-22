"""add_calendar_integration

Revision ID: ba8e903ef964
Revises: a4f5d2cfc1ba
Create Date: 2025-12-13 16:21:57.291357

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "ba8e903ef964"
down_revision: Union[str, Sequence[str], None] = "a4f5d2cfc1ba"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First create availability_schedules table (required for schedule_calendar_syncs)
    op.create_table(
        "availability_schedules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_availability_schedules_user_id"),
        "availability_schedules",
        ["user_id"],
        unique=False,
    )

    # Add the calendar_integrations table
    op.create_table(
        "calendar_integrations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("calendar_id", sa.String(length=255), nullable=False),
        sa.Column("sync_bookings_to_gcal", sa.Boolean(), nullable=False),
        sa.Column("check_gcal_busy", sa.Boolean(), nullable=False),
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
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_calendar_integrations_user_id"),
        "calendar_integrations",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_calendar_integrations_user_id"), table_name="calendar_integrations"
    )
    op.drop_table("calendar_integrations")
    # Drop availability_schedules
    op.drop_index(
        op.f("ix_availability_schedules_user_id"), table_name="availability_schedules"
    )
    op.drop_table("availability_schedules")
