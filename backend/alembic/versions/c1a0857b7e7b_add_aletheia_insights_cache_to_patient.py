"""Add AletheIA insights cache to Patient

Revision ID: c1a0857b7e7b
Revises: e6893be52687
Create Date: 2025-12-14 15:40:48.742603

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c1a0857b7e7b"
down_revision: Union[str, Sequence[str], None] = "e6893be52687"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add AletheIA insights cache columns to patients table."""
    op.add_column(
        "patients",
        sa.Column(
            "last_insight_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
    )
    op.add_column(
        "patients",
        sa.Column("last_insight_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Remove AletheIA insights cache columns from patients table."""
    op.drop_column("patients", "last_insight_at")
    op.drop_column("patients", "last_insight_json")
