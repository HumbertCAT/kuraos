"""
Help Assistant Service - Gemini 2.5 Flash powered chatbot for user support.

Features:
- Context-aware assistance (knows current page, user tier)
- Hallucination-zero: Only answers based on known features
- Query logging for product analytics
"""

import logging
import asyncio
from typing import Optional, List
from concurrent.futures import ThreadPoolExecutor
from google import genai
from google.genai import types as genai_types

from app.core.config import settings

logger = logging.getLogger(__name__)

# Thread pool for running sync Gemini calls
_executor = ThreadPoolExecutor(max_workers=4)

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
    """Gemini 2.5 Flash powered help chatbot."""

    MODEL = "gemini-2.5-flash"

    def __init__(self):
        # Initialize client lazily to avoid import-time issues
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        return self._client

    def _sync_generate(
        self,
        system_prompt: str,
        contents: list,
    ) -> str:
        """Synchronous Gemini call (runs in thread pool)."""
        response = self.client.models.generate_content(
            model=self.MODEL,
            contents=contents,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.3,
                max_output_tokens=300,
            ),
        )
        return response.text or "Lo siento, no pude generar una respuesta."

    async def chat(
        self,
        message: str,
        locale: str = "es",
        user_name: str = "Usuario",
        tier: str = "BUILDER",
        route: str = "/dashboard",
        history: Optional[List[dict]] = None,
    ) -> str:
        """
        Generate a response to the user's help query.

        Uses ThreadPoolExecutor to run sync Gemini client without blocking.
        """
        try:
            # Build system prompt with context
            system_prompt = SYSTEM_PROMPT.format(
                locale=locale,
                user_name=user_name,
                tier=tier,
                route=route,
            )

            # Build conversation history
            contents = []

            # Add history if provided
            if history:
                for msg in history[-6:]:
                    role = "user" if msg.get("role") == "user" else "model"
                    contents.append(
                        genai_types.Content(
                            role=role,
                            parts=[genai_types.Part(text=msg.get("content", ""))],
                        )
                    )

            # Add current user message
            contents.append(
                genai_types.Content(role="user", parts=[genai_types.Part(text=message)])
            )

            # Run sync Gemini call in thread pool to avoid blocking event loop
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                _executor,
                self._sync_generate,
                system_prompt,
                contents,
            )

            return result

        except Exception as e:
            logger.error(f"Help assistant error: {e}")
            return "Lo siento, hubo un error procesando tu consulta. Por favor, contacta a support@therapistos.com"


# Singleton instance
help_assistant = HelpAssistant()
