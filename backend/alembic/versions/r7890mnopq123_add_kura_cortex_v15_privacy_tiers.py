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
    """Add Cortex v1.5 schema changes (idempotent)."""
    conn = op.get_bind()

    # 1. Create PrivacyTier enum if not exists
    conn.execute(
        sa.text("""
        DO $$ BEGIN
            CREATE TYPE privacytier AS ENUM ('GHOST', 'STANDARD', 'LEGACY');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    )

    # 2. Add columns to organizations (if not exist)
    conn.execute(
        sa.text("""
        ALTER TABLE organizations 
        ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'ES' NOT NULL;
    """)
    )
    conn.execute(
        sa.text("""
        ALTER TABLE organizations 
        ADD COLUMN IF NOT EXISTS default_privacy_tier privacytier;
    """)
    )

    # 3. Add column to patients (if not exist)
    conn.execute(
        sa.text("""
        ALTER TABLE patients 
        ADD COLUMN IF NOT EXISTS privacy_tier_override privacytier;
    """)
    )

    # 4. Create ai_pipeline_configs table if not exists
    conn.execute(
        sa.text("""
        CREATE TABLE IF NOT EXISTS ai_pipeline_configs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) UNIQUE NOT NULL,
            input_modality VARCHAR(20) NOT NULL,
            stages JSONB NOT NULL DEFAULT '[]',
            privacy_tier_required privacytier,
            is_active BOOLEAN NOT NULL DEFAULT true,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    )

    # 5. Create index if not exists
    conn.execute(
        sa.text("""
        CREATE INDEX IF NOT EXISTS ix_ai_pipeline_configs_name 
        ON ai_pipeline_configs(name);
    """)
    )

    # 6. Seed initial pipeline configurations (upsert)
    conn.execute(
        sa.text("""
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
         'Document/image OCR and digitization')
        ON CONFLICT (name) DO NOTHING;
    """)
    )


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
