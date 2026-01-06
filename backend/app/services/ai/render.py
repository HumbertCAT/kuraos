"""
Prompt Template Renderer

Renders Jinja2 templates for AI system instructions.
v1.4.4: ADR-021 Native Prompt Engineering
"""

import os
from typing import Optional
from functools import lru_cache

from jinja2 import Environment, FileSystemLoader, TemplateNotFound


# Template directory
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")


@lru_cache(maxsize=1)
def _get_jinja_env() -> Environment:
    """Get cached Jinja2 environment."""
    return Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=False,  # Not HTML, no escaping needed
        trim_blocks=True,
        lstrip_blocks=True,
    )


def render_prompt(template_name: str, context: Optional[dict] = None) -> str:
    """
    Render a prompt template with the given context.

    Args:
        template_name: Name of template file (e.g., 'clinical_v1.jinja2')
        context: Variables to inject into template

    Returns:
        Rendered prompt string

    Raises:
        TemplateNotFound: If template doesn't exist

    Example:
        >>> render_prompt('triage_v1.jinja2', {'flags': 'Cardiac history'})
    """
    env = _get_jinja_env()
    template = env.get_template(template_name)
    return template.render(context or {})


def get_system_prompt(task_type: str, context: Optional[dict] = None) -> str:
    """
    Get system prompt for a task type.

    Maps task types to versioned templates and renders them.

    Args:
        task_type: Task identifier (e.g., 'clinical_analysis', 'triage')
        context: Variables for template

    Returns:
        Rendered system instruction string
    """
    # Task to template mapping
    TASK_TEMPLATES = {
        "clinical_analysis": "clinical_v1.jinja2",
        "audio_synthesis": "audio_v1.jinja2",
        "document_analysis": "document_v1.jinja2",
        "form_analysis": "form_v1.jinja2",
        "triage": "triage_v1.jinja2",
        "chat": "chat_v1.jinja2",
        "help_bot": "help_v1.jinja2",
        "briefing": "clinical_v1.jinja2",  # Reuse clinical for now
        "ai_enhancement": "clinical_v1.jinja2",
    }

    template_name = TASK_TEMPLATES.get(task_type, "clinical_v1.jinja2")

    try:
        return render_prompt(template_name, context)
    except TemplateNotFound:
        # Fallback to legacy prompts.py
        from app.services.ai.prompts import PROMPTS, PromptTask

        task_enum = getattr(PromptTask, task_type.upper(), PromptTask.CLINICAL_ANALYSIS)
        prompt = PROMPTS.get(task_enum, "")

        # Apply context if provided
        if context:
            try:
                return prompt.format(**context)
            except KeyError:
                pass
        return prompt
