"""add_processing_status_to_clinical_entries

Revision ID: 407cec59ed8d
Revises: 8506f66d6628
Create Date: 2025-12-10 01:09:46.757079

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "407cec59ed8d"
down_revision: Union[str, Sequence[str], None] = "8506f66d6628"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Create the enum type
processingstatus_enum = postgresql.ENUM(
    "IDLE", "PENDING", "PROCESSING", "COMPLETED", "FAILED", name="processingstatus"
)


def upgrade() -> None:
    """Upgrade schema."""
    # Create the enum type first
    processingstatus_enum.create(op.get_bind(), checkfirst=True)

    # Add columns with server_default
    op.add_column(
        "clinical_entries",
        sa.Column(
            "processing_status",
            sa.Enum(
                "IDLE",
                "PENDING",
                "PROCESSING",
                "COMPLETED",
                "FAILED",
                name="processingstatus",
            ),
            server_default="IDLE",
            nullable=False,
        ),
    )
    op.add_column(
        "clinical_entries", sa.Column("processing_error", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("clinical_entries", "processing_error")
    op.drop_column("clinical_entries", "processing_status")

    # Drop the enum type
    processingstatus_enum.drop(op.get_bind(), checkfirst=True)
