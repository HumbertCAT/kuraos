"""add target_entity to form_templates

Revision ID: h8901bcdef2
Revises: g7890abcdef1
Create Date: 2025-12-22 02:19:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "h8901bcdef2"
down_revision = "g7890abcdef1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add target_entity column to form_templates
    op.add_column(
        "form_templates",
        sa.Column(
            "target_entity", sa.String(20), nullable=False, server_default="PATIENT"
        ),
    )


def downgrade() -> None:
    # Remove target_entity column
    op.drop_column("form_templates", "target_entity")
