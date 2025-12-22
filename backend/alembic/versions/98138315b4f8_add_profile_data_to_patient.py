"""Add profile_data to Patient

Revision ID: 98138315b4f8
Revises: c1a0857b7e7b
Create Date: 2025-12-14 16:25:14.145147

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "98138315b4f8"
down_revision: Union[str, Sequence[str], None] = "c1a0857b7e7b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add profile_data JSONB column to patients table."""
    op.add_column(
        "patients",
        sa.Column(
            "profile_data",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
    )


def downgrade() -> None:
    """Remove profile_data column from patients table."""
    op.drop_column("patients", "profile_data")
