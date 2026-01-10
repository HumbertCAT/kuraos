"""TD-81: Add composite index for identity lookups.

Revision ID: t9012opqrs345
Revises: s8901nopqr234_add_ghost_protocol_to_clinical_entries
Create Date: 2026-01-10

Performance optimization: Add composite index on identities(organization_id, primary_email, primary_phone)
for faster Identity Vault lookups when checking both email and phone in a single query.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = "t9012opqrs345"
down_revision = "s8901nopqr234"
branch_labels = None
depends_on = None


def upgrade():
    """Add composite index for faster identity resolution."""
    # TD-81: Composite index for lookups that check both email AND phone in same query
    # This optimizes the IdentityResolver.resolve_identity() waterfall matching

    # Check if identities table exists (migration order issue with parallel branches)
    conn = op.get_bind()
    result = conn.execute(
        sa.text("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_name='identities'
    """)
    )
    if result.fetchone() is None:
        # Table doesn't exist yet - skip index creation
        # It will be created when e6766c8a25d4 runs later
        return

    op.create_index(
        "idx_identities_org_email_phone",
        "identities",
        ["organization_id", "primary_email", "primary_phone"],
        unique=False,
    )


def downgrade():
    """Remove composite index."""
    conn = op.get_bind()
    result = conn.execute(
        sa.text("""
        SELECT indexname FROM pg_indexes WHERE indexname='idx_identities_org_email_phone'
    """)
    )
    if result.fetchone() is not None:
        op.drop_index("idx_identities_org_email_phone", table_name="identities")
