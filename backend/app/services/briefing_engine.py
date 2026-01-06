"""Daily Briefing Engine - "Chief of Staff" for therapists.

Generates a personalized morning audio briefing summarizing:
- Today's calendar (appointments count, first appointment)
- Clinical alerts (high-risk patients with appointments today)
- Financial summary (payments collected in last 24h)
- CRM status (pending actions waiting approval)

Uses Gemini for script generation and OpenAI TTS for audio.
"""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

logger = logging.getLogger(__name__)

# Cache directory for generated audio files
BRIEFING_DIR = Path("/app/static/briefings")


class BriefingEngine:
    """Generate and cache daily audio briefings."""

    def __init__(self, db: AsyncSession, user_id: UUID, organization_id: UUID):
        self.db = db
        self.user_id = user_id
        self.organization_id = organization_id

    async def generate(self) -> dict:
        """
        Main entry point: generate or retrieve cached briefing.

        Returns:
            {
                "audio_url": "/static/briefings/{user_id}_{date}.mp3" or None,
                "text_script": "Your briefing text...",
                "generated_at": "2025-12-22T08:00:00",
                "cached": True/False
            }
        """
        today = datetime.now().strftime("%Y-%m-%d")
        cache_key = f"{self.user_id}_{today}"
        cache_path = BRIEFING_DIR / f"{cache_key}.mp3"
        script_path = BRIEFING_DIR / f"{cache_key}.txt"

        # Check cache
        if cache_path.exists() and script_path.exists():
            logger.info(f"Briefing cache hit: {cache_key}")
            return {
                "audio_url": f"/static/briefings/{cache_key}.mp3",
                "text_script": script_path.read_text(),
                "generated_at": datetime.fromtimestamp(
                    cache_path.stat().st_mtime
                ).isoformat(),
                "cached": True,
            }

        # Generate fresh briefing
        logger.info(f"Generating new briefing for {cache_key}")

        # 1. Aggregate data
        data = await self._aggregate_data()

        # 2. Generate script with Gemini
        script = await self._generate_script(data)

        # 3. Generate audio with OpenAI TTS
        audio_url = await self._generate_audio(script, cache_path)

        # Save script to cache
        BRIEFING_DIR.mkdir(parents=True, exist_ok=True)
        script_path.write_text(script)

        return {
            "audio_url": audio_url,
            "text_script": script,
            "generated_at": datetime.now().isoformat(),
            "cached": False,
        }

    async def _aggregate_data(self) -> dict:
        """Fetch today's snapshot for the user."""
        from app.db.models import (
            Booking,
            Patient,
            ClinicalEntry,
            PendingAction,
        )

        # Spanish day/month names (locale-independent)
        DAYS_ES = {
            "Monday": "lunes",
            "Tuesday": "martes",
            "Wednesday": "miércoles",
            "Thursday": "jueves",
            "Friday": "viernes",
            "Saturday": "sábado",
            "Sunday": "domingo",
        }
        MONTHS_ES = {
            "January": "enero",
            "February": "febrero",
            "March": "marzo",
            "April": "abril",
            "May": "mayo",
            "June": "junio",
            "July": "julio",
            "August": "agosto",
            "September": "septiembre",
            "October": "octubre",
            "November": "noviembre",
            "December": "diciembre",
        }

        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)

        # Format date in Spanish manually
        day_name = now.strftime("%A")
        month_name = now.strftime("%B")
        day_num = now.strftime("%d")
        fecha_es = f"{DAYS_ES.get(day_name, day_name)}, {day_num} de {MONTHS_ES.get(month_name, month_name)}"

        # Calendar: Today's appointments
        bookings_query = await self.db.execute(
            select(Booking)
            .where(
                Booking.organization_id == self.organization_id,
                Booking.start_time >= today_start,
                Booking.start_time < today_end,
                Booking.status.in_(["CONFIRMED", "PENDING"]),
            )
            .order_by(Booking.start_time)
        )
        bookings = bookings_query.scalars().all()
        appointments_today = len(bookings)
        first_appointment = (
            bookings[0].start_time.strftime("%H:%M") if bookings else None
        )

        # Clinical: High-risk patients with appointments today
        # Get patient IDs from today's bookings
        patient_ids = [b.patient_id for b in bookings if b.patient_id]

        high_risk_patients = []
        if patient_ids:
            # Check for recent high-risk clinical entries
            risk_query = await self.db.execute(
                select(ClinicalEntry.patient_id)
                .where(
                    ClinicalEntry.patient_id.in_(patient_ids),
                    ClinicalEntry.created_at >= last_7d,
                    ClinicalEntry.entry_metadata["risk_level"].astext.in_([
                        "HIGH",
                        "CRITICAL",
                    ]),
                )
                .distinct()
            )
            high_risk_ids = [r[0] for r in risk_query.all()]

            if high_risk_ids:
                # Get patient names
                patients_query = await self.db.execute(
                    select(Patient).where(Patient.id.in_(high_risk_ids))
                )
                high_risk_patients = [
                    f"{p.first_name} {p.last_name}".strip()
                    for p in patients_query.scalars().all()
                ]

        # Financial: Payments collected in last 24h
        # Use bookings that were updated (paid) in last 24h with successful payment
        payment_query = await self.db.execute(
            select(func.sum(Booking.amount_paid)).where(
                Booking.organization_id == self.organization_id,
                Booking.updated_at >= last_24h,
                Booking.stripe_payment_status == "succeeded",
            )
        )
        payments_24h = payment_query.scalar() or 0

        # CRM: Pending actions waiting approval
        pending_query = await self.db.execute(
            select(func.count(PendingAction.id)).where(
                PendingAction.organization_id == self.organization_id,
                PendingAction.status == "PENDING",
            )
        )
        pending_actions = pending_query.scalar() or 0

        return {
            "fecha": fecha_es,
            "citas_hoy": appointments_today,
            "primera_cita": first_appointment,
            "pacientes_riesgo": high_risk_patients,
            "ingresos_24h": float(payments_24h),
            "tareas_pendientes": pending_actions,
        }

    async def _generate_script(self, data: dict) -> str:
        """Generate briefing script with Gemini via ProviderFactory."""
        from app.services.ai import ProviderFactory

        system_prompt = """You are a helpful Chief of Staff for a therapist in Spain.
Summarize this JSON data into a warm, professional, 30-second morning briefing script.
Be concise. Highlight risks first. Speak in Spanish (Castellano).
End with something motivating.

Output: Spanish script (~50 words)."""

        content = f"Daily briefing data:\n{json.dumps(data, ensure_ascii=False)}"

        try:
            # v1.3.11: Use centralized ProviderFactory with task routing
            provider = await ProviderFactory.get_provider_for_task("briefing")

            response = await provider.analyze_text(
                content=content,
                system_prompt=system_prompt,
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Briefing script generation failed: {e}")
            return self._fallback_script(data)

    def _fallback_script(self, data: dict) -> str:
        """Generate a simple script without AI."""
        script_parts = [f"Buenos días. Hoy es {data['fecha']}."]

        if data["pacientes_riesgo"]:
            script_parts.append(
                f"Atención: tienes citas con pacientes de alto riesgo: {', '.join(data['pacientes_riesgo'])}."
            )

        if data["citas_hoy"] > 0:
            script_parts.append(f"Tienes {data['citas_hoy']} citas programadas.")
            if data["primera_cita"]:
                script_parts.append(f"La primera es a las {data['primera_cita']}.")
        else:
            script_parts.append("No tienes citas programadas para hoy.")

        if data["ingresos_24h"] > 0:
            script_parts.append(
                f"En las últimas 24 horas has recibido {data['ingresos_24h']:.2f}€."
            )

        if data["tareas_pendientes"] > 0:
            script_parts.append(
                f"Tienes {data['tareas_pendientes']} borradores de agentes esperando tu aprobación."
            )

        script_parts.append("¡Que tengas un día productivo!")

        return " ".join(script_parts)

    async def _generate_audio(self, script: str, cache_path: Path) -> Optional[str]:
        """Generate audio with OpenAI TTS."""
        from app.core.config import settings

        if not hasattr(settings, "OPENAI_API_KEY") or not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set, skipping audio generation")
            return None

        try:
            from openai import OpenAI

            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            response = client.audio.speech.create(
                model="tts-1",
                voice="nova",  # Warm, professional female voice
                input=script,
            )

            # Ensure directory exists
            BRIEFING_DIR.mkdir(parents=True, exist_ok=True)

            # Save audio file
            response.stream_to_file(str(cache_path))

            logger.info(f"Audio briefing saved: {cache_path}")
            return f"/static/briefings/{cache_path.name}"

        except Exception as e:
            logger.error(f"OpenAI TTS failed: {e}")
            return None


async def get_daily_briefing(
    db: AsyncSession,
    user_id: UUID,
    organization_id: UUID,
) -> dict:
    """Convenience function to get daily briefing."""
    engine = BriefingEngine(db, user_id, organization_id)
    return await engine.generate()
