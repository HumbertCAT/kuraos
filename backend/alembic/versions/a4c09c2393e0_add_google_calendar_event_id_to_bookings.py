"""Add google_calendar_event_id to bookings

Revision ID: a4c09c2393e0
Revises: c6f0b381121c
Create Date: 2025-12-13 23:58:57.984961

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a4c09c2393e0"
down_revision: Union[str, Sequence[str], None] = "c6f0b381121c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Only add the google_calendar_event_id column
    op.add_column(
        "bookings",
        sa.Column("google_calendar_event_id", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("bookings", "google_calendar_event_id")
