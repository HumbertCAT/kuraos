# Technical Debt Register

> **Status**: Living Document (v1.3.6)  
> **Purpose**: Active technical debt tracking for KURA OS  
> **Last Updated**: 2026-01-06 (v1.3.6 Release)

This document tracks **actionable** technical debt that requires resolution. Resolved items belong in the CHANGELOG.

---



---

## 🔴 CRITICAL (Data Integrity & Notifications)



---

## 🍄 GROWTH ENGINE (The Mycelium Debt)

> [!NOTE]
> v1.1.18 implemented viral growth MVP. v1.2.0 migrated to EUR-based spending.

### Manual Workarounds (The "Soporte" Bottleneck)

| Feature | Current State | Blocker | Required Implementation |
|:---|:---|:---|:---|
| **Reward Redemption** | 🟡 mailto to soporte@kuraos.ai | No API | `POST /api/v1/growth/redeem` |
| **+1 Patient Slot** | 🟡 Manual request email | No DB logic | `UPDATE organizations SET max_patients +=1` |
| **Feature Unlock** | 🟡 Manual tier override | No feature flags | Feature flag system in `system_settings` |
| **AI Spend Grant** | 🟡 Manual limit increase | No logic | `UPDATE organizations SET ai_spend_limit += X` |
| **Redemption History** | ❌ Missing entirely | No table | New table `karma_redemptions` |

**Consequence**: Every reward redemption = manual email to soporte@kuraos.ai. Does not scale.

---

## 🎨 UI/UX & Design System Leak

### 4. Recursive Refactor Fragility
**Pattern**: API response structure changes

- **Issue**: Standardizing a list response (e.g., `Patients`) often breaks secondary consumers (`RecentPatients.tsx`, `patient-store.ts`) that are not caught by narrow audits.
- **Impact**: Production crashes after seemingly safe refactors.
- **Fix**: Enforce full-codebase audits (`grep` for legacy keys like `.patients`, `.bookings`) after **ANY** structural API change.



---

## ⚙️ INFRASTRUCTURE

### 6. Script Naming Consistency
**File**: `scripts/backup_db.sh`

- **Issue**: Backup script looks for hardcoded database names instead of using `POSTGRES_DB` env variable.
- **Impact**: Breaks on non-standard DB names.
- **Fix**: Standardize all release scripts to read `POSTGRES_DB` consistently.



---

## 🧪 TESTING INFRASTRUCTURE (The Silent Void)

> [!CAUTION]
> **Zero automated tests exist.** Every deployment is a prayer.

### 9. Lack of Automated Testing Infrastructure
**Scope**: Entire codebase (Backend + Frontend)

- **Current State**: ❌ **NO TESTS**
- **Impact**: CRITICAL - Regressions discovered only in production.
- **Risk Level**: CRITICAL - Every refactor is a gamble.
- **Fix**: Initialize **Pytest** for backend core logic and **Playwright** for critical clinical happy-paths.

---

## 🏗️ ARCHITECTURAL DEBT



---

## 📋 Debt Tracking Protocol

1. **NEVER** mark items as "Resolved" in this document. Move to CHANGELOG.
2. **ALWAYS** include file paths and risk assessment.
3. **PRIORITIZE** by business impact, not technical complexity.
4. **REVIEW** quarterly with Engineering Manager + Product Owner.
