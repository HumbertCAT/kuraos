"""Add theme_preference to User.

Revision ID: l2345fghi6789
Revises: k1234efgh5678
Create Date: 2025-12-28

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM

# revision identifiers, used by Alembic.
revision = "l2345fghi6789"
down_revision = "k1234efgh5678"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type with checkfirst to avoid duplicate errors
    theme_preference_enum = ENUM(
        "DEFAULT", "OCEAN", "SUNSET", name="themepreference", create_type=False
    )
    theme_preference_enum.create(op.get_bind(), checkfirst=True)

    # Add column to users table
    op.add_column(
        "users",
        sa.Column(
            "theme_preference",
            sa.Enum("DEFAULT", "OCEAN", "SUNSET", name="themepreference"),
            nullable=False,
            server_default="DEFAULT",
        ),
    )


def downgrade() -> None:
    # Remove column
    op.drop_column("users", "theme_preference")

    # Drop enum type (safe with IF EXISTS)
    op.execute("DROP TYPE IF EXISTS themepreference")
