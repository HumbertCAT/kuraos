# Technical Debt Register

> **Status**: Living Document (v1.1.20)  
> **Purpose**: Active technical debt tracking for KURA OS  
> **Last Updated**: 2026-01-03

This document tracks **actionable** technical debt that requires resolution. Resolved items belong in the CHANGELOG.

---

## 🔴 CRITICAL (Data Integrity & Notifications)

### 1. Booking Notifications
**File**: `backend/app/api/v1/booking.py`

- **Issue**: Missing email/SMS trigger logic for cancellations and rescheduling
- **Impact**: Patients are not notified when appointments are changed by therapist
- **Risk Level**: HIGH - Patient no-shows, confusion, poor UX
- **Fix**: Implement automation events for `BOOKING_CANCELLED` and `BOOKING_RESCHEDULED`

### 2. Decimal Precision in Financial KPIs
**File**: `backend/app/api/v1/*` (roster endpoints)

- **Issue**: SQLAlchemy `Decimal` results are cast to `float` for JSON serialization
- **Impact**: Acceptable for UI display, but risks precision loss for accounting/billing
- **Risk Level**: MEDIUM - Future audit issues
- **Fix**: Return financial values as strings or scaled integers for pure financial endpoints

---

## 🍄 GROWTH ENGINE (The Mycelium Debt)

> [!NOTE]
> v1.1.18 implemented viral growth MVP. Automation gaps remain.

### Manual Workarounds (The "Soporte" Bottleneck)

| Feature | Current State | Blocker | Required Implementation |
|:---|:---|:---|:---|
| **Reward Redemption** | 🟡 mailto to soporte@kuraos.ai | No API | `POST /api/v1/growth/redeem` |
| **+1 Patient Slot** | 🟡 Manual request email | No DB logic | `UPDATE organizations SET max_patients +=1` |
| **Feature Unlock** | 🟡 Manual tier override | No feature flags | Feature flag system in `system_settings` |
| **AI Token Grant** | 🟡 Manual quota increase | No credit system | `INSERT INTO ai_usage_log (debit_credit)` |
| **Redemption History** | ❌ Missing entirely | No table | New table `karma_redemptions` |

**Consequence**: Every reward redemption = manual email to soporte@kuraos.ai. Does not scale.

---

## 🎨 UI/UX & Fragility

### 3. Forms QR Modal (Broken State)
**File**: `apps/platform/app/[locale]/forms/page.tsx`

- **Issue**: QR button appears clickable but does nothing if form has no `public_token`
- **Impact**: Confusing UX, wastes time
- **Fix**: Either disable button when no token, or auto-generate token on first QR click

### 4. Recursive Refactor Fragility
**Pattern**: API response structure changes

- **Issue**: Standardizing a list response (e.g., `Patients`) often breaks secondary consumers (`RecentPatients.tsx`, `patient-store.ts`) that are not caught by narrow audits
- **Impact**: Production crashes after seemingly safe refactors
- **Fix**: Enforce full-codebase audits (`grep` for legacy keys like `.patients`, `.bookings`) after **ANY** structural API change

### 5. FocusSessionCard (Mock Data)
**File**: `apps/platform/components/dashboard/FocusSessionCard.tsx`

- **Issue**: Widget still uses mock AletheIA insight instead of real patient data
- **Status**: 🟡 PENDING
- **Fix**: Wire to `GET /api/v1/insights/patient/{id}` or equivalent

---

## ⚙️ INFRASTRUCTURE

### 6. Script Naming Consistency
**File**: `scripts/backup_db.sh`

- **Issue**: Backup script looks for hardcoded database names instead of using `POSTGRES_DB` env variable
- **Impact**: Breaks on non-standard DB names
- **Fix**: Standardize all release scripts to read `POSTGRES_DB` consistently

### 7. Stripe Dynamic Rates (Hardcoded)
**File**: `backend/app/services/stripe_service.py`

- **Issue**: Application fee rates (5%/3%/2%) are hardcoded in Python
- **Impact**: Cannot adjust commission without deployment
- **Fix**: Read from `system_settings` table for dynamic configuration

---

## 🧪 TESTING INFRASTRUCTURE (The Silent Void)

> [!CAUTION]
> **Zero automated tests exist.** Every deployment is a prayer.

### 8. Automated Unit Testing System
**Scope**: Entire codebase (Backend + Frontend)

- **Current State**: ❌ **NO TESTS** - Not a single unit test, integration test, or E2E test
- **Impact**: CRITICAL - Regressions discovered only in production
- **Risk Level**: CRITICAL - Every refactor is a gamble

#### Requirements for "Doubly Automatic" Testing:

| Dimension | Requirement | Implementation |
|:----------|:------------|:---------------|
| **Auto-Execute** | Tests run on every release/PR | GitHub Actions workflow with `pytest` + `vitest` |
| **Auto-Generate** | New tests created per feature | AI/LLM test generator or strict PR template requiring tests |

#### Proposed Stack:

| Layer | Tool | Target |
|:------|:-----|:-------|
| Backend Unit | `pytest` + `pytest-asyncio` | Models, Services, Utils |
| Backend Integration | `pytest` + `httpx` | API endpoints |
| Frontend Unit | `vitest` + `@testing-library/react` | Components, Hooks |
| E2E | `Playwright` | Critical user journeys |
| CI/CD Gate | GitHub Actions | Block merge if coverage < 80% |

#### Priority Order:
1. **Critical paths first**: Auth, Payments, AI Analysis, Booking
2. **Business logic**: Services (ledger, risk_detector, automation_engine)
3. **UI components**: Forms, Modals, Data tables

#### Estimated Effort:
- Initial setup (CI + fixtures): **2-3 days**
- Core backend tests (~50 tests): **1 week**
- Frontend tests (~30 tests): **1 week**
- E2E critical flows (~10 flows): **3 days**
- **Total**: ~3 weeks for solid foundation

---

## 📋 Debt Tracking Protocol

1. **NEVER** mark items as "Resolved" in this document. Move to CHANGELOG.
2. **ALWAYS** include file paths and risk assessment.
3. **PRIORITIZE** by business impact, not technical complexity.
4. **REVIEW** quarterly with Engineering Manager + Product Owner.
