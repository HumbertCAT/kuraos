"""v1.1.1 - Upgrade ai_usage_logs for token-based cost tracking

Adds provider, model_id, task_type, tokens_input, tokens_output,
cost_provider_usd, cost_user_credits, patient_id, clinical_entry_id
fields to ai_usage_logs table for FinOps tracking.

Revision ID: k1234efgh5678
Revises: j0123def4h5i
Create Date: 2024-12-27
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "k1234efgh5678"
down_revision = "j0123def4h5i"
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns for v1.1.1 Intelligence Engine

    # Provider and model identification
    op.add_column(
        "ai_usage_logs",
        sa.Column(
            "provider", sa.String(50), server_default="vertex-google", nullable=False
        ),
    )
    op.add_column(
        "ai_usage_logs",
        sa.Column(
            "model_id",
            sa.String(100),
            server_default="gemini-2.5-flash",
            nullable=False,
        ),
    )
    op.add_column(
        "ai_usage_logs",
        sa.Column(
            "task_type",
            sa.String(50),
            server_default="clinical_analysis",
            nullable=False,
        ),
    )

    # Token metrics
    op.add_column(
        "ai_usage_logs",
        sa.Column("tokens_input", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "ai_usage_logs",
        sa.Column("tokens_output", sa.Integer(), server_default="0", nullable=False),
    )

    # Cost tracking
    op.add_column(
        "ai_usage_logs",
        sa.Column(
            "cost_provider_usd", sa.Float(), server_default="0.0", nullable=False
        ),
    )
    op.add_column(
        "ai_usage_logs",
        sa.Column(
            "cost_user_credits", sa.Float(), server_default="0.0", nullable=False
        ),
    )

    # Additional context
    op.add_column("ai_usage_logs", sa.Column("patient_id", sa.UUID(), nullable=True))
    op.add_column(
        "ai_usage_logs", sa.Column("clinical_entry_id", sa.UUID(), nullable=True)
    )

    # Make user_id nullable (automated processes may not have a user)
    op.alter_column("ai_usage_logs", "user_id", nullable=True)

    # Add foreign keys
    op.create_foreign_key(
        "fk_ai_usage_logs_patient_id",
        "ai_usage_logs",
        "patients",
        ["patient_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_ai_usage_logs_clinical_entry_id",
        "ai_usage_logs",
        "clinical_entries",
        ["clinical_entry_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # Add indexes for analytics
    op.create_index(
        "ix_ai_usage_org_date", "ai_usage_logs", ["organization_id", "created_at"]
    )
    op.create_index("ix_ai_usage_model", "ai_usage_logs", ["model_id"])


def downgrade():
    # Remove indexes
    op.drop_index("ix_ai_usage_model", table_name="ai_usage_logs")
    op.drop_index("ix_ai_usage_org_date", table_name="ai_usage_logs")

    # Remove foreign keys
    op.drop_constraint(
        "fk_ai_usage_logs_clinical_entry_id", "ai_usage_logs", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_ai_usage_logs_patient_id", "ai_usage_logs", type_="foreignkey"
    )

    # Make user_id required again
    op.alter_column("ai_usage_logs", "user_id", nullable=False)

    # Remove new columns
    op.drop_column("ai_usage_logs", "clinical_entry_id")
    op.drop_column("ai_usage_logs", "patient_id")
    op.drop_column("ai_usage_logs", "cost_user_credits")
    op.drop_column("ai_usage_logs", "cost_provider_usd")
    op.drop_column("ai_usage_logs", "tokens_output")
    op.drop_column("ai_usage_logs", "tokens_input")
    op.drop_column("ai_usage_logs", "task_type")
    op.drop_column("ai_usage_logs", "model_id")
    op.drop_column("ai_usage_logs", "provider")
