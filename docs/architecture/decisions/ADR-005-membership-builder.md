# ADR-005: The Membership Builder (Subscriptions & Content Library)

**Status:** 🟡 PLANNED (Fidelization Phase 1/3)  
**Date:** 2025-12-24  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Retention & Recurring Revenue Module  

---

## Summary

Native subscription system to create, sell, and manage recurring content memberships.

**Mantra:** *"Convert episodic patients into permanent members."*

**Competitive Kill:** Kajabi, Teachable, Podia — but with clinical integration (Smart Prescription).

---

## Strategic Value

- **MRR Dashboard**: Predictable recurring revenue for therapists
- **Retention**: Patients stay engaged between sessions
- **Differentiation**: Hybrid access (paid OR prescription)
- **Upsell Path**: From per-session to membership = higher LTV

---

## Data Architecture

### New Models

**MembershipPlan** (The Product)
```python
class MembershipPlan(Base):
    id: UUID
    organization_id: UUID  # FK
    name: str  # "Círculo de Integración"
    price_monthly: Decimal
    stripe_product_id: str
    stripe_price_id: str
    benefits: JSON  # ["Q&A Mensual", "Acceso Biblioteca", "10% descuento"]
    is_active: bool
```

**ContentLibrary** (The Content - "Micropíldoras")
```python
class ContentLibrary(Base):
    id: UUID
    organization_id: UUID
    title: str
    description: str
    type: Enum  # VIDEO, AUDIO, PDF, TEXT_BLOCK
    url: str  # S3/CloudStorage or YouTube/Vimeo embed
    thumbnail_url: str
    tags: JSON  # ["ansiedad", "sueño", "duelo"] - for Smart Prescription
    duration_minutes: int  # For audio/video
```

**PlanContentAccess** (M2M Linking)
```python
class PlanContentAccess(Base):
    plan_id: UUID  # FK MembershipPlan
    content_id: UUID  # FK ContentLibrary
    # Allows "Premium" content only for higher tiers
```

**PatientSubscription** (The State)
```python
class PatientSubscription(Base):
    id: UUID
    patient_id: UUID  # FK
    plan_id: UUID  # FK MembershipPlan
    status: Enum  # ACTIVE, PAST_DUE, CANCELED
    stripe_subscription_id: str
    current_period_end: datetime
```

---

## Killer Feature: Smart Prescription

**The Hybrid Access Model:**

| Access Type | How | Duration | Cost |
|-------------|-----|----------|------|
| **Paid** | Patient subscribes | Unlimited | €29/mo |
| **Prescription** | Therapist grants | 7 days | Free |

**Use Case:** "As homework, I want you to listen to this audio. I've unlocked it for you for a week."

```python
class ContentPrescription(Base):
    id: UUID
    patient_id: UUID
    content_id: UUID
    granted_by: UUID  # Therapist user_id
    expires_at: datetime  # 7 days default
    notes: str  # "Listen before our next session"
```

---

## Therapist Experience: Creator Studio

**Location:** Dashboard → "Biblioteca & Planes"

**Features:**
- **Drag & Drop Upload**: Audio (MP3), PDF
- **Video Embed**: YouTube/Vimeo private links (no hosting cost v1)
- **Plan Builder**: Name + Price + Select content (checkboxes)
- **MRR Dashboard Card**: "Ingresos Recurrentes: 450€/mes (15 miembros)"

---

## Patient Experience: The Netflix View

**Location:** `/portal/library`

**Design:**
- Dark/Calm mode (separate from clinical UI)
- Carousels: "Tus Herramientas", "Novedades", "Recomendado"
- Floating audio player (navigate while listening)
- "Mark as completed" (basic gamification)
- Progress tracking per content

---

## Stripe Integration Extension

**New Webhooks:**
- `invoice.paid` → Renew subscription period
- `invoice.payment_failed` → Mark PAST_DUE
- `customer.subscription.deleted` → Mark CANCELED
- `customer.subscription.updated` → Sync plan changes

**Checkout Mode:**
```python
session = stripe.checkout.Session.create(
    mode="subscription",  # Not "payment"
    line_items=[{"price": plan.stripe_price_id, "quantity": 1}],
    ...
)
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (2 weeks)
- [ ] MembershipPlan, ContentLibrary, PatientSubscription models
- [ ] Stripe subscription checkout integration
- [ ] Subscription webhooks (renew, cancel)

### Phase 2: Creator Studio (2 weeks)
- [ ] Content upload UI (audio, PDF, embed)
- [ ] Plan builder form
- [ ] MRR dashboard card

### Phase 3: Patient Library (2 weeks)
- [ ] Netflix-style library view
- [ ] Floating audio player
- [ ] Access control (check subscription OR prescription)

### Phase 4: Smart Prescription (1 week)
- [ ] ContentPrescription model
- [ ] "Grant Access" button in patient profile
- [ ] Expiration logic

---

## Scope Exclusions (v1)

- ❌ Forums/Community chat (later phase)
- ❌ Video hosting (use embeds)
- ❌ Certificates/Gamification badges
- ❌ Cohort-based courses

---

## References

- Competitors: Kajabi ($149/mo), Teachable ($59/mo), Podia ($39/mo)
- Related: [ADR-003: Marketing Growth Engine](./ADR-003-marketing-growth-engine.md)
- Stripe Docs: [Subscriptions](https://stripe.com/docs/billing/subscriptions)

---

*This is 1/3 of the Fidelization feature set. See also ADR-006 (pending) and ADR-007 (pending).*
