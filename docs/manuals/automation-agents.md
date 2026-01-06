# Automation Agents - How To Guide

Internal documentation for the Kura OS automation agent system.

---

## Overview

The Agent system allows therapists to:
1. **Activate pre-built automations** with one click
2. **Install agents** from a curated catalog
3. **Toggle agents ON/OFF** without configuration
4. **Request custom agents** for specific needs

> **Philosophy**: "Agents, Not Tools" — AI operates as autonomous teammates, not passive software.

---

## Key Concepts

### Agents vs Manual Rules

| Approach | Description | Example |
|----------|-------------|---------|
| **Agent** | Pre-configured protocol, install & activate | "Block high-risk patients" |
| **Manual Rule** | Custom configuration (future) | "Send email after 3 days" |

**Current Focus:** Agent Catalog (v1.4.x). Manual rule builder planned for future.

---

### System Templates vs Organization Agents

| Type | Description | `organization_id` |
|------|-------------|-------------------|
| **System Template** | Global catalog template | `NULL` |
| **Organization Agent** | Installed from template | `UUID` (your org) |

**Key Field:** `cloned_from_id` tracks which template an agent was installed from.

---

## Available Agents

### 1. 🛡️ Escudo de Seguridad (Security Shield)

**Purpose:** Automatically block high-risk patients and alert the therapist.

| Property | Value |
|----------|-------|
| **Trigger** | `FORM_SUBMISSION_COMPLETED` |
| **Conditions** | Risk level = HIGH or CRITICAL |
| **Actions** | Update journey status to BLOCKED_HIGH_RISK, Send email to therapist |
| **Icon** | `ShieldAlert` |

**Use Case:** Intake forms with automatic risk screening.

---

### 2. 🤝 Concierge (Welcome Agent)

**Purpose:** Welcome new leads and nudge them toward booking.

| Property | Value |
|----------|-------|
| **Trigger** | `LEAD_CREATED` |
| **Actions** | Send welcome email + booking nudge |
| **Icon** | `UserPlus` |

**Use Case:** Automatic onboarding for new CRM leads.

---

### 3. 👻 Ghost Detector

**Purpose:** Re-engage leads who haven't responded in 48h.

| Property | Value |
|----------|-------|
| **Trigger** | `LEAD_STAGED_TIMEOUT` |
| **Conditions** | Hours elapsed >= 48 |
| **Actions** | Send re-engagement message |
| **Icon** | `Ghost` |

**Use Case:** Prevent lead abandonment.

---

### 4. 💸 Cobrador Automático (Auto Collector)

**Purpose:** Send payment reminders when patients don't complete booking payment.

| Property | Value |
|----------|-------|
| **Trigger** | `JOURNEY_STAGE_TIMEOUT` |
| **Conditions** | Journey stage = AWAITING_PAYMENT, Hours elapsed >= 48 |
| **Actions** | Send payment reminder email |
| **Icon** | `Banknote` |

**Use Case:** Booking flows where payment is required to confirm.

---

### 5. ❤️ Fidelización Post-Retiro (Post-Retreat Loyalty)

**Purpose:** Send satisfaction survey after retreat completion.

| Property | Value |
|----------|-------|
| **Trigger** | `JOURNEY_STAGE_TIMEOUT` |
| **Conditions** | Journey stage = COMPLETED, Hours elapsed >= 168 (7 days) |
| **Actions** | Send satisfaction survey email |
| **Icon** | `HeartHandshake` |

**Use Case:** Follow-up after retreats or intensive programs.

---

## User Flows

### 1. Installing an Agent

```
Agentes → Catálogo de Agentes tab → Click "Activar" → Agent activated
```

**What happens:**
1. System template is cloned to your organization
2. New agent is created with `is_active = true`
3. `cloned_from_id` links to original template
4. Agent appears in "Mis Agentes" tab

---

### 2. Toggling an Agent

```
Mis Agentes → Click toggle switch → Agent ON/OFF
```

**What happens:**
1. `PATCH /automations/rules/{id}` updates `is_active`
2. UI reflects new state immediately
3. Automation engine checks `is_active` before executing

---

### 3. Uninstalling an Agent

```
Mis Agentes → Click trash icon → Confirm → Agent deleted
```

**What happens:**
1. `DELETE /automations/rules/{id}` removes the agent
2. Agent no longer executes
3. Can reinstall from Catalog anytime

---

## Database Schema

### AutomationRule Model

```
automation_rules
├── id (UUID)
├── organization_id (NULL = system, UUID = org)
├── name (string)
├── description (text)
├── icon (string - Lucide icon name)
├── trigger_event (string)
├── conditions (JSONB)
│   ├── logic ("AND" | "OR")
│   └── rules [{ field, operator, value }]
├── actions (JSONB array)
│   └── [{ type, params }]
├── is_active (bool)
├── is_system_template (bool)
├── priority (int - lower = higher priority)
├── cloned_from_id (UUID - source template)
└── timestamps
```

---

## Conditions Schema

```json
{
  "logic": "OR",
  "rules": [
    { "field": "risk_analysis.level", "operator": "equals", "value": "HIGH" },
    { "field": "risk_analysis.level", "operator": "equals", "value": "CRITICAL" }
  ]
}
```

**Operators:**
- `equals` - Exact match
- `not_equals` - Not equal
- `contains` - String contains
- `gte` / `lte` - Greater/less than or equal (numbers)

---

## Actions Schema

```json
[
  {
    "type": "update_journey_status",
    "params": { "key": "intake", "status": "BLOCKED_HIGH_RISK" }
  },
  {
    "type": "send_email",
    "params": { "template": "risk_alert", "to": "therapist" }
  }
]
```

**Action Types:**
- `update_journey_status` - Change patient journey state
- `send_email` - Send transactional email
- `send_whatsapp` - Send WhatsApp message (future)
- `create_task` - Create follow-up task (future)

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/automations/rules` | GET | List org's installed agents |
| `/automations/marketplace` | GET | List system templates |
| `/automations/rules/install/{id}` | POST | Clone template to org |
| `/automations/rules/{id}` | PATCH | Toggle ON/OFF |
| `/automations/rules/{id}` | DELETE | Remove from org |

---

## Technical Implementation

### Event Flow

```
1. Event occurs (form submission, timeout, etc.)
2. automation_engine.py receives event
3. Queries active agents for that trigger type
4. Evaluates conditions against event payload
5. Executes matching actions
6. Logs to SystemEventLog
```

### Key Files

| File | Purpose |
|------|---------|
| `backend/app/db/models.py` | `AutomationRule` model |
| `backend/app/api/v1/automations.py` | CRUD endpoints |
| `backend/app/services/automation_engine.py` | Event processing |
| `backend/scripts/seed_automation_playbooks.py` | Initial templates |
| `apps/platform/app/[locale]/automations/page.tsx` | Agents UI |
| `apps/platform/components/IconRenderer.tsx` | Dynamic icons |

---

## Adding New Agents

### 1. Define in Seed Script

```python
# backend/scripts/seed_automation_playbooks.py

{
    "name": "Nuevo Agente",
    "description": "Descripción de lo que hace.",
    "icon": "LucideIconName",
    "trigger_event": TriggerEvent.FORM_SUBMISSION_COMPLETED.value,
    "conditions": { ... },
    "actions": [ ... ],
    "priority": 50,
}
```

### 2. Add Icon to Registry

```tsx
// apps/platform/components/IconRenderer.tsx
import { NewIcon } from 'lucide-react';

const ICON_MAP = {
    // ...existing
    NewIcon,
};
```

### 3. Run Seed Script

```bash
docker-compose exec backend python -m scripts.seed_automation_playbooks
```

---

## Security Notes

1. **Multi-tenancy**: All queries filter by `organization_id`
2. **System templates**: Cannot be modified or deleted by users
3. **Cloning**: Only system templates can be cloned
4. **Execution**: Only `is_active = true` agents execute
5. **Audit**: All events logged to `SystemEventLog`

---

## Troubleshooting

### Agent not executing

1. Check `is_active` is `true`
2. Verify trigger event is firing
3. Check conditions match event payload
4. Look for errors in `SystemEventLog`

### Icon not showing

1. Verify icon name is in `IconRenderer.tsx`
2. Check icon name is PascalCase (e.g., `ShieldAlert`)
3. Rebuild frontend if newly added

---

*Last updated: 2026-01-06*
