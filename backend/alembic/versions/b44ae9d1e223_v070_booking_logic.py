"""v070_booking_logic

Revision ID: b44ae9d1e223
Revises: 2c6c2da46142
Create Date: 2025-12-10 12:36:11.660909

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b44ae9d1e223"
down_revision: Union[str, Sequence[str], None] = "2c6c2da46142"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the PostgreSQL enum types first
    servicemode_enum = sa.Enum("ONE_ON_ONE", "GROUP", name="servicemode")
    schedulingtype_enum = sa.Enum("CALENDAR", "FIXED_DATE", name="schedulingtype")

    servicemode_enum.create(op.get_bind(), checkfirst=True)
    schedulingtype_enum.create(op.get_bind(), checkfirst=True)

    # Add columns with server defaults for existing rows
    op.add_column(
        "form_templates",
        sa.Column(
            "service_mode",
            servicemode_enum,
            nullable=False,
            server_default="ONE_ON_ONE",
        ),
    )
    op.add_column(
        "form_templates",
        sa.Column(
            "scheduling_type",
            schedulingtype_enum,
            nullable=False,
            server_default="CALENDAR",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("form_templates", "scheduling_type")
    op.drop_column("form_templates", "service_mode")

    # Drop the enum types
    sa.Enum(name="schedulingtype").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="servicemode").drop(op.get_bind(), checkfirst=True)
