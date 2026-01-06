"""
Help Assistant Service - Vertex AI powered chatbot for user support.

v1.4.1: Migrated from google.genai to ProviderFactory (Vertex AI).

Features:
- Context-aware assistance (knows current page, user tier)
- Hallucination-zero: Only answers based on known features
- Query logging for product analytics
- AI Governance tracking via ProviderFactory
"""

import logging
from typing import Optional, List, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

# System prompt with "hallucination zero" directive
SYSTEM_PROMPT = """You are KuraOS Support, the technical assistant for TherapistOS (also known as KuraOS).

RULES:
- Respond in {locale}
- Max 3 sentences, use bullet points when listing steps
- Link to UI actions when possible using markdown: [Ir a Pacientes](/patients)
- CRITICAL: Answer ONLY based on the context provided. Do not invent features that are not listed below. If the user asks for a feature that doesn't exist, admit it politely and suggest a workaround or manual process.
- If unsure, suggest contacting support@therapistos.com

CONTEXT - TherapistOS Modules:
- Pacientes: Manage patient profiles, clinical timeline, journey status
- Diario Clínico: Session notes (text/audio), file uploads, AI analysis
- Formularios: Create forms, send to patients, view submissions
- Reservas: Calendar, services, availability, public booking
- Automatizaciones: Playbooks marketplace, rules engine
- WhatsApp: Message monitoring, AletheIA sentiment analysis
- Mi Plan: Subscription tiers (Builder/Pro/Center), credits

USER CONTEXT:
- User: {user_name}
- Tier: {tier}
- Current page: {route}
"""


class HelpAssistant:
    """
    Vertex AI powered help chatbot via ProviderFactory.

    v1.4.1: Now uses ProviderFactory for:
    - Vertex AI SDK (ADC authentication)
    - AI Governance logging
    - Unified cost tracking
    """

    async def chat(
        self,
        message: str,
        locale: str = "es",
        user_name: str = "Usuario",
        tier: str = "BUILDER",
        route: str = "/dashboard",
        history: Optional[List[dict]] = None,
    ) -> Tuple[str, int, int, str]:
        """
        Generate a response to the user's help query.

        Uses ProviderFactory to route through Vertex AI.
        Returns tuple for AI usage logging: (text, tokens_in, tokens_out, model_id)
        """
        try:
            from app.services.ai import ProviderFactory

            # Get provider for help_bot task (routes through Vertex AI)
            provider = ProviderFactory.get_provider_for_task("help_bot")

            # Build system prompt with context
            system_prompt = SYSTEM_PROMPT.format(
                locale=locale,
                user_name=user_name,
                tier=tier,
                route=route,
            )

            # Build flattened conversation content
            # (Vertex analyze_text expects a single content string)
            content_parts = []

            # Add history as transcript if provided
            if history:
                content_parts.append("[Previous conversation]")
                for msg in history[-6:]:  # Last 6 messages for context
                    role = "User" if msg.get("role") == "user" else "Assistant"
                    content_parts.append(f"{role}: {msg.get('content', '')}")
                content_parts.append("")  # Blank line separator

            # Add current query
            content_parts.append("[Current query]")
            content_parts.append(f"User: {message}")

            content = "\n".join(content_parts)

            # Call Vertex AI via ProviderFactory
            response = await provider.analyze_text(
                content=content,
                system_prompt=system_prompt,
            )

            # Return tuple for AI usage logging
            return (
                response.text,
                response.tokens_input,
                response.tokens_output,
                response.model_id,
            )

        except Exception as e:
            logger.error(f"Help assistant error: {e}")
            # Return error message with zero tokens (won't be logged)
            return (
                "Lo siento, hubo un error procesando tu consulta. Por favor, contacta a support@therapistos.com",
                0,
                0,
                "error",
            )


# Singleton instance
help_assistant = HelpAssistant()
