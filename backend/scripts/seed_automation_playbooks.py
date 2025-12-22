"""Seed system playbook templates for Automation Marketplace.

Run with: docker-compose exec backend python -m scripts.seed_automation_playbooks
"""

import asyncio
import sys
from uuid import uuid4

from sqlalchemy import select

# Add parent to path for imports
sys.path.insert(0, "/app")

from app.db.base import AsyncSessionLocal
from app.db.models import AutomationRule
from app.schemas.automation_types import TriggerEvent


PLAYBOOKS = [
    {
        "name": "Escudo de Seguridad",
        "description": "Bloquea automáticamente pacientes con riesgo alto y alerta al equipo clínico por email.",
        "icon": "ShieldAlert",
        "trigger_event": TriggerEvent.FORM_SUBMISSION_COMPLETED.value,
        "conditions": {
            "logic": "OR",
            "rules": [
                {"field": "risk_analysis.level", "operator": "equals", "value": "HIGH"},
                {
                    "field": "risk_analysis.level",
                    "operator": "equals",
                    "value": "CRITICAL",
                },
            ],
        },
        "actions": [
            {
                "type": "update_journey_status",
                "params": {"key": "intake", "status": "BLOCKED_HIGH_RISK"},
            },
            {
                "type": "send_email",
                "params": {"template": "risk_alert", "to": "therapist"},
            },
        ],
        "priority": 10,
    },
    {
        "name": "Cobrador Automático",
        "description": "Envía recordatorios de pago a las 24h y 48h si el paciente no completa su reserva.",
        "icon": "Banknote",
        "trigger_event": TriggerEvent.JOURNEY_STAGE_TIMEOUT.value,
        "conditions": {
            "logic": "AND",
            "rules": [
                {"field": "journey_key", "operator": "equals", "value": "intake"},
                {
                    "field": "current_stage",
                    "operator": "equals",
                    "value": "AWAITING_PAYMENT",
                },
                {"field": "hours_elapsed", "operator": "gte", "value": 48},
            ],
        },
        "actions": [
            {
                "type": "send_email",
                "params": {"template": "payment_reminder", "to": "patient"},
            }
        ],
        "priority": 50,
    },
    {
        "name": "Fidelización Post-Retiro",
        "description": "Envía una encuesta de satisfacción 7 días después de completar el retiro.",
        "icon": "HeartHandshake",
        "trigger_event": TriggerEvent.JOURNEY_STAGE_TIMEOUT.value,
        "conditions": {
            "logic": "AND",
            "rules": [
                {"field": "current_stage", "operator": "equals", "value": "COMPLETED"},
                {"field": "hours_elapsed", "operator": "gte", "value": 168},  # 7 days
            ],
        },
        "actions": [
            {
                "type": "send_email",
                "params": {"template": "satisfaction_survey", "to": "patient"},
            }
        ],
        "priority": 100,
    },
    {
        "name": "Agente Concierge",
        "description": "Da la bienvenida inmediata a nuevos interesados y ofrece agendar una llamada.",
        "icon": "BotMessageSquare",
        "trigger_event": TriggerEvent.LEAD_CREATED.value,
        "conditions": {
            "logic": "AND",
            "rules": [
                {
                    "field": "source",
                    "operator": "neq",
                    "value": "Manual",
                },  # Don't msg people I added myself
            ],
        },
        "actions": [
            {
                "type": "send_email",
                "params": {
                    "template": "lead_welcome",
                    "to": "lead",
                    "subject": "He recibido tu consulta",
                    "body": "Hola {first_name}, soy el asistente virtual. ¿Te gustaría agendar una llamada breve? Haz click aquí: {booking_link}",
                },
            }
        ],
        "priority": 5,  # High priority - respond fast to leads
    },
    {
        "name": "Agente Fantasma",
        "description": "Reactiva leads que llevan más de 48h sin contacto con un mensaje de seguimiento automático.",
        "icon": "Ghost",
        "trigger_event": TriggerEvent.LEAD_STAGED_TIMEOUT.value,
        "conditions": {},  # No conditions - applies to all stale leads
        "actions": [
            {
                "type": "send_email",
                "params": {
                    "template": "generic",
                    "to": "lead",
                    "subject": "¿Sigues interesado/a?",
                    "body": "Hola {first_name}, hace unos días mostraste interés pero no hemos podido conectar. ¿Te gustaría que agendemos una llamada de 15 minutos para resolver tus dudas? Responde a este email y te contactaré personalmente.",
                },
            }
        ],
        "priority": 60,  # Lower priority than immediate responses
    },
]


async def seed_playbooks():
    """Insert system playbook templates if they don't exist."""
    async with AsyncSessionLocal() as db:
        for playbook in PLAYBOOKS:
            # Check if already exists
            result = await db.execute(
                select(AutomationRule).where(
                    AutomationRule.name == playbook["name"],
                    AutomationRule.is_system_template.is_(True),
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"⏭️  Playbook '{playbook['name']}' already exists, skipping")
                continue

            # Create system template
            rule = AutomationRule(
                id=uuid4(),
                organization_id=None,  # System template
                name=playbook["name"],
                description=playbook["description"],
                icon=playbook["icon"],
                trigger_event=playbook["trigger_event"],
                conditions=playbook["conditions"],
                actions=playbook["actions"],
                is_active=False,  # Templates are not active, clones are
                is_system_template=True,
                priority=playbook["priority"],
            )
            db.add(rule)
            print(f"✅ Created playbook: {playbook['name']}")

        await db.commit()
        print("\n🎉 Playbook seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed_playbooks())
