"""add_terminology_preference

Revision ID: 7993cb9acf03
Revises: 7abb364277c9
Create Date: 2025-12-20 15:37:20.344207

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "7993cb9acf03"
down_revision: Union[str, Sequence[str], None] = "7abb364277c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Create the enum type
terminologypreference_enum = sa.Enum(
    "PATIENT", "CLIENT", "CONSULTANT", name="terminologypreference"
)


def upgrade() -> None:
    """Add terminology_preference to organizations."""
    # First, create the enum type in PostgreSQL
    terminologypreference_enum.create(op.get_bind(), checkfirst=True)

    # Then add the column with a default value (allows NOT NULL on existing rows)
    op.add_column(
        "organizations",
        sa.Column(
            "terminology_preference",
            terminologypreference_enum,
            nullable=False,
            server_default="CLIENT",
        ),
    )


def downgrade() -> None:
    """Remove terminology_preference from organizations."""
    op.drop_column("organizations", "terminology_preference")

    # Drop the enum type
    terminologypreference_enum.drop(op.get_bind(), checkfirst=True)
