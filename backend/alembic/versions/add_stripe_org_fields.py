"""Add Stripe fields to Organization

Revision ID: add_stripe_org_fields
Revises: add_patient_profile_image
Create Date: 2024-12-16

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_stripe_org_fields"
down_revision = "add_patient_profile_image"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Stripe SaaS Billing fields
    op.add_column(
        "organizations", sa.Column("stripe_customer_id", sa.String(255), nullable=True)
    )
    op.add_column(
        "organizations",
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
    )

    # Stripe Connect fields
    op.add_column(
        "organizations", sa.Column("stripe_connect_id", sa.String(255), nullable=True)
    )
    op.add_column(
        "organizations",
        sa.Column(
            "stripe_connect_enabled",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("organizations", "stripe_connect_enabled")
    op.drop_column("organizations", "stripe_connect_id")
    op.drop_column("organizations", "stripe_subscription_id")
    op.drop_column("organizations", "stripe_customer_id")
