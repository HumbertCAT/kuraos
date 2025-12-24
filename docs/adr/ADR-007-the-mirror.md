# ADR-007: The Mirror (Progress Visualization & Retention)

**Status:** 🟡 PLANNED (Fidelization Phase 3/3)  
**Date:** 2024-12-24  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Churn Prevention & Visual Progress Proof  

---

## Summary

Automatic generation of evolution reports based on clinical metadata and sentiment analysis.

**Mantra:** *"Make the invisible visible."*

**Anti-Churn Purpose:** Emotional progress is like watching grass grow — The Mirror takes "satellite photos" quarterly to show: *"Look where you were. Look where you are now."*

---

## The 4 Dimensions

### 1. Emotional Climate (Sentiment Trend)
- Smoothed line chart
- Y-axis: Perceived wellbeing (AletheIA sentiment score)
- X-axis: Time
- Narrative: "Your emotional climate went from 'Stormy' to 'Variable with clear spells'"

### 2. Semantic Shift (The Crown Jewel)
- Two word clouds side by side: Month 1 vs Month 3
- **Before:** "Fear, Insomnia, Ex, Guilt"
- **After:** "Work, Boundaries, Future, Calm"
- **Impact:** Irrefutable proof that therapy focus has shifted

### 3. Consistency (The Show Up)
- Simple metric: "You prioritized yourself 12 times this quarter"
- Session count with positive framing

### 4. Journey Milestones
- Visual timeline with badges
- "Start", "Risk Form Passed", "Retreat Completed", "Membership Activated"

---

## Data Architecture

### ProgressEngine Service

```python
class ProgressEngine:
    def generate(self, patient_id: UUID, start: date, end: date) -> SoulReportData:
        # 1. Fetch all DailyConversationAnalysis (sentiment, keywords)
        # 2. Calculate rolling averages (smooth spikes)
        # 3. Extract keyword frequency counts
        # 4. Generate JSON report structure
        return SoulReportData(...)
```

### SoulReport Model

```python
class SoulReport(Base):
    id: UUID
    patient_id: UUID
    
    period_start: date
    period_end: date
    generated_at: datetime
    
    data: JSON  # The report content
    therapist_note: str  # Personal touch: "I'm proud of your work with boundaries"
    
    status: Enum  # DRAFT, PUBLISHED, VIEWED
    public_token: str  # Secure access without login
```

---

## User Experience

### Therapist (Editor Mode)

**Location:** Patient Profile → "Generate Quarterly Report"

**Features:**
- Preview: See graphs and keywords
- **Safety Edit:** Hide sensitive keywords (e.g., affair partner's name)
- **Personal Touch:** Add closing note
- Publish → Patient receives email

### Patient (Viewer Mode)

**Delivery:** Email "Your Evolution Report is Ready"

**Experience:** "Spotify Wrapped" style
- Mobile-first, animated
- Scrolling story, not static PDF
- Animated graph entries
- "Download PDF" option at end

---

## The Retention Hook

**Last slide "Next Steps"** suggests based on patient state:

| State | Suggestion |
|-------|------------|
| Doing well | "Join the Maintenance Club (Membership)" |
| In crisis | "Let's reinforce. 3-Session Deepening Pack" |
| Plateaued | "Try this new audio from my library" |

---

## Privacy Guardrails

**We show META-DATA, never clinical notes:**
- ✅ Sentiment scores (numbers)
- ✅ Keywords extracted (therapist-approved)
- ✅ Session counts
- ❌ Never raw note content
- ❌ Never identifiable details without review

---

## Implementation Phases

### Phase 1: Engine (2 weeks)
- [ ] ProgressEngine service
- [ ] SoulReport model
- [ ] Data aggregation from ai_analyses

### Phase 2: Editor (1 week)
- [ ] "Generate Report" button
- [ ] Preview mode
- [ ] Keyword hiding
- [ ] Therapist note field

### Phase 3: Viewer (2 weeks)
- [ ] Public token access (`/reports/public/{token}`)
- [ ] "Spotify Wrapped" animated view
- [ ] Sentiment chart (recharts/nivo)
- [ ] Word cloud component
- [ ] PDF download

### Phase 4: Retention Hooks (1 week)
- [ ] "Next Steps" recommendations
- [ ] Link to membership/packages

---

## Dependencies

- **AletheIA**: Sentiment scoring, keyword extraction (already exists)
- **ADR-005**: Membership Builder (for upsell hooks)
- **Charts**: recharts or nivo library

---

## The Fidelization Trinity Complete

| Module | Purpose | Metaphor |
|--------|---------|----------|
| ADR-005: Membership Builder | Recurring revenue | The Netflix |
| ADR-006: Smart Prescriptions | Value between sessions | The Pharmacy |
| ADR-007: The Mirror | Visual proof of success | The Reflection |

**Together:** Kura OS transforms from administrative tool to **Clinical Growth Partner**.

---

## Implementation Priority Recommendation

1. **Smart Prescriptions** (ADR-006) — Fastest, immediate daily value
2. **Membership Builder** (ADR-005) — MRR foundation
3. **The Mirror** (ADR-007) — Quarterly, can wait

---

*This completes 3/3 of the Fidelization feature set.*
