# Journeys Architecture - Hybrid State Machine

**Version:** v1.4.14  
**Status:** ✅ IMPLEMENTED  
**Author:** Kura OS Core  
**Last Updated:** 2026-01-07

---

## 1. Executive Summary

**Journeys** are the mechanism Kura OS uses to track a patient's progression through multi-stage clinical processes (retreats, intakes, coaching programs, etc.).

The system implements a **Hybrid State Machine** pattern:
- **State Storage**: JSONB field `journey_status` on the `Patient` model (flexible, multi-journey)
- **Validation**: `JourneyTemplate` table defines allowed stages per journey type
- **Audit Trail**: `JourneyLog` table records every state transition (immutable)
- **Temporal Automation**: `stale_journey_monitor` APScheduler worker triggers timeouts

---

## 2. Core Components

### 2.1 Patient.journey_status (JSONB)

```python
# Location: backend/app/db/models.py (Patient model, line ~348)
journey_status: Mapped[dict] = mapped_column(JSONB, default={})
```

**Structure Example:**
```json
{
  "retreat_ibiza_2025": "AWAITING_PAYMENT",
  "intake_flow": "COMPLETED",
  "yoga_urban_om": "CONFIRMED"
}
```

Each key represents a **journey type**, and the value is the **current stage** within that journey.

**Design Rationale:**
- Single patient can participate in multiple simultaneous journeys
- No rigid schema - new journey types are dynamically addable
- Efficient queries via PostgreSQL JSONB operators

---

### 2.2 JourneyTemplate (Blueprint)

```python
# Location: backend/app/db/models.py (line ~1107)
class JourneyTemplate(Base):
    __tablename__ = "journey_templates"
    
    organization_id: UUID          # Owner organization
    name: str                      # "Retiro Ibiza 2025"
    key: str                       # "retreat_ibiza_2025" (machine identifier)
    allowed_stages: list[str]      # ["AWAITING_SCREENING", "AWAITING_PAYMENT", "CONFIRMED", "BLOCKED"]
    initial_stage: str             # "PENDING"
    is_active: bool
```

**Purpose:**
- Formalizes journey configurations (previously magic strings)
- Validates stage transitions (prevents invalid states)
- Per-organization (allows customization per therapist)

---

### 2.3 JourneyLog (Audit Trail)

```python
# Location: backend/app/db/models.py (line ~1146)
class JourneyLog(Base):
    __tablename__ = "journey_logs"
    
    patient_id: UUID
    journey_key: str           # "retreat_ibiza_2025"
    from_stage: Optional[str]  # NULL for first enrollment
    to_stage: str
    changed_at: datetime
    trigger_event_id: Optional[UUID]  # Link to SystemEventLog
```

**Purpose:**
- Immutable audit trail for clinical compliance
- Analytics (avg time to payment, conversion rates)
- Stale journey detection (time since last change)

**Index:**
```sql
ix_journey_logs_patient_key_time (patient_id, journey_key, changed_at)
```

---

### 2.4 StaleJourneyMonitor (Temporal Engine)

```python
# Location: backend/app/workers/stale_journey_monitor.py
```

A scheduled worker (APScheduler, runs hourly) that detects patients **stuck** in a stage for too long.

**Rule Structure:**
```python
STALE_RULES = [
    {
        "journey_key": "retreat_ibiza_2025",
        "stage": "AWAITING_PAYMENT",
        "max_hours": 48,
        "action": "send_payment_reminder",
        "email_subject": "⏰ Recordatorio: Completa tu reserva del Retiro",
    },
    # ... more rules for different journey/stage combinations
]
```

**SQL Query Pattern:**
```sql
WITH latest_transitions AS (
    SELECT DISTINCT ON (patient_id)
        patient_id, to_stage, changed_at
    FROM journey_logs
    WHERE journey_key = :journey_key
    ORDER BY patient_id, changed_at DESC
),
recent_reminders AS (
    SELECT entity_id as patient_id
    FROM system_events
    WHERE event_type = 'JOURNEY_STAGE_TIMEOUT'
    AND payload->>'journey_key' = :journey_key
    AND created_at > NOW() - INTERVAL '24 hours'
)
SELECT p.* FROM patients p
JOIN latest_transitions lt ON p.id = lt.patient_id
LEFT JOIN recent_reminders rr ON p.id = rr.patient_id
WHERE lt.to_stage = :stage
AND lt.changed_at < :cutoff_time
AND rr.patient_id IS NULL  -- Anti-spam: no recent reminder
```

---

## 3. State Transitions

### 3.1 How Journeys Are Updated

State transitions occur via **AutomationRule actions**:

```python
# AutomationRule.actions format (JSONB)
[
    {
        "type": "update_journey_status",
        "params": {
            "key": "intake",
            "status": "BLOCKED"
        }
    }
]
```

**Trigger Events that commonly affect journeys:**
| TriggerEvent | Typical Journey Action |
|--------------|------------------------|
| `FORM_SUBMISSION_COMPLETED` | Move from SCREENING_PENDING → SCREENING_COMPLETED |
| `PAYMENT_SUCCEEDED` | Move from AWAITING_PAYMENT → CONFIRMED |
| `RISK_ANALYSIS_COMPLETED` | Move to BLOCKED_HIGH_RISK (if high risk) |
| `JOURNEY_STAGE_TIMEOUT` | Send reminder email |
| `BOOKING_CANCELLED` | Move to CANCELLED |

### 3.2 Standard Journey Stages (Enum)

```python
# Location: backend/app/schemas/automation_types.py
class JourneyStatus(str, Enum):
    # Intake/Screening
    SCREENING_PENDING = "SCREENING_PENDING"
    SCREENING_COMPLETED = "SCREENING_COMPLETED"
    BLOCKED_HIGH_RISK = "BLOCKED_HIGH_RISK"
    
    # Booking flow
    AWAITING_PAYMENT = "AWAITING_PAYMENT"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
```

> **Note**: Custom stages can be defined in `JourneyTemplate.allowed_stages` for specialized journeys.

---

## 4. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         EVENT TRIGGERS                                │
├─────────────────┬──────────────────┬────────────────────────────────-┤
│ Form Submitted  │ Payment Received │ APScheduler (Hourly Check)      │
└────────┬────────┴────────┬─────────┴────────────┬────────────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTOMATION ENGINE                               │
│                   (automation_engine.py)                             │
│  - Match TriggerEvent to AutomationRules                            │
│  - Evaluate conditions                                              │
│  - Execute actions (including update_journey_status)                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
│ Patient Model  │  │   JourneyLog     │  │   SystemEventLog         │
│ journey_status │  │ (Audit Trail)    │  │ (Debugging & Compliance) │
│    {JSONB}     │  │ from→to, when    │  │    Payloads stored       │
└────────────────┘  └──────────────────┘  └──────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ stale_journey_      │
                    │ monitor (Worker)    │
                    │ Checks every hour   │
                    │ Triggers TIMEOUT    │
                    │ events if stuck     │
                    └─────────────────────┘
```

---

## 5. Demo Journey Archetypes

The stale_journey_monitor includes rules for these predefined archetypes:

| Archetype | Journey Key | Key Stages |
|-----------|-------------|------------|
| **Psychedelic Retreat** | `retreat_ibiza_2025` | AWAITING_PAYMENT (48h timeout), PREPARATION_PHASE (7d reminder) |
| **Astrology** | `carta_natal` | AWAITING_BIRTH_DATA (24h timeout) |
| **Coaching Program** | `despertar_8s` | ONBOARDING (7d engagement), DEEP_DIVE (14d stagnation alert) |
| **Yoga Studio** | `yoga_urban_om` | AWAITING_WAIVER (24h timeout) |
| **Legacy Intake** | `intake` | AWAITING_PAYMENT (48h timeout) |

---

## 6. Security & Compliance

### 6.1 Audit Requirements
- All transitions logged in `journey_logs` with timestamp
- `trigger_event_id` links to the original `SystemEventLog` for tracing
- Immutable: No UPDATE/DELETE on journey_logs

### 6.2 Clinical Blocking
High-risk patients can be automatically blocked from progressing:
```python
# Example AutomationRule action
{
    "type": "update_journey_status",
    "params": {"key": "retreat", "status": "BLOCKED_HIGH_RISK"}
}
```
This requires manual therapist intervention to unblock.

---

## 7. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/patients/{id}` | Returns patient with `journey_status` field |
| PATCH | `/api/v1/patients/{id}/journey` | Manual journey update (therapist action) |
| GET | `/api/v1/admin/stale-journeys/check` | Manual trigger of stale journey monitor |
| GET | `/api/v1/journey-templates` | List journey blueprints for organization |

---

## 8. UI Components (Implemented)

The following frontend components provide visual interaction with the Journeys system:

### 8.1 Dashboard Widget: "Journeys Activos"
- Location: Dashboard home page (right sidebar)
- Shows total active journeys count
- Lists patients with their current journey stage badges
- Click to view full journey details

### 8.2 Patient Journey View
- Location: Patient profile page → "PATIENT JOURNEY" section
- Visual progress bar showing stage progression
- Stage states: Active, BLOQUEADO, Completed
- "Revisar Bloqueo" action button for blocked patients
- "Acción requerida" indicator

### 8.3 Flow Builder (Logic & Flows)
- Location: `/design-system` → Neural Circuit Components
- Visual CUANDO/SI/ENTONCES node system
- FlowNode.trigger (purple, AI icon)
- FlowNode.condition (orange, diamond)
- FlowNode.action (green, success)
- Reusable for: Agent flows, Campaign funnels, Patient timelines

---

## 9. Future Enhancements (Roadmap)

1. **Transition Conditions**: Rules like "can only move to CONFIRMED if payment_succeeded"
2. **Journey Analytics Dashboard**: Conversion funnels and stagnation metrics

---

## 9. Related Documents

- [ADR-003: Marketing Growth Engine](./adr/ADR-003-marketing-growth-engine.md) - Leads funnel integration
- [ADR-004: Meta Cloud API](./adr/ADR-004-meta-cloud-api-integration.md) - Lead→Patient conversion
- `backend/app/services/automation_engine.py` - Core automation execution
- `backend/app/workers/stale_journey_monitor.py` - Temporal monitoring implementation

---

*This document is intended for the Architect (GAG) to understand the Journey subsystem's design and integration points.*
