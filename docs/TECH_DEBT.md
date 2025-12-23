# Technical Debt Report (v1.0.0)

This document tracks known technical debt and incomplete implementations identified during the v1.0.0 release audit.

## 🚨 Critical (Safety/Data Integrity)

1. **Service Deletion Safety** (`backend/app/api/v1/services.py`)
   - **Issue**: `DELETE /services/{id}` does not check for existing future bookings.
   - **Risk**: Deleting a service could orphan or break active bookings.
   - **Fix**: Add check: `if bookings.count() > 0: raise HTTPException(400, "Cannot delete service with active bookings")`.

2. **Booking Notifications** (`backend/app/api/v1/booking.py`)
   - **Issue**: TODOs exist for sending emails on cancellation and rescheduling.
   - **Risk**: Patients are not notified when appointments are changed/cancelled by therapist.
   - **Status**: Logic missing in `cancel_booking` and `public_booking_manage`.

## 🛠 Backend & Infrastructure

3. **Stripe Dynamic Rates** (`backend/app/services/stripe_service.py`)
   - **Issue**: Application fee rates are hardcoded.
   - **Fix**: Read rates from `system_settings` table to allow runtime adjustment without deployment.

4. **Marketing App Structure** (`apps/marketing`)
   - **Issue**: `grep` reported missing files in `apps/marketing/app/landing/components/`.
   - **Action**: Verify file structure and clean up unused references.

## 🎨 Frontend & UI

5. **MDX Rendering** (`apps/platform/.../settings/help/[chapter]/page.tsx`)
   - **Issue**: Help center uses basic text rendering.
   - **Fix**: Implement proper MDX compilation to support rich formatting and components in help docs.

6. **Terminology Preference Wiring** (`apps/platform/.../settings/general/page.tsx`)
   - **Issue**: TODO comment indicates terminology preference UI might not be fully wired to organization settings.

## 🤖 AI & Automation

7. **AI Tone Enforcement** (`backend/app/services/automation_engine.py`)
   - **Issue**: Code checks for "Tone" configuration but lacks the LLM call to rewrite the message content.

## � Security & Access Control

8. **Admin UI Co-location** (`apps/platform/app/[locale]/(dashboard)/admin`)
   - **Issue**: SuperAdmin pages are part of the main client bundle.
   - **Risk**: While protected by RBAC (server-side 403), the route structure and UI code are visible to curious users inspecting source maps.
   - **Mitigation**: Move admin panel to a separate internal tool (e.g., Retool or separate Next.js app) or use aggressive code splitting/middleware blocking.

## �💻 Developer Experience (DevEx)

8. **Ephemeral Webhook URLs** (`scripts/start-dev.sh`)
   - **Issue**: `ngrok` generates a new random URL (e.g., `https://a1b2c3d4.ngrok-free.app`) every time the dev environment restarts.
   - **Friction**: Developer must manually copy-paste this new URL into the Twilio Console (Sandbox settings) on every startup.
   - **Solution**: Use static ngrok domains (requires paid plan) or automate Twilio configuration via API.

9. **Stripe CLI Dependency**
   - **Issue**: Local webhook handling relies on `stripe listen` running in the background.
   - **Friction**: If the developer forgets to install Stripe CLI, payments seem to work but status never updates.
   - **Fix**: Add strict check/auto-install or clearer UI warning when webhook listener is absent.
