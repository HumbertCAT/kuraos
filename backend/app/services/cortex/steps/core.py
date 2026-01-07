"""
Core Pipeline Steps - Implementations

These steps wrap existing AletheIA logic units into
the Cortex pipeline architecture.
"""

import logging
from typing import Optional, Dict, Any

from app.services.cortex.steps.base import PipelineStep, StepExecutionError
from app.services.cortex.steps.registry import register_step
from app.services.cortex.context import PatientEventContext

logger = logging.getLogger(__name__)


@register_step("transcribe")
class TranscribeStep(PipelineStep):
    """
    Audio → Text transcription step.

    Reads: context.get_evidence("audio:*")
    Writes: context.add_output("transcribe", "transcript", ...)

    Wraps the existing audio transcription logic using Gemini.
    """

    step_type = "transcribe"

    async def execute(self, context: PatientEventContext) -> None:
        """Transcribe audio from context resources."""
        from app.services.ai.factory import ProviderFactory

        # Find audio resource
        resources = context.list_resources()
        audio_uri = None
        for key, uri in resources.items():
            if "audio" in key:
                audio_uri = uri
                break

        if not audio_uri:
            raise StepExecutionError(
                self.step_type, "No audio resource found in context"
            )

        logger.info(f"TranscribeStep: Processing {audio_uri}")

        try:
            # Get AI provider and transcribe
            provider = ProviderFactory.get_provider("gemini:2.5-flash")

            # The provider handles GCS URIs directly under BAA
            result = await provider.transcribe_audio(audio_uri)

            # Write outputs
            context.add_output(self.step_type, "transcript", result.get("text", ""))
            context.add_output(
                self.step_type, "duration_seconds", result.get("duration")
            )
            context.add_output(self.step_type, "language", result.get("language", "es"))

            # Store transcript as new resource for downstream steps
            if result.get("text"):
                context.add_evidence(
                    "transcript:raw",
                    f"memory://{context.patient_id}/transcript",  # Virtual URI
                )

            logger.info(
                f"TranscribeStep: Complete ({len(result.get('text', ''))} chars)"
            )

        except Exception as e:
            raise StepExecutionError(self.step_type, str(e), e)


@register_step("analyze")
class AnalyzeStep(PipelineStep):
    """
    Text → Clinical Analysis step.

    Reads: context outputs from previous steps (transcript, form data, etc.)
    Writes: context.add_output("analyze", "soap_note", ...)

    Uses configurable prompts based on the step config.
    """

    step_type = "analyze"

    def __init__(self, prompt_key: str = "clinical_analysis", model: str = None):
        self.prompt_key = prompt_key
        self.model = model or "gemini:2.5-pro"

    async def execute(self, context: PatientEventContext) -> None:
        """Analyze clinical content and generate insights."""
        from app.services.ai.factory import ProviderFactory

        # Gather input text from previous steps
        input_text = self._gather_input(context)

        if not input_text:
            raise StepExecutionError(
                self.step_type, "No input text available for analysis"
            )

        logger.info(
            f"AnalyzeStep: Analyzing {len(input_text)} chars with {self.prompt_key}"
        )

        try:
            provider = ProviderFactory.get_provider(self.model)

            # Get prompt from centralized library
            from app.services.ai.prompts import get_prompt, PromptTask

            task_map = {
                "clinical_analysis": PromptTask.CLINICAL_ANALYSIS,
                "triage": PromptTask.TRIAGE_FORM,
                "form_analysis": PromptTask.FORM_ANALYSIS,
            }
            task = task_map.get(self.prompt_key, PromptTask.CLINICAL_ANALYSIS)
            prompt = get_prompt(task)

            result = await provider.generate(
                prompt=prompt, content=input_text, output_format="json"
            )

            # Write structured outputs
            context.add_output(self.step_type, "analysis_json", result)
            context.add_output(self.step_type, "prompt_key", self.prompt_key)

            # Extract key fields if present
            if isinstance(result, dict):
                if "risk_level" in result:
                    context.add_output(
                        self.step_type, "risk_level", result["risk_level"]
                    )
                if "summary" in result:
                    context.add_output(self.step_type, "summary", result["summary"])

            logger.info(f"AnalyzeStep: Complete")

        except Exception as e:
            raise StepExecutionError(self.step_type, str(e), e)

    def _gather_input(self, context: PatientEventContext) -> str:
        """Gather text from previous step outputs or direct input."""
        parts = []

        # v1.5.5: Check for direct text input (SESSION_NOTE entries)
        input_data = context.get_output("input", "form_data")
        if input_data and isinstance(input_data, dict):
            text_content = input_data.get("text_content")
            if text_content:
                parts.append(f"## Nota de Sesión\n{text_content}")

        # Check for transcript from transcribe step
        transcript = context.get_output("transcribe", "transcript")
        if transcript:
            parts.append(f"## Transcripción\n{transcript}")

        # Check for form data from intake step
        form_data = context.get_output("intake", "form_text")
        if form_data:
            parts.append(f"## Datos del Formulario\n{form_data}")

        # Check for OCR text
        ocr_text = context.get_output("ocr", "extracted_text")
        if ocr_text:
            parts.append(f"## Texto Extraído\n{ocr_text}")

        return "\n\n".join(parts)


@register_step("ocr")
class OCRStep(PipelineStep):
    """
    Image/Document → Text extraction step (Grapho).

    Reads: context.get_evidence("document:*" or "image:*")
    Writes: context.add_output("ocr", "extracted_text", ...)

    Uses Gemini Vision for OCR/document understanding.
    """

    step_type = "ocr"

    async def execute(self, context: PatientEventContext) -> None:
        """Extract text from images/documents."""
        from app.services.ai.factory import ProviderFactory

        # Find image/document resource
        resources = context.list_resources()
        image_uri = None
        for key, uri in resources.items():
            if any(t in key for t in ["image", "document", "photo", "scan"]):
                image_uri = uri
                break

        if not image_uri:
            raise StepExecutionError(
                self.step_type, "No image or document resource found in context"
            )

        logger.info(f"OCRStep: Processing {image_uri}")

        try:
            provider = ProviderFactory.get_provider("gemini:2.5-flash")

            result = await provider.analyze_image(
                image_uri=image_uri,
                prompt="Extract all text from this clinical document. Preserve structure and formatting.",
            )

            context.add_output(self.step_type, "extracted_text", result.get("text", ""))
            context.add_output(
                self.step_type, "document_type", result.get("document_type")
            )
            context.add_output(
                self.step_type, "confidence", result.get("confidence", 0.0)
            )

            logger.info(f"OCRStep: Extracted {len(result.get('text', ''))} chars")

        except Exception as e:
            raise StepExecutionError(self.step_type, str(e), e)


@register_step("triage")
class TriageStep(PipelineStep):
    """
    Content → Risk Assessment step (Sentinel).

    Reads: Any text content from previous steps
    Writes: context.add_output("triage", "risk_level", ...)

    Performs clinical risk triage (CRITICAL/HIGH/MEDIUM/LOW/NONE).
    """

    step_type = "triage"

    async def execute(self, context: PatientEventContext) -> None:
        """Assess clinical risk from content."""

        # Gather all available text
        all_text = []
        for stage, outputs in context.outputs.items():
            if isinstance(outputs, dict):
                for key, value in outputs.items():
                    if isinstance(value, str) and len(value) > 50:
                        all_text.append(value)

        if not all_text:
            context.add_output(self.step_type, "risk_level", "NONE")
            context.add_output(self.step_type, "reason", "No content to assess")
            return

        content = "\n\n".join(all_text)
        logger.info(f"TriageStep: Assessing {len(content)} chars")

        try:
            from app.services.ai.factory import ProviderFactory
            from app.services.ai.prompts import get_prompt, PromptTask

            provider = ProviderFactory.get_provider("gemini:2.5-flash")
            prompt = get_prompt(PromptTask.TRIAGE_FORM)

            result = await provider.generate(
                prompt=prompt, content=content, output_format="json"
            )

            risk_level = (
                result.get("risk_level", "NONE") if isinstance(result, dict) else "NONE"
            )

            context.add_output(self.step_type, "risk_level", risk_level)
            context.add_output(self.step_type, "evidence", result.get("evidence", []))
            context.add_output(
                self.step_type, "recommended_action", result.get("recommended_action")
            )

            logger.info(f"TriageStep: Risk level = {risk_level}")

        except Exception as e:
            # Triage should not fail the pipeline - default to unknown
            logger.warning(f"TriageStep failed, defaulting to MEDIUM: {e}")
            context.add_output(self.step_type, "risk_level", "MEDIUM")
            context.add_output(self.step_type, "error", str(e))


@register_step("intake")
class IntakeStep(PipelineStep):
    """
    Form Data → Structured Intake step.

    Reads: Raw form submission data
    Writes: context.add_output("intake", "form_text", ...)

    Processes intake form submissions for clinical use.
    """

    step_type = "intake"

    async def execute(self, context: PatientEventContext) -> None:
        """Process intake form data."""
        # Intake typically receives form data as input
        # This step normalizes it for downstream analysis

        form_data = context.get_output("input", "form_data")

        if not form_data:
            raise StepExecutionError(self.step_type, "No form data provided in context")

        logger.info(f"IntakeStep: Processing form with {len(form_data)} fields")

        # Convert form data to readable text
        if isinstance(form_data, dict):
            lines = []
            for key, value in form_data.items():
                if value:
                    lines.append(f"**{key}**: {value}")
            form_text = "\n".join(lines)
        else:
            form_text = str(form_data)

        context.add_output(self.step_type, "form_text", form_text)
        context.add_output(
            self.step_type,
            "field_count",
            len(form_data) if isinstance(form_data, dict) else 1,
        )

        logger.info(f"IntakeStep: Normalized to {len(form_text)} chars")
