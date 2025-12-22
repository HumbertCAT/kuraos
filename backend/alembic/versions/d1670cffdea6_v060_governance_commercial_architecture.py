"""v060_governance_commercial_architecture

Revision ID: d1670cffdea6
Revises: 407cec59ed8d
Create Date: 2025-12-10 01:53:33.176256

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d1670cffdea6"
down_revision: Union[str, Sequence[str], None] = "407cec59ed8d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Create enum types
orgtier_enum = postgresql.ENUM("FREE", "PRO", "TRIAL", name="orgtier")
outputlanguage_enum = postgresql.ENUM("AUTO", "ES", "EN", name="outputlanguage")


def upgrade() -> None:
    """Upgrade schema."""
    # Create enum types first
    orgtier_enum.create(op.get_bind(), checkfirst=True)
    outputlanguage_enum.create(op.get_bind(), checkfirst=True)

    # Create new tables
    op.create_table(
        "system_settings",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("key"),
    )

    op.create_table(
        "ai_usage_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("entry_id", sa.Uuid(), nullable=True),
        sa.Column("credits_cost", sa.Integer(), nullable=False),
        sa.Column("activity_type", sa.String(length=50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["entry_id"],
            ["clinical_entries.id"],
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ai_usage_logs_organization_id"),
        "ai_usage_logs",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ai_usage_logs_user_id"), "ai_usage_logs", ["user_id"], unique=False
    )

    # Organizations: add tier and credits columns with defaults for existing rows
    op.add_column(
        "organizations",
        sa.Column(
            "tier",
            sa.Enum("FREE", "PRO", "TRIAL", name="orgtier"),
            server_default="FREE",
            nullable=False,
        ),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "ai_credits_monthly_quota",
            sa.Integer(),
            server_default="100",
            nullable=False,
        ),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "ai_credits_purchased", sa.Integer(), server_default="0", nullable=False
        ),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "ai_credits_used_this_month",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )
    op.add_column(
        "organizations",
        sa.Column("credits_reset_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "organizations",
        sa.Column("settings", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )

    # Patients: add language with default
    op.add_column(
        "patients",
        sa.Column(
            "language", sa.String(length=10), server_default="es", nullable=False
        ),
    )

    # Users: add superuser, locale, and AI preference with defaults
    op.add_column(
        "users",
        sa.Column("is_superuser", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("locale", sa.String(length=10), server_default="es", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column(
            "ai_output_preference",
            sa.Enum("AUTO", "ES", "EN", name="outputlanguage"),
            server_default="AUTO",
            nullable=False,
        ),
    )

    # Seed initial SystemSettings
    op.execute("""
        INSERT INTO system_settings (key, value, description) VALUES
        ('FREE_PATIENT_LIMIT', '5', 'Maximum patients for FREE tier'),
        ('FREE_CREDITS_MONTHLY', '100', 'Monthly AI credits for FREE tier'),
        ('PRO_CREDITS_MONTHLY', '500', 'Monthly AI credits for PRO tier'),
        ('AI_COST_TEXT', '1', 'Credits per text analysis'),
        ('AI_COST_MULTIMODAL', '5', 'Credits per audio/image analysis'),
        ('AI_MODEL', '"gemini-2.5-flash"', 'Default AI model')
        ON CONFLICT (key) DO NOTHING;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Delete seeded settings
    op.execute(
        "DELETE FROM system_settings WHERE key IN ('FREE_PATIENT_LIMIT', 'FREE_CREDITS_MONTHLY', 'PRO_CREDITS_MONTHLY', 'AI_COST_TEXT', 'AI_COST_MULTIMODAL', 'AI_MODEL');"
    )

    op.drop_column("users", "ai_output_preference")
    op.drop_column("users", "locale")
    op.drop_column("users", "is_superuser")
    op.drop_column("patients", "language")
    op.drop_column("organizations", "settings")
    op.drop_column("organizations", "credits_reset_at")
    op.drop_column("organizations", "ai_credits_used_this_month")
    op.drop_column("organizations", "ai_credits_purchased")
    op.drop_column("organizations", "ai_credits_monthly_quota")
    op.drop_column("organizations", "tier")
    op.drop_index(op.f("ix_ai_usage_logs_user_id"), table_name="ai_usage_logs")
    op.drop_index(op.f("ix_ai_usage_logs_organization_id"), table_name="ai_usage_logs")
    op.drop_table("ai_usage_logs")
    op.drop_table("system_settings")

    # Drop enum types
    outputlanguage_enum.drop(op.get_bind(), checkfirst=True)
    orgtier_enum.drop(op.get_bind(), checkfirst=True)
