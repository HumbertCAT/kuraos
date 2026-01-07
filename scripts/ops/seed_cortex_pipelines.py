#!/usr/bin/env python3
"""
Seed Cortex Pipeline Configurations

Kura Cortex v1.5.4 - Cerebral Integration

Creates robust pipeline definitions for all clinical processing scenarios.
Supports tier-aware routing with GHOST mode pipelines.

Usage:
    cd backend && python scripts/ops/seed_cortex_pipelines.py [--dry-run]
"""

import asyncio
import argparse
import uuid
from datetime import datetime

# Add parent to path for imports
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from sqlalchemy import select, text
from app.db.base import get_session_factory
from app.db.models import AIPipelineConfig, PrivacyTier


# Pipeline Definitions
PIPELINES = [
    # ============================================================
    # TEXT PIPELINES
    # ============================================================
    {
        "name": "clinical_soap_v1",
        "input_modality": "TEXT",
        "description": "Clinical note → SOAP analysis with risk triage",
        "privacy_tier_required": None,  # Works for all tiers
        "stages": [
            {"step": "intake", "description": "Normalize input text"},
            {
                "step": "analyze",
                "model": "gemini:2.5-pro",
                "prompt_key": "clinical_analysis",
            },
            {
                "step": "triage",
                "model": "gemini:2.5-flash",
                "prompt_key": "risk_triage",
            },
        ],
    },
    # ============================================================
    # AUDIO PIPELINES
    # ============================================================
    {
        "name": "audio_session_v1",
        "input_modality": "AUDIO",
        "description": "Session audio → Transcription → SOAP → Triage (STANDARD/LEGACY)",
        "privacy_tier_required": None,  # STANDARD and LEGACY
        "stages": [
            {"step": "transcribe", "model": "gemini:2.5-flash"},
            {
                "step": "analyze",
                "model": "gemini:2.5-pro",
                "prompt_key": "clinical_analysis",
            },
            {
                "step": "triage",
                "model": "gemini:2.5-flash",
                "prompt_key": "risk_triage",
            },
        ],
    },
    {
        "name": "ghost_session_v1",
        "input_modality": "AUDIO",
        "description": "GHOST mode: Audio → RAM-only processing → Insights only (no persistence)",
        "privacy_tier_required": PrivacyTier.GHOST,  # GHOST only
        "stages": [
            {"step": "transcribe", "model": "gemini:2.5-flash", "ram_only": True},
            {
                "step": "analyze",
                "model": "gemini:2.5-pro",
                "prompt_key": "clinical_analysis",
                "ephemeral": True,
            },
            # No triage step - minimal footprint
        ],
    },
    # ============================================================
    # DOCUMENT PIPELINES
    # ============================================================
    {
        "name": "document_ocr_v1",
        "input_modality": "VISION",
        "description": "Document/image → OCR → Clinical triage",
        "privacy_tier_required": None,
        "stages": [
            {"step": "ocr", "model": "gemini:2.5-flash"},
            {
                "step": "triage",
                "model": "gemini:2.5-flash",
                "prompt_key": "document_triage",
            },
        ],
    },
    # ============================================================
    # QUICK AUDIO (MEMO)
    # ============================================================
    {
        "name": "audio_memo_v1",
        "input_modality": "AUDIO",
        "description": "Quick audio notes (<15 min) → Structured JSON",
        "privacy_tier_required": None,
        "stages": [
            {"step": "transcribe", "model": "gemini:2.5-flash"},
            {
                "step": "analyze",
                "model": "gemini:2.5-flash",
                "prompt_key": "audio_memo",
            },
        ],
    },
]


async def seed_pipelines(dry_run: bool = False):
    """Insert or update pipeline configurations."""
    print("🧠 Kura Cortex Pipeline Seeder")
    print("=" * 50)
    print(f"Mode: {'DRY RUN' if dry_run else 'EXECUTE'}")
    print(f"Pipelines to seed: {len(PIPELINES)}")
    print()

    if dry_run:
        for p in PIPELINES:
            print(f"  📋 {p['name']}")
            print(f"     Modality: {p['input_modality']}")
            print(f"     Stages: {len(p['stages'])}")
            print(
                f"     Privacy: {p['privacy_tier_required'].value if p['privacy_tier_required'] else 'ANY'}"
            )
            print()
        print("DRY RUN complete. No changes made.")
        return

    factory = get_session_factory()
    async with factory() as db:
        created = 0
        updated = 0

        for pipeline_def in PIPELINES:
            # Check if exists
            result = await db.execute(
                select(AIPipelineConfig).where(
                    AIPipelineConfig.name == pipeline_def["name"]
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                # Update
                existing.stages = pipeline_def["stages"]
                existing.description = pipeline_def["description"]
                existing.input_modality = pipeline_def["input_modality"]
                existing.privacy_tier_required = pipeline_def["privacy_tier_required"]
                existing.is_active = True
                updated += 1
                print(f"  ♻️  Updated: {pipeline_def['name']}")
            else:
                # Create
                config = AIPipelineConfig(
                    id=uuid.uuid4(),
                    name=pipeline_def["name"],
                    input_modality=pipeline_def["input_modality"],
                    stages=pipeline_def["stages"],
                    description=pipeline_def["description"],
                    privacy_tier_required=pipeline_def["privacy_tier_required"],
                    is_active=True,
                )
                db.add(config)
                created += 1
                print(f"  ✅ Created: {pipeline_def['name']}")

        await db.commit()

        print()
        print("=" * 50)
        print(f"✅ Complete: {created} created, {updated} updated")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Cortex pipeline configurations")
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview changes without applying"
    )
    args = parser.parse_args()

    asyncio.run(seed_pipelines(dry_run=args.dry_run))
