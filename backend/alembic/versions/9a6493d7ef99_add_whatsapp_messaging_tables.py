"""add whatsapp messaging tables

Revision ID: 9a6493d7ef99
Revises: e426eeae86b3
Create Date: 2025-12-16 14:22:31.321072

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "9a6493d7ef99"
down_revision: Union[str, Sequence[str], None] = "e426eeae86b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create daily_conversation_analyses table
    op.create_table(
        "daily_conversation_analyses",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("sentiment_score", sa.Float(), nullable=False),
        sa.Column("emotional_state", sa.String(length=50), nullable=True),
        sa.Column(
            "risk_flags", postgresql.JSONB(astext_type=sa.Text()), nullable=False
        ),
        sa.Column("suggestion", sa.Text(), nullable=True),
        sa.Column("message_count", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_daily_analysis_patient_date",
        "daily_conversation_analyses",
        ["patient_id", "date"],
        unique=True,
    )
    op.create_index(
        op.f("ix_daily_conversation_analyses_date"),
        "daily_conversation_analyses",
        ["date"],
        unique=False,
    )
    op.create_index(
        op.f("ix_daily_conversation_analyses_organization_id"),
        "daily_conversation_analyses",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_daily_conversation_analyses_patient_id"),
        "daily_conversation_analyses",
        ["patient_id"],
        unique=False,
    )

    # Create message_logs table
    op.create_table(
        "message_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column(
            "direction",
            sa.Enum("INBOUND", "OUTBOUND", name="messagedirection"),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("provider_id", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider_id"),
    )
    op.create_index(
        op.f("ix_message_logs_organization_id"),
        "message_logs",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_message_logs_patient_id"), "message_logs", ["patient_id"], unique=False
    )
    op.create_index(
        "ix_message_logs_patient_timestamp",
        "message_logs",
        ["patient_id", "timestamp"],
        unique=False,
    )
    op.create_index(
        op.f("ix_message_logs_timestamp"), "message_logs", ["timestamp"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_message_logs_timestamp"), table_name="message_logs")
    op.drop_index("ix_message_logs_patient_timestamp", table_name="message_logs")
    op.drop_index(op.f("ix_message_logs_patient_id"), table_name="message_logs")
    op.drop_index(op.f("ix_message_logs_organization_id"), table_name="message_logs")
    op.drop_table("message_logs")
    op.drop_index(
        op.f("ix_daily_conversation_analyses_patient_id"),
        table_name="daily_conversation_analyses",
    )
    op.drop_index(
        op.f("ix_daily_conversation_analyses_organization_id"),
        table_name="daily_conversation_analyses",
    )
    op.drop_index(
        op.f("ix_daily_conversation_analyses_date"),
        table_name="daily_conversation_analyses",
    )
    op.drop_index(
        "ix_daily_analysis_patient_date", table_name="daily_conversation_analyses"
    )
    op.drop_table("daily_conversation_analyses")
