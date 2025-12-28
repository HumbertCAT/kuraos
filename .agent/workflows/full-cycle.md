---
description: The complete Generator Protocol - from idea to production
---

# Full Cycle (The God Workflow)

> **USE CASE:** Complete feature development from zero to production.
> **GOAL:** Execute the entire Generator Protocol in sequence.

```
┌─────────────────────────────────────────────────────────────────┐
│  /plan-cycle → /create-feature → /safe-migration → /audit → /publish-release  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Phase 1: STRATEGY (The Spark)

**Execute:** `/plan-cycle`

- [ ] Define objective and Trinity domain
- [ ] Identify risks (HIPAA/Payments)
- [ ] Generate `implementation_plan.md`
- [ ] **⚠️ STOP: Get Director approval**

---

## 🏗️ Phase 2: BUILD (The Construction)

**Execute:** `/create-feature`

- [ ] Define domain (CONNECT/PRACTICE/GROW/GLOBAL)
- [ ] Scaffold files with Golden Rule applied
- [ ] Add translations

**If DB changes needed, execute:** `/safe-migration`

- [ ] Backup database
- [ ] Generate migration
- [ ] Test up/down locally

---

## 🔍 Phase 3: VERIFY (The Quality Gate)

**Execute:** `/audit`

- [ ] Semantic audit (no hardcoded colors)
- [ ] Type check (pnpm build)
- [ ] Security scan

**If violations found → Return to Phase 2**

---

## 🚀 Phase 4: DEPLOY (The Launch)

**Execute:** `/publish-release`

- [ ] Update CHANGELOG, README, ROADMAP
- [ ] Backup before deploy
- [ ] Git commit + tag
- [ ] Deploy backend + frontend

---

## ✅ Cycle Complete

Report:
- 📋 Plan: Approved
- 🏗️ Build: Complete
- 🔍 Audit: PASSED
- 🚀 Version: vX.Y.Z Live
