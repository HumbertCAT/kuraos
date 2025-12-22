# Dynamic Terminology System

## Overview
Kura OS adapts its UI terminology to match the practitioner's therapeutic model.

## Configuration
- **Location:** Organization Settings.
- **Options:**
  1. **PATIENT** (Clinical/Medical model)
  2. **CLIENT** (Coaching/Business model) - *Default*
  3. **CONSULTANT** (Holistic/Humanist model)

## The "Participant" Rule
Regardless of the global setting, the system automatically switches to **"Participante"** when:
1. Managing Group Services (Retreats, Workshops).
2. Viewing Attendees of an Event.
3. In the Booking Wizard for a Group Service.

## Developer Usage
Never hardcode "Paciente" or "Client". Use the hook:

```typescript
import { useTerminology } from '@/hooks/use-terminology';

function MyComponent() {
  const { singular, plural, label } = useTerminology();
  
  return (
    <div>
      <h1>{plural}</h1>  {/* "Clientes" */}
      <button>Añadir {label}</button>  {/* "Añadir Cliente" */}
    </div>
  );
}
```

### Group Context Override
For group services, pass 'GROUP' to force "Participante":

```typescript
const { plural } = useTerminology('GROUP');
// Always returns "Participantes"
```

### Service-Based Detection
```typescript
import { useTerminologyForService } from '@/hooks/use-terminology';

const { label } = useTerminologyForService(service.kind === 'GROUP');
```

## i18n Keys
The terminology namespace is located in `messages/es.json` and `messages/en.json`:

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

## Database Schema
- **Table:** `organizations`
- **Column:** `terminology_preference`
- **Type:** PostgreSQL ENUM (`terminologypreference`)
- **Values:** `PATIENT`, `CLIENT`, `CONSULTANT`
- **Default:** `CLIENT`

## Migration
Applied in: `7993cb9acf03_add_terminology_preference.py`
