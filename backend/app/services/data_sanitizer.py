"""Data Sanitizer Service - The Scrubber.

Sanitizes clinical content by removing PII and stores anonymized data
in the 'anonymous_datasets' vault for GDPR-compliant IP preservation.
"""

import re
import uuid
import logging
from typing import Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AnonymousDataset, DatasetType

logger = logging.getLogger(__name__)

# ============ PII Patterns (MVP - Regex Based) ============

# Email pattern
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")

# Phone patterns (international, Spanish, with/without spaces)
PHONE_PATTERN = re.compile(
    r"\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}"
)

# Common Spanish names (top 100 + variations)
# Note: This is intentionally limited for MVP - use Google DLP for production
COMMON_NAMES = {
    "maría",
    "carmen",
    "ana",
    "isabel",
    "laura",
    "cristina",
    "marta",
    "elena",
    "lucía",
    "paula",
    "sara",
    "andrea",
    "alba",
    "rocío",
    "julia",
    "silvia",
    "josé",
    "antonio",
    "manuel",
    "francisco",
    "david",
    "juan",
    "javier",
    "daniel",
    "carlos",
    "miguel",
    "rafael",
    "pedro",
    "pablo",
    "jorge",
    "luis",
    "alberto",
    "fernando",
    "sergio",
    "roberto",
    "alejandro",
    "diego",
    "dr",
    "dra",
    "doctor",
    "doctora",
    "sr",
    "sra",
    "señor",
    "señora",
}


def _scrub_pii_basic(content: str) -> str:
    """
    Basic PII removal using regex patterns.

    MVP implementation - removes:
    - Email addresses
    - Phone numbers
    - Common Spanish first names (capitalized)

    TODO: Implement Google DLP or spaCy NER for advanced sanitization
    """
    if not content:
        return ""

    result = content

    # 1. Remove emails
    result = EMAIL_PATTERN.sub("[EMAIL_REDACTED]", result)

    # 2. Remove phone numbers
    result = PHONE_PATTERN.sub("[PHONE_REDACTED]", result)

    # 3. Remove common names (case-insensitive word boundaries)
    for name in COMMON_NAMES:
        pattern = re.compile(rf"\b{name}\b", re.IGNORECASE)
        result = pattern.sub("[NAME_REDACTED]", result)

    return result


async def sanitize_and_store(
    db: AsyncSession,
    content: str,
    metadata: dict,
    source_type: str,
    language: str = "es",
) -> Optional[uuid.UUID]:
    """
    Sanitize clinical content and store in anonymous vault.

    This function is designed to be called via FastAPI BackgroundTasks
    to ensure completion even after HTTP response is sent.

    Args:
        db: Database session
        content: Raw clinical content (notes, transcripts, etc.)
        metadata: Analysis metadata (sentiment, themes, risk_level) - NO PII
        source_type: One of 'CLINICAL_NOTE', 'TRANSCRIPT', 'CHAT_ANALYSIS'
        language: Content language code

    Returns:
        UUID of created anonymous dataset, or None on error
    """
    try:
        # 1. Sanitize content
        sanitized = _scrub_pii_basic(content)

        # 2. Sanitize metadata (ensure no PII leaked through)
        safe_metadata = {
            k: v
            for k, v in (metadata or {}).items()
            if k
            in ("sentiment", "themes", "keywords", "risk_level", "engagement_score")
        }

        # 3. Map source type to enum
        type_map = {
            "CLINICAL_NOTE": DatasetType.CLINICAL_NOTE,
            "TRANSCRIPT": DatasetType.TRANSCRIPT,
            "CHAT_ANALYSIS": DatasetType.CHAT_ANALYSIS,
        }
        dataset_type = type_map.get(source_type, DatasetType.CLINICAL_NOTE)

        # 4. Store in orphan table (no FK references)
        dataset = AnonymousDataset(
            source_type=dataset_type,
            content=sanitized,
            meta_analysis=safe_metadata,
            language=language,
        )

        db.add(dataset)
        await db.commit()

        logger.info(f"✅ Anonymized dataset created: {dataset.id}")
        return dataset.id

    except Exception as e:
        logger.error(f"❌ Data sanitization failed: {e}")
        return None


async def sanitize_and_store_background(
    content: str, metadata: dict, source_type: str, language: str = "es"
) -> None:
    """
    Background-safe wrapper for sanitize_and_store.

    Called via FastAPI BackgroundTasks to ensure execution completes
    even after HTTP response is sent. Creates its own DB session.
    """
    from app.db.base import AsyncSessionLocal

    try:
        async with AsyncSessionLocal() as db:
            await sanitize_and_store(
                db=db,
                content=content,
                metadata=metadata,
                source_type=source_type,
                language=language,
            )
    except Exception as e:
        logger.error(f"❌ Background sanitization failed: {e}")
