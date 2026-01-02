# Technical Debt Report (v1.1.15) 🕹️ THE CONTROL DECK

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

### 2. Remaining Dashboard Wiring (Mock Data)
While the rosters are wired, some core dashboard widgets are still awaiting integration with the new Metadata Envelope.

| Component | Debt Type | Status | Required Action |
|-----------|-----------|--------|-----------------|
| **PipelineVelocity** | UI Mock | 🔴 HIGH | Wire to `/leads?group_by=nurture_status`. |
| **ActiveJourneysWidget** | UI Mock | 🔴 HIGH | Wire to `/journeys/active`. |
| **VitalSignCard** (Ocupación) | UI Mock | 🟡 MEDIUM | Implement availability vs bookings ratio in backend. |
| **FocusSessionCard** | UI Mock | 🟡 MEDIUM | Link to real AletheIA insights from clinical records. |

### 3. ⚖️ Architectural Contract: The Metadata Envelope

> [!IMPORTANT]
> **v1.1.15.2 Mandate:** Any backend endpoint returning a list MUST use the `PaginatedResponse<T>` envelope:
> ```json
> { "data": [...], "meta": { "total", "filtered", "page", "page_size", "extra" } }
> ```
> **No exceptions.** Frontend consumers MUST access `.data` for the array. Violating this contract will cause production crashes.

---

## 🚨 Critical Architecture & Safety

1. **The "Bypassed Component" Trap**
   - **Issue**: Some components (like `Dashboard/page.tsx`) still use raw `fetch` strings instead of the typed `api` library.
   - **Risk**: These bypasses lead to silent build failures or data mismatches during infrastructure refactors.
   - **Fix**: Migrate ALL dashboard data fetching to the centralized `lib/api.ts` client.

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

7. **Roster Action Inconsistency**
   - **Issue**: Some pages (Settings, Help) still use standard Buttons/Links instead of the "Tactile Ghost Action" pattern used in Patients.
   - **Fix**: Standardize all table actions following the Zinc Protocol.

8. **Translation Mapping Structural Debt**
   - **Issue**: Manually creating translation objects in pages (e.g., `bookings/page.tsx`) leads to build crashes if any key/locale (e.g., 'ca') is missing.
   - **Fix**: Use `useTranslations` hook predominantly or enforce strict mapping types.

9. **Terminology Preference Wiring**
   - **Issue**: UI for terminology settings (Patient vs Client) is not fully wired to active context stores.

---

## 🤖 AI & Automation
(No changes in v1.1.15)

---

## 🚀 Releases & Ops

10. **Standardizing script names**
    - **Issue**: `backup_db.sh` looks for specific DB names.
    - **Fix**: Standardize on `POSTGRES_DB` env variable across all release scripts.

*Last updated: January 02, 2026 (v1.1.15 THE CONTROL DECK)*
