"""Add Kura Cortex v1.5 privacy tiers and pipeline configs

Revision ID: r7890mnopq123
Revises: q6789lmnop012
Create Date: 2026-01-07

Kura Cortex v1.5 Foundation:
- PrivacyTier enum (GHOST/STANDARD/LEGACY)
- Organization.country_code for GDPR/BAA region detection
- Organization.default_privacy_tier for org-level override
- Patient.privacy_tier_override for patient-level control
- AIPipelineConfig table for DAG-based cognitive pipelines
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = "r7890mnopq123"
down_revision: Union[str, None] = "q6789lmnop012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Cortex v1.5 schema changes."""

    # 1. Create PrivacyTier enum
    privacy_tier_enum = sa.Enum(
        "GHOST", "STANDARD", "LEGACY", name="privacytier", create_type=False
    )
    privacy_tier_enum.create(op.get_bind(), checkfirst=True)

    # 2. Add columns to organizations
    op.add_column(
        "organizations",
        sa.Column("country_code", sa.String(2), nullable=False, server_default="ES"),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "default_privacy_tier",
            sa.Enum("GHOST", "STANDARD", "LEGACY", name="privacytier"),
            nullable=True,
        ),
    )

    # 3. Add column to patients
    op.add_column(
        "patients",
        sa.Column(
            "privacy_tier_override",
            sa.Enum("GHOST", "STANDARD", "LEGACY", name="privacytier"),
            nullable=True,
        ),
    )

    # 4. Create ai_pipeline_configs table
    op.create_table(
        "ai_pipeline_configs",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("input_modality", sa.String(20), nullable=False),
        sa.Column("stages", JSONB, nullable=False, server_default="[]"),
        sa.Column(
            "privacy_tier_required",
            sa.Enum("GHOST", "STANDARD", "LEGACY", name="privacytier"),
            nullable=True,
        ),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )

    # 5. Seed initial pipeline configurations
    op.execute("""
        INSERT INTO ai_pipeline_configs (id, name, input_modality, stages, description)
        VALUES 
        (gen_random_uuid(), 'session_analysis', 'AUDIO', 
         '[{"step": "transcribe", "model": "gemini:2.5-flash"}, {"step": "analyze", "model": "gemini:2.5-pro", "prompt_key": "clinical_analysis"}]',
         'Standard session analysis: Audio → Transcription → SOAP Note'),
        (gen_random_uuid(), 'clinical_intake', 'TEXT', 
         '[{"step": "analyze", "model": "gemini:2.5-flash", "prompt_key": "triage"}]',
         'Intake form analysis with risk triage'),
        (gen_random_uuid(), 'grapho_digitization', 'VISION', 
         '[{"step": "ocr", "model": "gemini:2.5-flash"}]',
         'Document/image OCR and digitization');
    """)


def downgrade() -> None:
    """Remove Cortex v1.5 schema changes."""

    # Drop table
    op.drop_table("ai_pipeline_configs")

    # Drop columns
    op.drop_column("patients", "privacy_tier_override")
    op.drop_column("organizations", "default_privacy_tier")
    op.drop_column("organizations", "country_code")

    # Note: We don't drop the enum as other migrations might depend on it
    # The enum can be manually dropped if needed: DROP TYPE privacytier;
