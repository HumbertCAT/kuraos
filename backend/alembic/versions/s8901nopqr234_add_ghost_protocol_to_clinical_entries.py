"""
Add is_ghost and pipeline_name to ClinicalEntry

Kura Cortex v1.5.4 - Ghost Protocol Support

Revision ID: s8901nopqr234
Revises: r7890mnopq123
Create Date: 2026-01-07
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "s8901nopqr234"
down_revision: Union[str, None] = "r7890mnopq123"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Ghost Protocol columns to clinical_entries."""

    # Add is_ghost flag (defaults to False for existing entries)
    op.add_column(
        "clinical_entries",
        sa.Column("is_ghost", sa.Boolean(), nullable=False, server_default="false"),
    )

    # Add pipeline_name to track which Cortex pipeline was used
    op.add_column(
        "clinical_entries",
        sa.Column("pipeline_name", sa.String(100), nullable=True),
    )


def downgrade() -> None:
    """Remove Ghost Protocol columns."""
    op.drop_column("clinical_entries", "pipeline_name")
    op.drop_column("clinical_entries", "is_ghost")
