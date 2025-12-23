"""fix_service_type_schema

Revision ID: fix_service_type_schema
Revises: fix_schedule_cols
Create Date: 2025-12-22 23:15:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = "fix_service_type_schema"
down_revision: Union[str, Sequence[str], None] = "fix_schedule_cols"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # 1. Check and create ENUM type safely
    # Note: postgresql.ENUM needs name
    enum_exists = bind.execute(
        text("SELECT 1 FROM pg_type WHERE typname = 'schedulingtype'")
    ).scalar()
    if not enum_exists:
        op.execute("CREATE TYPE schedulingtype AS ENUM ('CALENDAR', 'FIXED_DATE')")

    # Define the enum for usage in add_column
    # We must match the name exactly
    scheduling_type_enum = sa.Enum("CALENDAR", "FIXED_DATE", name="schedulingtype")

    # 2. Check and add columns to service_types
    # Get existing columns
    result = bind.execute(
        text(
            "SELECT column_name FROM information_schema.columns WHERE table_name='service_types'"
        )
    )
    existing_columns = [row[0] for row in result.fetchall()]

    if "schedule_id" not in existing_columns:
        op.add_column(
            "service_types", sa.Column("schedule_id", sa.Uuid(), nullable=True)
        )
        op.create_foreign_key(
            "fk_service_types_schedule_id",
            "service_types",
            "availability_schedules",
            ["schedule_id"],
            ["id"],
        )
        op.create_index(
            op.f("ix_service_types_schedule_id"),
            "service_types",
            ["schedule_id"],
            unique=False,
        )

    if "scheduling_type" not in existing_columns:
        op.add_column(
            "service_types",
            sa.Column(
                "scheduling_type",
                scheduling_type_enum,
                nullable=False,
                server_default="CALENDAR",
            ),
        )


def downgrade() -> None:
    # We can use ignore_errors=True or just best effort
    # But usually downgrade is strict.
    # For now, let's implement standard downgrade but it might fail if columns don't exist
    pass  # Skip partial downgrade logic for safety in this hotfix context
