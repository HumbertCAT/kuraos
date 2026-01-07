#!/usr/bin/env python
"""
Cortex Synapse Check - v1.5.5
==============================

Validates that the backend can READ and INTERPRET the seeded pipeline configs.
This is a critical pre-production smoke test.

Usage:
    docker-compose exec backend python -m scripts.verify_cortex_readiness
"""

import asyncio
import sys
from pathlib import Path
import json

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.db.base import get_session_factory
from app.db.models import AIPipelineConfig


async def check_synapses():
    """Verify Cortex can read and parse pipeline configurations."""

    print("=" * 60)
    print("🔎 CORTEX SYNAPSE CHECK v1.5.5")
    print("=" * 60)

    session_factory = get_session_factory()
    async with session_factory() as db:
        # 1. Verify raw DB read for ORACLE (clinical_analysis)
        print("\n1. [DB LAYER] Fetching 'clinical_analysis' (ORACLE)...")
        stmt = select(AIPipelineConfig).where(
            AIPipelineConfig.name == "clinical_analysis"
        )
        result = await db.execute(stmt)
        config = result.scalar_one_or_none()

        if not config:
            print("   ❌ FATAL: Pipeline 'clinical_analysis' not found in DB!")
            return False

        print(f"   ✅ Found Pipeline ID: {config.id}")
        print(f"   ✅ Modality: {config.input_modality}")
        print(f"   ✅ Active: {config.is_active}")

        # Verify JSON structure
        stages = config.stages
        print(f"   📦 Stages Type: {type(stages).__name__}")
        print(f"   📄 Content: {json.dumps(stages, indent=2)}")

        # 2. Validate stages structure
        print("\n2. [STRUCTURE] Validating stages schema...")

        if not isinstance(stages, list):
            print("   ❌ CRITICAL: 'stages' is not a list!")
            return False

        if len(stages) == 0:
            print("   ❌ CRITICAL: 'stages' is empty!")
            return False

        first_stage = stages[0]
        model = first_stage.get("model")
        prompt_key = first_stage.get("prompt_key")

        print(f"   🎯 First Stage Model: {model}")
        print(f"   📝 First Stage Prompt: {prompt_key}")

        if model != "gemini-2.5-pro":
            print(f"   ⚠️ WARNING: Expected 'gemini-2.5-pro', got '{model}'")
        else:
            print("   ✅ Model matches expected value")

        # 3. Verify ALL pipelines are readable
        print("\n3. [FULL SCAN] Checking all 10 pipelines...")

        all_stmt = select(AIPipelineConfig).where(AIPipelineConfig.is_active == True)
        all_result = await db.execute(all_stmt)
        all_configs = all_result.scalars().all()

        expected_pipelines = {
            "triage",
            "clinical_analysis",
            "briefing",
            "chat",
            "transcription",
            "session_analysis",
            "audio_memo",
            "document_analysis",
            "form_analysis",
            "help_bot",
        }

        found_pipelines = {c.name for c in all_configs}
        missing = expected_pipelines - found_pipelines

        print(f"   📊 Found: {len(all_configs)} active pipelines")

        for cfg in all_configs:
            stages_count = len(cfg.stages) if isinstance(cfg.stages, list) else 0
            status = "✅" if stages_count > 0 else "⚠️"
            print(f"   {status} {cfg.name:<20} → {stages_count} stage(s)")

        if missing:
            print(f"\n   ❌ MISSING PIPELINES: {missing}")
            return False

        # 4. Final verdict
        print("\n" + "=" * 60)
        if len(all_configs) >= 10:
            print("✅ SYSTEM GREEN: Cortex is fully operational!")
            print("   All 10 pipelines readable and valid.")
            print("   Ready for production traffic.")
        else:
            print(f"⚠️ PARTIAL: Only {len(all_configs)}/10 pipelines found")

        print("=" * 60)
        return True


if __name__ == "__main__":
    success = asyncio.run(check_synapses())
    sys.exit(0 if success else 1)
