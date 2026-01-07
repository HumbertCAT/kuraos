#!/usr/bin/env python
"""
Cortex Activation Protocol - v1.5.5
====================================

Seeds all 10 AletheIA Units into the ai_pipeline_configs table.
This script is IDEMPOTENT - safe to run multiple times.

Usage:
    cd backend && python -m scripts.seed_cortex_pipelines

Or via Docker:
    docker-compose exec backend python -m scripts.seed_cortex_pipelines
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.db.base import get_session_factory
from app.db.models import AIPipelineConfig


# ============================================================================
# THE CORTEX REGISTRY - All 10 AletheIA Units
# ============================================================================

PIPELINES = [
    # === LEVEL 1: CLINICAL JUDGMENT ===
    {
        "name": "triage",  # SENTINEL
        "input_modality": "TEXT",
        "stages": [
            {"step": "analyze", "model": "gemini-2.5-flash", "prompt_key": "triage_v1"}
        ],
        "description": "SENTINEL - Active Security Monitor. Risk screening with zero-temperature for deterministic safety detection.",
        "is_active": True,
    },
    {
        "name": "clinical_analysis",  # ORACLE
        "input_modality": "TEXT",
        "stages": [
            {
                "step": "analyze",
                "model": "gemini-2.5-pro",
                "prompt_key": "clinical_v1",
                "temperature": 0.2,
            }
        ],
        "description": "ORACLE - Clinical Deduction Engine. Deep session analysis with context window.",
        "is_active": True,
    },
    {
        "name": "briefing",  # NOW
        "input_modality": "TEXT",
        "stages": [
            {
                "step": "analyze",
                "model": "gemini-2.5-flash",
                "prompt_key": "daily_briefing_v1",
                "temperature": 0.4,
            }
        ],
        "description": "NOW - Strategic Context Synthesizer. Daily briefing and next actions.",
        "is_active": True,
    },
    {
        "name": "chat",  # PULSE
        "input_modality": "TEXT",
        "stages": [
            {
                "step": "analyze",
                "model": "gemini-2.5-flash",
                "prompt_key": "chat_v1",
                "temperature": 0.3,
            }
        ],
        "description": "PULSE - Emotional Temperature Sensor. Chat sentiment monitoring.",
        "is_active": True,
    },
    # === LEVEL 2: TRANSFORMATION & MEDIA ===
    {
        "name": "transcription",  # SCRIBE
        "input_modality": "AUDIO",
        "stages": [{"step": "transcribe", "model": "chirp-v2", "language": "es"}],
        "description": "SCRIBE - High-Fidelity Transcriber. Audio to verbatim text with diarization.",
        "is_active": True,
    },
    {
        "name": "session_analysis",  # VOICE (Audio → Full Analysis)
        "input_modality": "AUDIO",
        "stages": [
            {"step": "transcribe", "model": "gemini-2.5-flash"},
            {
                "step": "analyze",
                "model": "gemini-2.5-pro",
                "prompt_key": "clinical_analysis",
                "temperature": 0.4,
            },
        ],
        "description": "VOICE - Session Synthesis Engine. Full session audio → transcription → SOAP analysis.",
        "is_active": True,
    },
    {
        "name": "audio_memo",  # MEMO
        "input_modality": "AUDIO",
        "stages": [
            {"step": "transcribe", "model": "gemini-2.5-flash"},
            {
                "step": "analyze",
                "model": "gemini-2.5-flash",
                "prompt_key": "memo_v1",
                "temperature": 0.3,
            },
        ],
        "description": "MEMO - Executive Notes Extractor. Quick voice memos → action items and key data.",
        "is_active": True,
    },
    # === LEVEL 3: OPERATIONS ===
    {
        "name": "document_analysis",  # SCAN
        "input_modality": "VISION",
        "stages": [{"step": "ocr", "model": "gemini-2.5-flash", "temperature": 0.1}],
        "description": "SCAN - Structured Data Processor. Document OCR and extraction.",
        "is_active": True,
    },
    {
        "name": "form_analysis",  # ALETHEIA SCAN
        "input_modality": "TEXT",
        "stages": [
            {
                "step": "analyze",
                "model": "gemini-2.5-flash",
                "prompt_key": "form_v1",
                "temperature": 0.1,
            }
        ],
        "description": "ALETHEIA SCAN - Form Analysis Module. Intake form processing.",
        "is_active": True,
    },
    {
        "name": "help_bot",  # HELPER
        "input_modality": "TEXT",
        "stages": [
            {
                "step": "analyze",
                "model": "gemini-2.5-flash-lite",
                "prompt_key": "help_v1",
                "temperature": 0.5,
            }
        ],
        "description": "HELPER - Platform Assistant. Operational queries about Kura OS usage.",
        "is_active": True,
    },
]


async def seed_cortex():
    """Seed all Cortex pipelines with UPSERT logic."""

    print("=" * 60)
    print("🧠 CORTEX ACTIVATION PROTOCOL v1.5.5")
    print("=" * 60)
    print()

    session_factory = get_session_factory()
    async with session_factory() as db:
        print("🔌 Connecting to Cortex Neural Matrix...")
        print()

        created = 0
        updated = 0

        for p in PIPELINES:
            # Idempotent: Find by name
            result = await db.execute(
                select(AIPipelineConfig).where(AIPipelineConfig.name == p["name"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"  ⚡ Updating: {p['name']:<20} → {p['description'][:40]}...")
                existing.input_modality = p["input_modality"]
                existing.stages = p["stages"]
                existing.description = p["description"]
                existing.is_active = p["is_active"]
                updated += 1
            else:
                print(f"  🌱 Seeding:  {p['name']:<20} → {p['description'][:40]}...")
                new_config = AIPipelineConfig(
                    name=p["name"],
                    input_modality=p["input_modality"],
                    stages=p["stages"],
                    description=p["description"],
                    is_active=p["is_active"],
                )
                db.add(new_config)
                created += 1

        await db.commit()

        print()
        print("=" * 60)
        print(f"✅ CORTEX ACTIVATION COMPLETE")
        print(f"   🌱 Created: {created} pipelines")
        print(f"   ⚡ Updated: {updated} pipelines")
        print(f"   📊 Total:   {created + updated}/10 nodes active")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed_cortex())
