"""add_leads_table_crm

Revision ID: 38323a7a5a29
Revises: 7993cb9acf03
Create Date: 2025-12-22 00:13:35.642589

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "38323a7a5a29"
down_revision: Union[str, Sequence[str], None] = "7993cb9acf03"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create leads table for CRM functionality."""
    # Create the LeadStatus enum type first (with IF NOT EXISTS via raw SQL)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE leadstatus AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create leads table
    op.create_table(
        "leads",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "NEW",
                "CONTACTED",
                "QUALIFIED",
                "CONVERTED",
                "LOST",
                name="leadstatus",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("source", sa.String(length=50), nullable=False),
        sa.Column(
            "source_details", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("converted_patient_id", sa.Uuid(), nullable=True),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["converted_patient_id"],
            ["patients.id"],
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_leads_email"), "leads", ["email"], unique=False)
    op.create_index(
        "ix_leads_org_status", "leads", ["organization_id", "status"], unique=False
    )


def downgrade() -> None:
    """Drop leads table."""
    op.drop_index("ix_leads_org_status", table_name="leads")
    op.drop_index(op.f("ix_leads_email"), table_name="leads")
    op.drop_table("leads")
    op.execute("DROP TYPE IF EXISTS leadstatus;")
