"""
Global Cost Reconciliation Service

Compares total internal costs (AiUsageLog) vs. Google Cloud Billing (BigQuery).
Detects catastrophic cost bugs at project level.

CRITICAL: Uses Lazy Loading pattern - NO imports at module level.
BigQuery is imported INSIDE methods to prevent boot crashes if library missing.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any

from app.db.models import AiUsageLog
from app.core.config import settings


class GlobalCostReconciler:
    """
    Compares total AI costs: Internal Ledger vs GCP Billing.

    Purpose: Detect major cost bugs (e.g., infinite loops, pricing errors).
    Scope: Project-level (not per-organization).

    SAFETY: Uses lazy loading - app will boot even if BigQuery unavailable.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.table_id = getattr(settings, "BILLING_TABLE_ID", None)

    async def get_internal_total_cost(
        self, start_date: datetime, end_date: datetime
    ) -> Decimal:
        """
        Sum all AI costs from internal ledger.

        Returns: Total cost_provider_usd (what we paid to Google)
        """
        result = await self.db.execute(
            select(func.sum(AiUsageLog.cost_provider_usd)).where(
                AiUsageLog.created_at.between(start_date, end_date)
            )
        )
        total = result.scalar()
        return Decimal(str(total)) if total else Decimal(0)

    def get_gcp_total_cost(self, start_date: datetime, end_date: datetime) -> Decimal:
        """
        Sum all AI costs from GCP Billing Export (BigQuery).

        LAZY IMPORT: Only loads BigQuery when method is called.

        Raises:
            RuntimeError: If BigQuery not available
            ValueError: If BILLING_TABLE_ID not configured
        """
        # LAZY IMPORT - happens at runtime, not boot time
        try:
            from google.cloud import bigquery
        except ImportError as e:
            raise RuntimeError(
                f"BigQuery library not available: {e}. Install google-cloud-bigquery."
            )

        if not self.table_id:
            raise ValueError("BILLING_TABLE_ID not configured in .env")

        query = f"""
        SELECT SUM(cost) as total_cost
        FROM `{self.table_id}`
        WHERE usage_start_time BETWEEN @start AND @end
        AND (
            service.description LIKE '%Vertex%'
            OR service.description LIKE '%Generative%'
            OR service.description LIKE '%AI Platform%'
        )
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("start", "TIMESTAMP", start_date),
                bigquery.ScalarQueryParameter("end", "TIMESTAMP", end_date),
            ]
        )

        # Create client at runtime
        client = bigquery.Client()
        result = client.query(query, job_config=job_config).result()
        row = next(iter(result), None)

        if row and row.total_cost is not None:
            return Decimal(str(row.total_cost))
        return Decimal(0)

    async def get_health_report(
        self, start_date: datetime, end_date: datetime
    ) -> Dict[str, Any]:
        """
        Generate global cost health report.

        Returns:
            {
                "internal_total_usd": 150.00,
                "gcp_total_usd": 152.30,
                "drift_usd": 2.30,
                "drift_pct": 1.53,
                "status": "healthy" | "warning" | "critical"
            }
        """
        internal = await self.get_internal_total_cost(start_date, end_date)

        # This may raise RuntimeError if BigQuery not available
        try:
            gcp = self.get_gcp_total_cost(start_date, end_date)
        except RuntimeError as e:
            # Return error status if BigQuery unavailable
            return {
                "internal_total_usd": float(internal),
                "gcp_total_usd": 0.0,
                "drift_usd": 0.0,
                "drift_pct": 0.0,
                "status": "error",
                "error": str(e),
            }

        drift_usd = float(internal - gcp)

        if gcp > 0:
            drift_pct = float((internal - gcp) / gcp * 100)
        else:
            drift_pct = 0.0

        # Health status thresholds
        abs_drift = abs(drift_pct)
        if abs_drift < 2:
            status = "healthy"
        elif abs_drift < 10:
            status = "warning"
        else:
            status = "critical"

        return {
            "internal_total_usd": float(internal),
            "gcp_total_usd": float(gcp),
            "drift_usd": drift_usd,
            "drift_pct": drift_pct,
            "status": status,
            "threshold_warning": 2.0,
            "threshold_critical": 10.0,
        }
