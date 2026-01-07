"""force_legacy_privacy_tier_v1_5_9

Revision ID: 2013ff4641d3
Revises: s8901nopqr234
Create Date: 2026-01-07 23:11:03.604746

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2013ff4641d3"
down_revision: Union[str, Sequence[str], None] = "s8901nopqr234"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Set all organizations and patients to LEGACY privacy tier."""
    # Using execute since PrivacyTier is an Enum and we want direct SQL speed
    op.execute("UPDATE organizations SET default_privacy_tier = 'LEGACY';")
    op.execute("UPDATE patients SET privacy_tier_override = 'LEGACY';")


def downgrade() -> None:
    """Downgrade schema: (Optional) could revert to STANDARD, but business decided LEGACY is default."""
    pass
