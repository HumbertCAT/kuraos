# Technical Debt Register

> [!NOTE]
> **Status**: Living Document (v1.3.6)  
> **Purpose**: Active technical debt tracking for KURA OS  
> **Last Updated**: 2026-01-06 (v1.3.6 Release)

This document tracks **actionable** technical debt that requires resolution. Resolved items belong in the [CHANGELOG](../../CHANGELOG.md).

---

## 🔴 CRITICAL (Data Integrity)

### 1. Lack of Automated Testing Infrastructure
**Scope**: Entire codebase (Backend + Frontend)

> [!CAUTION]
> **Zero automated tests exist.** Every deployment is a risk of regression discoverable only in production.

- **Impact**: High - Regressions are frequent during structural refactors.
- **Risk Level**: CRITICAL
- **Required Fix**: Initialize **Pytest** for backend core and **Playwright** for critical clinical happy-paths.

---

## 🍄 GROWTH ENGINE (The Mycelium Debt)

> [!IMPORTANT]
> v1.2.0 migrated to EUR-based spending, but manual "Soporte" interventions remain a significant bottleneck.

### Manual Workarounds (The "Soporte" Bottleneck)

| Feature | Current State | Blocker | Required Implementation |
|:---|:---|:---|:---|
| **Reward Redemption** | 🟡 `mailto` to support | No API | `POST /api/v1/growth/redeem` |
| **+1 Patient Slot** | 🟡 Manual request | No DB logic | `UPDATE organizations SET max_patients +=1` |
| **Feature Unlock** | 🟡 Manual override | No flags | Feature flag system in `system_settings` |
| **AI Spend Grant** | 🟡 Manual increase | No logic | `UPDATE organizations SET ai_spend_limit += X` |
| **Redemption History** | ❌ Missing entirely | No table | New table `karma_redemptions` |

---

## 🎨 UI/UX & Design System Sovereignty

### 2. Recursive Refactor Fragility
**Pattern**: API response structure changes

> [!WARNING]
> Structural changes in API lists (e.g., `Patients`) often break secondary consumers (`RecentPatients.tsx`, `patient-store.ts`) not covered by specific audits.

- **Fix**: Enforce full-codebase audits using `grep` for legacy keys after any structural change.

---

## ⚙️ INFRASTRUCTURE & OPS

### 3. Script Naming Consistency
**File**: `scripts/backup_db.sh`

- **Issue**: Backup script uses hardcoded database names instead of the `POSTGRES_DB` environment variable.
- **Fix**: Standardize all release scripts to read environment variables consistently.

---

## 📋 Debt Tracking Protocol

1. **NEVER** mark items as "Resolved" here. Move them to the [CHANGELOG](../../CHANGELOG.md).
2. **ALWAYS** include file paths and risk assessment.
3. **PRIORITIZE** by clinical and business impact.
4. **REVIEW** quarterly with the engineering team.
