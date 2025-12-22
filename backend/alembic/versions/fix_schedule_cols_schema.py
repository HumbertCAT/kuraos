"""fix_schedule_cols

Revision ID: fix_schedule_cols
Revises: a1b2c3d4e5f6
Create Date: 2025-12-22 22:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "fix_schedule_cols"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add schedule_id to availability_blocks
    # We make it nullable=True initially to support existing rows,
    # but practically the table is likely empty or data is invalid without it.
    op.add_column(
        "availability_blocks", sa.Column("schedule_id", sa.Uuid(), nullable=True)
    )
    op.create_foreign_key(
        "fk_availability_blocks_schedule_id",
        "availability_blocks",
        "availability_schedules",
        ["schedule_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_availability_blocks_schedule_id"),
        "availability_blocks",
        ["schedule_id"],
        unique=False,
    )

    # Add schedule_id to time_off
    op.add_column("time_off", sa.Column("schedule_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_time_off_schedule_id",
        "time_off",
        "availability_schedules",
        ["schedule_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_time_off_schedule_id"), "time_off", ["schedule_id"], unique=False
    )

    # Add schedule_id to specific_availability
    op.add_column(
        "specific_availability", sa.Column("schedule_id", sa.Uuid(), nullable=True)
    )
    op.create_foreign_key(
        "fk_specific_availability_schedule_id",
        "specific_availability",
        "availability_schedules",
        ["schedule_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_specific_availability_schedule_id"),
        "specific_availability",
        ["schedule_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_specific_availability_schedule_id"), table_name="specific_availability"
    )
    op.drop_constraint(
        "fk_specific_availability_schedule_id",
        "specific_availability",
        type_="foreignkey",
    )
    op.drop_column("specific_availability", "schedule_id")

    op.drop_index(op.f("ix_time_off_schedule_id"), table_name="time_off")
    op.drop_constraint("fk_time_off_schedule_id", "time_off", type_="foreignkey")
    op.drop_column("time_off", "schedule_id")

    op.drop_index(
        op.f("ix_availability_blocks_schedule_id"), table_name="availability_blocks"
    )
    op.drop_constraint(
        "fk_availability_blocks_schedule_id", "availability_blocks", type_="foreignkey"
    )
    op.drop_column("availability_blocks", "schedule_id")
