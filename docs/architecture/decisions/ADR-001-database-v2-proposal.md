# ADR-001: Database v2.0 Architecture Proposal

**Status:** 🟡 DEFERRED  
**Date:** 2025-12-24  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Series-A Readiness Planning  

---

## Summary

This ADR documents a comprehensive database evolution proposal for KURA OS v2.0, designed to solve two problems competitors fail at: **Hybrid Billing** (Insurance + Retail) and **Data Segregation** (HIPAA vs Non-HIPAA). After analysis, implementation is **deferred** until market validation.

---

## Problem Statement

As KURA OS scales beyond MVP, three architectural gaps emerge:

1. **Financial Complexity**: Need to handle medical insurance claims (CPT codes) AND retreat installment payments in a unified ledger
2. **Legal Isolation**: Need to separate Clinical PHI (HIPAA) from Coaching data at the database level, not just application level
3. **Data Richness**: Need to store multimodal biomarker data (voice analysis, wearables) without polluting core schemas

---

## Proposed Solutions

### 1. Hybrid Ledger (Financial Architecture)

**Objective:** Unified patient balance across medical and retail transactions.

#### Schema Design

```python
# models/financial_ledger.py

class TransactionType(str, Enum):
    CLINICAL_SERVICE = "clinical_service"   # Medical (CPT codes)
    RETAIL_PRODUCT = "retail_product"       # Shop items
    PROGRAM_ENROLLMENT = "program_enrollment"  # Retreats

class PaymentStatus(str, Enum):
    PENDING_INSURANCE = "pending_insurance"
    PATIENT_DUE = "patient_due"
    PAID = "paid"
    FAILED = "failed"

class FinancialLedgerEntry(Base):
    __tablename__ = "financial_ledger_entries"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID, ForeignKey("organizations.id"), nullable=False)
    patient_id = Column(UUID, ForeignKey("patients.id"), nullable=False)
    
    transaction_type = Column(SQLAlchemyEnum(TransactionType), nullable=False)
    payment_status = Column(SQLAlchemyEnum(PaymentStatus), nullable=False)
    
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(3), default="USD")
    
    # Flexible metadata for different transaction types
    metadata = Column(JSONB, default={})
    # Clinical: {"cpt_code": "90837", "diagnosis_code": "F43.10", "superbill_id": "uuid"}
    # Retreat: {"stripe_subscription_id": "sub_123", "installment_number": 1, "total_installments": 4}
    
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### Implementation Requirements
- Integration with clearinghouses (Availity, Change Healthcare)
- ANSI X12 837P format compliance for claims
- Superbill generation for medical transactions
- Receipt generation for retail transactions

---

### 2. Row Level Security (RLS)

**Objective:** PostgreSQL-level tenant and role isolation.

#### Schema Extensions

Every sensitive table requires:

```python
# Additional columns for RLS
organization_id = Column(UUID, ForeignKey("organizations.id"), nullable=False)
data_classification = Column(
    SQLAlchemyEnum("CLINICAL_PHI", "GENERAL_WELLNESS", name="data_classification"),
    nullable=False,
    default="GENERAL_WELLNESS"
)
```

#### PostgreSQL RLS Policies

```sql
-- Enable RLS on clinical_entries
ALTER TABLE clinical_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_entries FORCE ROW LEVEL SECURITY;

-- Policy 1: Tenant Isolation
-- Users can only see rows from their organization
CREATE POLICY tenant_isolation ON clinical_entries
    FOR ALL
    USING (organization_id = current_setting('app.current_org')::uuid);

-- Policy 2: Role-Based PHI Restriction  
-- COACH role cannot access CLINICAL_PHI data
CREATE POLICY coach_phi_restriction ON clinical_entries
    FOR SELECT
    USING (
        data_classification != 'CLINICAL_PHI' 
        OR current_setting('app.user_role', true) != 'COACH'
    );

-- Grant usage (RLS applies on top of these)
GRANT SELECT, INSERT, UPDATE, DELETE ON clinical_entries TO kura_app;
```

#### Application Changes Required

```python
# database.py - Session context injection
async def get_db_with_context(user: User):
    async with async_session() as session:
        await session.execute(
            text(f"SET app.current_org = '{user.organization_id}'")
        )
        await session.execute(
            text(f"SET app.user_role = '{user.role}'")
        )
        yield session
```

---

### 3. Biomarkers Schema

**Objective:** Store multimodal health data (voice, wearables) for analysis.

```python
# models/biomarkers.py

class BiomarkerSource(str, Enum):
    KINTSUGI_VOICE = "kintsugi_voice"
    APPLE_HEALTH_KIT = "apple_health_kit"
    OURA_API = "oura_api"
    MANUAL_INPUT = "manual_input"

class BiomarkerLog(Base):
    __tablename__ = "biomarker_logs"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID, ForeignKey("organizations.id"), nullable=False)
    patient_id = Column(UUID, ForeignKey("patients.id"), nullable=False)
    
    source = Column(SQLAlchemyEnum(BiomarkerSource), nullable=False)
    metric_type = Column(String(100), nullable=False)  # e.g., "depression_score", "hrv_rmssd"
    
    value_numeric = Column(Float, nullable=True)  # For graphing
    value_text = Column(Text, nullable=True)      # For categorical data
    raw_payload = Column(JSONB, default={})       # Full API response for auditing
    
    captured_at = Column(DateTime, nullable=False)  # Actual reading time
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Composite index for time-series queries
    __table_args__ = (
        Index('idx_biomarker_timeseries', 'patient_id', 'metric_type', 'captured_at'),
    )
```

---

## Decision: DEFERRED

### Rationale

| Component | Defer Reason |
|-----------|-------------|
| **Hybrid Ledger** | Requires clearinghouse integrations + billing specialist. No paying customer demanding this yet. |
| **RLS** | Valuable but requires session context refactoring. Risk of Alembic migration complexity. |
| **Biomarkers** | Zero current users with Kintsugi/Oura. Building for hypothetical demand. |

### Recommended Timeline

| Phase | Feature | Trigger |
|-------|---------|---------|
| **Q2 2026** | RLS Pilot (clinical_entries only) | After 50 orgs milestone |
| **When Demanded** | Hybrid Ledger | First enterprise customer requiring insurance billing |
| **When Demanded** | Biomarkers | First integration partner (Kintsugi, Oura, etc.) |

---

## Dependencies for Future Implementation

### Hybrid Ledger Prerequisites
- [ ] Clearinghouse API account (Availity or Change Healthcare)
- [ ] ERA/EOB processing capability
- [ ] Billing specialist on team
- [ ] State-by-state licensing research

### RLS Prerequisites
- [ ] Refactor `database.py` session management
- [ ] Add `data_classification` column to all sensitive tables
- [ ] Performance benchmarking with RLS enabled
- [ ] Rollback strategy documented

### Biomarkers Prerequisites
- [ ] Partnership with data provider (Kintsugi, Oura, Apple)
- [ ] Data processing pipeline for time-series
- [ ] Visualization components (graphs, trends)

---

## References

- Original proposal: System Architect (December 2025)
- Analysis: GAG Engineering Review
- Related: [TECH_DEBT.md](../TECH_DEBT.md), [ROADMAP.md](../../ROADMAP.md)

---

*This ADR will be revisited when any of the trigger conditions are met.*
