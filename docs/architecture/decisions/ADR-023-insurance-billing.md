# ADR-023: Insurance Billing & Hybrid Ledger

**Status:** 🟡 DEFERRED  
**Date:** 2026-01-07  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Enterprise Medical Billing Requirements  
**Extracted From:** [ADR-001](./ADR-001-database-v2-proposal.md) (archived)

---

## Summary

Unified financial ledger for medical insurance claims (CPT codes) AND retail/retreat payments.

## Problem

Need to handle:
- Medical insurance billing (CPT codes, ANSI X12 837P format)
- Retail products (shop items)
- Program enrollments (retreats with installments)

All in a single patient balance view.

## Proposed Solution

```python
class FinancialLedgerEntry(Base):
    __tablename__ = "financial_ledger_entries"
    
    transaction_type: Enum["clinical_service", "retail_product", "program_enrollment"]
    payment_status: Enum["pending_insurance", "patient_due", "paid", "failed"]
    amount_cents: int
    metadata: JSONB  # CPT codes, Stripe subscription IDs, etc.
```

## Decision: DEFERRED

### Trigger Conditions
- [ ] First enterprise customer requiring insurance billing
- [ ] Clearinghouse API account established (Availity/Change Healthcare)
- [ ] Billing specialist on team

### Prerequisites
- Clearinghouse integration
- ERA/EOB processing capability
- State-by-state licensing research
- Superbill generation

---

*This ADR will be revisited when trigger conditions are met.*
