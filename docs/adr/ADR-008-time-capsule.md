# ADR-008: The Time Capsule (Delayed Messaging)

**Status:** 🟡 PLANNED (Fidelization Cherry on Top)  
**Date:** 2025-12-24  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Emotional Retention & Therapeutic Tool  

---

## Summary

System for delayed, scheduled messaging — patients send hope to their future selves.

**Mantra:** *"Send hope to the future."*

**Therapeutic Insight:** Time is an active ingredient in healing. This feature proves Kura OS understands psychotherapy better than any Silicon Valley engineer.

---

## The Magic Experience

### Creation Moment (In Composer)

**Trigger:** Hourglass icon ⏳ in Composer toolbar

**The Message:**
- Audio (native recorder): "Record a message for your future self"
- Text: "Dear future me, remember that today you felt capable of..."
- Attachment: Photo of drawing or symbol from session

**The Destination (Date):**
- Quick selectors: +1 Month, +3 Months, +6 Months, +1 Year
- Custom date picker (e.g., birthday)

**The Sealing:**
- Button: "Seal Capsule"
- Animation: Envelope closes with wax seal, disappears from view

### Delivery Moment (The Reveal)

**When:** Scheduled day at 09:00 AM local time

**Email/WhatsApp:**
```
Subject: ⏳ You have a message waiting since [Creation Date]

Body:
"Hello [Name]. 6 months ago, you left a message for yourself.
Your therapist [Therapist Name] kept this safe for today."

[Open Capsule] → Secure micro-landing
```

**The Reveal Page:**
- "This message traveled 180 days to find you"
- Audio player / text display
- Emotional, minimal design

---

## Data Architecture

### TimeCapsule Model

```python
class TimeCapsule(Base):
    id: UUID
    organization_id: UUID
    patient_id: UUID  # FK
    created_by: UUID  # Therapist who helped create it
    
    content_text: str  # Encrypted
    media_url: str  # S3/GCS link (audio/image)
    
    unlock_at: datetime
    status: Enum  # SEALED, DELIVERED, OPENED
    delivery_method: Enum  # EMAIL, WHATSAPP
    
    created_at: datetime  # For "Time Travelled" calculation
    opened_at: datetime  # When patient viewed
```

---

## Delivery Engine

**Worker:** `backend/app/services/time_capsule_delivery.py`

```python
async def deliver_due_capsules():
    """Run daily at 9:00 AM local org time."""
    due_capsules = await db.query(TimeCapsule).filter(
        TimeCapsule.unlock_at <= now(),
        TimeCapsule.status == "SEALED"
    ).all()
    
    for capsule in due_capsules:
        if capsule.delivery_method == "WHATSAPP":
            await send_whatsapp_capsule(capsule)
        else:
            await send_email_capsule(capsule)
        
        capsule.status = "DELIVERED"
```

**Scheduler:** Add to `main.py` (daily at 9:00 AM)

---

## API Endpoints

- `POST /capsules` — Create and seal (accepts file upload)
- `GET /capsules/public/{token}` — View capsule (only if unlock_at passed)
  - If accessed early: Show countdown timer
  - Signed URL for media (temporary access)

---

## Frontend Components

### TimeCapsuleCreator.tsx

**Location:** Composer toolbar (⏳ icon)

**Modal:**
- Text area + Audio recorder (reuse existing)
- Timing: Quick buttons + date picker
- "Seal" button with envelope animation

### Timeline Integration

**In Patient Timeline:**
```
🔒 Cápsula sellada — Se abrirá el 24 Dic 2025
   (Content hidden until unlock)
```

---

## Privacy & Security

- Content encrypted at rest
- Media in private storage, signed URLs only
- Public link requires token + date check
- Therapist cannot read sealed capsules retroactively

---

## Implementation Phases

### Phase 1: Core (1 week)
- [ ] TimeCapsule model
- [ ] POST /capsules endpoint
- [ ] Audio/image upload

### Phase 2: Delivery (1 week)
- [ ] Cron job (9:00 AM check)
- [ ] Email template
- [ ] WhatsApp template

### Phase 3: Viewer (1 week)
- [ ] Public view page
- [ ] Countdown if too early
- [ ] "Time Travelled" calculation
- [ ] Signed URL for media

### Phase 4: UI (1 week)
- [ ] Composer integration
- [ ] Seal animation
- [ ] Timeline locked state

---

## The Complete Loyalty Stack

| Layer | Module | Metaphor |
|-------|--------|----------|
| Revenue | Membership Builder | The Netflix |
| Value | Smart Prescriptions | The Pharmacy |
| Proof | The Mirror | The Reflection |
| Magic | Time Capsule | The Hope |

**The cycle closes:**
- **Leads**: Capture fast (CRM)
- **Clinical**: Manage safely (Soul Record)
- **Loyalty**: Retain with magic (Time Capsule)

---

*This is the "cherry on top" of the Fidelization feature set (4/4).*
