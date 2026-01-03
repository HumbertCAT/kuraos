# Terminology Standard

> **Status**: Production (v1.1.20)  
> **Scope**: Global UI Labels & i18n  
> **Last Updated**: 2026-01-03

---

## 1. Overview

Kura OS uses a **Dynamic Terminology Engine** that adapts UI labels to match each practitioner's therapeutic model. The word "Patient" never appears unless explicitly configured.

---

## 2. Terminology Options

| Setting | Label | Use Case |
|:---|:---|:---|
| `PATIENT` | Paciente / Patient | Clinical/Medical model |
| `CLIENT` | Cliente / Client | Coaching/Business model (Default) |
| `CONSULTANT` | Consultante / Consultant | Holistic/Humanist model |

### Configuration

- **Location**: Organization Settings → General
- **Storage**: `organizations.terminology_preference` (PostgreSQL ENUM)
- **Default**: `CLIENT`

---

## 3. The "Participant" Exception

Regardless of global setting, the system **automatically switches** to "Participante" when:

| Context | Trigger |
|:---|:---|
| Group Services | Retreats, Workshops, Group Sessions |
| Event Attendees | Viewing booking attendees list |
| Booking Wizard | When booking a GROUP-type service |

This ensures semantic accuracy—people attending a group retreat are "participants", not "patients".

---

## 4. Developer Usage

### Core Rule
> **NEVER** hardcode "Paciente", "Client", or any terminology. Always use the hook.

### The `useTerminology` Hook

**File**: `apps/platform/hooks/use-terminology.ts`

```typescript
import { useTerminology } from '@/hooks/use-terminology';

function MyComponent() {
  const { singular, plural, label } = useTerminology();
  
  return (
    <div>
      <h1>{plural}</h1>           {/* "Clientes" */}
      <button>Añadir {label}</button>  {/* "Añadir Cliente" */}
    </div>
  );
}
```

### Group Context Override

Force "Participante" for group services:

```typescript
const { plural } = useTerminology('GROUP');
// Always returns "Participantes"
```

### Service-Based Detection

Automatic context detection from service type:

```typescript
import { useTerminologyForService } from '@/hooks/use-terminology';

function BookingCard({ service }) {
  const { label } = useTerminologyForService(service.kind === 'GROUP');
  // Returns "Participante" for groups, org preference otherwise
}
```

---

## 5. Hook API Reference

```typescript
interface TerminologyResult {
  singular: string;  // "Cliente", "Paciente", "Consultante", or "Participante"
  plural: string;    // "Clientes", "Pacientes", etc.
  label: string;     // Same as singular (for button labels)
}

function useTerminology(context?: 'GROUP' | 'INDIVIDUAL'): TerminologyResult;
function useTerminologyForService(isGroupService?: boolean): TerminologyResult;
```

### Priority Logic

1. **GROUP context override** → Returns "Participante"
2. **Organization preference** → Returns configured term
3. **Fallback** → Returns "Cliente" (default)

---

## 6. i18n Keys

Translations in `messages/{locale}.json`:

```json
{
  "terminology": {
    "patient": { "singular": "Paciente", "plural": "Pacientes" },
    "client": { "singular": "Cliente", "plural": "Clientes" },
    "consultant": { "singular": "Consultante", "plural": "Consultantes" },
    "participant": { "singular": "Participante", "plural": "Participantes" }
  }
}
```

---

## 7. Database Schema

| Field | Type | Values |
|:---|:---|:---|
| `organizations.terminology_preference` | ENUM | `PATIENT`, `CLIENT`, `CONSULTANT` |

**Migration**: `7993cb9acf03_add_terminology_preference.py`

---

## 8. Key Files Reference

| File | Purpose |
|:---|:---|
| `apps/platform/hooks/use-terminology.ts` | Hook implementation |
| `apps/platform/messages/es.json` | Spanish translations |
| `apps/platform/messages/en.json` | English translations |
| `backend/app/db/models.py` | `TerminologyPreference` enum |
