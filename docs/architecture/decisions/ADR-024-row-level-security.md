# ADR-024: PostgreSQL Row Level Security (RLS)

**Status:** 🟡 DEFERRED  
**Date:** 2026-01-07  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Database-Level Tenant Isolation  
**Extracted From:** [ADR-001](./ADR-001-database-v2-proposal.md) (archived)

---

## Summary

Implement PostgreSQL Row Level Security policies for automatic tenant isolation at the database level.

## Problem

Currently, tenant isolation is enforced at the **application level** (every query includes `WHERE organization_id = X`). This works but relies on developers never making mistakes.

RLS moves this guarantee to the **database level** - even if a query forgets the filter, PostgreSQL enforces it.

## Proposed Solution

```sql
-- Enable RLS
ALTER TABLE clinical_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_entries FORCE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON clinical_entries
    FOR ALL
    USING (organization_id = current_setting('app.current_org')::uuid);
```

```python
# Session context injection
async def get_db_with_context(user: User):
    await session.execute(f"SET app.current_org = '{user.organization_id}'")
    yield session
```

## Decision: DEFERRED

### Why Defer?
- Current team size (1 dev) doesn't justify complexity
- Application-level isolation working well
- Session context refactoring required
- Risk of Alembic migration complexity

### Trigger Conditions
- [ ] 50+ organizations milestone
- [ ] Multiple backend services accessing DB
- [ ] Security audit requirement

### Prerequisites
- [ ] Refactor `database.py` session management
- [ ] Add `data_classification` column to sensitive tables
- [ ] Performance benchmarking with RLS enabled
- [ ] Rollback strategy documented

---

*This ADR will be revisited when trigger conditions are met.*
