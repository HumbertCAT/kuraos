"""add_anonymous_datasets_vault

Revision ID: b1234def5678
Revises: 849384d89ca0
Create Date: 2025-12-27 00:40:00.000000

The Vault - Creates orphan table for GDPR-compliant clinical IP preservation.
This table has NO foreign keys and survives patient deletion.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b1234def5678"
down_revision: Union[str, Sequence[str], None] = "849384d89ca0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create anonymous_datasets table (The Vault)."""
    # Create enum type
    datasettype_enum = postgresql.ENUM(
        "CLINICAL_NOTE",
        "TRANSCRIPT",
        "CHAT_ANALYSIS",
        name="datasettype",
        create_type=True,
    )
    datasettype_enum.create(op.get_bind(), checkfirst=True)

    # Create orphan table - NO foreign keys
    op.create_table(
        "anonymous_datasets",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column(
            "source_type",
            postgresql.ENUM(
                "CLINICAL_NOTE",
                "TRANSCRIPT",
                "CHAT_ANALYSIS",
                name="datasettype",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "meta_analysis", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("language", sa.String(10), server_default="es", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Drop anonymous_datasets table."""
    op.drop_table("anonymous_datasets")

    # Drop enum type
    datasettype_enum = postgresql.ENUM(
        "CLINICAL_NOTE", "TRANSCRIPT", "CHAT_ANALYSIS", name="datasettype"
    )
    datasettype_enum.drop(op.get_bind(), checkfirst=True)
