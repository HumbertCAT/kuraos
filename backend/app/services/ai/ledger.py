"""
AI Cost Ledger

FinOps tracking for AI usage with real token accounting.
Calculates provider costs and applies configurable margins.
"""

from decimal import Decimal
from typing import Optional
from datetime import datetime
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai.base import AIResponse
from app.core.config import settings


class CostLedger:
    """
    Track AI usage costs with real token-based accounting.

    Features:
        - Real-time cost calculation from token counts
        - Configurable margin for user billing
        - Per-organization usage tracking
        - Task-type categorization for analytics
    """

    # Pricing per 1M tokens (USD) - December 2025
    # Source: https://cloud.google.com/vertex-ai/generative-ai/pricing
    # Note: These are TEXT prices. Audio input is typically higher.
    PRICING = {
        # Gemini 3.x models (Latest - December 2025)
        "gemini-3-pro": {"input": Decimal("2.00"), "output": Decimal("12.00")},
        # Gemini 2.5 models
        "gemini-2.5-pro": {"input": Decimal("1.25"), "output": Decimal("10.00")},
        "gemini-2.5-flash": {"input": Decimal("0.15"), "output": Decimal("0.60")},
        "gemini-2.5-flash-lite": {"input": Decimal("0.10"), "output": Decimal("0.40")},
        # Gemini 2.0 models (Legacy)
        "gemini-2.0-flash": {"input": Decimal("0.10"), "output": Decimal("0.40")},
        "gemini-2.0-flash-lite": {"input": Decimal("0.075"), "output": Decimal("0.30")},
        # Vertex AI Speech (Chirp) - per 15 seconds of audio
        "chirp-2": {"input": Decimal("0.016"), "output": Decimal("0")},
        # Phase 3: Claude models (Vertex AI)
        "claude-3-5-sonnet-v2": {"input": Decimal("3.00"), "output": Decimal("15.00")},
        "claude-3-5-haiku": {"input": Decimal("0.25"), "output": Decimal("1.25")},
        # Phase 3: Llama models (Vertex AI pricing)
        "llama-3.2-90b-vision": {"input": Decimal("0.88"), "output": Decimal("0.88")},
        # Phase 3: Mistral models
        "mistral-large": {"input": Decimal("2.00"), "output": Decimal("6.00")},
    }

    # Default pricing for unknown models
    DEFAULT_PRICING = {"input": Decimal("0.10"), "output": Decimal("0.40")}

    @classmethod
    def get_default_margin(cls) -> Decimal:
        """Get margin from settings or default to 1.5x (50% margin)."""
        return Decimal(str(getattr(settings, "AI_COST_MARGIN", 1.5)))

    @classmethod
    def calculate_cost(
        cls,
        response: AIResponse,
        margin: Optional[Decimal] = None,
    ) -> dict:
        """
        Calculate costs for an AI response.

        Args:
            response: AIResponse with token counts
            margin: Multiplier for user billing (e.g., 1.5 = 50% margin)

        Returns:
            dict with:
                - cost_provider_usd: Raw cost from provider
                - cost_user_credits: Cost with margin applied
                - tokens_input: Input token count
                - tokens_output: Output token count
        """
        margin = margin or cls.get_default_margin()
        pricing = cls.PRICING.get(response.model_id, cls.DEFAULT_PRICING)

        # Calculate provider cost (per 1M tokens)
        cost_input = (Decimal(response.tokens_input) / Decimal("1000000")) * pricing[
            "input"
        ]

        cost_output = (Decimal(response.tokens_output) / Decimal("1000000")) * pricing[
            "output"
        ]

        cost_provider = cost_input + cost_output

        # Apply margin for user billing
        cost_user = cost_provider * margin

        return {
            "cost_provider_usd": cost_provider,
            "cost_user_credits": cost_user,
            "tokens_input": response.tokens_input,
            "tokens_output": response.tokens_output,
        }

    @classmethod
    async def log_usage(
        cls,
        db: AsyncSession,
        response: AIResponse,
        organization_id: str,
        task_type: str,
        user_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        clinical_entry_id: Optional[str] = None,
        margin: Optional[Decimal] = None,
    ):
        """
        Log AI usage to database and calculate costs.

        Args:
            db: Database session
            response: AIResponse with analysis result
            organization_id: Organization UUID
            task_type: 'transcription', 'clinical_analysis', 'chat', etc.
            user_id: Optional user UUID
            patient_id: Optional patient UUID
            clinical_entry_id: Optional related entry UUID
            margin: Optional custom margin (defaults to settings)

        Returns:
            AIUsageLog instance
        """
        from app.db.models import AIUsageLog

        costs = cls.calculate_cost(response, margin)

        log = AIUsageLog(
            id=uuid.uuid4(),
            created_at=datetime.utcnow(),
            organization_id=organization_id,
            user_id=user_id,
            patient_id=patient_id,
            clinical_entry_id=clinical_entry_id,
            provider=response.provider_id,
            model_id=response.model_id,
            task_type=task_type,
            tokens_input=costs["tokens_input"],
            tokens_output=costs["tokens_output"],
            cost_provider_usd=costs["cost_provider_usd"],
            cost_user_credits=costs["cost_user_credits"],
        )

        db.add(log)
        await db.flush()

        return log

    @classmethod
    async def get_organization_usage(
        cls,
        db: AsyncSession,
        organization_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        """
        Get aggregated usage statistics for an organization.

        Returns:
            dict with total_cost, total_tokens, by_model breakdown
        """
        from sqlalchemy import select, func
        from app.db.models import AIUsageLog

        query = select(
            func.sum(AIUsageLog.cost_user_credits).label("total_cost"),
            func.sum(AIUsageLog.tokens_input + AIUsageLog.tokens_output).label(
                "total_tokens"
            ),
            func.count(AIUsageLog.id).label("total_calls"),
        ).where(AIUsageLog.organization_id == organization_id)

        if start_date:
            query = query.where(AIUsageLog.created_at >= start_date)
        if end_date:
            query = query.where(AIUsageLog.created_at <= end_date)

        result = await db.execute(query)
        row = result.one_or_none()

        return {
            "total_cost": float(row.total_cost or 0),
            "total_tokens": int(row.total_tokens or 0),
            "total_calls": int(row.total_calls or 0),
        }
