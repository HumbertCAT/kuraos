"""merge divergent heads

Revision ID: j0123def4h5i
Revises: add_stripe_org_fields, i9012cdef3g4
Create Date: 2025-12-26 09:25:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "j0123def4h5i"
down_revision = ("add_stripe_org_fields", "i9012cdef3g4")
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Merge migration - no schema changes needed
    pass


def downgrade() -> None:
    pass
