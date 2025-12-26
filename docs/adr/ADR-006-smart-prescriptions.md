# ADR-006: Smart Prescriptions (Clinical Content Assignment)

**Status:** 🟡 PLANNED (Fidelization Phase 2/3)  
**Date:** 2025-12-24  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Clinical Content Delivery with AI Matching  

---

## Summary

Digital dispensation system for therapeutic resources based on clinical triggers, with adherence tracking.

**Mantra:** *"Don't send a PDF. Prescribe a solution."*

**Differentiation:** Content has **clinical intent**, **traceability**, and **dosage** — not just file sharing.

---

## The Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. DETECTION   │────►│  2. SUGGESTION  │────►│  3. PRESCRIPTION│
│  (The Diagnosis)│     │  (AI Pharmacist)│     │  (The Signature)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
    Therapist             AletheIA shows           Click "Prescribe"
    writes note:          widget: "💊 Suggested     + add custom
    "Anxiety at           Prescriptions"           message
    bedtime..."           - Jacobson Audio
                          - Sleep Hygiene PDF
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐
│  5. ADHERENCE   │◄────│  4. DELIVERY    │
│  (Tracking)     │     │  (The Dose)     │
└─────────────────┘     └─────────────────┘
         │                       │
    Next session:          Patient receives
    "Audio: 10%            WhatsApp/Email:
    PDF: Not opened"       "Your therapist sent
                           you a new tool"
```

---

## Data Architecture

### Prescription Model

```python
class Prescription(Base):
    id: UUID
    organization_id: UUID
    patient_id: UUID  # FK
    content_id: UUID  # FK ContentLibrary
    prescribed_by: UUID  # Therapist user_id
    related_entry_id: UUID  # Optional: clinical note that triggered
    
    custom_message: str  # "Listen tonight before bed, Juan"
    valid_until: datetime  # Access expiration
    
    # Adherence tracking
    status: Enum  # SENT, OPENED, COMPLETED
    progress: int  # 0-100 for audio/video
    opened_at: datetime
    completed_at: datetime
```

---

## AI Matchmaker (AletheIA Integration)

**How it works:**

1. When `ClinicalEntry` is saved, extract clinical themes (anxiety, insomnia, grief, trauma)
2. Query `ContentLibrary` matching tags
3. Filter: Exclude content patient already received
4. Return Top 3 matches with confidence score

**Auto-tagging (Content Upload):**
- Use Gemini to analyze PDF text / transcribe audio
- Suggest tags automatically: `["ansiedad", "sueño", "meditación"]`

---

## Clinical Interface: The Prescription Pad

**Location:** Sidebar widget in ClinicalComposer + Patient Profile

**Components:**
- Semantic search: "Find resources for..."
- Prescription Card: Thumbnail + title + tags
- "Send via WhatsApp" button (pre-filled wa.me link)
- "Send via Email" button (transactional template)

---

## Adherence Tracking

**Patient Portal:**
- Magic Link: `kura.bio/p/rx/{token}`
- Tracking pixel / JS to update `status=OPENED`
- Audio/video player reports `progress` %

**Timeline Display:**
```
Session Note (Dec 20)
├─ ✅ Audio: Anxiety Relief - Completed (Dec 21, 22:30)
└─ ❌ PDF: Gratitude Journal - Not opened
```

**Clinical Value:** "I see you couldn't listen to the audio. What happened?"

---

## Delivery Channels

**WhatsApp (Priority):**
```
Tu terapeuta te ha enviado una herramienta:
📚 "Relajación Progresiva Jacobson"
👉 Accede aquí: kura.bio/p/rx/abc123

Mensaje: "Escucha esto esta noche, Juan. Hablamos el martes."
```

**Email (Fallback):**
- Transactional template via Brevo
- Same content, formatted for email

---

## Why Better Than SimplePractice

| Feature | SimplePractice | Kura Smart Prescriptions |
|---------|----------------|--------------------------|
| Content storage | ✅ Upload PDF | ✅ Upload + Auto-tag |
| Sharing | ✅ Manual share | ✅ AI-suggested based on notes |
| Tracking | ❌ None | ✅ Opened, Progress %, Completed |
| Context | ❌ Dead file | ✅ Linked to clinical session |
| Delivery | ❌ Patient portal only | ✅ WhatsApp + Email + Portal |

---

## Implementation Phases

### Phase 1: Core Model (1 week)
- [ ] Prescription model
- [ ] Magic Link generator (`/p/rx/{token}`)
- [ ] Patient content viewer (portal page)

### Phase 2: Tracking (1 week)
- [ ] Status updates (OPENED, COMPLETED)
- [ ] Progress tracking for audio/video
- [ ] Timeline integration

### Phase 3: AI Suggestions (1 week)
- [ ] Tag extraction from clinical notes
- [ ] Content-to-note matching
- [ ] "Suggested Prescriptions" widget

### Phase 4: Delivery (1 week)
- [ ] WhatsApp integration (wa.me deep link)
- [ ] Email template
- [ ] Notification to patient

---

## Dependencies

- **ADR-005**: ContentLibrary model (required)
- **AletheIA**: Tag extraction from notes
- **Twilio/Meta**: WhatsApp delivery

---

## References

- Related: [ADR-005: Membership Builder](./ADR-005-membership-builder.md)
- Competitor gap: SimplePractice, TherapyNotes — no adherence tracking

---

*This is 2/3 of the Fidelization feature set.*
