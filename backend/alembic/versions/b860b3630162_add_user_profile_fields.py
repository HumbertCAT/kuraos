"""add_user_profile_fields

Revision ID: b860b3630162
Revises: 04c7843ea29d
Create Date: 2025-12-15 09:29:01.371904

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b860b3630162"
down_revision: Union[str, Sequence[str], None] = "04c7843ea29d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("users", sa.Column("phone", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("website", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("country", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column(
        "users", sa.Column("profile_image_url", sa.String(length=512), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column(
            "social_media", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "social_media")
    op.drop_column("users", "profile_image_url")
    op.drop_column("users", "city")
    op.drop_column("users", "country")
    op.drop_column("users", "website")
    op.drop_column("users", "phone")
