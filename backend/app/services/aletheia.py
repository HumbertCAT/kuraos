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


# Clinical analysis system prompt
CLINICAL_SYSTEM_PROMPT = """You are AletheIA, an AI clinical assistant for therapists.

Analyze the provided clinical content and generate a structured assessment.

## Your Analysis Should Include:

1. **Summary**: Brief overview of the content (2-3 sentences)

2. **Clinical Observations**: Key themes, patterns, or concerns noted

3. **Risk Assessment**: Flag any indicators of:
   - ⚠️ Suicidal ideation or self-harm
   - ⚠️ Substance abuse
   - ⚠️ Crisis indicators
   - ⚠️ Safety concerns
   
   If no risk indicators are present, state "No risk indicators identified."

4. **Therapeutic Notes**: Suggestions for the therapist to consider

## Guidelines:
- Be concise but thorough
- Use clinical language appropriate for mental health professionals
- Do NOT provide diagnoses - only observations
- Maintain a supportive, non-judgmental tone
- If content is unclear or insufficient, note what additional information would be helpful

Respond in the same language as the input content.
"""

AUDIO_TRANSCRIPTION_PROMPT = """You are AletheIA, an AI clinical assistant for therapists.

Listen to this ENTIRE therapy session audio from START to FINISH. Your task is to SYNTHESIZE and ANALYZE, NOT transcribe verbatim.

## IMPORTANT: You have unlimited input context. Process the FULL audio duration.

Provide your analysis in these sections:

## 1. RESUMEN CLÍNICO COMPLETO
A comprehensive clinical summary covering the ENTIRE session (beginning to end):
- Opening: How did the session start? Patient's initial state.
- Main themes: Key topics discussed throughout
- Patient's emotional journey: How their state evolved during the session
- Therapeutic interventions: What techniques were used
- Closing: How did the session end? Any homework assigned? Next steps discussed?

## 2. MOMENTOS CLAVE (Cronológico)
A bulleted timeline of significant moments:
- [Early session] ...
- [Mid session] ...
- [Late session] ...

## 3. EVALUACIÓN DE RIESGO
Explicitly flag if present, or state "Sin indicadores de riesgo identificados":
- ⚠️ Ideación suicida o autolesión
- ⚠️ Abuso de sustancias
- ⚠️ Crisis o situaciones de seguridad

## 4. CITAS TEXTUALES RELEVANTES
Include ONLY 2-4 direct quotes that represent:
- Breakthrough moments
- Risk indicators (if any)
- Core therapeutic insights

## 5. NOTAS PARA SEGUIMIENTO
Recommendations for the therapist for future sessions.

Respond in the same language as the audio content."""

DOCUMENT_ANALYSIS_PROMPT = """Analyze this clinical document or image.

Provide:
1. **Document Type**: What kind of document this appears to be
2. **Key Information**: Important details extracted
3. **Clinical Relevance**: How this relates to patient care
4. **Action Items**: Any follow-up actions suggested

Respond in the same language as the document content.
"""

FORM_ANALYSIS_PROMPT = """Analyze this intake form submission.

Provide:
1. **Key Information**: Important details from the answers
2. **Initial Observations**: Preliminary clinical impressions
3. **Preparation Notes**: How to prepare for the first session

Respond in the same language as the form content.
"""

ASTROLOGY_FORM_PROMPT = """You are AletheIA, an AI assistant for holistic therapists specializing in astrology and human design.

The patient provided birth data in their intake form. Your role:
1. **Acknowledge Data Reception**: Warmly confirm receipt of their birth information
2. **Brief Significance**: Mention the Sun sign if birth date is provided (do NOT calculate full chart)
3. **Context for Session**: Explain how this data will help personalize their experience
4. **Next Steps**: What the therapist can do with this information

IMPORTANT:
- Do NOT provide full astrological charts or detailed readings
- Keep the tone warm, supportive, and professional
- Focus on validating the patient's choice to share this personal information

Respond in the same language as the form content.
"""

TRIAGE_FORM_PROMPT = """You are AletheIA acting as a Medical Triage Officer for holistic therapy intake.

CONTEXT: This form submission has been flagged for safety review.
Flagged items: {flags}

Your role is to conduct a conservative safety review:

1. **Flagged Items Review**: Assess each flagged medical item and its potential implications
2. **Free-Text Scan**: Review all text answers for mentions of:
   - SSRIs, MAOIs, or other psychiatric medications
   - Psychotic episodes or history of psychosis
   - Unstable medication history
   - Recent hospitalizations
   - Cardiovascular conditions
3. **Risk Assessment**: Provide a clear risk summary
4. **Recommendations**: Suggest precautions or contraindications

CRITICAL INSTRUCTIONS:
- Be CONSERVATIVE - when in doubt, flag for human review
- Do NOT clear anyone for psychedelic work without explicit therapist approval
- Highlight ANY ambiguity in the responses
- This is a safety tool, not a diagnostic tool

Respond in the same language as the form content.
"""


class AletheIA:
    """AI Clinical Analysis Service using Google Gemini."""

    def __init__(self):
        """Initialize the AletheIA service with Gemini configuration."""
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not configured")

        genai.configure(api_key=settings.GOOGLE_API_KEY)

        # Configure the model with safety settings appropriate for clinical content
        self.model = genai.GenerativeModel(
            model_name=settings.AI_MODEL,
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            },
            generation_config={
                "temperature": 0.4,
                "top_p": 0.95,
                "max_output_tokens": 8192,  # Increased for long transcriptions
            },
        )

        self.uploads_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "static",
            "uploads",
        )

    async def analyze(self, entry: ClinicalEntry, model_name: str = None) -> dict:
        """
        Perform AI analysis on a clinical entry.

        Args:
            entry: The ClinicalEntry to analyze
            model_name: Optional model override (reads from system_settings if provided)

        Returns:
            dict with {id, date, text, model} for the analysis
        """
        # Use override model if provided and different from default
        effective_model = model_name or settings.AI_MODEL
        if model_name and model_name != settings.AI_MODEL:
            # Create a temporary model with the override
            self._current_model = genai.GenerativeModel(
                model_name=model_name,
                safety_settings=self.model._safety_settings,
                generation_config=self.model._generation_config,
            )
        else:
            self._current_model = self.model
        entry_type = entry.entry_type

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

            # Run Gemini in thread pool to not block event loop
            response = await asyncio.to_thread(self.model.generate_content, [prompt])

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

    def analyze_chat_transcript(self, transcript: str) -> dict:
        """
        Analyze WhatsApp chat transcript for clinical insights.

        Args:
            transcript: Raw chat transcript (Patient: ... / System: ...)

        Returns:
            dict with summary, sentiment_score, emotional_state, risk_flags, suggestion
        """
        if not self.model:
            return self._neutral_chat_response()

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
            response = self.model.generate_content(
                [system_prompt, f"TRANSCRIPT:\n{transcript}"],
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                ),
            )

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
