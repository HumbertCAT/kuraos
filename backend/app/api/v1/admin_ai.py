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
    """30-day AI usage and financial statistics."""

    period_days: int = 30
    # Costs
    total_cost_usd: float = Field(..., description="Provider cost (Google bill)")
    # Revenue (SaaS model)
    subscription_revenue: float = Field(
        0, description="Est. revenue from subscriptions"
    )
    commission_revenue: float = Field(
        0, description="Est. revenue from booking commissions"
    )
    total_revenue_usd: float = Field(0, description="Total estimated revenue")
    # Profit
    gross_profit: float = Field(0, description="Revenue - Cost = Gross Profit")
    margin_percentage: float = Field(0, description="Gross margin as percentage")
    # Usage metrics
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
    Get aggregated AI/financial statistics for the last N days.

    Returns:
    - AI costs (provider bill)
    - Revenue from subscriptions + commissions
    - Gross profit (revenue - cost)
    """
    from app.db.models import Organization, OrgTier, Booking

    start_date = datetime.utcnow() - timedelta(days=days)

    # ========================================
    # 1. AI COSTS (Provider bill)
    # ========================================
    cost_query = select(
        func.sum(AiUsageLog.cost_provider_usd).label("total_cost"),
        func.sum(AiUsageLog.tokens_input + AiUsageLog.tokens_output).label(
            "total_tokens"
        ),
        func.count(AiUsageLog.id).label("total_calls"),
    ).where(AiUsageLog.created_at >= start_date)

    cost_result = await db.execute(cost_query)
    cost_row = cost_result.one()
    total_cost = float(cost_row.total_cost or 0)
    total_tokens = int(cost_row.total_tokens or 0)
    total_calls = int(cost_row.total_calls or 0)

    # ========================================
    # 2. SUBSCRIPTION REVENUE (monthly estimate)
    # ========================================
    # Prices: PRO = $49/mo, CENTER = $149/mo
    pro_count_result = await db.execute(
        select(func.count()).where(Organization.tier == OrgTier.PRO)
    )
    pro_count = pro_count_result.scalar() or 0

    center_count_result = await db.execute(
        select(func.count()).where(Organization.tier == OrgTier.CENTER)
    )
    center_count = center_count_result.scalar() or 0

    subscription_revenue = (pro_count * 49.0) + (center_count * 149.0)

    # ========================================
    # 3. COMMISSION REVENUE (from bookings)
    # ========================================
    # Sum platform_fee from bookings in the period
    try:
        commission_query = select(func.sum(Booking.platform_fee)).where(
            Booking.created_at >= start_date,
            Booking.status.in_(["PAID", "CONFIRMED", "COMPLETED"]),
        )
        commission_result = await db.execute(commission_query)
        commission_revenue = float(commission_result.scalar() or 0)
    except Exception:
        # Booking.platform_fee might not exist yet
        commission_revenue = 0.0

    # ========================================
    # 4. CALCULATE TOTALS
    # ========================================
    total_revenue = subscription_revenue + commission_revenue
    gross_profit = total_revenue - total_cost
    margin_pct = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0

    # ========================================
    # 5. BREAKDOWN BY PROVIDER/MODEL
    # ========================================
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
        total_cost_usd=round(total_cost, 2),
        subscription_revenue=round(subscription_revenue, 2),
        commission_revenue=round(commission_revenue, 2),
        total_revenue_usd=round(total_revenue, 2),
        gross_profit=round(gross_profit, 2),
        margin_percentage=round(margin_pct, 1),
        total_calls=total_calls,
        total_tokens=total_tokens,
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
    """Get list of available AI models with capabilities and pricing (EU region)."""
    from app.services.ai.model_registry import ModelRegistry

    models = ModelRegistry.get_all_models()

    return [
        ModelInfo(
            id=m.id,
            provider=m.provider,
            name=m.name,
            supports_audio=m.capabilities.supports_audio,
            cost_input=m.cost_input,
            cost_output=m.cost_output,
            is_enabled=True,
        )
        for m in models
    ]


# ============================================================================
# TASK ROUTING ENDPOINTS
# ============================================================================


class TaskRoutingConfig(BaseModel):
    """Current task→model routing configuration."""

    routing: dict  # task_type -> model_id
    available_tasks: List[str]
    region: str = "europe-west1"


class TaskRoutingUpdate(BaseModel):
    """Update task routing."""

    routing: dict  # Partial or full routing map


@router.get("/routing", response_model=TaskRoutingConfig)
async def get_task_routing(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Get current AI task→model routing configuration."""
    from app.services.ai.factory import ProviderFactory

    routing = await ProviderFactory.get_routing_config(db)

    # All known task types
    available_tasks = [
        "transcription",
        "clinical_analysis",
        "audio_synthesis",
        "chat",
        "triage",
        "form_analysis",
        "help_bot",
        "document_analysis",
        "briefing",
    ]

    return TaskRoutingConfig(
        routing=routing,
        available_tasks=available_tasks,
        region="europe-west1",
    )


@router.patch("/routing", response_model=TaskRoutingConfig)
async def update_task_routing(
    update: TaskRoutingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    """Update AI task→model routing configuration."""
    from app.services.ai.model_registry import ModelRegistry

    # Validate models exist
    valid_model_ids = {m.id for m in ModelRegistry.get_all_models()}

    for task_type, model_id in update.routing.items():
        if model_id not in valid_model_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown model: {model_id}. Valid models: {sorted(valid_model_ids)}",
            )

    # Load or create config
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "AI_TASK_ROUTING")
    )
    setting = result.scalar_one_or_none()

    if setting:
        # Merge updates
        current_routing = setting.value or {}
        current_routing.update(update.routing)
        setting.value = current_routing
    else:
        # Create new
        new_setting = SystemSetting(
            key="AI_TASK_ROUTING",
            value=update.routing,
            description="Maps AI task types to specific models",
        )
        db.add(new_setting)

    await db.commit()

    # Return updated config
    return await get_task_routing(db, current_user)
