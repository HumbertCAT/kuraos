# The Trinity: CONNECT, PRACTICE, GROW

> **Status**: Active (v1.7.5+)  
> **Philosophy**: "Three intention-based relationship domains, one unified platform"  
> **Last Updated**: 2026-01-12

---

## Overview

The **Trinity Architecture** organizes Kura OS into three distinct but interconnected pillars, each representing a different **intention** in the therapeutic relationship lifecycle:

1. **CONNECT** (Pilar I - ATRAER): Lead Management, CRM, Public Intake
2. **PRACTICE** (Pilar II - SERVIR): Clinical Care, Patient Records, HIPAA Zone
3. **GROW** (Pilar III - CRECER): Analytics, Billing, Growth Metrics

This separation ensures **HIPAA compliance** while enabling a complete view of the practitioner-client relationship from first touch to ongoing care.

---

## The Three Pillars

### 1. CONNECT: Lead Management & CRM

**Intent**: Attract and qualify prospects before they become clinical patients.

**Domain Objects**:
- `Lead` (CRM contact, pre-clinical)
- `PublicForm` (intake forms, lead magnets)
- `Follower` (social/email followers)

**Key Features**:
- Public booking for free services (Lead Magnet: "Consulta Inicial 0€")
- Sherlock Score (R.N.A.V. framework for lead qualification)
- Shadow Profile (AI-generated sales intelligence)
- Lead status pipeline: NEW → CONTACTED → QUALIFIED → APPOINTMENT_SCHEDULED → CONVERTED
- Auto-conversion: Lead → Patient on first paid booking

**Data Classification**: **Business/Marketing Data** (NOT HIPAA-protected)

**API Prefix**: `/api/v1/leads`, `/api/v1/public/forms`

---

### 2. PRACTICE: Clinical Care & Patient Records

**Intent**: Serve active patients with clinical excellence.

**Domain Objects**:
- `Patient` (clinical record, Soul Record)
- `ClinicalEntry` (session notes, assessments, AI analyses)
- `Booking` (appointments)
- `Service` (therapeutic offerings)

**Key Features**:
- AletheIA clinical intelligence (SOAP notes, risk detection)
- Journeys Engine (patient lifecycle tracking)
- Form assignments (clinical intake, pre/post-session)
- Privacy tiers: GHOST, STANDARD, LEGACY
- Kura Cortex pipelines (audio → transcript → analysis)

**Data Classification**: **Clinical Data** (HIPAA-protected)

**API Prefix**: `/api/v1/patients`, `/api/v1/booking`, `/api/v1/clinical-entries`

---

### 3. GROW: Analytics & Business Intelligence

**Intent**: Scale the practice with data-driven insights.

**Domain Objects**:
- `Dashboard` (KPIs, metrics)
- `Billing` (Stripe integration)
- `Referral` (growth loops, karma system)
- `AiUsageLog` (Kura Credits economy)

**Key Features**:
- Conversion funnel analytics (Follower → Lead → Patient)
- Mycelium Growth Engine (referral rewards)
- Tier-based capacity limits (BUILDER/PRO/CENTER)
- Real-time revenue tracking

**Data Classification**: **Business Analytics** (aggregate, anonymized)

**API Prefix**: `/api/v1/dashboard`, `/api/v1/billing`

---

## Lead-Patient Dualism

### The Core Distinction

| Aspect | Lead (CONNECT) | Patient (PRACTICE) |
|--------|----------------|-------------------|
| **Intent** | Qualify, nurture, convert | Clinical care, therapeutic relationship |
| **Data** | Marketing (email, source, notes) | HIPAA-protected (medical history, sessions) |
| **Status** | Pipeline (NEW → CONVERTED) | Active/Inactive (always retained) |
| **Deletion** | Hard delete allowed (GDPR) | Soft delete only (`is_active=False`) |
| **Journey** | Lead Magnet → Qualification → First Paid Booking | Intake → Treatment → Maintenance → Discharge |

### Auto-Conversion Logic

When a **Lead** completes their first **paid booking**, the system:
1. Creates a `Patient` record
2. Copies contact info (name, email, phone)
3. Transfers context (notes → `profile_data.initial_notes`)
4. Links Lead to Patient (`converted_patient_id`)
5. Updates Lead status to `CONVERTED`
6. **Both records persist** (Lead for attribution, Patient for clinical care)

---

## The Identity Vault (v1.6.4)

### Universal Contact Deduplication

**Problem**: A person can exist as Lead, Patient, and Follower simultaneously with different emails/phones.

**Solution**: The **Identity Vault** — a UUID-based universal contact ID system.

### How It Works

```
┌─────────────────────────────────────────┐
│        IDENTITY (Universal ID)          │
│  - primary_email (normalized)           │
│  - primary_phone (E.164)                │
└─────────────────────────────────────────┘
         ↓              ↓              ↓
   ┌─────────┐    ┌─────────┐    ┌──────────┐
   │  LEAD   │    │ PATIENT │    │ FOLLOWER │
   │ (CRM)   │    │(Clinical)│   │ (Growth) │
   └─────────┘    └─────────┘    └──────────┘
```

**Benefits**:
- 🔗 Same person = same `identity_id` across all domains
- 📊 360° Contact Timeline (all interactions in one view)
- 🚫 Automatic deduplication (email + phone matching)
- 📞 WhatsApp Lead + Email Form = 1 identity (not 2 records)

**API**: See `/api/v1/contacts/{identity_id}` for timeline view.

**WhatsApp Integration** (v1.7.5): Messages from Meta Cloud API are routed through Identity Vault. See [whatsapp-monitoring.md](../manuals/whatsapp-monitoring.md).

**Implementation**: [identity-vault.md](./identity-vault.md)

---

## Data Flow Example

### Scenario: Instagram DM → Free Booking → Paid Session

1. **Day 1**: User clicks Instagram bio link → fills form
   - **Creates**: `Lead` (status: NEW)
   - **Creates**: `Identity` (email + phone normalized)
   - Link: `Lead.identity_id = Identity.id`

2. **Day 3**: User books "Consulta Inicial 0€" via WhatsApp
   - **Matches**: Same phone → finds existing `Identity`
   - **Creates**: `Lead` (source: WhatsApp booking)
   - **Links**: Both Leads share same `identity_id`

3. **Day 7**: User completes first paid booking (€80)
   - **Converts**: Lead → Patient
   - **Creates**: `Patient` record
   - **Links**: `Patient.identity_id = Identity.id`
   - **Result**: 2 Leads + 1 Patient, all linked to 1 Identity

**Timeline View** (`/contacts/{identity_id}`):
- Shows all 3 interactions chronologically
- Clear distinction: Lead (blue) vs Patient (green)
- Navigate to Lead or Patient detail with one click

---

## Trinity API Structure

```
/api/v1/
├── leads/              # CONNECT: CRM, lead pipeline
├── patients/           # PRACTICE: clinical records
├── contacts/           # IDENTITY VAULT: 360° view
├── public/
│   ├── forms/          # CONNECT: public intake
│   └── booking/        # CONNECT → PRACTICE bridge
├── booking/            # PRACTICE: appointments
├── clinical-entries/   # PRACTICE: session notes
├── dashboard/          # GROW: analytics
└── billing/            # GROW: payments
```

---

## See Also

- [identity-vault.md](./identity-vault.md) — Technical implementation
- [aletheia-system.md](./aletheia-system.md) — AI intelligence across all pillars
- [journeys-engine.md](./journeys-engine.md) — Patient lifecycle automation
- ADR-XXX: Lead-Patient Separation Architecture (TODO)

---

**Last Updated**: 2026-01-12 (v1.7.5)
