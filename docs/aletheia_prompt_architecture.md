# AletheIA Prompt Architecture - Architect Reference

## Current State (v1.1.0)

AletheIA uses **8 specialized system prompts** across 2 services, each tuned for specific clinical contexts.

### Core Clinical Prompts

| Prompt | File | Trigger | Purpose |
|--------|------|---------|---------|
| `CLINICAL_SYSTEM_PROMPT` | [aletheia.py](file:///Users/humbert/Documents/KuraOS/backend/app/services/aletheia.py#L22-50) | Text session notes | Structured clinical assessment with risk flags |
| `AUDIO_TRANSCRIPTION_PROMPT` | [aletheia.py](file:///Users/humbert/Documents/KuraOS/backend/app/services/aletheia.py#L52-89) | Audio files | Full session synthesis (NOT verbatim transcription) |
| `DOCUMENT_ANALYSIS_PROMPT` | [aletheia.py](file:///Users/humbert/Documents/KuraOS/backend/app/services/aletheia.py#L91-100) | PDF/images | Document type detection + clinical relevance |

### Form-Specific Prompts

| Prompt | Purpose |
|--------|---------|
| `FORM_ANALYSIS_PROMPT` | Generic intake form review |
| `ASTROLOGY_FORM_PROMPT` | Holistic/Human Design birth data acknowledgment |
| `TRIAGE_FORM_PROMPT` | Safety screening for psychedelic protocols (SSRIs, MAOIs, contraindications) |

### Chat Intelligence

| Prompt | File | Purpose |
|--------|------|---------|
| `analyze_chat_transcript` (inline) | [aletheia.py](file:///Users/humbert/Documents/KuraOS/backend/app/services/aletheia.py#L614-653) | WhatsApp daily analysis → sentiment score + risk flags (JSON output) |

### Platform Support

| Prompt | File | Purpose |
|--------|------|---------|
| `SYSTEM_PROMPT` | [help_assistant.py](file:///Users/humbert/Documents/KuraOS/backend/app/services/help_assistant.py#L25-47) | Zero-hallucination support bot (knows modules, respects tier) |

---

## Prompt Architecture Characteristics

### 1. Language Awareness
All prompts end with: `"Respond in the same language as the input content."`

### 2. Risk Detection Pattern
Clinical prompts consistently flag:
- ⚠️ Suicidal ideation / self-harm
- ⚠️ Substance abuse
- ⚠️ Crisis situations
- ⚠️ Safety concerns

### 3. Therapeutic Lineage Sensitivity
Prompts adapt to modality (astrology, psychedelic, somatic) based on form metadata.

### 4. "Synthesis, Not Transcription"
Audio analysis explicitly avoids verbatim transcription in favor of clinical synthesis.

---

## Future Roadmap (Phase 2-3)

### 1. Per-Organization Custom Prompts
**Status**: Planned (Q2 2026)

| Feature | Description |
|---------|-------------|
| **Custom Suffix** | Org-level prompt appendix (stored in `Organization.settings.custom_ai_prompt`) |
| **Terminology Injection** | Auto-replace "patient" with org's `terminology_preference` (Client/Consultant) |
| **Language Lock** | Force output in specific language regardless of input |

### 2. Prompt Versioning & A/B Testing
**Status**: Research

- Store prompt templates in `SystemSetting` table (not hardcoded)
- Version control with rollback capability
- A/B testing for output quality optimization

### 3. Context Enrichment Pipeline
**Status**: Planned (v1.2+)

| Stage | Data Injected |
|-------|---------------|
| **Patient History** | Last 3 session summaries, current journey stage |
| **Therapist Preferences** | Output language, preferred output format |
| **Temporal Context** | "This is session 5 of 8", "3 weeks since last session" |

### 4. Model-Specific Prompt Variants
**Status**: Phase 3 (Model Garden)

Different models may need different prompt structures:
- **Gemini**: Long context, native audio
- **Claude**: Explicit XML tags, higher reasoning
- **Llama**: Shorter context windows, structured output emphasis

---

## Technical Notes for Factory Integration

When integrating with `ProviderFactory` (v1.1.1):

```python
# Current: Prompts hardcoded
response = model.generate_content([CLINICAL_SYSTEM_PROMPT, content])

# Future: Provider-aware prompting
provider = ProviderFactory.get_provider(model_spec)
prompt = PromptRegistry.get_prompt(
    task="clinical_analysis",
    provider=provider.provider_id,
    org_id=org_id,
)
response = await provider.analyze_text(content, prompt)
```

### `PromptRegistry` Concept (Future)

```python
class PromptRegistry:
    @staticmethod
    def get_prompt(task: str, provider: str, org_id: str = None) -> str:
        # 1. Load base template from SystemSetting
        # 2. Apply provider-specific adjustments
        # 3. Inject org-level customizations
        # 4. Return final prompt
```
