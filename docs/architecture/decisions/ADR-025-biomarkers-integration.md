# ADR-025: Biomarkers Integration Architecture

**Status:** 🟡 DEFERRED  
**Date:** 2026-01-07  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Multimodal Health Data Integration  
**Extracted From:** [ADR-001](./ADR-001-database-v2-proposal.md) (archived)

---

## Summary

Schema and integration architecture for storing multimodal biomarker data from external providers (voice analysis, wearables).

## Problem

Future clinical intelligence may require:
- Voice biomarkers (depression detection via Kintsugi)
- Physiological data (HRV, sleep via Oura/Apple Health)
- Manual patient inputs (mood tracking)

Currently no schema exists for time-series health data.

## Proposed Solution

```python
class BiomarkerSource(str, Enum):
    KINTSUGI_VOICE = "kintsugi_voice"
    APPLE_HEALTH_KIT = "apple_health_kit"
    OURA_API = "oura_api"
    MANUAL_INPUT = "manual_input"

class BiomarkerLog(Base):
    __tablename__ = "biomarker_logs"
    
    patient_id: UUID
    source: BiomarkerSource
    metric_type: str  # e.g., "depression_score", "hrv_rmssd"
    value_numeric: float
    raw_payload: JSONB  # Full API response for auditing
    captured_at: datetime  # Actual reading time
```

## Decision: DEFERRED

### Why Defer?
- Zero current users with Kintsugi/Oura integrations
- Building for hypothetical demand
- Requires partnership agreements first

### Trigger Conditions
- [ ] First integration partner signed (Kintsugi, Oura, Apple)
- [ ] Customer demand for wearable integration

### Prerequisites
- [ ] Partnership with data provider
- [ ] Data processing pipeline for time-series
- [ ] Visualization components (graphs, trends)
- [ ] HIPAA assessment for third-party data

---

*This ADR will be revisited when trigger conditions are met.*
