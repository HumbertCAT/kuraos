"""
Finance & Cost Reconciliation API

Admin-only endpoints for financial auditing.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone

from app.db.session import get_db
from app.api.v1.auth import require_superuser
from app.db.models import User
from app.services.finance.auditor import GlobalCostReconciler


router = APIRouter()


@router.get("/reconciliation/global")
async def get_global_reconciliation(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser),
):
    """
    Global Cost Reconciliation Report.

    Compares total internal AI costs (AiUsageLog) with Google Cloud Billing.
    Detects catastrophic cost bugs at project level.

    Args:
        days: Number of days to analyze (default: 7)

    Returns:
        {
            "period": {"start": "...", "end": "...", "days": 7},
            "costs": {
                "internal_total_usd": 150.00,
                "gcp_total_usd": 152.30,
                "drift_usd": 2.30,
                "drift_pct": 1.53
            },
            "status": "healthy",
            "interpretation": "..."
        }

    Requires: Superuser access
    """
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)

    try:
        reconciler = GlobalCostReconciler(db)
        report = await reconciler.get_health_report(start_date, end_date)
    except ValueError as e:
        raise HTTPException(
            status_code=500, detail=f"Reconciliation service not configured: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch GCP billing data: {str(e)}"
        )

    # Interpretation messages
    interpretations = {
        "healthy": "Cost tracking is accurate. Internal ledger matches Google billing.",
        "warning": "Minor drift detected. Review CostLedger pricing or check for rounding issues.",
        "critical": "MAJOR DRIFT DETECTED. Possible bug in cost calculation or runaway AI usage.",
    }

    return {
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "days": days,
        },
        "costs": {
            "internal_total_usd": report["internal_total_usd"],
            "gcp_total_usd": report["gcp_total_usd"],
            "drift_usd": report["drift_usd"],
            "drift_pct": report["drift_pct"],
        },
        "status": report["status"],
        "thresholds": {
            "warning": f"{report['threshold_warning']}%",
            "critical": f"{report['threshold_critical']}%",
        },
        "interpretation": interpretations[report["status"]],
    }
