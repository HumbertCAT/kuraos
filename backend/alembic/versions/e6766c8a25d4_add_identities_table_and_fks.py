"""add_identities_table_and_fks

Revision ID: e6766c8a25d4
Revises: a8651949a70d
Create Date: 2026-01-08 15:44:29.533448

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e6766c8a25d4"
down_revision: Union[str, Sequence[str], None] = "a8651949a70d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    The Identity Vault - Phase 1

    Creates the universal identity system for deduplicating contacts
    across Lead/Patient/Follower domains.
    """

    # 1. Create identities table
    op.create_table(
        "identities",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("primary_email", sa.String(255), nullable=True),
        sa.Column("primary_phone", sa.String(20), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.Column("merged_with", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_merged", sa.Boolean(), server_default="false", nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["merged_with"], ["identities.id"], ondelete="SET NULL"
        ),
        sa.UniqueConstraint(
            "organization_id", "primary_email", name="uq_identity_org_email"
        ),
        sa.UniqueConstraint(
            "organization_id", "primary_phone", name="uq_identity_org_phone"
        ),
    )

    # 2. Create performance indexes
    op.create_index(
        "idx_identities_email", "identities", ["organization_id", "primary_email"]
    )
    op.create_index(
        "idx_identities_phone", "identities", ["organization_id", "primary_phone"]
    )
    op.create_index("idx_identities_merged", "identities", ["is_merged"])

    # 3. Add identity_id to leads table
    op.add_column(
        "leads", sa.Column("identity_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        "fk_leads_identity",
        "leads",
        "identities",
        ["identity_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("idx_leads_identity", "leads", ["identity_id"])

    # 4. Add identity_id to patients table
    op.add_column(
        "patients",
        sa.Column("identity_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_patients_identity",
        "patients",
        "identities",
        ["identity_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("idx_patients_identity", "patients", ["identity_id"])


def downgrade() -> None:
    """Rollback The Identity Vault."""

    # Remove from patients
    op.drop_index("idx_patients_identity", table_name="patients")
    op.drop_constraint("fk_patients_identity", "patients", type_="foreignkey")
    op.drop_column("patients", "identity_id")

    # Remove from leads
    op.drop_index("idx_leads_identity", table_name="leads")
    op.drop_constraint("fk_leads_identity", "leads", type_="foreignkey")
    op.drop_column("leads", "identity_id")

    # Remove identities table
    op.drop_index("idx_identities_merged", table_name="identities")
    op.drop_index("idx_identities_phone", table_name="identities")
    op.drop_index("idx_identities_email", table_name="identities")
    op.drop_table("identities")
