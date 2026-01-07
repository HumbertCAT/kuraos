"""API endpoints for Automation Playbook Marketplace.

Provides:
- GET /rules - List org's active automation rules
- GET /marketplace - List system playbook templates
- POST /rules/install/{template_id} - Clone template to org
- PATCH /rules/{id} - Toggle rule ON/OFF
- DELETE /rules/{id} - Remove rule from org
- GET /rules/{id}/logs - Execution logs
- GET /rules/{id}/stats - Execution statistics
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.db.models import AutomationRule, AutomationExecutionLog, Patient, User

router = APIRouter(prefix="/automations", tags=["Automations"])


# ============ Schemas ============


class AutomationRuleResponse(BaseModel):
    """Response schema for automation rules."""

    id: UUID
    name: str
    description: str
    icon: str
    trigger_event: str
    conditions: dict = {}  # Conditions for rule matching
    actions: list = []  # Actions to execute
    is_active: bool
    is_system_template: bool
    priority: int
    cloned_from_id: Optional[UUID] = None
    agent_config: Optional[dict] = None

    class Config:
        from_attributes = True


class RuleToggleRequest(BaseModel):
    """Request to toggle rule ON/OFF or update agent config."""

    is_active: Optional[bool] = None
    agent_config: Optional[dict] = None


class MarketplaceResponse(BaseModel):
    """Response for marketplace listing."""

    templates: list[AutomationRuleResponse]


class MyRulesResponse(BaseModel):
    """Response for org's rules listing."""

    rules: list[AutomationRuleResponse]


# ============ Endpoints ============


@router.get("/rules", response_model=MyRulesResponse)
async def list_my_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List automation rules for current organization."""
    result = await db.execute(
        select(AutomationRule)
        .where(
            AutomationRule.organization_id == current_user.organization_id,
            AutomationRule.is_system_template == False,
        )
        .order_by(AutomationRule.priority, AutomationRule.name)
    )
    rules = result.scalars().all()
    return {"rules": rules}


@router.get("/rules/{rule_id}", response_model=AutomationRuleResponse)
async def get_rule(
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single automation rule by ID."""
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.organization_id == current_user.organization_id,
        )
    )
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found"
        )

    return rule


@router.get("/marketplace", response_model=MarketplaceResponse)
async def list_marketplace_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List available system playbook templates."""
    result = await db.execute(
        select(AutomationRule)
        .where(AutomationRule.is_system_template == True)
        .order_by(AutomationRule.priority, AutomationRule.name)
    )
    templates = result.scalars().all()
    return {"templates": templates}


@router.post("/rules/install/{template_id}", response_model=AutomationRuleResponse)
async def install_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clone a system template to the organization's active rules."""
    # Get template
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == template_id,
            AutomationRule.is_system_template == True,
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )

    # Check if already installed
    existing = await db.execute(
        select(AutomationRule).where(
            AutomationRule.organization_id == current_user.organization_id,
            AutomationRule.cloned_from_id == template_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Template already installed"
        )

    # Clone template
    new_rule = AutomationRule(
        organization_id=current_user.organization_id,
        name=template.name,
        description=template.description,
        icon=template.icon,
        trigger_event=template.trigger_event,
        conditions=template.conditions,
        actions=template.actions,
        is_active=True,  # Active by default when installed
        is_system_template=False,
        priority=template.priority,
        cloned_from_id=template.id,
    )
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)

    return new_rule


@router.patch("/rules/{rule_id}", response_model=AutomationRuleResponse)
async def update_rule(
    rule_id: UUID,
    request: RuleToggleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a rule (toggle ON/OFF or update agent config)."""
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.organization_id == current_user.organization_id,
        )
    )
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found"
        )

    # Update fields if provided
    if request.is_active is not None:
        rule.is_active = request.is_active
    if request.agent_config is not None:
        rule.agent_config = request.agent_config

    await db.commit()
    await db.refresh(rule)

    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a rule from the organization."""
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.organization_id == current_user.organization_id,
        )
    )
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found"
        )

    await db.delete(rule)
    await db.commit()


@router.get("/rules/{rule_id}/installed", response_model=dict)
async def check_if_installed(
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if a template is already installed for this org."""
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.organization_id == current_user.organization_id,
            AutomationRule.cloned_from_id == rule_id,
        )
    )
    installed = result.scalar_one_or_none()
    return {
        "installed": installed is not None,
        "rule_id": installed.id if installed else None,
    }


# ============ Execution Logs & Stats ============


class ExecutionLogResponse(BaseModel):
    """Response for a single execution log."""

    id: UUID
    patient_name: Optional[str] = None
    status: str
    action: str
    timestamp: datetime
    error: Optional[str] = None

    class Config:
        from_attributes = True


class LogsListResponse(BaseModel):
    """Response for execution logs listing."""

    logs: list[ExecutionLogResponse]
    total: int


class StatsResponse(BaseModel):
    """Response for automation stats."""

    total_executions: int
    success_count: int
    failed_count: int
    this_month: int
    last_execution: Optional[datetime] = None


@router.get("/rules/{rule_id}/logs", response_model=LogsListResponse)
async def get_rule_logs(
    rule_id: UUID,
    limit: int = Query(default=10, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get execution logs for a specific automation rule."""
    # Verify rule belongs to org
    rule_check = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.organization_id == current_user.organization_id,
        )
    )
    if not rule_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Rule not found")

    # Get logs with patient name
    result = await db.execute(
        select(AutomationExecutionLog, Patient.first_name, Patient.last_name)
        .outerjoin(Patient, AutomationExecutionLog.patient_id == Patient.id)
        .where(AutomationExecutionLog.automation_rule_id == rule_id)
        .order_by(AutomationExecutionLog.created_at.desc())
        .limit(limit)
    )
    rows = result.all()

    logs = []
    for log, first_name, last_name in rows:
        patient_name = f"{first_name} {last_name}" if first_name else None
        action = log.actions_executed[0]["type"] if log.actions_executed else "Unknown"
        logs.append(
            ExecutionLogResponse(
                id=log.id,
                patient_name=patient_name,
                status=log.status,
                action=action,
                timestamp=log.created_at,
                error=log.error_message,
            )
        )

    # Get total count
    count_result = await db.execute(
        select(func.count(AutomationExecutionLog.id)).where(
            AutomationExecutionLog.automation_rule_id == rule_id
        )
    )
    total = count_result.scalar() or 0

    return {"logs": logs, "total": total}


@router.get("/rules/{rule_id}/stats", response_model=StatsResponse)
async def get_rule_stats(
    rule_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated stats for a specific automation rule."""
    # Verify rule belongs to org
    rule_check = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.organization_id == current_user.organization_id,
        )
    )
    if not rule_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Rule not found")

    # Total and by status
    total_result = await db.execute(
        select(func.count(AutomationExecutionLog.id)).where(
            AutomationExecutionLog.automation_rule_id == rule_id
        )
    )
    total = total_result.scalar() or 0

    success_result = await db.execute(
        select(func.count(AutomationExecutionLog.id)).where(
            AutomationExecutionLog.automation_rule_id == rule_id,
            AutomationExecutionLog.status == "SUCCESS",
        )
    )
    success_count = success_result.scalar() or 0

    failed_count = total - success_count

    # This month
    month_start = datetime.now().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    month_result = await db.execute(
        select(func.count(AutomationExecutionLog.id)).where(
            AutomationExecutionLog.automation_rule_id == rule_id,
            AutomationExecutionLog.created_at >= month_start,
        )
    )
    this_month = month_result.scalar() or 0

    # Last execution
    last_result = await db.execute(
        select(AutomationExecutionLog.created_at)
        .where(AutomationExecutionLog.automation_rule_id == rule_id)
        .order_by(AutomationExecutionLog.created_at.desc())
        .limit(1)
    )
    last_execution = last_result.scalar()

    return StatsResponse(
        total_executions=total,
        success_count=success_count,
        failed_count=failed_count,
        this_month=this_month,
        last_execution=last_execution,
    )
