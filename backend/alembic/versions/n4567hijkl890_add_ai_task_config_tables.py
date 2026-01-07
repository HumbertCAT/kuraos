"""Add AI task config tables for v1.4.5 Governance Pro

Revision ID: n4567hijkl890
Revises: m3456ghij7890
Create Date: 2026-01-07

Creates ai_task_configs and ai_task_config_history tables for runtime
AI parameter configuration (temperature, model, safety mode).
Includes seed data for all existing task types.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "n4567hijkl890"
down_revision: Union[str, None] = "m3456ghij7890"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Safety mode enum for Postgres
safety_mode_enum = postgresql.ENUM(
    "CLINICAL", "STANDARD", "STRICT", name="safetymode", create_type=False
)


def upgrade() -> None:
    """Create AI task config tables and seed defaults."""

    # Create SafetyMode enum type
    op.execute("CREATE TYPE safetymode AS ENUM ('CLINICAL', 'STANDARD', 'STRICT');")

    # Create ai_task_configs table
    op.create_table(
        "ai_task_configs",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("task_type", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column(
            "model_id",
            sa.String(100),
            nullable=False,
            server_default="gemini-2.5-flash",
        ),
        sa.Column(
            "temperature", sa.Numeric(3, 2), nullable=False, server_default="0.70"
        ),
        sa.Column(
            "max_output_tokens", sa.Integer, nullable=False, server_default="2048"
        ),
        sa.Column(
            "safety_mode", safety_mode_enum, nullable=False, server_default="CLINICAL"
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.Column(
            "updated_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
    )

    # Create ai_task_config_history table
    op.create_table(
        "ai_task_config_history",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("task_type", sa.String(50), nullable=False, index=True),
        sa.Column("field_changed", sa.String(50), nullable=False),
        sa.Column("old_value", sa.Text, nullable=True),
        sa.Column("new_value", sa.Text, nullable=True),
        sa.Column(
            "changed_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column(
            "changed_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=True,
        ),
    )

    # Seed default configurations for all task types
    # Based on current hardcoded values in factory.py
    op.execute("""
        INSERT INTO ai_task_configs (task_type, model_id, temperature, max_output_tokens, safety_mode)
        VALUES 
            ('clinical_analysis', 'gemini-2.5-pro', 0.70, 4096, 'CLINICAL'),
            ('audio_synthesis', 'gemini-2.5-flash', 0.70, 4096, 'CLINICAL'),
            ('document_analysis', 'gemini-2.5-flash', 0.70, 2048, 'CLINICAL'),
            ('form_analysis', 'gemini-2.5-flash', 0.70, 2048, 'CLINICAL'),
            ('triage', 'gemini-2.5-flash', 0.50, 2048, 'CLINICAL'),
            ('chat', 'gemini-2.5-flash', 0.70, 2048, 'CLINICAL'),
            ('help_bot', 'gemini-2.5-flash-lite', 0.30, 1024, 'STRICT'),
            ('transcription', 'gemini-2.5-flash', 0.30, 4096, 'CLINICAL'),
            ('briefing', 'gemini-2.5-flash', 0.70, 2048, 'CLINICAL')
        ON CONFLICT (task_type) DO NOTHING;
    """)


def downgrade() -> None:
    """Drop AI task config tables."""
    op.drop_table("ai_task_config_history")
    op.drop_table("ai_task_configs")
    op.execute("DROP TYPE IF EXISTS safetymode;")
