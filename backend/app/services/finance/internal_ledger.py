"""
Internal Ledger Service

Provides financial reporting using ONLY internal AiUsageLog data.
NO external dependencies. Safe for deployment.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from app.db.models import AiUsageLog


class InternalLedger:
    """
    Financial reporting from internal cost tracking.

    Calculates gross margin by comparing:
    - cost_provider_usd (what we pay Google)
    - cost_user_credits (what we charge customers)

    NO external API calls. NO BigQuery. Pure SQL.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_financial_report(self, days: int = 30) -> Dict[str, Any]:
        """
        Generate financial report for last N days.

        Args:
            days: Number of days to analyze (default: 30)

        Returns:
            {
                "period_days": 30,
                "total_requests": 1500,
                "cogs_usd": 50.25,          # Cost of Goods Sold
                "revenue_usd": 75.38,       # Revenue charged to users
                "gross_margin_usd": 25.13,  # Profit
                "gross_margin_pct": 33.35   # Margin %
            }
        """
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        # Aggregate from AiUsageLog
        query = select(
            func.sum(AiUsageLog.cost_provider_usd).label("total_cost_usd"),
            func.sum(AiUsageLog.cost_user_credits).label("total_revenue_usd"),
            func.count().label("total_requests"),
        ).where(AiUsageLog.created_at >= start_date)

        result = await self.db.execute(query)
        row = result.one()

        # Calculate margins
        cost = float(row.total_cost_usd or 0)
        revenue = float(row.total_revenue_usd or 0)
        margin = revenue - cost
        margin_pct = (margin / revenue * 100) if revenue > 0 else 0

        return {
            "period_days": days,
            "period_start": start_date.isoformat(),
            "period_end": datetime.now(timezone.utc).isoformat(),
            "total_requests": row.total_requests,
            "cogs_usd": round(cost, 4),
            "revenue_usd": round(revenue, 4),
            "gross_margin_usd": round(margin, 4),
            "gross_margin_pct": round(margin_pct, 2),
            "status": self._get_health_status(margin_pct),
        }

    def _get_health_status(self, margin_pct: float) -> str:
        """Determine financial health based on margin."""
        if margin_pct >= 40:
            return "healthy"
        elif margin_pct >= 20:
            return "acceptable"
        elif margin_pct >= 0:
            return "low_margin"
        else:
            return "unprofitable"
