# AletheIA System Architecture

> **Status**: Production (v1.1.20)  
> **Last Updated**: 2026-01-03  
> **Source of Truth**: This document consolidates all AletheIA documentation.

---

## 1. Overview

**AletheIA** (from Greek ἀλήθεια, "truth/disclosure") is Kura OS's clinical intelligence engine. It analyzes patient data to reveal patterns, risks, and actionable insights for therapists.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALETHEIA ECOSYSTEM                           │
├──────────────────┬──────────────────┬───────────────────────────┤
│   INTELLIGENCE   │   AUTOMATION     │   INTERFACE               │
│   (Backend)      │   (Agents)       │   (Frontend)              │
├──────────────────┼──────────────────┼───────────────────────────┤
│ • Risk Detection │ • Concierge      │ • Sentinel Pulse          │
│ • Voice Analysis │ • Ghost Detector │ • Focus Session Card      │
│ • Form Screening │ • Collector      │ • Observatory Sidebar     │
│ • Cost Tracking  │ • Security Shield│ • Daily Briefing          │
└──────────────────┴──────────────────┴───────────────────────────┘
```

---

## 2. Intelligence Core (Backend)

### 2.1 Provider Factory
**File**: `backend/app/services/ai/factory.py`

```python
class ProviderFactory:
    providers = {
        "gemini": GeminiProvider,
        # Phase 3: "claude": ClaudeProvider, "llama": LlamaProvider
    }
    
    # Supports: 'gemini:2.5-flash' or 'gemini-2.5-flash'
    def get_provider(cls, model_spec: str) -> "AIProvider"
```

### 2.2 Available Models
**File**: `backend/app/services/ai/providers/gemini.py`

| Model ID | Audio | Input $/1M | Output $/1M |
|:---|:---:|---:|---:|
| `gemini-3-pro` | ✅ | $2.00 | $12.00 |
| `gemini-2.5-pro` | ✅ | $1.25 | $10.00 |
| `gemini-2.5-flash` ⭐ | ✅ | $0.15 | $0.60 |
| `gemini-2.5-flash-lite` | ✅ | $0.10 | $0.40 |
| `gemini-2.0-flash` | ✅ | $0.10 | $0.40 |
| `whisper-1` (OpenAI) | ✅ | $0.006/min | — |
| `claude-3-5-sonnet-v2` | ❌ | $3.00 | $15.00 |

⭐ Default model via `settings.AI_MODEL`

### 2.3 The Neural Ledger (FinOps)
**File**: `backend/app/services/ai/ledger.py`

#### Cost Formula
```python
cost_provider = (tokens_input / 1M) × price_in + (tokens_output / 1M) × price_out
cost_user = cost_provider × margin  # Default: 1.5x (50% gross margin)
```

#### Usage Tracking
Every AI call logs to `AiUsageLog`:
- `tokens_input`, `tokens_output`
- `cost_provider_usd`, `cost_user_credits`
- `task_type`: `transcription`, `clinical_analysis`, `chat`, `briefing`

#### Financial Health
**File**: `backend/app/services/finance/internal_ledger.py`

| Margin % | Status |
|---:|:---|
| ≥ 40% | `healthy` |
| ≥ 20% | `acceptable` |
| ≥ 0% | `low_margin` |
| < 0% | `unprofitable` |

---

## 3. Analysis Protocols

### 3.1 Risk Detection (Keyword-Based)
**File**: `backend/app/services/risk_detector.py`

```python
RISK_KEYWORDS = [
    # Suicidal ideation (ES + EN)
    "suicid", "suicide", "suicida", "quitarme la vida", "matarme",
    # Self-harm
    "harm", "autolesion", "cortarme", "hacerme daño",
    # Crisis
    "crisis", "emergencia", "emergency", "urgente",
    # Death wishes
    "morir", "muerte", "kill", "die", "quiero morir",
    # Hopelessness
    "sin esperanza", "hopeless", "sin salida", "no way out",
    # Violence
    "violencia", "violence", "pegar", "golpear",
]  # 34 keywords total
```

| Level | Condition | Action |
|:---|:---|:---|
| `HIGH` | Keyword detected | Alert therapist, block (CENTER tier) |
| `MEDIUM` | Negative sentiment | Dashboard flag |
| `LOW` | No indicators | Silent |

> **Note**: Current implementation is keyword-based (v0.9.2). Semantic AI analysis planned for future.

### 3.2 Engagement Score
**File**: `backend/app/api/v1/insights.py` → `_generate_fallback_insights()`

```python
engagement = 50                      # Base score
engagement += 20 if entries else 0   # Has clinical notes
engagement += 15 if bookings else 0  # Has appointments
engagement -= 20 if critical_alert   # Critical issues
engagement -= 10 if warning_alert    # Warnings
# Final: max(0, min(100, engagement))
```

| Score | Color | Status |
|---:|:---|:---|
| ≥ 70 | 🟢 Green | Healthy engagement |
| 40-69 | 🟡 Amber | Needs attention |
| < 40 | 🔴 Red | At risk |

### 3.3 Thematic Pills
Extracted clinical themes for quick review:

| Raw Note | Extracted Themes |
|:---|:---|
| "Pérdida de su madre hace 3 meses..." | `["Grief", "Family"]` |
| "Experiencia con psilocibina..." | `["Spiritual Emergency", "Integration"]` |

**Fallback themes**: `"Nuevo paciente"`, `"Bloqueo médico"`, `"Estancamiento"`, `"Pago pendiente"`

---

## 4. User Experience (Frontend)

### 4.1 Daily Briefing
**Component**: Dashboard widget  
**API**: `GET /api/v1/insights/daily-briefing`

Audio-first morning summary for practitioners:

```
Aggregation → Scripting (Gemini) → TTS (OpenAI) → Caching
```

| Data Source | Content |
|:---|:---|
| Calendar | Today's appointment count |
| Clinical Risk | HIGH/MEDIUM patients scheduled today |
| Financials | Pending payments (24h) |
| CRM | PendingActions awaiting approval |

**Output**: MP3 audio + text transcript. Cached in `static/briefings/`.

### 4.2 Observatory Sidebar
**Component**: `components/AletheiaObservatory.tsx`

| Widget | Purpose |
|:---|:---|
| Risk Score | -1.0 to +1.0 gauge |
| Risk Trend | 72h trend indicator |
| Voice Analysis | Tone, latency, depression % |
| Active Flags | Detected risk markers |
| Biomarkers | HRV, Sleep (Oura planned) |

**Visibility**: `xl` screens only (`hidden xl:flex`, `w-80`)

### 4.3 Help ChatBot
**Component**: `components/help/HelpChatBot.tsx`

- Platform-specific support grounded in MDX docs
- Session-aware (user role, tier, current page)
- Queries logged to `HelpQueryLog`

### 4.4 Sentinel Pulse (Real-Time Monitor)
**Component**: `apps/platform/components/SentimentPulseWidget.tsx`

The emotional ECG/HRV widget showing the patient's 7-day emotional trajectory.

| Aspect | Detail |
|:---|:---|
| **Data Source** | `Patient.last_insight_json.risk_score` |
| **Metric Range** | -1.0 (Crisis) to +1.0 (Stable) |
| **Location** | Clinical Canvas (Patient Profile - Right Column) |
| **Update Frequency** | On each clinical entry analysis |

**Visual States:**

| State | Condition | Appearance |
|:---|:---|:---|
| 🟢 **Active** | Data available | Green/Red gradient timeline |
| 👻 **Dormant** | No recent data (>7 days) | Ghost-faded graph |
| 🔒 **Locked** | BUILDER tier | Upsell overlay |

> [!IMPORTANT]
> **Data Coherence Rule**: Sentinel Pulse risk score MUST exactly match `Patient.last_insight_json.risk_score`. Any mismatch indicates a cache invalidation bug.

### 4.5 Focus Session Card (The Oracle)
**Component**: `apps/platform/components/dashboard/FocusSessionCard.tsx`

The Dashboard Hero widget that preps the therapist in seconds.

| Aspect | Detail |
|:---|:---|
| **Location** | Dashboard (Top-Left Hero Position) |
| **Purpose** | Show the *immediate* next session context |
| **Data** | Next booking + patient's last AletheIA insight |

**Content Display:**
- Patient name + profile photo
- Service type + scheduled time
- **Last Insight Summary**: The most recent `last_insight_json` excerpt
- Risk indicators (if any HIGH/MEDIUM flags)

> **Status**: 🟡 Currently uses mock insight data. Wiring to live API pending (see `technical-debt.md`).

---

## 5. Automation Agents

### 5.1 Philosophy: "Agents, Not Tools"
AI operates as **autonomous teammates**, not passive software.

| Legacy Term | New Term |
|:---|:---|
| Playbook | Protocolo |
| Install | Activar |
| Marketplace | Catálogo de Agentes |
| Automation | Agente IA |

### 5.2 Active Agents

| Agent | Trigger | Action |
|:---|:---|:---|
| **Concierge** | `LEAD_CREATED` | Welcome email + booking nudge |
| **Ghost Detector** | `LEAD_STAGED_TIMEOUT` (48h) | Re-engagement message |
| **Security Shield** | `RISK_DETECTED` (HIGH) | Block patient + alert (CENTER only) |
| **Collector** | `PAYMENT_FAILED` | 48h payment reminder |

### 5.3 Human-in-the-Loop (HITL)
- **Draft Mode**: `agent_config.mode == 'DRAFT_ONLY'`
- **PendingActions Table**: Stores drafted communications
- **Approval Widget**: Dashboard View/Edit/Approve/Reject

### 5.4 Event Types
```python
class EventType(str, Enum):
    FORM_SUBMISSION_COMPLETED = "FORM_SUBMISSION_COMPLETED"
    PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    BOOKING_CONFIRMED = "BOOKING_CONFIRMED"
    JOURNEY_STAGE_TIMEOUT = "JOURNEY_STAGE_TIMEOUT"
    RISK_DETECTED_IN_NOTE = "RISK_DETECTED_IN_NOTE"
    LEAD_CREATED = "LEAD_CREATED"
    LEAD_STAGED_TIMEOUT = "LEAD_STAGED_TIMEOUT"
```

---

## 6. Registry

### 6.1 Prompts
**File**: `backend/app/services/ai/prompts.py`

| Prompt | Trigger | Purpose |
|:---|:---|:---|
| `CLINICAL_SYSTEM_PROMPT` | Text notes | Structured clinical assessment |
| `AUDIO_SYNTHESIS_PROMPT` | Audio files | Session synthesis (not verbatim) |
| `DOCUMENT_ANALYSIS_PROMPT` | PDF/images | Document type + clinical relevance |
| `FORM_ANALYSIS_PROMPT` | Generic forms | Intake form review |
| `ASTROLOGY_FORM_PROMPT` | Birth data forms | Holistic/Human Design acknowledgment |
| `TRIAGE_FORM_PROMPT` | Risk-flagged forms | Safety screening (SSRIs, MAOIs) |
| `CHAT_ANALYSIS_PROMPT` | WhatsApp | Daily sentiment + risk flags (JSON) |
| `SYSTEM_PROMPT` (Help) | Support bot | Zero-hallucination platform help |

**Characteristics**:
- All prompts end with: `"Respond in the same language as the input content."`
- Therapeutic lineage sensitivity (astrology, psychedelic, somatic)
- Audio analysis = synthesis, not transcription

### 6.2 Key Files

| Component | File |
|:---|:---|
| Main Service | `backend/app/services/aletheia.py` |
| Factory | `backend/app/services/ai/factory.py` |
| Gemini Provider | `backend/app/services/ai/providers/gemini.py` |
| Cost Ledger | `backend/app/services/ai/ledger.py` |
| Risk Detector | `backend/app/services/risk_detector.py` |
| Insights API | `backend/app/api/v1/insights.py` |
| Automation Engine | `backend/app/services/automation_engine.py` |
| Stale Monitor | `backend/app/workers/stale_journey_monitor.py` |
| Help Assistant | `backend/app/services/help_assistant.py` |
| Financial Reports | `backend/app/services/finance/internal_ledger.py` |

### 6.3 Data Flow

```
┌────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ User Input     │───▶│ AletheIA.analyze │───▶│ GeminiProvider  │
│ (ClinicalEntry)│    │ (aletheia.py)    │    │ (gemini.py)     │
└────────────────┘    └──────────────────┘    └─────────────────┘
                               │                      │
                               ▼                      ▼
                      ┌──────────────────┐    ┌─────────────────┐
                      │ CostLedger       │    │ AIResponse      │
                      │ _log_ai_usage()  │    │ {text, tokens}  │
                      └──────────────────┘    └─────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ Patient.         │
                      │ last_insight_json│ ← JSONB cache (1 hour)
                      └──────────────────┘
```
