# Technical Debt Report (v1.1.16) 🛡️ THE EFFICIENCY SWEEP

This document tracks known technical debt, architectural shortcuts, and clinical implementation gaps.

---

## 🕹️ v1.1.15 Infrastructure Evolution (The Metadata Envelope)

> [!NOTE]
> v1.1.15 successfully cleared the "Clean Slate" data debt by standardizing all major rosters (Patients, Bookings, Services, Forms) to a unified API response pattern.

### 1. Resolved Wiring & Standardization ✅
- **Server-Side Pagination**: (✅ v1.1.15) Migrated logic from frontend counting to backend-driven `{ data, meta }` envelope.
- **Header KPIs**: (✅ v1.1.15) Page headers now consume real-time business metrics from `meta.extra`.
- **Trailing Slash Consistency**: (✅ v1.1.15) Standardized all API fetch calls to use trailing slashes, eliminating 307 redirect overhead.
- **Serialization Safety**: (✅ v1.1.15) Backend decimals are now explicitly cast to floats in metadata to prevent JSON serialization 500 errors.

### 2. Dashboard Wiring (✅ RESOLVED v1.1.16)

> [!NOTE]
> v1.1.16 wired all major dashboard widgets to real data sources.

| Component | Status | Resolution |
|-----------|--------|------------|
| **PipelineVelocity** | ✅ RESOLVED | Wired to leads by status (NEW, CONTACTED, CLOSING) |
| **ActiveJourneysWidget** | ✅ RESOLVED | Wired to patients with `journey_status != INACTIVE` |
| **VitalSignCard** (Ocupación) | ✅ RESOLVED | Calculated from confirmed sessions / 40 target |
| **FocusSessionCard** | 🟡 PENDING | Still uses mock AletheIA insight |

### 3. ⚖️ Architectural Contract: The Metadata Envelope

> [!IMPORTANT]
> **v1.1.15.2 Mandate:** Any backend endpoint returning a list MUST use the `PaginatedResponse<T>` envelope:
> ```json
> { "data": [...], "meta": { "total", "filtered", "page", "page_size", "extra" } }
> ```
> **No exceptions.** Frontend consumers MUST access `.data` for the array. Violating this contract will cause production crashes.

---

## 🚨 Critical Architecture & Safety

1. **The "Bypassed Component" Trap** (✅ RESOLVED v1.1.16)
   - **Status**: Resolved. Dashboard and major pages now use `api` client exclusively.
   - **Resolution**: Migrated `bookings/page.tsx`, `leads/page.tsx` to centralized API methods.

2. **Recursive Refactor Fragility**
   - **Issue**: Standardizing a list response (e.g., `Patients`) often breaks secondary consumers (`RecentPatients.tsx`, `patient-store.ts`) that are not caught by narrow audits.
   - **Fix**: Enforce full-codebase audits (grep for legacy keys like `.patients`, `.bookings`) after ANY structural API change.

3. **Service Deletion Safety** (✅ IMPLEMENTED v1.1.14)
   - **Status**: Deletion is blocked if active/pending bookings exist. ✅

4. **Booking Notifications** (`backend/app/api/v1/booking.py`)
   - **Issue**: Missing email/SMS trigger logic for cancellations and rescheduling.
   - **Risk**: Patients are not notified when appointments are changed.

5. **Forms QR Modal** (`forms/page.tsx`)
   - **Issue**: QR button does nothing if form has no `public_token`.
   - **Risk**: Confusing UX - button appears clickable but has no effect.
   - **Fix**: Either disable button when no token, or auto-generate token on first QR click.

---

## 🛠 Backend & Infrastructure

5. **Stripe Dynamic Rates** (`backend/app/services/stripe_service.py`)
   - **Issue**: Application fee rates are hardcoded.
   - **Fix**: Read from `system_settings` table.

6. **Decimal Precision vs Serialization**
   - **Issue**: SQLAlchemy results for financial KPIs return `Decimal`.
   - **Debt**: We are casting to `float` in the API layer, which is fine for UI but could lose precision for accounting.
   - **Solution**: Consider returning strings or scaled integers for pure financial endpoints.

---

## 🎨 Frontend & Design System

7. **Roster Action Inconsistency** (✅ RESOLVED v1.1.16)
   - **Status**: Resolved. All rosters now use Ghost Actions with Lucide icons.
   - **Resolution**: Standardized Admin, Forms, Bookings, Patients, Services tables.

8. **Translation Mapping Structural Debt**
   - **Issue**: Manually creating translation objects in pages (e.g., `bookings/page.tsx`) leads to build crashes if any key/locale (e.g., 'ca') is missing.
   - **Fix**: Use `useTranslations` hook predominantly or enforce strict mapping types.

9. **Terminology Preference Wiring**
   - **Issue**: UI for terminology settings (Patient vs Client) is not fully wired to active context stores.

---

## 🍄 v1.1.18 THE MYCELIUM (Growth Station)

> [!NOTE]
> v1.1.18 implemented the viral growth engine with referral tracking, karma points, and a rewards catalog. Some features are MVP/manual pending automation.

### 1. Growth Station MVP Features ✅
- **Referral Tracking**: `referred_by_id` + `karma_score` in Organization model
- **Karma Rewards**: +50 welcome bonus (referred), +100 referrer reward
- **ReferralWidget**: Dashboard share tools (WhatsApp, Email, LinkedIn, Copy)
- **Powered By Footer**: Viral attribution on public pages with `?ref=PUBLIC` tracking
- **Growth Station Page**: `/settings/referrals` with karma vault, history, rewards catalog

### 2. Pending Automation (Technical Debt)

| Feature | Current State | Required Implementation |
|---------|---------------|------------------------|
| **Reward Redemption** | 🟡 mailto to soporte@kuraos.ai | `POST /api/v1/growth/redeem` |
| **+1 Patient Slot** | 🟡 Manual request | `UPDATE organizations SET max_patients +=1` |
| **Feature Unlock** | 🟡 Manual | Feature flag system in DB |
| **AI Token Grant** | 🟡 Manual | `INSERT INTO ai_usage_log (credit)` |
| **Redemption History** | ❌ Missing | New table `karma_redemptions` |

### 3. Future Enhancements (Roadmap Reference)

| Feature | Priority | Roadmap Target |
|---------|----------|----------------|
| Automated reward redemption | 🔴 HIGH | v1.1.19+ |
| Patient-to-Patient referrals | 🟡 MEDIUM | v1.2.0 |
| Derivation network (therapist referrals) | 🟡 MEDIUM | v1.2.0+ |
| Golden Ticket system (patient graduation) | 🟢 LOW | v1.2.0+ |
| Tier-gating for "Powered By" footer | 🟢 LOW | Post-PRO launch |

---

## 🤖 AI & Automation
(No changes in v1.1.18)

---

## 🚀 Releases & Ops

10. **Standardizing script names**
    - **Issue**: `backup_db.sh` looks for specific DB names.
    - **Fix**: Standardize on `POSTGRES_DB` env variable across all release scripts.

*Last updated: January 02, 2026 (v1.1.18 THE MYCELIUM)*
