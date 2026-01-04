"""
Seed AI Task Routing Configuration

Populates system_settings with default task→model routing.
Run: python -m app.scripts.seed_routing
"""

import asyncio
import json
from app.db.base import AsyncSessionLocal
from sqlalchemy import select
from app.db.models import SystemSetting


# Default task → model routing
# Each task type gets the optimal model for its use case
DEFAULT_TASK_ROUTING = {
    # Transcription: Whisper is the gold standard for STT
    "transcription": "whisper-1",
    # Clinical Analysis: Balance of quality and cost for therapy notes
    "clinical_analysis": "gemini-2.5-flash",
    # Audio Synthesis: Needs audio input support, fast processing
    "audio_synthesis": "gemini-2.5-flash",
    # Chat Sentiment: High volume, low complexity → cheapest option
    "chat": "gemini-2.5-flash-lite",
    # Triage: Critical safety screening → highest quality
    "triage": "gemini-2.5-pro",
    # Form Analysis: Simple structured data extraction
    "form_analysis": "gemini-2.5-flash-lite",
    # Help Bot: Platform FAQ, simple queries
    "help_bot": "gemini-2.5-flash-lite",
    # Document Analysis: PDFs, images → needs vision
    "document_analysis": "gemini-2.5-flash",
    # Daily Briefing: Text generation for morning summary
    "briefing": "gemini-2.5-flash",
}


async def seed_task_routing():
    """Seed AI_TASK_ROUTING in system_settings."""
    async with AsyncSessionLocal() as db:
        # Check if already exists
        result = await db.execute(
            select(SystemSetting).where(SystemSetting.key == "AI_TASK_ROUTING")
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("✓ AI_TASK_ROUTING already exists, skipping seed")
            print(f"  Current value: {json.dumps(existing.value, indent=2)}")
            return

        # Create new setting
        new_setting = SystemSetting(
            key="AI_TASK_ROUTING",
            value=DEFAULT_TASK_ROUTING,
            description="Maps AI task types to specific models. Each task uses the optimal model for its use case.",
        )
        db.add(new_setting)
        await db.commit()

        print("✅ AI_TASK_ROUTING seeded successfully!")
        print(f"   Tasks configured: {len(DEFAULT_TASK_ROUTING)}")
        for task, model in DEFAULT_TASK_ROUTING.items():
            print(f"   • {task}: {model}")


if __name__ == "__main__":
    asyncio.run(seed_task_routing())
