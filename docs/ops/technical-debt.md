# Technical Debt Register

> **Status**: Living Document (v1.3.4)  
> **Purpose**: Active technical debt tracking for KURA OS  
> **Last Updated**: 2026-01-05 (v1.3.4 Deployment & Gatekeeper Audit)

This document tracks **actionable** technical debt that requires resolution. Resolved items belong in the CHANGELOG.

---

### 0.5 Partial AI Routing Coverage (Incomplete Circuit)
**File**: `backend/app/services/{risk_detector, briefing, communication, help}.py`

- **Issue**: v1.3.3 fixed the clinical note loop. v1.3.4 fixed Helper. Sentinel, Now, and Pulse still use legacy `AI_MODEL` or hardcoded settings.
- **Impact**: Admin model selections for these specific units are ignored in production.
- **Risk Level**: MEDIUM - Operational disconnect and cost inaccuracy.
- **Fix**: Connect all remaining services (Sentinel, Now, Pulse) to `ProviderFactory.get_provider_for_task()` (Operation Full Circuit).

---

## 🔴 CRITICAL (Data Integrity & Notifications)

### 1. Booking Notifications
**File**: `backend/app/api/v1/booking.py`

- **Issue**: Missing email trigger logic for rescheduling (Cancellations resolved in v1.2.2).
- **Impact**: Patients are not notified when appointments are changed by therapist.
- **Risk Level**: HIGH - Patient no-shows, confusion, poor UX.
- **Fix**: Implement automation events for `BOOKING_RESCHEDULED`.

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

### 5. Forbidden Hardcoded Layout Values (Semantic Leak)
**File**: `apps/platform/app/(auth)/*`, `apps/platform/app/(dashboard)/*`

- **Issue**: Gatekeeper audit v1.3.4 identified manual pixel overrides (e.g., `w-[500px]`, `top-[-20%]`) specifically in Auth and Settings pages.
- **Impact**: Breaks design system sovereignty. Prevents responsive behavior.
- **Fix**: Replace arbitrary `-[...]` values with standard Tailwind tokens.

---

## ⚙️ INFRASTRUCTURE

### 6. Script Naming Consistency
**File**: `scripts/backup_db.sh`

- **Issue**: Backup script looks for hardcoded database names instead of using `POSTGRES_DB` env variable.
- **Impact**: Breaks on non-standard DB names.
- **Fix**: Standardize all release scripts to read `POSTGRES_DB` consistently.

### 7. Stripe Event Subscription Parity
**System**: Stripe Webhook Configuration

- **Issue**: Manual creation of webhook endpoints results in missing critical event subscriptions.
- **Impact**: Backend remains silent while Stripe reports "Success" for secondary events.
- **Fix**: Implement a status endpoint that checks which event types have been received and warns if critical triggers are missing.

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

### 10. Service Layer Hybridity (Sync/Async)
**File**: `backend/app/services/aletheia.py`

- **Issue**: The main AI service uses a hybrid of sync and async methods, blocking full Task Routing implementation.
- **Impact**: Prevents SENTINEL/PULSE from using dynamic routing without blocking the event loop.
- **Risk Level**: MEDIUM - Blocks full governance circuit.
- **Fix**: Refactor `AletheIA` to be strictly asynchronous and consume providers from `ProviderFactory`.

---

## 📋 Debt Tracking Protocol

1. **NEVER** mark items as "Resolved" in this document. Move to CHANGELOG.
2. **ALWAYS** include file paths and risk assessment.
3. **PRIORITIZE** by business impact, not technical complexity.
4. **REVIEW** quarterly with Engineering Manager + Product Owner.
