# The Identity Vault: Universal Contact Deduplication

> **Status**: Active (v1.6.4+)  
> **Architecture**: GEM Hybrid Approach  
> **Philosophy**: "One person, one identity, across all domains"

---

## Problem Statement

In a multi-domain platform (Leads, Patients, Followers), the same **real person** can exist as multiple disconnected records:

- 📧 Email form submission → Creates `Lead`
- 📱 WhatsApp booking (phone only) → Creates different `Lead`
- 💳 First payment → Creates `Patient`

**Result**: 3 records for 1 person, no cross-domain visibility, manual deduplication required.

---

## Solution: The Identity Vault

A **UUID-based universal contact ID** system that:
1. Normalizes email (lowercase, trim) and phone (E.164)
2. Matches contacts across domains using waterfall logic
3. Links all records (Lead, Patient, Follower) to a single `Identity`
4. Provides 360° timeline view of all interactions

---

## Architecture

### Database Schema

```sql
-- The universal identity
CREATE TABLE identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Normalized identifiers
    primary_email VARCHAR(255),  -- lowercase, trimmed
    primary_phone VARCHAR(20),   -- E.164 format (+34600123456)
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Future: merge support
    merged_with UUID REFERENCES identities(id),
    is_merged BOOLEAN DEFAULT FALSE,
    
    -- Indexes for performance
    UNIQUE (organization_id, primary_email),
    UNIQUE (organization_id, primary_phone)
);

-- Link to leads
ALTER TABLE leads ADD COLUMN identity_id UUID REFERENCES identities(id);
CREATE INDEX idx_leads_identity ON leads(identity_id);

-- Link to patients
ALTER TABLE patients ADD COLUMN identity_id UUID REFERENCES identities(id);
CREATE INDEX idx_patients_identity ON patients(identity_id);
```

**Migration**: `e6766c8a25d4_add_identities_table_and_fks`

---

## The Identity Brain: IdentityResolver

### Core Service

```python
from app.services.identity_resolver import IdentityResolver

# Initialize with DB session and org context
resolver = IdentityResolver(db, organization_id)

# Resolve identity (find or create)
identity = await resolver.resolve_identity(
    email="john@example.com",
    phone="600 123 456",  # Will be normalized to +34600123456
    name="John Doe",      # For logging
    source="public_booking"
)

# Returns: Identity object with id, primary_email, primary_phone
```

### Normalization Rules (GEM Constitution)

1. **Email Normalization**:
   - Trim whitespace
   - Convert to lowercase
   - Example: `"  John@Example.COM  "` → `"john@example.com"`

2. **Phone Normalization** (Strict E.164):
   - Uses `phonenumbers` library (Google's reference implementation)
   - Default region: Spain (ES)
   - Validates number
   - Formats as E.164 (+34600123456)
   - Invalid numbers → `None` + warning logged
   - Example: `"600 123 456"` → `"+34600123456"`

3. **NEVER compare raw strings** (always normalize first)

---

## Waterfall Matching Logic

```
┌─────────────────────────────────────┐
│   Input: email, phone, name         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Step 1: Normalize                  │
│  - email → lowercase, trim          │
│  - phone → E.164 (phonenumbers lib) │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Step 2: Search by email            │
│  - If match found → return identity │
│  - Enrich missing phone if provided │
└─────────────────────────────────────┘
              ↓ (no match)
┌─────────────────────────────────────┐
│  Step 3: Search by phone            │
│  - If match found → return identity │
│  - Enrich missing email if provided │
└─────────────────────────────────────┘
              ↓ (no match)
┌─────────────────────────────────────┐
│  Step 4: Create new identity        │
│  - Generate UUID                    │
│  - Store normalized email + phone   │
│  - Log creation                     │
└─────────────────────────────────────┘
```

### Auto-Enrichment

If identity exists but is missing data:
- Has email, new phone provided → **adds phone**
- Has phone, new email provided → **adds email**
- Always flushes DB to persist enrichment

---

## Integration Points

### 1. Public Booking (`create_public_booking`)

```python
# BEFORE creating Lead or Patient
identity = await resolver.resolve_identity(
    email=booking_data.patient_email,
    phone=booking_data.patient_phone,
    name=booking_data.patient_name,
    source="public_booking"
)

# Create Lead (free service)
lead = Lead(
    organization_id=org_id,
    identity_id=identity.id,  # ← Universal link
    first_name=first_name,
    last_name=last_name,
    email=booking_data.patient_email,
    phone=booking_data.patient_phone,
    ...
)

# Create Patient (paid service OR free conversion)
patient = Patient(
    organization_id=org_id,
    identity_id=identity.id,  # ← Same identity
    first_name=first_name,
    last_name=last_name,
    ...
)
```

### 2. Manual Lead Creation (`create_lead`)

```python
# Resolve identity before creating lead
identity = await resolver.resolve_identity(
    email=data.email,
    phone=data.phone,
    name=f"{data.first_name} {data.last_name}",
    source="manual"
)

lead = Lead(
    organization_id=current_user.organization_id,
    identity_id=identity.id,  # ← Link to vault
    ...
)
```

### 3. Public Forms (TODO v2.0)

When user submits form:
1. Extract email/phone from `form_data`
2. Resolve identity
3. Create Lead with `identity_id`
4. If identity has existing Patient → show context in UI

---

## API Endpoints

### GET `/api/v1/contacts/{identity_id}`

Returns 360° contact view:

```json
{
  "identity_id": "2a9620bb-6444-4239-950d-4592038d76f7",
  "primary_email": "juan@example.com",
  "primary_phone": "+34600123456",
  "created_at": "2026-01-01T00:00:00Z",
  "leads": [
    {
      "id": "lead-uuid-1",
      "first_name": "Juan",
      "last_name": "Pérez",
      "source": "Instagram Form",
      "status": "CONVERTED",
      "created_at": "2026-01-01T10:00:00Z"
    },
    {
      "id": "lead-uuid-2",
      "source": "WhatsApp Booking",
      "status": "CONVERTED",
      "created_at": "2026-01-03T14:00:00Z"
    }
  ],
  "patients": [
    {
      "id": "patient-uuid-1",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "juan@example.com",
      "created_at": "2026-01-07T16:00:00Z"
    }
  ],
  "total_interactions": 3,
  "first_contact": "2026-01-01T10:00:00Z",
  "last_activity": "2026-01-07T16:00:00Z"
}
```

### GET `/api/v1/contacts/{identity_id}/leads`

Returns all Leads for an identity (CRM history).

### GET `/api/v1/contacts/{identity_id}/patients`

Returns all Patients for an identity (clinical records).

### GET `/api/v1/contacts?email=X&phone=Y`

Search for identities (deduplication check):

```python
# Before creating new contact, check if exists
response = await fetch(
    `/api/v1/contacts?email=${email}&phone=${phone}`
)

if (response.results.length > 0) {
    // Identity exists! Show merge/link option
}
```

---

## Frontend: 360° Contact Page

**Route**: `/contacts/[id]`

**Features**:
- Contact info card (email, phone, first contact date, total interactions)
- Stats cards: Lead count (CRM), Patient count (Clinical)
- Unified timeline: Leads + Patients merged chronologically
- Visual distinction: Blue badges (Lead), Green badges (Patient)
- Navigation: "Ver detalles →" links to `/leads` or `/patients`

**Access Pattern**:
- Direct URL: `/contacts/{uuid}`
- From Lead detail: Click "View 360° Contact" button
- From Patient detail: Click "View 360° Contact" button

---

## Data Deduplication Examples

### Example 1: Email Match

```
Day 1: User submits form (email only)
→ Creates Identity A (email: john@example.com)
→ Creates Lead 1 (identity_id: A)

Day 3: Same user books via phone (same email)
→ Finds Identity A (email match)
→ Creates Lead 2 (identity_id: A)

Result: 2 Leads, 1 Identity ✅
```

### Example 2: Phone Match

```
Day 1: WhatsApp booking (phone only)
→ Creates Identity B (phone: +34600123456)
→ Creates Lead 1 (identity_id: B)

Day 5: Instagram form (same phone, adds email)
→ Finds Identity B (phone match)
→ Enriches Identity B with email
→ Creates Lead 2 (identity_id: B)

Result: 2 Leads, 1 Identity (enriched) ✅
```

### Example 3: Cross-Domain Linking

```
Day 1: Instagram form
→ Creates Identity C
→ Creates Lead 1 (identity_id: C)

Day 7: First paid booking (same email)
→ Finds Identity C (email match)
→ Creates Patient 1 (identity_id: C)
→ Converts Lead 1 to CONVERTED status

Result: 1 Lead + 1 Patient, same Identity ✅
Timeline shows complete journey: Lead → Patient
```

---

## Backfill Script

For existing data without `identity_id`:

```bash
docker exec kuraos-backend-1 python scripts/backfill_identities.py
```

**Output**:
```
🔐 Identity Vault Backfill Script
==================================================
📋 Found 2 leads without identity_id
  ✅ Lead Juan Pérez → identity 2a9620bb-6444-4239-950d-4592038d76f7
✅ Backfilled 1/2 leads

👤 Found 9 patients without identity_id
  ✅ Patient Juan Pérez → identity 2a9620bb-6444-4239-950d-4592038d76f7
  ✅ Patient Marcus Thorne → identity f6b4e697-93ff-442e-8e64-2bf8a2c99039
✅ Backfilled 9/9 patients

✅ Backfill complete! 1 leads + 9 patients
```

**Automatic Deduplication**: Juan Pérez got same `identity_id` for Lead and Patient (email match)!

---

## GDPR & HIPAA Compliance

### Data Hierarchy

**Clinical Data (Patient) > Marketing Data (Lead)**

In future Phase 2, if `identity` has both Lead and Patient:
- Patient email/phone takes precedence
- Lead data cannot override clinical record

### Privacy Controls

- `Identity` deletion: Cascades to anonymize all linked records
- `Lead` deletion: Hard delete allowed (GDPR "right to be forgotten")
- `Patient` deletion: Soft delete only (`is_active=False`) for compliance

### Audit Trail

All identity operations logged:
```
INFO Identity match found: {identity.id} for Juan Pérez (source: public_booking, email: juan@example.com)
INFO New identity created: {identity.id} (source: manual, email: new@example.com)
INFO Enriched identity {identity.id} with missing contact data
```

---

## Future Enhancements (v2.0)

1. **Fuzzy Matching**:
   - "Juan Perez" vs "Juan Pérez" (accent normalization)
   - Nickname detection ("John" vs "Jonathan")
   - Levenshtein distance for typos

2. **Multiple Emails/Phones**:
   - `contact_identifiers` many-to-many table
   - Track all emails/phones per identity
   - Mark one as primary

3. **Manual Merge UI**:
   - Admin can merge duplicate identities
   - Audit log of merge operations
   - Undo merge capability

4. **WhatsApp → Identity Direct Mapping**:
   - Incoming WhatsApp message → resolve identity
   - Show full context in Inbox (Lead + Patient history)

---

## Performance Considerations

- **Indexes**: `(organization_id, primary_email)` and `(organization_id, primary_phone)` for O(1) lookups
- **Caching**: Identity resolution results cached per request (future: Redis)
- **Normalization**: Minimal overhead (~1ms per normalize_phone call)
- **Race Conditions**: IntegrityError handling with retry logic

---

## See Also

- [trinity-crm.md](./trinity-crm.md) — Lead-Patient-Follower architecture
- [aletheia-system.md](./aletheia-system.md) — AI intelligence across domains
- Backend: `app/services/identity_resolver.py`
- Frontend: `apps/platform/app/[locale]/(dashboard)/contacts/[id]/page.tsx`
- API: `app/api/v1/connect/contacts.py`

---

**Last Updated**: 2026-01-08 (v1.6.4)  
**Status**: ✅ Production Ready
