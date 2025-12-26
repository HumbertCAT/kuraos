"""add_lead_form_data

Revision ID: 849384d89ca0
Revises: j0123def4h5i
Create Date: 2025-12-26 22:25:34.724314

Security: Adds structured JSONB storage for form answers.
This separates PII (name, email in columns) from clinical data (form_data).
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "849384d89ca0"
down_revision: Union[str, Sequence[str], None] = "j0123def4h5i"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add form_data JSONB column to leads table."""
    op.add_column(
        "leads",
        sa.Column("form_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    """Remove form_data column from leads table."""
    op.drop_column("leads", "form_data")
