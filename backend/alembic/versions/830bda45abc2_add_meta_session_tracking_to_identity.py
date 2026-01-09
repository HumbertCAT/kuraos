"""add_meta_session_tracking_to_identity

Revision ID: 830bda45abc2
Revises: e6766c8a25d4
Create Date: 2026-01-09 02:47:43.109362

v1.6.6: Meta Chronos Logic - Session tracking for 24h/7d window enforcement
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "830bda45abc2"
down_revision: Union[str, Sequence[str], None] = "e6766c8a25d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Meta session tracking columns to identities table."""
    op.add_column(
        "identities",
        sa.Column(
            "last_meta_interaction_at", sa.DateTime(timezone=True), nullable=True
        ),
    )
    op.add_column(
        "identities", sa.Column("meta_provider", sa.String(length=20), nullable=True)
    )


def downgrade() -> None:
    """Remove Meta session tracking columns."""
    op.drop_column("identities", "meta_provider")
    op.drop_column("identities", "last_meta_interaction_at")
