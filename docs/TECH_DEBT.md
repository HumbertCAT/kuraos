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

9. **Stripe CLI Dependency** ✅ RESOLVED
   - **Status**: Fixed in start-dev.sh - auto-starts `stripe listen` with proper warning if CLI not installed.

---

## 🚀 Sandbox → Production Migration

> [!IMPORTANT]
> Both Stripe and Twilio are currently in **TEST/SANDBOX** mode. Follow these steps to go live.

### Stripe (Payments)

| Item | Current (Sandbox) | Production | Action |
|------|-------------------|------------|--------|
| API Keys | `sk_test_*` / `pk_test_*` | `sk_live_*` / `pk_live_*` | Generate in [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| Webhook Secret | `whsec_*` (test) | New `whsec_*` (live) | Create webhook in Live mode |
| Connect | Test accounts | Real bank accounts | Therapists re-onboard in live mode |

**Steps to activate Stripe Live:**
1. Complete Stripe account verification (identity, business details)
2. Go to Dashboard → toggle "Test mode" OFF
3. Generate Live API keys
4. Update secrets in GCP: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
5. Create Live webhook at `https://api.kuraos.ai/api/v1/payments/webhook`
6. Update `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_CENTER` with Live price IDs
7. Deploy with `./scripts/deploy.sh`

---

### Twilio WhatsApp (Messaging)

| Item | Current (Sandbox) | Production | Action |
|------|-------------------|------------|--------|
| Phone Number | `+14155238886` (shared) | Dedicated number | Purchase via Twilio |
| Approval | None needed | Meta Business Verification | Submit Business Profile |
| Message Templates | Any message | Pre-approved only | Create in Twilio Console |

**Steps to activate Twilio Production:**
1. **Meta Business Verification**: Submit business documents
2. **WhatsApp Business Profile**: Create and submit for approval
3. **Purchase Number**: Buy a dedicated phone number for WhatsApp
4. **Message Templates**: Create and submit templates for approval (required for outbound)
5. **Update secrets in GCP**: `TWILIO_WHATSAPP_NUMBER` with new number
6. **Configure Webhook**: Update to production URL in Twilio Console
7. Deploy with `./scripts/deploy.sh`

> [!WARNING]
> WhatsApp Business API requires Meta approval which can take 1-2 weeks. Plan ahead.
