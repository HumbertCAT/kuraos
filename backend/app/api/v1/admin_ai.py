"""
AI Governance Admin API

Endpoints for managing the Multi-Model Intelligence Engine:
- Ledger stats (costs, revenue, margin)
- Config management (margin, model toggles)
- Usage logs

Requires superuser authentication.
"""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_super_admin, get_db
from app.db.models import AiUsageLog, SystemSetting, User


router = APIRouter(prefix="/admin/ai", tags=["AI Governance"])


# ============================================================================
# SCHEMAS
# ============================================================================


class LedgerStats(BaseModel):
    """30-day AI usage statistics."""

    period_days: int = 30
    total_cost_usd: float = Field(..., description="Provider cost (Google bill)")
    total_revenue_credits: float = Field(..., description="User-facing credits charged")
    net_margin: float = Field(..., description="Revenue - Cost")
    margin_percentage: float = Field(..., description="Margin as percentage")
    total_calls: int = 0
    total_tokens: int = 0
    usage_by_provider: dict = Field(default_factory=dict)
    usage_by_model: dict = Field(default_factory=dict)


class AiConfig(BaseModel):
    """Current AI engine configuration."""

    cost_margin: float = 1.5
    active_models: List[str] = []
    vertex_ai_enabled: bool = True


class AiConfigUpdate(BaseModel):
    """Update AI configuration."""

    cost_margin: Optional[float] = Field(None, ge=1.0, le=5.0)
    vertex_ai_enabled: Optional[bool] = None


class UsageLogEntry(BaseModel):
    """Single usage log entry."""

    id: str
    created_at: datetime
    user_email: Optional[str] = None
    provider: str
    model_id: str
    task_type: str
    tokens_input: int
    tokens_output: int
    cost_provider_usd: float
    cost_user_credits: float

    class Config:
        from_attributes = True


class UsageLogResponse(BaseModel):
    """Paginated usage logs."""

    logs: List[UsageLogEntry]
    total: int
    page: int
    limit: int


class ModelInfo(BaseModel):
    """Model registry entry."""

    id: str
    provider: str
    name: str
    supports_audio: bool
    cost_input: float
    cost_output: float
    is_enabled: bool = True


# ============================================================================
# ENDPOINTS
# ============================================================================


@router.get("/ledger", response_model=LedgerStats)
async def get_ledger_stats(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """
    Get aggregated AI usage statistics for the last N days.

    Returns costs, revenue, margin, and usage breakdown by provider/model.
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # Aggregate totals
    totals_query = select(
        func.sum(AiUsageLog.cost_provider_usd).label("total_cost"),
        func.sum(AiUsageLog.cost_user_credits).label("total_revenue"),
        func.sum(AiUsageLog.tokens_input + AiUsageLog.tokens_output).label(
            "total_tokens"
        ),
        func.count(AiUsageLog.id).label("total_calls"),
    ).where(AiUsageLog.created_at >= start_date)

    result = await db.execute(totals_query)
    totals = result.one()

    total_cost = float(totals.total_cost or 0)
    total_revenue = float(totals.total_revenue or 0)
    net_margin = total_revenue - total_cost
    margin_pct = ((total_revenue / total_cost) - 1) * 100 if total_cost > 0 else 0

    # Breakdown by provider
    provider_query = (
        select(
            AiUsageLog.provider,
            func.count(AiUsageLog.id).label("calls"),
            func.sum(AiUsageLog.cost_provider_usd).label("cost"),
        )
        .where(AiUsageLog.created_at >= start_date)
        .group_by(AiUsageLog.provider)
    )

    provider_result = await db.execute(provider_query)
    usage_by_provider = {
        row.provider: {"calls": row.calls, "cost": float(row.cost or 0)}
        for row in provider_result.all()
    }

    # Breakdown by model
    model_query = (
        select(
            AiUsageLog.model_id,
            func.count(AiUsageLog.id).label("calls"),
            func.sum(AiUsageLog.tokens_input + AiUsageLog.tokens_output).label(
                "tokens"
            ),
        )
        .where(AiUsageLog.created_at >= start_date)
        .group_by(AiUsageLog.model_id)
    )

    model_result = await db.execute(model_query)
    usage_by_model = {
        row.model_id: {"calls": row.calls, "tokens": int(row.tokens or 0)}
        for row in model_result.all()
    }

    return LedgerStats(
        period_days=days,
        total_cost_usd=total_cost,
        total_revenue_credits=total_revenue,
        net_margin=net_margin,
        margin_percentage=round(margin_pct, 1),
        total_calls=int(totals.total_calls or 0),
        total_tokens=int(totals.total_tokens or 0),
        usage_by_provider=usage_by_provider,
        usage_by_model=usage_by_model,
    )


@router.get("/config", response_model=AiConfig)
async def get_ai_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Get current AI engine configuration."""
    # Try to load from SystemSettings
    setting = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "ai_config")
    )
    config_row = setting.scalar_one_or_none()

    if config_row and config_row.value:
        return AiConfig(
            cost_margin=config_row.value.get("cost_margin", 1.5),
            active_models=config_row.value.get(
                "active_models",
                [
                    "gemini-2.5-flash",
                    "gemini-2.5-pro",
                    "gemini-2.5-flash-lite",
                    "gemini-3-pro",
                    "gemini-2.0-flash",
                ],
            ),
            vertex_ai_enabled=config_row.value.get("vertex_ai_enabled", True),
        )

    # Default config
    return AiConfig(
        cost_margin=1.5,
        active_models=[
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.5-flash-lite",
            "gemini-3-pro",
            "gemini-2.0-flash",
        ],
        vertex_ai_enabled=True,
    )


@router.patch("/config", response_model=AiConfig)
async def update_ai_config(
    update: AiConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Update AI engine configuration."""
    # Load or create config
    setting = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "ai_config")
    )
    config_row = setting.scalar_one_or_none()

    if config_row:
        current_config = config_row.value or {}
    else:
        current_config = {
            "cost_margin": 1.5,
            "active_models": [
                "gemini-2.5-flash",
                "gemini-2.5-pro",
                "gemini-2.5-flash-lite",
                "gemini-3-pro",
                "gemini-2.0-flash",
            ],
            "vertex_ai_enabled": True,
        }

    # Apply updates
    if update.cost_margin is not None:
        current_config["cost_margin"] = update.cost_margin
    if update.vertex_ai_enabled is not None:
        current_config["vertex_ai_enabled"] = update.vertex_ai_enabled

    # Upsert
    if config_row:
        config_row.value = current_config
    else:
        new_setting = SystemSetting(
            key="ai_config",
            value=current_config,
            description="AI Engine configuration (margin, models, flags)",
        )
        db.add(new_setting)

    await db.commit()

    return AiConfig(
        cost_margin=current_config.get("cost_margin", 1.5),
        active_models=current_config.get("active_models", []),
        vertex_ai_enabled=current_config.get("vertex_ai_enabled", True),
    )


@router.get("/logs", response_model=UsageLogResponse)
async def get_usage_logs(
    page: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Get paginated AI usage logs."""
    offset = (page - 1) * limit

    # Count total
    count_query = select(func.count(AiUsageLog.id))
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Fetch logs with user info
    logs_query = (
        select(AiUsageLog, User.email)
        .outerjoin(User, AiUsageLog.user_id == User.id)
        .order_by(AiUsageLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(logs_query)
    rows = result.all()

    logs = [
        UsageLogEntry(
            id=str(log.id),
            created_at=log.created_at,
            user_email=email,
            provider=log.provider,
            model_id=log.model_id,
            task_type=log.task_type,
            tokens_input=log.tokens_input,
            tokens_output=log.tokens_output,
            cost_provider_usd=float(log.cost_provider_usd or 0),
            cost_user_credits=float(log.cost_user_credits or 0),
        )
        for log, email in rows
    ]

    return UsageLogResponse(
        logs=logs,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/models", response_model=List[ModelInfo])
async def get_available_models(
    current_user: User = Depends(require_super_admin),
):
    """Get list of available AI models with capabilities and pricing."""
    from app.services.ai.factory import ProviderFactory

    models = ProviderFactory.list_available_models()

    return [
        ModelInfo(
            id=m["id"],
            provider=m["provider"],
            name=m["id"].replace("-", " ").title(),
            supports_audio=m["supports_audio"],
            cost_input=m["cost"]["input"],
            cost_output=m["cost"]["output"],
            is_enabled=True,  # TODO: Load from config
        )
        for m in models
    ]
