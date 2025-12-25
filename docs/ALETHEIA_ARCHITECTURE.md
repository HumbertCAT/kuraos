# AletheIA Architecture Document

> **For:** Senior Architects  
> **Version:** v1.0.5  
> **Status:** Current Implementation State

---

## 1. Overview

**AletheIA** is Kura OS's clinical intelligence system. The name derives from Greek ἀλήθεια (truth/disclosure) - representing the AI's role in revealing patterns and risks in patient data.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALETHEIA ECOSYSTEM                           │
├──────────────────┬──────────────────┬───────────────────────────┤
│   INSIGHTS       │   AUTOMATION     │   INTERFACE               │
│   (Analysis)     │   (Agents)       │   (Observatory)           │
├──────────────────┼──────────────────┼───────────────────────────┤
│ • Risk Detection │ • Concierge      │ • Right Sidebar HUD       │
│ • Voice Analysis │ • Ghost Detector │ • Real-time Risk Score    │
│ • Daily Briefing │ • Collector      │ • Active Flags            │
│ • Form Screening │ • Security Shield│ • Biomarkers (Oura)       │
└──────────────────┴──────────────────┴───────────────────────────┘
```

---

## 2. Backend Architecture

### 2.1 AI Provider
| Component | Technology | Model |
|-----------|------------|-------|
| Primary LLM | Google Gen AI SDK | Gemini 2.0 Flash Exp |
| TTS (Briefings) | OpenAI | tts-1 (alloy/nova) |

### 2.2 Key Files
```
backend/app/
├── services/
│   ├── automation_engine.py    # Event-driven agent execution
│   ├── risk_detector.py        # Keyword + sentiment analysis
│   └── stale_journey_monitor.py # Temporal rules (48h ghost detection)
├── workers/
│   └── conversation_analyzer.py # Daily WhatsApp analysis
└── api/v1/
    └── insights.py              # AI analysis endpoints
```

### 2.3 Core Functions

| Function | Trigger | Output |
|----------|---------|--------|
| **Risk Assessment** | Form submission, clinical note | HIGH/MEDIUM/LOW flag |
| **Engagement Score** | Participation analysis | 0-100 score |
| **Thematic Pills** | Session notes | ["Grief", "Spiritual Emergency"] |
| **Daily Briefing** | 6AM cron | Audio MP3 + transcript |
| **Lead Stale Monitor** | Hourly cron | LEAD_STAGED_TIMEOUT event |

### 2.4 Processing Pattern
```
1. Ingestion    → Form/Note submitted
2. Queue        → Background task created
3. Analysis     → Gemini Pro processes
4. Caching      → 1-hour intelligent cache
5. Notification → Events emitted to automation engine
```

---

## 3. Database Models

### 3.1 Patient Insights
```python
# Patient.last_insight_json (JSONB)
{
    "risk_level": "HIGH",
    "risk_score": -0.90,
    "themes": ["suicidal_ideation", "sleep_disruption"],
    "engagement": 45,
    "analysis_summary": "...",
    "analyzed_at": "2024-12-25T10:00:00Z"
}

# Patient.last_insight_at (DateTime)
```

### 3.2 AI Usage Tracking
```python
class AiUsageLog:
    organization_id: UUID
    user_id: UUID
    entry_id: Optional[UUID]
    credits_cost: int
    activity_type: str  # "analysis_text", "analysis_audio", "briefing"
    created_at: DateTime
```

### 3.3 Credit System
| Tier | Monthly Quota | Behavior on Exhaustion |
|------|---------------|------------------------|
| BUILDER | 100 | Fail-soft: raw data + "Upgrade Required" |
| PRO | 500 | Same |
| CENTER | 2000 | Same |

---

## 4. Frontend Architecture

### 4.1 AletheiaObservatory Component
**Location:** `components/AletheiaObservatory.tsx`

**Current State:** Hardcoded mock data (v1.0.4)

**Visual Elements:**
| Widget | Purpose |
|--------|---------|
| Risk Score | -1.0 to +1.0 gauge with color coding |
| Risk Trend | 72h trend indicator (positive/negative/stable) |
| Voice Analysis | Tone, latency, depression correlation % |
| Biomarkers | HRV (ms), Sleep duration (Oura integration planned) |
| Active Flags | List of detected risk markers |

**Styling:**
- Visible only on `xl` screens (`hidden xl:flex`)
- Width: `w-80` fixed
- Colors: `--ai` (violet), `--risk` (red), `--brand` (teal)
- Typography: `Space Grotesk` for technical headers

### 4.2 Help ChatBot
**Location:** `components/help/HelpChatBot.tsx`

**Features:**
- Platform-specific support grounded in MDX documentation
- Session-aware (user role, tier, current page)
- Query logging to `HelpQueryLog` for topic analysis

---

## 5. Automation Agents

### 5.1 Philosophy: "Agents, Not Tools"
AI is treated as **Active Intelligence** (autonomous teammates) rather than passive software.

### 5.2 Terminology
| Legacy Term | New Term |
|-------------|----------|
| Playbook | Protocolo |
| Install | Activar |
| Marketplace | Catálogo de Agentes |
| Automation | Agente IA |

### 5.3 Active Agents
| Agent | Trigger | Action |
|-------|---------|--------|
| **Concierge** | LEAD_CREATED | Welcome email + booking nudge |
| **Ghost Detector** | LEAD_STAGED_TIMEOUT (48h) | Re-engagement message |
| **Security Shield** | RISK_DETECTED (HIGH) | Block patient (CENTER only) + alert |
| **Collector** | PAYMENT_FAILED | 48h reminder |

### 5.4 Human-in-the-Loop (HITL)
- **Draft Mode:** `agent_config.mode == 'DRAFT_ONLY'`
- **PendingActions Table:** Stores drafted communications
- **Approval Widget:** Dashboard allows View/Edit/Approve/Reject

---

## 6. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/patients/{id}/insights` | GET | Cached patient insights |
| `/api/v1/patients/{id}/analyze` | POST | Trigger new analysis |
| `/api/v1/clinical-entries/{id}/analyze` | POST | Analyze specific note |
| `/api/v1/admin/trigger-conversation-analysis` | POST | Force daily analysis (superuser) |
| `/api/v1/admin/trigger-cron` | POST | Force stale monitor (superuser) |

---

## 7. Event Types

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

*Last updated: 2024-12-25*
