"""
AletheIA - AI Clinical Analysis Service

Multimodal analysis of clinical entries using Google Gemini.
Supports text, audio, and image/document analysis.
"""

import os
import uuid
from datetime import datetime
from typing import Optional
import mimetypes

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from app.core.config import settings
from app.db.models import ClinicalEntry, EntryType


# Import centralized prompts
from app.services.ai.prompts import (
    CLINICAL_SYSTEM_PROMPT,
    AUDIO_SYNTHESIS_PROMPT as AUDIO_TRANSCRIPTION_PROMPT,
    DOCUMENT_ANALYSIS_PROMPT,
    FORM_ANALYSIS_PROMPT,
    ASTROLOGY_FORM_PROMPT,
    TRIAGE_FORM_PROMPT,
    CHAT_ANALYSIS_PROMPT,
)


class AletheIA:
    """AI Clinical Analysis Service using Google Gemini.

    v1.3.5: Refactored to use per-task model routing via Task Routing settings.
    No longer holds a single global model - each task gets its configured model.
    """

    def __init__(self):
        """Initialize the AletheIA service with Gemini configuration."""
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not configured")

        genai.configure(api_key=settings.GOOGLE_API_KEY)

        # v1.3.5: Store configs for per-task model creation (no global model)
        self._safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }
        self._generation_config = {
            "temperature": 0.4,
            "top_p": 0.95,
            "max_output_tokens": 8192,
        }

        self.uploads_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "static",
            "uploads",
        )

        # Context for logging (set externally when db session available)
        self._db = None
        self._organization_id = None
        self._user_id = None
        self._patient_id = None

    def set_context(self, db=None, organization_id=None, user_id=None, patient_id=None):
        """Set context for AI usage logging."""
        self._db = db
        self._organization_id = organization_id
        self._user_id = user_id
        self._patient_id = patient_id

    async def _get_model_for_task(self, task_type: str) -> "genai.GenerativeModel":
        """
        v1.3.4: Get configured model for specific task type from Task Routing.

        Args:
            task_type: One of 'triage', 'clinical_analysis', 'chat', etc.

        Returns:
            Configured GenerativeModel instance
        """
        from app.services.ai import ProviderFactory

        try:
            routing = await ProviderFactory.get_routing_config(self._db)
            model_name = routing.get(task_type, settings.AI_MODEL)
        except Exception as e:
            print(f"[AletheIA] Failed to get routed model for {task_type}: {e}")
            model_name = settings.AI_MODEL

        return genai.GenerativeModel(
            model_name=model_name,
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            },
            generation_config={
                "temperature": 0.4,
                "top_p": 0.95,
                "max_output_tokens": 8192,
            },
        )

    async def _log_ai_usage(
        self,
        response,
        task_type: str,
        model_name: str = None,
        clinical_entry_id: str = None,
    ):
        """Log AI usage to database if context is set."""
        if not self._db or not self._organization_id:
            return  # Skip logging if no db context

        try:
            from app.db.models import AiUsageLog

            # Extract token counts from genai response
            usage = getattr(response, "usage_metadata", None)
            tokens_in = getattr(usage, "prompt_token_count", 0) if usage else 0
            tokens_out = getattr(usage, "candidates_token_count", 0) if usage else 0

            # Calculate costs
            from app.services.ai.ledger import CostLedger
            from decimal import Decimal

            model_id = model_name or settings.AI_MODEL
            pricing = CostLedger.PRICING.get(model_id, CostLedger.DEFAULT_PRICING)
            margin = CostLedger.get_default_margin()

            cost_provider = (Decimal(tokens_in) / Decimal("1000000")) * pricing[
                "input"
            ] + (Decimal(tokens_out) / Decimal("1000000")) * pricing["output"]
            cost_user = cost_provider * margin

            # Create log entry
            log = AiUsageLog(
                id=uuid.uuid4(),
                organization_id=self._organization_id,
                user_id=self._user_id,
                patient_id=self._patient_id,
                clinical_entry_id=clinical_entry_id,
                provider="vertex-google",
                model_id=model_id,
                task_type=task_type,
                tokens_input=tokens_in,
                tokens_output=tokens_out,
                cost_provider_usd=float(cost_provider),
                cost_user_credits=float(cost_user),
            )

            self._db.add(log)
            await self._db.flush()
        except Exception as e:
            # Don't fail the main operation if logging fails
            print(f"[AletheIA] Usage logging error: {e}")

    async def analyze(self, entry: ClinicalEntry, model_name: str = None) -> dict:
        """
        Perform AI analysis on a clinical entry.

        Args:
            entry: The ClinicalEntry to analyze
            model_name: Optional model override (reads from Task Routing if not provided)

        Returns:
            dict with {id, date, text, model} for the analysis
        """
        entry_type = entry.entry_type

        # v1.3.5: Determine task type and get routed model
        task_type = {
            EntryType.SESSION_NOTE: "clinical_analysis",
            EntryType.AUDIO: "audio_synthesis",
            EntryType.DOCUMENT: "document_analysis",
            EntryType.FORM_SUBMISSION: "form_analysis",
        }.get(entry_type, "clinical_analysis")

        # Get model for this task (or use override)
        if model_name:
            effective_model = model_name
        else:
            model_obj = await self._get_model_for_task(task_type)
            effective_model = model_obj._model_name

        # Create model instance for this analysis
        self._current_model = genai.GenerativeModel(
            model_name=effective_model,
            safety_settings=self._safety_settings,
            generation_config=self._generation_config,
        )

        try:
            if entry_type == EntryType.SESSION_NOTE:
                analysis_text = await self._analyze_text(entry.content)
            elif entry_type == EntryType.AUDIO:
                analysis_text = await self._analyze_audio(entry)
            elif entry_type in (EntryType.DOCUMENT, EntryType.ASSESSMENT):
                analysis_text = await self._analyze_document(entry)
            elif entry_type == EntryType.FORM_SUBMISSION:
                analysis_text = await self._analyze_form_submission(entry)
            else:
                # For AI_ANALYSIS entries, don't re-analyze
                analysis_text = "This entry is already an AI analysis."
        except Exception as e:
            analysis_text = f"Error during analysis: {str(e)}"

        return {
            "id": str(uuid.uuid4()),
            "date": datetime.utcnow().isoformat(),
            "text": analysis_text,
            "model": effective_model,
        }

    async def _analyze_text(self, content: str) -> str:
        """Analyze text content."""
        if not content or not content.strip():
            return "No text content available for analysis."

        response = self._current_model.generate_content([
            CLINICAL_SYSTEM_PROMPT,
            f"## Clinical Entry Content:\n\n{content}",
        ])

        # Log AI usage
        await self._log_ai_usage(response, "clinical_analysis")

        return response.text

    async def _analyze_form_submission(self, entry: ClinicalEntry) -> str:
        """Analyze form submission with therapy-type aware prompting."""
        metadata = entry.entry_metadata or {}
        answers = metadata.get("answers", {})
        form_title = metadata.get("form_title", "Intake Form")

        if not answers:
            return "No form answers available for analysis."

        # Format answers for analysis
        answers_text = "\n".join([
            f"- **{key}**: {value}" for key, value in answers.items()
        ])

        # Check for birth data to determine if astrology-focused
        has_birth_data = any(
            key in answers for key in ["birth_date", "birth_time", "birth_place"]
        )

        # Select appropriate prompt based on therapy type context
        if has_birth_data:
            # Use astrology-focused prompt
            prompt = ASTROLOGY_FORM_PROMPT
            birth_info = []
            if answers.get("birth_date"):
                birth_info.append(f"Birth Date: {answers['birth_date']}")
            if answers.get("birth_time"):
                birth_info.append(f"Birth Time: {answers['birth_time']}")
            if answers.get("birth_place"):
                birth_info.append(f"Birth Place: {answers['birth_place']}")

            content = f"""## Form: {form_title}

### Birth Data Provided:
{chr(10).join(birth_info)}

### All Form Answers:
{answers_text}
"""
        else:
            # Use standard form analysis prompt
            prompt = FORM_ANALYSIS_PROMPT
            content = f"""## Form: {form_title}

### Form Answers:
{answers_text}
"""

        # Check for risk flags - if flagged, use triage prompt instead
        risk_flags = metadata.get("risk_flags", [])
        is_flagged = metadata.get("is_flagged", False)
        requires_review = metadata.get("requires_review", False)

        if is_flagged or requires_review or risk_flags:
            # Format flags for the triage prompt
            if risk_flags:
                flags_text = "\n".join([
                    f"- {f.get('field_label', f.get('field_id', 'Unknown'))}: {f.get('reason', 'Flagged')}"
                    for f in risk_flags
                ])
            else:
                flags_text = "No specific flags, but form is marked for manual review."

            prompt = TRIAGE_FORM_PROMPT.format(flags=flags_text)
            content = f"""## Form: {form_title}

### Risk Flags:
{flags_text}

### All Form Answers:
{answers_text}
"""

        response = self._current_model.generate_content([
            prompt,
            content,
        ])

        # v1.3.5: Log usage for form analysis (SENTINEL on triage, SCAN on normal)
        task = (
            "triage"
            if (is_flagged or requires_review or risk_flags)
            else "form_analysis"
        )
        await self._log_ai_usage(response, task)

        return response.text

    async def _analyze_audio(self, entry: ClinicalEntry) -> str:
        """Analyze audio content by uploading and transcribing."""
        file_url = (
            entry.entry_metadata.get("file_url") if entry.entry_metadata else None
        )

        if not file_url:
            return "No audio file attached to this entry."

        # Extract filename from URL
        filename = os.path.basename(file_url)
        file_path = os.path.join(self.uploads_dir, filename)

        if not os.path.exists(file_path):
            return f"Audio file not found: {filename}"

        try:
            # Upload file to Gemini
            # Force correct MIME type for audio files
            extension = os.path.splitext(file_path)[1].lower()
            mime_type_map = {
                ".webm": "audio/webm",
                ".mp3": "audio/mpeg",
                ".wav": "audio/wav",
                ".m4a": "audio/mp4",
                ".ogg": "audio/ogg",
                ".flac": "audio/flac",
            }
            mime_type = mime_type_map.get(
                extension, mimetypes.guess_type(file_path)[0] or "audio/mpeg"
            )
            uploaded_file = genai.upload_file(file_path, mime_type=mime_type)

            # Wait for file to be processed (ACTIVE state)
            import time

            max_wait = 60  # Maximum 60 seconds
            wait_time = 0
            while uploaded_file.state.name == "PROCESSING" and wait_time < max_wait:
                time.sleep(2)
                wait_time += 2
                uploaded_file = genai.get_file(uploaded_file.name)

            if uploaded_file.state.name != "ACTIVE":
                return f"Error: Audio file processing failed. State: {uploaded_file.state.name}"

            # Generate analysis with audio
            response = self._current_model.generate_content([
                AUDIO_TRANSCRIPTION_PROMPT,
                uploaded_file,
            ])

            # Clean up uploaded file
            try:
                genai.delete_file(uploaded_file.name)
            except Exception:
                pass  # Ignore cleanup errors

            return response.text

        except Exception as e:
            return f"Error processing audio: {str(e)}"

    async def _analyze_document(self, entry: ClinicalEntry) -> str:
        """Analyze document or image content."""
        file_url = (
            entry.entry_metadata.get("file_url") if entry.entry_metadata else None
        )

        if not file_url:
            # If no file but has content, analyze as text
            if entry.content:
                return await self._analyze_text(entry.content)
            return "No document or content available for analysis."

        # Extract filename from URL
        filename = os.path.basename(file_url)
        file_path = os.path.join(self.uploads_dir, filename)

        if not os.path.exists(file_path):
            return f"Document file not found: {filename}"

        try:
            # Get MIME type
            mime_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"

            # Handle DOCX files by extracting text
            if (
                filename.endswith(".docx")
                or mime_type
                == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ):
                return await self._analyze_docx(file_path)

            # Handle unsupported MIME types
            if mime_type == "application/octet-stream":
                # Try to read as plain text
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        text_content = f.read()
                    return await self._analyze_text(text_content)
                except UnicodeDecodeError:
                    return f"Unsupported file format. Cannot analyze binary files without specific handler."

            # Upload file to Gemini for images and PDFs
            uploaded_file = genai.upload_file(file_path, mime_type=mime_type)

            # Generate analysis
            response = self._current_model.generate_content([
                DOCUMENT_ANALYSIS_PROMPT,
                uploaded_file,
            ])

            # Clean up uploaded file
            try:
                genai.delete_file(uploaded_file.name)
            except Exception:
                pass  # Ignore cleanup errors

            return response.text

        except Exception as e:
            return f"Error processing document: {str(e)}"

    async def generate_patient_insights(
        self, patient, entries: list, bookings: list
    ) -> dict:
        """
        Generate AI-powered clinical insights for a patient.

        Args:
            patient: Patient model instance
            entries: Recent ClinicalEntry list
            bookings: Recent Booking list

        Returns:
            dict with insights structure
        """
        import json

        # Build context
        patient_name = f"{patient.first_name} {patient.last_name}"

        # Format journey status
        journey_text = "Sin journeys activos"
        if patient.journey_status:
            journey_text = ", ".join([
                f"{k.replace('_', ' ')}: {v.replace('_', ' ')}"
                for k, v in patient.journey_status.items()
            ])

        # Format recent entries
        if entries:
            entries_text = "\n".join([
                f"- [{e.entry_type.value}] {e.content[:200] if e.content else 'Sin contenido'}..."
                for e in entries[:3]
            ])
        else:
            entries_text = "Sin notas clínicas registradas"

        # Format bookings
        if bookings:
            bookings_text = "\n".join([
                f"- {b.start_time.strftime('%d/%m/%Y')} - {b.status.value}"
                for b in bookings[:3]
            ])
        else:
            bookings_text = "Sin reservas registradas"

        # Get today's date for context
        from datetime import date

        today_str = date.today().strftime("%d/%m/%Y")

        prompt = f"""Eres AletheIA, el asistente clínico IA del terapeuta.

Analiza el estado actual de este paciente y proporciona insights accionables para el terapeuta.

## FECHA DE HOY
{today_str}

## PACIENTE
Nombre: {patient_name}

## ESTADO DEL JOURNEY
{journey_text}

## ENTRADAS CLÍNICAS RECIENTES
{entries_text}

## RESERVAS
{bookings_text}

## INSTRUCCIONES
Genera un JSON válido con esta estructura exacta (sin markdown, solo JSON puro):

{{
  "summary": "Resumen clínico de 1-2 frases sobre el estado actual del paciente",
  "alerts": [
    {{"type": "critical|warning|info", "message": "Descripción de la alerta"}}
  ],
  "suggestions": ["Sugerencia accionable 1", "Sugerencia 2"],
  "engagementScore": 0-100,
  "riskLevel": "low|medium|high",
  "keyThemes": ["tema1", "tema2"]
}}

REGLAS:
- alerts: incluir SOLO si hay situaciones que requieran atención (bloqueos, estancamiento, pagos pendientes)
- suggestions: máximo 3, específicas y accionables
- engagementScore: basado en actividad reciente y estado del journey
- riskLevel: "high" si hay bloqueos médicos o alertas críticas
- keyThemes: 2-4 temas relevantes del estado actual
- FECHAS: Usa la fecha de hoy ({today_str}) como referencia. Si una reserva es en los próximos 7 días, es PRÓXIMA. Si es más de 30 días, es LEJANA.

Responde SOLO con el JSON, sin texto adicional."""

        try:
            import asyncio

            # v1.3.5: Get routed model for briefing/insights (NOW unit)
            model = await self._get_model_for_task("briefing")

            # Run Gemini in thread pool to not block event loop
            response = await asyncio.to_thread(model.generate_content, [prompt])

            # v1.3.5: Log usage for NOW briefing
            await self._log_ai_usage(response, "briefing", model._model_name)

            # Parse JSON from response
            json_text = response.text.strip()

            # Clean up potential markdown code blocks
            if json_text.startswith("```"):
                json_text = json_text.split("```")[1]
                if json_text.startswith("json"):
                    json_text = json_text[4:]
                json_text = json_text.strip()

            insights = json.loads(json_text)

            # Validate required fields
            return {
                "summary": insights.get(
                    "summary", f"{patient.first_name} es un paciente en seguimiento."
                ),
                "alerts": insights.get("alerts", []),
                "suggestions": insights.get("suggestions", [])[:3],
                "engagementScore": min(
                    100, max(0, insights.get("engagementScore", 50))
                ),
                "riskLevel": insights.get("riskLevel", "low"),
                "keyThemes": insights.get("keyThemes", ["En seguimiento"]),
                "lastAnalysis": None,
            }

        except json.JSONDecodeError as e:
            print(f"JSON parse error from Gemini: {e}")
            raise
        except Exception as e:
            print(f"Gemini error: {e}")
            raise

    async def _analyze_docx(self, file_path: str) -> str:
        """Extract text from DOCX and analyze."""
        try:
            from docx import Document

            doc = Document(file_path)
            text_content = "\n".join([
                para.text for para in doc.paragraphs if para.text.strip()
            ])

            if not text_content.strip():
                return "The DOCX document appears to be empty."

            return await self._analyze_text(text_content)
        except ImportError:
            return "DOCX support requires python-docx library. Please install it."
        except Exception as e:
            return f"Error reading DOCX file: {str(e)}"

    async def analyze_chat_transcript(self, transcript: str) -> dict:
        """
        Analyze WhatsApp chat transcript for clinical insights.

        v1.3.5: Now async with PULSE task routing.

        Args:
            transcript: Raw chat transcript (Patient: ... / System: ...)

        Returns:
            dict with summary, sentiment_score, emotional_state, risk_flags, suggestion
        """
        system_prompt = """ROLE:
Eres AletheIA, un supervisor clínico experto en terapia asistida por psicodélicos y salud mental.
Tu trabajo es analizar transcripciones diarias de chats de WhatsApp entre un Paciente y un Terapeuta (o sistema automatizado).

CONTEXT:
El paciente puede estar en fase de Preparación, Dosis o Integración.
Busca sutilezas. No te limites a palabras clave obvias.
Diferencia entre "procesamiento emocional difícil" (normal en integración) y "crisis de seguridad" (riesgo).

INPUT:
Una transcripción de chat cruda del día.

OUTPUT FORMAT (JSON ONLY):
{
  "summary": "Resumen clínico de 1-2 frases sobre el estado del paciente hoy.",
  "sentiment_score": float, // De -1.0 (Muy Negativo/Crisis) a 1.0 (Muy Positivo/Flow). 0.0 es Neutro.
  "emotional_state": "string", // Ej: "Ansioso", "Reflexivo", "Disociado", "Esperanzado".
  "risk_flags": [ // Lista de strings. VACÍA si no hay riesgos.
     // Ej: "Ideación Suicida", "Abandono de Medicación", "Insomnio Severo", "Interacción Farmacológica"
  ],
  "suggestion": "string" // Sugerencia breve para el terapeuta (ej: "Verificar adherencia a dieta", "Llamar para check-in").
}

RULES FOR ANALYSIS:
1. **Integration vs Crisis:** Si el paciente dice "ha sido un día duro" o "estoy llorando mucho" post-sesión, esto es PROCESAMIENTO (Sentimiento -0.2), no CRISIS. Solo marca RIESGO si hay desesperanza, autolesión o desconexión con la realidad.
2. **Medication:** Cualquier mención a dejar medicación psiquiátrica de golpe es RIESGO ALTO.
3. **Keywords:** Presta atención a palabras como "oscuridad", "eterno", "sin salida", "voces".
4. **Language:** Responde siempre en el mismo idioma que el chat (Español o Inglés).

EXAMPLE INPUT:
"Hola, hoy me siento raro. No he dormido nada. Siento que la sesión del sábado me dejó muy abierto y me cuesta ir a trabajar."

EXAMPLE OUTPUT JSON:
{
  "summary": "Paciente reporta insomnio y vulnerabilidad emocional post-sesión ('muy abierto'). Dificultad funcional leve.",
  "sentiment_score": -0.3,
  "emotional_state": "Vulnerable/Abierto",
  "risk_flags": [],
  "suggestion": "Recomendar técnicas de enraizamiento (grounding) y validar normalidad del proceso."
}"""

        try:
            import asyncio

            # v1.3.5: Get routed model for chat analysis (PULSE unit)
            model = await self._get_model_for_task("chat")

            # Run in thread pool to not block event loop
            response = await asyncio.to_thread(
                model.generate_content,
                [system_prompt, f"TRANSCRIPT:\n{transcript}"],
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            )

            # v1.3.5: Log usage for PULSE chat analysis
            await self._log_ai_usage(response, "chat", model._model_name)

            import json

            result = json.loads(response.text)

            # Validate and sanitize
            return {
                "summary": result.get("summary", "Sin resumen disponible"),
                "sentiment_score": float(result.get("sentiment_score", 0.0)),
                "emotional_state": result.get("emotional_state", "Neutro"),
                "risk_flags": result.get("risk_flags", []),
                "suggestion": result.get("suggestion", ""),
            }

        except Exception as e:
            print(f"AletheIA error: {e}")
            return self._neutral_chat_response()

    def _neutral_chat_response(self) -> dict:
        """Return neutral response when analysis fails."""
        return {
            "summary": "Análisis no disponible",
            "sentiment_score": 0.0,
            "emotional_state": "Desconocido",
            "risk_flags": [],
            "suggestion": "Revisar manualmente la conversación",
        }


# Singleton instance
_aletheia_instance: Optional[AletheIA] = None


def get_aletheia() -> AletheIA:
    """Get or create the AletheIA service instance."""
    global _aletheia_instance

    if _aletheia_instance is None:
        _aletheia_instance = AletheIA()

    return _aletheia_instance
