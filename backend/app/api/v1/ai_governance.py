"""AI Governance Admin API (v1.4.5)

Admin endpoints for:
- Viewing and updating AI task configurations
- Task metrics and change history
- Cache invalidation
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import CurrentSuperuser
from app.db.base import get_async_session
from app.db.models import AiTaskConfig, AiTaskConfigHistory, AiUsageLog, SafetyMode
from app.services.ai_governance import (
    get_all_task_configs,
    get_task_config,
    get_task_config_history,
    update_task_config,
    invalidate_cache,
)


router = APIRouter(prefix="/admin/ai-governance", tags=["admin-ai-governance"])


# =============================================================================
# DTOs
# =============================================================================


class TaskConfigResponse(BaseModel):
    """Response DTO for task config."""

    task_type: str
    model_id: str
    temperature: float
    max_output_tokens: int
    safety_mode: str

    class Config:
        from_attributes = True


class TaskConfigUpdate(BaseModel):
    """Request DTO for updating task config."""

    model_id: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_output_tokens: Optional[int] = Field(None, ge=256, le=8192)
    safety_mode: Optional[str] = None


class TaskMetrics(BaseModel):
    """Metrics for a task over the last 30 days."""

    total_calls: int
    total_tokens_input: int
    total_tokens_output: int
    total_cost_usd: float
    total_cost_credits: float
    avg_latency_ms: Optional[float] = None
    success_rate: float


class TaskDetailResponse(BaseModel):
    """Full detail for a task including config, metrics, and history."""

    config: TaskConfigResponse
    metrics: TaskMetrics
    history: List[dict]


class HistoryEntryResponse(BaseModel):
    """Response DTO for config history entry."""

    field_changed: str
    old_value: Optional[str]
    new_value: Optional[str]
    changed_at: str
    changed_by: Optional[str]


# =============================================================================
# Endpoints
# =============================================================================


@router.get("/tasks", response_model=List[TaskConfigResponse])
async def list_task_configs(
    current_user: CurrentSuperuser,
    db: AsyncSession = Depends(get_async_session),
):
    """List all AI task configurations."""
    configs = await get_all_task_configs(db)

    return [
        TaskConfigResponse(
            task_type=c.task_type,
            model_id=c.model_id,
            temperature=float(c.temperature),
            max_output_tokens=c.max_output_tokens,
            safety_mode=c.safety_mode.value,
        )
        for c in configs
    ]


@router.get("/tasks/{task_type}", response_model=TaskDetailResponse)
async def get_task_detail(
    task_type: str,
    current_user: CurrentSuperuser,
    db: AsyncSession = Depends(get_async_session),
):
    """Get full detail for a task including config, metrics, and history."""
    from datetime import datetime, timedelta

    # Get config
    config_dict = await get_task_config(db, task_type)

    # Get metrics (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    metrics_result = await db.execute(
        select(
            func.count(AiUsageLog.id).label("total_calls"),
            func.sum(AiUsageLog.tokens_input).label("total_tokens_input"),
            func.sum(AiUsageLog.tokens_output).label("total_tokens_output"),
            func.sum(AiUsageLog.cost_provider_usd).label("total_cost_usd"),
            func.sum(AiUsageLog.cost_user_credits).label("total_cost_credits"),
        ).where(
            AiUsageLog.task_type == task_type,
            AiUsageLog.created_at >= thirty_days_ago,
        )
    )
    row = metrics_result.one()

    metrics = TaskMetrics(
        total_calls=row.total_calls or 0,
        total_tokens_input=row.total_tokens_input or 0,
        total_tokens_output=row.total_tokens_output or 0,
        total_cost_usd=float(row.total_cost_usd or 0),
        total_cost_credits=float(row.total_cost_credits or 0),
        success_rate=1.0,  # TODO: Calculate from failure logs
    )

    # Get history
    history = await get_task_config_history(db, task_type, limit=10)
    history_dicts = [
        {
            "field_changed": h.field_changed,
            "old_value": h.old_value,
            "new_value": h.new_value,
            "changed_at": h.changed_at.isoformat(),
            "changed_by": str(h.changed_by_id) if h.changed_by_id else None,
        }
        for h in history
    ]

    # Get actual config from DB
    result = await db.execute(
        select(AiTaskConfig).where(AiTaskConfig.task_type == task_type)
    )
    db_config = result.scalar_one_or_none()

    if db_config:
        config_response = TaskConfigResponse(
            task_type=db_config.task_type,
            model_id=db_config.model_id,
            temperature=float(db_config.temperature),
            max_output_tokens=db_config.max_output_tokens,
            safety_mode=db_config.safety_mode.value,
        )
    else:
        # Fallback config
        config_response = TaskConfigResponse(
            task_type=task_type,
            model_id=config_dict.get("model_id", "gemini-2.5-flash"),
            temperature=config_dict.get("temperature", 0.7),
            max_output_tokens=config_dict.get("max_output_tokens", 2048),
            safety_mode="CLINICAL",
        )

    return TaskDetailResponse(
        config=config_response,
        metrics=metrics,
        history=history_dicts,
    )


@router.patch("/tasks/{task_type}", response_model=TaskConfigResponse)
async def update_task(
    task_type: str,
    update: TaskConfigUpdate,
    current_user: CurrentSuperuser,
    db: AsyncSession = Depends(get_async_session),
):
    """Update AI task configuration."""
    # Parse safety_mode
    safety_mode = None
    if update.safety_mode:
        try:
            safety_mode = SafetyMode(update.safety_mode)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid safety_mode. Must be one of: {[m.value for m in SafetyMode]}",
            )

    config = await update_task_config(
        db=db,
        task_type=task_type,
        user=current_user,
        model_id=update.model_id,
        temperature=update.temperature,
        max_output_tokens=update.max_output_tokens,
        safety_mode=safety_mode,
    )

    return TaskConfigResponse(
        task_type=config.task_type,
        model_id=config.model_id,
        temperature=float(config.temperature),
        max_output_tokens=config.max_output_tokens,
        safety_mode=config.safety_mode.value,
    )


@router.post("/cache/invalidate")
async def invalidate_config_cache(
    task_type: Optional[str] = None,
    current_user: CurrentSuperuser = None,
):
    """Invalidate config cache (optionally for a specific task)."""
    invalidate_cache(task_type)
    return {"status": "ok", "invalidated": task_type or "all"}
