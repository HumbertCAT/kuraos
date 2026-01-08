"""Automation Engine service for v0.9.0 The Automator.

This service processes system events and executes hardcoded business rules.
In a future version (Hito 3), rules will be dynamically loaded from the database.

Architecture:
1. Events are logged to SystemEventLog (audit trail)
2. Hardcoded rules are evaluated against the event payload
3. Actions are executed (update patient status, send notifications, etc.)
"""

import logging
from uuid import UUID
from typing import Optional, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import (
    SystemEventLog,
    EventStatus,
)
from app.schemas.automation_types import TriggerEvent

logger = logging.getLogger(__name__)


class AutomationEngine:
    """
    Event-driven automation engine with hardcoded rules.

    Usage:
        async with AsyncSessionLocal() as db:
            engine = AutomationEngine(db)
            await engine.process_event(
                event_type=TriggerEvent.FORM_SUBMISSION_COMPLETED,
                payload={"patient_id": "...", "risk_analysis": {"level": "HIGH"}},
                organization_id=org_id
            )
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_event(
        self,
        event_type: str,
        payload: dict,
        organization_id: UUID,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
    ) -> SystemEventLog:
        """
        Main entry point: log event and execute matching rules.

        Args:
            event_type: The type of event (from TriggerEvent enum)
            payload: Full event data (will be stored in JSONB)
            organization_id: Tenant ID
            entity_type: Optional entity type (e.g., "form_submission", "booking")
            entity_id: Optional entity ID for linking

        Returns:
            The created SystemEventLog record
        """
        # 1. Create audit log entry
        event_log = SystemEventLog(
            organization_id=organization_id,
            event_type=event_type,
            payload=payload,
            status=EventStatus.PENDING,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        self.db.add(event_log)
        await self.db.flush()  # Get the ID

        try:
            # 2. Execute hardcoded rules
            rules_matched = await self._execute_rules(
                event_type, payload, organization_id
            )

            # 3. Update log status
            if rules_matched:
                event_log.status = EventStatus.PROCESSED
            else:
                event_log.status = EventStatus.IGNORED

            await self.db.commit()
            logger.info(
                f"Event {event_type} processed: {event_log.status.value} "
                f"(org={organization_id})"
            )

        except Exception as e:
            event_log.status = EventStatus.FAILED
            event_log.error_message = str(e)
            await self.db.commit()
            logger.error(f"Event {event_type} failed: {e}")
            raise

        return event_log

    async def _execute_rules(
        self, event_type: str, payload: dict, organization_id: UUID
    ) -> bool:
        """
        Execute rules for the given event.
        Returns True if any rule matched.

        Now queries AutomationRule table for dynamic rules.
        """
        from app.services.email import email_service
        from app.db.models import User, Organization, AutomationRule

        rules_matched = False

        # === NEW: Query dynamic rules from database ===
        print(f"🔍 Looking for rules: event={event_type}, org={organization_id}")
        dynamic_rules_query = await self.db.execute(
            select(AutomationRule)
            .where(
                AutomationRule.organization_id == organization_id,
                AutomationRule.trigger_event == event_type,
                AutomationRule.is_active,
            )
            .order_by(AutomationRule.priority.desc())
        )
        dynamic_rules = dynamic_rules_query.scalars().all()

        print(f"📋 Found {len(dynamic_rules)} active rules for {event_type}")

        for rule in dynamic_rules:
            try:
                print(
                    f"🎯 Processing rule: {rule.name}, agent_config: {rule.agent_config}"
                )
                # Check conditions
                if not self._check_conditions(rule.conditions, payload):
                    print(f"❌ Rule {rule.name} conditions not met, skipping")
                    continue

                # Execute actions
                print(f"▶️ Executing actions for rule: {rule.name}")
                await self._execute_actions(rule, payload, organization_id)
                rules_matched = True
                print(f"✅ Executed rule: {rule.name}")

            except Exception as e:
                logger.error(f"Error executing rule {rule.name}: {e}", exc_info=True)

        # === LEGACY: Hardcoded rules (for backwards compatibility) ===

        # --- RULE: High Risk Form Submission ---
        if event_type == TriggerEvent.FORM_SUBMISSION_COMPLETED.value:
            risk_level = self._get_nested_value(payload, "risk_analysis.level")
            patient_id = payload.get("patient_id")
            patient_name = payload.get("patient_name", "Paciente")
            patient_email = payload.get("patient_email")
            flags = self._get_nested_value(payload, "risk_analysis.flags") or []

            if patient_id and risk_level in ["HIGH", "CRITICAL"]:
                # Get org to check tier for blocking decision
                org_result = await self.db.execute(
                    select(Organization).where(Organization.id == organization_id)
                )
                org = org_result.scalar_one_or_none()

                # TIER-BASED RISK SHIELD:
                # - CENTER tier: Full auto-blocking
                # - BUILDER/PRO: Only notification (upsell feature)
                from app.db.models import OrgTier

                if org and org.tier == OrgTier.CENTER:
                    # 1. Update journey status (BLOCKING)
                    await self._update_patient_journey_status(
                        patient_id, "intake", "BLOCKED_HIGH_RISK"
                    )
                    logger.warning(
                        f"HIGH RISK patient {patient_id} - AUTO-BLOCKED (CENTER tier)"
                    )
                else:
                    # No blocking for non-CENTER tiers
                    logger.info(
                        f"HIGH RISK patient {patient_id} - auto-block skipped (tier: {org.tier.value if org else 'unknown'})"
                    )

                # 2. Get therapist email (owner of org)
                therapist_result = await self.db.execute(
                    select(User).where(
                        User.organization_id == organization_id, User.role == "OWNER"
                    )
                )
                therapist = therapist_result.scalar_one_or_none()
                therapist_email = therapist.email if therapist else None

                # 3. Send alert to therapist (all tiers get notification)
                if therapist_email:
                    # Include upgrade hint for non-CENTER tiers
                    context = {
                        "patient_name": patient_name,
                        "flags": flags,
                    }
                    if org and org.tier != OrgTier.CENTER:
                        context["upgrade_hint"] = (
                            "Activa el plan Center para bloqueo automático"
                        )

                    await email_service.send_automation_email(
                        to_email=therapist_email,
                        to_name=therapist.full_name if therapist else "Terapeuta",
                        subject=f"🚨 ALERTA: Riesgo detectado en {patient_name}",
                        template_type="risk_alert",
                        context=context,
                    )

                logger.warning(f"HIGH RISK patient {patient_id} - therapist notified")
                rules_matched = True

            elif patient_id and risk_level == "LOW":
                # 1. Update journey status
                await self._update_patient_journey_status(
                    patient_id, "intake", "AWAITING_PAYMENT"
                )

                # 2. Send payment link to patient
                if patient_email:
                    from app.core.config import settings

                    # Use FRONTEND_URL from settings (localhost in dev, domain in prod)
                    payment_link = (
                        f"{settings.FRONTEND_URL}/public/booking?patient={patient_id}"
                    )

                    await email_service.send_automation_email(
                        to_email=patient_email,
                        to_name=patient_name,
                        subject="🎉 ¡Estás dentro! Completa tu reserva",
                        template_type="patient_accepted",
                        context={
                            "name": patient_name,
                            "payment_link": payment_link,
                        },
                    )

                logger.info(f"LOW RISK patient {patient_id} - payment link sent")
                rules_matched = True

        # --- RULE: Booking Confirmed ---
        elif event_type == TriggerEvent.BOOKING_CONFIRMED.value:
            patient_id = payload.get("patient_id")
            if patient_id:
                await self._update_patient_journey_status(
                    patient_id, "booking", "CONFIRMED"
                )
                rules_matched = True

        # --- RULE: Payment Failed ---
        elif event_type == TriggerEvent.PAYMENT_FAILED.value:
            patient_id = payload.get("patient_id")
            if patient_id:
                await self._update_patient_journey_status(
                    patient_id, "booking", "PAYMENT_FAILED"
                )
                rules_matched = True

        return rules_matched

    async def _update_patient_journey_status(
        self,
        patient_id: str,
        journey_key: str,
        new_status: str,
        trigger_event_id: Optional[UUID] = None,
    ):
        """
        Update a specific key in the patient's journey_status JSONB.
        Uses PostgreSQL jsonb_set for atomic merge (not overwrite).

        Also writes to JourneyLog for audit trail (v0.9.2).

        Example:
            patient.journey_status = {"intake": "BLOCKED_HIGH_RISK"}
            _update_patient_journey_status(id, "booking", "CONFIRMED")
            # Result: {"intake": "BLOCKED_HIGH_RISK", "booking": "CONFIRMED"}
        """
        from sqlalchemy import text
        from app.db.models import JourneyLog

        # 1. Get current status for audit log
        old_status_result = await self.db.execute(
            text("""
                SELECT journey_status->:journey_key as current_stage
                FROM patients
                WHERE id = :patient_id
            """),
            {"journey_key": journey_key, "patient_id": patient_id},
        )
        row = old_status_result.fetchone()
        old_status = row[0] if row and row[0] else None
        # Remove quotes from JSONB string
        if old_status and isinstance(old_status, str):
            old_status = old_status.strip('"')

        # 2. Update JSONB atomically
        await self.db.execute(
            text("""
                UPDATE patients
                SET journey_status = jsonb_set(
                    COALESCE(journey_status, '{}'),
                    :path,
                    :value::jsonb
                )
                WHERE id = :patient_id
            """),
            {
                "path": f"{{{journey_key}}}",
                "value": f'"{new_status}"',
                "patient_id": patient_id,
            },
        )

        # 3. Write to JourneyLog (audit trail)
        journey_log = JourneyLog(
            patient_id=UUID(patient_id) if isinstance(patient_id, str) else patient_id,
            journey_key=journey_key,
            from_stage=old_status,
            to_stage=new_status,
            trigger_event_id=trigger_event_id,
        )
        self.db.add(journey_log)

        logger.info(
            f"Patient {patient_id}: {journey_key} {old_status or 'NULL'} -> {new_status}"
        )

    def _get_nested_value(self, data: dict, path: str) -> Any:
        """
        Extract a value from a nested dict using dot notation.
        Example: _get_nested_value({"a": {"b": 1}}, "a.b") -> 1
        """
        keys = path.split(".")
        current = data

        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            else:
                return None
            if current is None:
                return None

        return current

    def _check_conditions(self, conditions: dict, payload: dict) -> bool:
        """
        Check if rule conditions match the payload.

        conditions format: {"logic": "AND", "rules": [{...}]}
        Returns True if conditions match.
        """
        if not conditions or not conditions.get("rules"):
            return True  # No conditions = always match

        rules = conditions.get("rules", [])
        logic = conditions.get("logic", "AND")

        results = []
        for cond in rules:
            field = cond.get("field")
            operator = cond.get("operator")
            value = cond.get("value")

            # Get actual value from payload
            actual_value = self._get_nested_value(payload, field)

            # Print for debugging
            print(
                f"   📊 Condition check: {field} {operator} {value} (actual: {actual_value})"
            )

            # Evaluate condition based on operator
            result = False

            # Equality operators
            if operator in ("=", "eq", "==", "equals"):
                result = str(actual_value) == str(value)
            elif operator in ("!=", "neq", "<>", "not_equals"):
                result = str(actual_value) != str(value)

            # String operators
            elif operator == "contains":
                result = (
                    str(value).lower() in str(actual_value).lower()
                    if actual_value
                    else False
                )
            elif operator == "starts_with":
                result = (
                    str(actual_value).lower().startswith(str(value).lower())
                    if actual_value
                    else False
                )
            elif operator == "ends_with":
                result = (
                    str(actual_value).lower().endswith(str(value).lower())
                    if actual_value
                    else False
                )

            # Numeric comparison operators
            elif operator in ("gte", ">="):
                try:
                    result = float(actual_value) >= float(value)
                except (ValueError, TypeError):
                    result = False
            elif operator in ("lte", "<="):
                try:
                    result = float(actual_value) <= float(value)
                except (ValueError, TypeError):
                    result = False
            elif operator in ("gt", ">"):
                try:
                    result = float(actual_value) > float(value)
                except (ValueError, TypeError):
                    result = False
            elif operator in ("lt", "<"):
                try:
                    result = float(actual_value) < float(value)
                except (ValueError, TypeError):
                    result = False

            else:
                print(f"   ⚠️ Unknown operator: {operator}")
                result = False

            print(f"   → Result: {result}")
            results.append(result)

        if logic == "AND":
            return all(results) if results else True
        else:  # OR
            return any(results) if results else True

    async def _execute_actions(
        self, rule: "AutomationRule", payload: dict, organization_id: UUID
    ):
        """
        Execute the actions defined in an automation rule.

        Handles send_email, send_whatsapp, etc.
        Now supports DRAFT_ONLY mode via agent_config.
        """
        from app.db.models import PendingAction, Lead
        from app.services.email import email_service

        for action in rule.actions:
            action_type = action.get("type")
            params = action.get("params", {})

            if action_type == "send_email":
                # Check if rule has agent_config with DRAFT_ONLY mode
                agent_config = rule.agent_config or {}
                mode = agent_config.get("mode", "AUTO_SEND")

                if mode == "DRAFT_ONLY":
                    # Create pending action instead of sending immediately
                    lead_id = payload.get("lead_id")
                    if not lead_id:
                        logger.warning("No lead_id in payload for draft mode, skipping")
                        continue

                    # Get lead info
                    lead_result = await self.db.execute(
                        select(Lead).where(Lead.id == UUID(lead_id))
                    )
                    lead = lead_result.scalar_one_or_none()
                    if not lead:
                        print(f"❌ Lead {lead_id} not found")
                        continue

                    # Enrich template params with lead data
                    from app.core.config import settings
                    from app.db.models import ServiceType

                    # Find "Consulta Inicial" service for booking link
                    service_result = await self.db.execute(
                        select(ServiceType)
                        .where(ServiceType.organization_id == organization_id)
                        .where(ServiceType.title.ilike("%consulta inicial%"))
                        .where(ServiceType.is_active == True)
                    )
                    consultation_service = service_result.scalar_one_or_none()

                    # Generate booking link
                    if consultation_service:
                        booking_link = f"{settings.FRONTEND_URL}/booking/{consultation_service.id}?lead={lead_id}"
                    else:
                        booking_link = f"{settings.FRONTEND_URL}/contact"  # Fallback

                    enriched_params = params.copy()
                    enriched_params["first_name"] = lead.first_name or "Lead"
                    enriched_params["last_name"] = lead.last_name or ""
                    enriched_params["email"] = lead.email
                    enriched_params["booking_link"] = booking_link

                    # Create draft
                    draft = PendingAction(
                        organization_id=organization_id,
                        rule_id=rule.id,
                        action_type="send_email",
                        recipient_id=UUID(lead_id),
                        recipient_type="lead",
                        recipient_name=f"{lead.first_name or ''} {lead.last_name or ''}".strip()
                        or "Lead",
                        recipient_email=lead.email,
                        draft_content=enriched_params,
                        status="PENDING",
                    )
                    self.db.add(draft)
                    await self.db.flush()
                    print(
                        f"✅ Created draft email for lead {lead_id} (rule: {rule.name})"
                    )

                else:
                    # AUTO_SEND mode - send immediately
                    # Get lead data for template substitution
                    lead_id = payload.get("lead_id")
                    lead = None
                    if lead_id:
                        lead_result = await self.db.execute(
                            select(Lead).where(Lead.id == UUID(lead_id))
                        )
                        lead = lead_result.scalar_one_or_none()

                    to_email = params.get("to")
                    subject = params.get("subject", "Notificación")
                    body = params.get("body", "")

                    # Template substitution
                    if lead:
                        from app.core.config import settings
                        from app.db.models import ServiceType

                        # Find "Consulta Inicial" service for booking link
                        service_result = await self.db.execute(
                            select(ServiceType)
                            .where(ServiceType.organization_id == organization_id)
                            .where(ServiceType.title.ilike("%consulta inicial%"))
                            .where(ServiceType.is_active == True)
                        )
                        consultation_service = service_result.scalar_one_or_none()

                        # Generate booking link
                        if consultation_service:
                            booking_link = f"{settings.FRONTEND_URL}/booking/{consultation_service.id}?lead={lead_id}"
                        else:
                            booking_link = (
                                f"{settings.FRONTEND_URL}/contact"  # Fallback
                            )

                        body = body.replace("{first_name}", lead.first_name or "Lead")
                        body = body.replace("{last_name}", lead.last_name or "")
                        body = body.replace("{email}", lead.email or "")
                        body = body.replace("{booking_link}", booking_link)
                        # TODO: Link to service

                        # Update lead status to CONTACTED after sending welcome email
                        if rule.trigger_event == "LEAD_CREATED":
                            lead.status = "CONTACTED"
                            await self.db.commit()

                    await email_service.send_automation_email(
                        to_email=to_email
                        if to_email != "lead"
                        else (lead.email if lead else ""),
                        to_name=lead.first_name if lead else params.get("to_name", ""),
                        subject=subject,
                        template_type="generic",
                        context={"body": body},
                    )
                    logger.info(f"✅ Sent email to {to_email} (rule: {rule.name})")


async def fire_event(
    db: AsyncSession,
    event_type: TriggerEvent,
    payload: dict,
    organization_id: UUID,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
) -> SystemEventLog:
    """
    Convenience function to fire an event (fire-and-forget wrapper).

    Use this from endpoints to trigger automation without blocking.
    """
    engine = AutomationEngine(db)
    return await engine.process_event(
        event_type=event_type.value,
        payload=payload,
        organization_id=organization_id,
        entity_type=entity_type,
        entity_id=entity_id,
    )


async def emit_event(
    db: AsyncSession,
    event_type: TriggerEvent,
    organization_id: UUID,
    entity_id: Optional[UUID] = None,
    entity_type: Optional[str] = None,
    payload: Optional[dict] = None,
) -> SystemEventLog:
    """
    Emit an automation event (alias for fire_event with different signature).

    Used by leads.py and other endpoints that create entities.
    """
    logger.info(
        f"🔥 Emitting event: {event_type.value} for org {organization_id}, entity {entity_id}"
    )
    try:
        engine = AutomationEngine(db)
        result = await engine.process_event(
            event_type=event_type.value,
            payload=payload or {},
            organization_id=organization_id,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        logger.info(f"✅ Event processed successfully: {event_type.value}")
        return result
    except Exception as e:
        logger.error(
            f"❌ Error processing event {event_type.value}: {e}", exc_info=True
        )
        raise


# ============ LLM Enhancement Helpers ============


async def enhance_message_with_ai(
    message_body: str,
    recipient_name: str,
    tone: str,  # CLINICAL, EMPATHETIC, DIRECT
    signature: Optional[str] = None,
) -> str:
    """
    Use AI to rewrite a message with the specified tone.

    v1.3.11: Uses ProviderFactory with 'ai_enhancement' task routing.

    Tones:
    - CLINICAL: Professional, clear, focused on facts
    - EMPATHETIC: Warm, understanding, supportive
    - DIRECT: Concise, action-oriented, to the point
    """
    from app.services.ai import ProviderFactory

    tone_instructions = {
        "CLINICAL": "Use a professional, clinical tone. Be clear and factual.",
        "EMPATHETIC": "Use a warm, empathetic tone. Show understanding and support.",
        "DIRECT": "Use a direct, concise tone. Focus on the action needed.",
    }

    system_prompt = f"""Rewrite the following message for {recipient_name}.
Tone: {tone_instructions.get(tone, tone_instructions["EMPATHETIC"])}
Keep it under 50 words. Preserve the key information.
{f"Sign with: {signature}" if signature else ""}

Output language: Same as input (Spanish/Castellano)."""

    try:
        # v1.3.11: Use centralized ProviderFactory with task routing
        provider = await ProviderFactory.get_provider_for_task("ai_enhancement")

        response = await provider.analyze_text(
            content=message_body,
            system_prompt=system_prompt,
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"AI enhancement failed: {e}")
        return message_body


async def create_draft_action(
    db: AsyncSession,
    organization_id: UUID,
    rule_id: UUID,
    action_type: str,
    recipient_id: UUID,
    recipient_type: str,
    recipient_name: str,
    recipient_email: Optional[str],
    draft_content: dict,
    ai_content: Optional[dict] = None,
    event_id: Optional[UUID] = None,
):
    """
    Create a PendingAction for human-in-the-loop approval.

    Called when agent_config.mode == DRAFT_ONLY.
    """
    from app.db.models import PendingAction

    pending = PendingAction(
        organization_id=organization_id,
        rule_id=rule_id,
        action_type=action_type,
        recipient_id=recipient_id,
        recipient_type=recipient_type,
        recipient_name=recipient_name,
        recipient_email=recipient_email,
        draft_content=draft_content,
        ai_generated_content=ai_content,
        created_by_event_id=event_id,
    )
    db.add(pending)
    await db.flush()

    logger.info(f"Created pending action {pending.id} for {recipient_name}")
    return pending
