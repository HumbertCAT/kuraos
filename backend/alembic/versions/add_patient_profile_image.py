"""Add patient profile_image_url field

Revision ID: add_patient_profile_image
Revises:
Create Date: 2024-12-16

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_patient_profile_image"
down_revision = "f01a2b3c4d5e"  # Links to existing head
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "patients", sa.Column("profile_image_url", sa.String(length=512), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("patients", "profile_image_url")
