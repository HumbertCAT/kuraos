"""backfill_form_public_tokens

Revision ID: n4567ijkl8901
Revises: m3456ghij7890
Create Date: 2026-01-05 10:30:00.000000

Backfill public_token for all form_templates that have organization_id
but are missing public_token (legacy clones/duplicates).
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "n4567ijkl8901"
down_revision = "b7573685053a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Generate public_token for all organization forms that don't have one
    # Uses md5 + random for unique token generation (no pgcrypto needed)
    op.execute("""
        UPDATE form_templates
        SET public_token = substring(md5(random()::text || clock_timestamp()::text || id::text) from 1 for 22)
        WHERE organization_id IS NOT NULL
          AND public_token IS NULL
    """)


def downgrade() -> None:
    # Cannot reliably downgrade - tokens are not reversible
    # Forms created before this migration had NULL tokens anyway
    pass
