"""Pending Actions API - Human-in-the-loop approval queue.

Provides endpoints to view, edit, approve, and reject draft actions
created by agents in DRAFT_ONLY mode.
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.base import get_db
from app.db.models import PendingAction, PendingActionStatus, AutomationRule
from app.api.deps import CurrentUser


router = APIRouter()


# ============ Schemas ============


class PendingActionResponse(BaseModel):
    id: uuid.UUID
    rule_id: uuid.UUID
    rule_name: str
    action_type: str
    recipient_id: uuid.UUID
    recipient_type: str
    recipient_name: str
    recipient_email: Optional[str]
    draft_content: dict
    ai_generated_content: Optional[dict]
    status: str
    created_at: str

    class Config:
        from_attributes = True


class PendingActionListResponse(BaseModel):
    actions: List[PendingActionResponse]
    total: int


class PendingActionUpdate(BaseModel):
    """Edit the draft content before approving."""

    subject: Optional[str] = None
    body: Optional[str] = None


# ============ Endpoints ============


@router.get("", response_model=PendingActionListResponse)
async def list_pending_actions(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = "PENDING",
):
    """List pending actions for the organization."""
    query = (
        select(PendingAction, AutomationRule)
        .join(AutomationRule, PendingAction.rule_id == AutomationRule.id)
        .where(PendingAction.organization_id == current_user.organization_id)
    )

    if status_filter:
        query = query.where(PendingAction.status == PendingActionStatus(status_filter))

    query = query.order_by(PendingAction.created_at.desc())

    result = await db.execute(query)
    rows = result.all()

    return PendingActionListResponse(
        actions=[
            PendingActionResponse(
                id=action.id,
                rule_id=action.rule_id,
                rule_name=rule.name,
                action_type=action.action_type,
                recipient_id=action.recipient_id,
                recipient_type=action.recipient_type,
                recipient_name=action.recipient_name,
                recipient_email=action.recipient_email,
                draft_content=action.draft_content,
                ai_generated_content=action.ai_generated_content,
                status=str(action.status.value)
                if hasattr(action.status, "value")
                else action.status,
                created_at=action.created_at.isoformat() if action.created_at else "",
            )
            for action, rule in rows
        ],
        total=len(rows),
    )


@router.get("/{action_id}", response_model=PendingActionResponse)
async def get_pending_action(
    action_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific pending action."""
    result = await db.execute(
        select(PendingAction, AutomationRule)
        .join(AutomationRule, PendingAction.rule_id == AutomationRule.id)
        .where(
            PendingAction.id == action_id,
            PendingAction.organization_id == current_user.organization_id,
        )
    )
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Action not found")

    action, rule = row

    return PendingActionResponse(
        id=action.id,
        rule_id=action.rule_id,
        rule_name=rule.name,
        action_type=action.action_type,
        recipient_id=action.recipient_id,
        recipient_type=action.recipient_type,
        recipient_name=action.recipient_name,
        recipient_email=action.recipient_email,
        draft_content=action.draft_content,
        ai_generated_content=action.ai_generated_content,
        status=str(action.status.value)
        if hasattr(action.status, "value")
        else action.status,
        created_at=action.created_at.isoformat() if action.created_at else "",
    )


@router.patch("/{action_id}", response_model=PendingActionResponse)
async def update_pending_action(
    action_id: uuid.UUID,
    data: PendingActionUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Edit the draft content before approving."""
    result = await db.execute(
        select(PendingAction).where(
            PendingAction.id == action_id,
            PendingAction.organization_id == current_user.organization_id,
            PendingAction.status == PendingActionStatus.PENDING,
        )
    )
    action = result.scalar_one_or_none()

    if not action:
        raise HTTPException(
            status_code=404, detail="Action not found or already processed"
        )

    # Update draft content
    draft = action.draft_content.copy()
    if data.subject is not None:
        draft["subject"] = data.subject
    if data.body is not None:
        draft["body"] = data.body
    action.draft_content = draft

    await db.commit()
    await db.refresh(action)

    # Get rule name for response
    rule_result = await db.execute(
        select(AutomationRule).where(AutomationRule.id == action.rule_id)
    )
    rule = rule_result.scalar_one()

    return PendingActionResponse(
        id=action.id,
        rule_id=action.rule_id,
        rule_name=rule.name,
        action_type=action.action_type,
        recipient_id=action.recipient_id,
        recipient_type=action.recipient_type,
        recipient_name=action.recipient_name,
        recipient_email=action.recipient_email,
        draft_content=action.draft_content,
        ai_generated_content=action.ai_generated_content,
        status=str(action.status.value)
        if hasattr(action.status, "value")
        else action.status,
        created_at=action.created_at.isoformat() if action.created_at else "",
    )


@router.post("/{action_id}/approve")
async def approve_pending_action(
    action_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Approve and execute the pending action (send email/whatsapp)."""
    from app.services.email import email_service

    result = await db.execute(
        select(PendingAction).where(
            PendingAction.id == action_id,
            PendingAction.organization_id == current_user.organization_id,
            PendingAction.status == PendingActionStatus.PENDING,
        )
    )
    action = result.scalar_one_or_none()

    if not action:
        raise HTTPException(
            status_code=404, detail="Action not found or already processed"
        )

    # Execute the action
    if action.action_type == "send_email" and action.recipient_email:
        # Use AI-enhanced content if available, otherwise use draft
        content = action.ai_generated_content or action.draft_content

        await email_service.send_automation_email(
            to_email=action.recipient_email,
            to_name=action.recipient_name,
            subject=content.get("subject", "Mensaje de tu terapeuta"),
            template_type="generic",
            context={
                "name": action.recipient_name,
                "body": content.get("body", ""),
            },
        )

    # Update status
    action.status = PendingActionStatus.APPROVED
    action.approved_by_user_id = current_user.id
    action.approved_at = datetime.utcnow()

    await db.commit()

    return {"success": True, "message": "Acción aprobada y enviada"}


@router.post("/{action_id}/reject")
async def reject_pending_action(
    action_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Reject and discard the pending action."""
    result = await db.execute(
        select(PendingAction).where(
            PendingAction.id == action_id,
            PendingAction.organization_id == current_user.organization_id,
            PendingAction.status == PendingActionStatus.PENDING,
        )
    )
    action = result.scalar_one_or_none()

    if not action:
        raise HTTPException(
            status_code=404, detail="Action not found or already processed"
        )

    action.status = PendingActionStatus.REJECTED
    action.approved_by_user_id = current_user.id
    action.approved_at = datetime.utcnow()

    await db.commit()

    return {"success": True, "message": "Acción descartada"}
