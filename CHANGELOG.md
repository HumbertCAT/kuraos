# KURA OS - Changelog

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Project overview & quick start |
| [ROADMAP.md](ROADMAP.md) | Strategic roadmap & pending features |

---

All notable changes to KURA OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.19] - 2026-01-02 🔮 THE ORACLE + 🎨 THE POLISH AUDIT

> **Theme:** "The server thinks so you don't have to." + "Dark mode, finally done right."

### 🧠 Dedicated Focus Endpoint (The Oracle)
- **New Endpoint:** `GET /api/v1/dashboard/focus` - Pre-computed next session data
- **Patient Insight:** Real AletheIA insights from `Patient.last_insight_json`
- **Efficient Query:** Single JOIN (Booking→Patient) instead of bulk fetch + filter
- **Smart Type Calculation:** `warning` (risk≥70), `info` (risk≥40), `success` (risk<40)

### 🔌 Frontend Wiring
- **Removed Mock:** Eliminated hardcoded "Sueño irregular" insight
- **api.dashboard.getFocus():** New API client method
- **FocusSessionCard:** Now displays real patient insights
- **Empty State:** "Sin análisis previos" when patient has no insights

### 🎨 The Polish Audit (Dark Mode Consistency)
- **ProseMirror/TipTap:** All CSS variables for dark mode (foreground, muted-foreground, border, brand)
- **RichTextEditor:** Semantic tokens throughout (bg-input, focus:ring-brand)
- **Settings/General:** AI Preferences (brand), Admin Tools (warning), Save button (primary + shadow)
- **Forms Editor:** Slate-800 gradient headers, bg-background page, bg-input fields
- **Admin Templates:** Same treatment as user forms editor
- **Layout:** Full-width containers matching settings/general pattern

### 🔧 Technical
- New file: `backend/app/api/v1/dashboard.py` (170 lines)
- Helper functions: `_format_time_ago()`, `_calculate_insight_type()`
- Response schema: `FocusResponse` with `BookingSummary`, `PatientSummary`, `InsightData`
- Fixed: Double-locale bug in admin template links

---


## [1.1.18] - 2026-01-02 🍄 THE MYCELIUM (Viral Growth Engine)

> **Theme:** "From acorn to forest." — Building the viral infrastructure that turns every user into a growth agent.

### 🍄 Referral System (The Spores)
- **Karma Points**: Clean reward system (`karma_score`) separate from AI credits.
- **Registration w/ Referrals**: Accept `?ref=CODE` param to track referrer and reward +100 karma.
- **Welcome Bonus**: New referred users start with +50 karma.
- **Backfill Migration**: Auto-generated referral codes for existing organizations.

### 📊 Dashboard Widget (The Fruiting Body)
- **ReferralWidget**: Replaced QuickNote widget with viral growth widget.
- **Features**: Display karma score, copy referral link, WhatsApp share button.
- **Design**: Cyber-Glass card with `border-brand/20` and `Sparkles` icon.

### 🏛️ The Growth Station (`/settings/referrals`)
- **KarmaVaultCard**: Hero display of karma score with progress bar to next reward.
- **ViralShareModule**: Expanded share buttons (WhatsApp, Email, LinkedIn, Copy).
- **ReferralHistoryTable**: High-density roster of referred organizations.
- **RewardsCatalog**: Tier-based rewards grid (BUILDER, PRO, CENTER).
- **Backend Endpoint**: `GET /api/v1/growth/stats` for referral statistics.

### 🌱 Powered By Attribution
- **PoweredByKuraFooter**: Viral footer on public booking pages.
- **Tracking**: `?ref=PUBLIC` parameter for organic registration attribution.
- **SEO**: `rel="nofollow"` to prevent PageRank dilution.

### 🔧 Technical
- Migration: `add_karma_score_to_organization` with SQL backfill.
- Updated `Organization` schema with `karma_score`, `tier`, `referral_code`.
- New components: `components/referrals/*` (4 files).
- New page: `/settings/referrals/page.tsx`.
- i18n: Full translations in ES, EN, CA, IT for Settings.referrals namespace.

### 📋 Known Limitations (Technical Debt)
- Reward redemption is manual (mailto to soporte@) pending automation in v1.1.19+.
- See `docs/TECH_DEBT.md` for full pending automation details.

---


## [1.1.17] - 2026-01-02 ⚡ THE OMNI-SEARCH (God Mode)

### 🔎 Global Command Palette
- **⌘K / Ctrl+K**: Spotlight-style command palette using `cmdk` library.
- **Patient Index**: Instant search of all patients from anywhere in the app.
- **Smart Navigation**: Keyboard shortcuts for Dashboard (`⌘D`), Patients (`⌘P`), Calendar (`⌘A`), and Settings (`⌘,`).
- **Sidebar Trigger**: Search bar in TrinityNav now opens the omniscient modal.

### 🎨 Design
- **Cyber-Glass UI**: `backdrop-blur-md`, `bg-background/95`, `border-white/10` for premium aesthetic.
- **Dark/Light Mode**: Fully themed for both modes with proper contrast.
- **Keyboard Hints**: Visual `kbd` elements show available shortcuts.

### 📦 Dependencies
- Added `cmdk ^1.1.1` for command palette infrastructure.

---

## [1.1.16] - 2026-01-02 🛡️ THE EFFICIENCY SWEEP

### 🛡️ Part 1: The Shield (Security & Stability)
- **API Centralization**: Replaced raw `fetch` calls in `bookings/page.tsx` and `leads/page.tsx` with centralized `api` client methods.
- **New API Methods**: Added `api.bookings.delete()`, `api.bookings.cancel()`, and `api.leads.create()` to `lib/api.ts`.
- **Backend**: Confirmed decimal serialization safety (`float()` casts) already in place for financial KPIs.

### 🎨 Part 2 & 2.5: The Uniform (Visual Consistency)
- **Ghost Actions Standard**: Replaced all dropdown menus (`MoreVertical`) and emoji buttons with inline Ghost Action icons across:
  - `admin/page.tsx` (System Settings, Templates, Backups)
  - `forms/page.tsx` (Settings, QR, Stats, Delete)
  - `bookings/page.tsx` (Confirm, Complete, Cancel, Delete - conditional by status)
  - `patients/page.tsx` (Eye, Pencil, Chat - replaced ChevronRight)
  - `services/page.tsx` (standardized hover states to `hover:bg-muted`)
- **Lucide Icons**: Standardized to `Pencil`, `Trash2`, `Eye`, `Download`, `RotateCcw`.
- **Destructive Hover**: All delete buttons now use `hover:text-destructive hover:bg-destructive/10`.

### ⚡ Part 3: The Wiring (Dashboard Data)
- **PipelineVelocity**: Now displays real lead counts by status (NEW, CONTACTED, CLOSING) instead of hardcoded mock.
- **ActiveJourneysWidget**: Displays patients with `journey_status` != INACTIVE, prioritizing BLOCKED and PAYMENT_PENDING.
- **VitalSignCard (Occupancy)**: Shows calculated occupancy rate (confirmed sessions / 40 target) with real session count badge.
- **i18n**: Added `vitalSigns.sessions` translation key.

### 🧹 Part 4: The Broom (Dead Code Cleanup)
- **MOCK_JOURNEYS**: Removed ~40 lines of hardcoded demo data from `ActiveJourneysWidget.tsx`.
- **defaultStages**: Removed ~5 lines of mock pipeline data from `PipelineVelocity.tsx`.
- **Unused Imports**: Removed `MoreVertical` from `bookings/page.tsx` and `forms/page.tsx`.
- **Widget Contracts**: Both widgets now require real data via props (no mock fallbacks).

### 🐛 Bugfixes
- **Locale Duplication**: Fixed `/${locale}/...` in Links when using `@/i18n/navigation` (caused 404s in forms subpages).
- **Delete Handler**: Added `handleDeleteForm()` with confirmation to forms roster.

### 📝 Known Issues
- **QR Modal**: Forms QR button only works for forms with `public_token` (deferred to future fix).

---

### [1.1.15.2] - 2026-01-02
- **Fix**: Resolved `TypeError` in Dashboard and Services Modal by correctly handling `PaginatedResponse` shape ({data, meta}).
- **Fix**: Standardized Agenda logic to show future-only bookings, sorted ascending by start time.
- **Fix**: Standardized all `Link` and `useRouter` imports to `@/i18n/navigation` to resolve 404 regressions in production for `/patients/new`.
- **Backend**: Added `sort_by` and `order` parameters to the bookings list endpoint.

## [1.1.15.1] - 2026-01-02
### Fixed
- **Navigation**: Standardized localized `Link` usage in `PageHeader` and admin modules to prevent 404 prefetch errors.
- **Stability**: Added defensive checks to AletheIA widgets (`Observatory`, `SentimentPulse`) to prevent runtime crashes on empty data.

## [1.1.15] - 2026-01-02 🕹️ THE CONTROL DECK & CLINICAL PRECISION

### 🕹️ Control Deck UI Evolution
Third generation of the dashboard UI, focusing on high-density information and clinical focus.
- **Improved Monitoring Widgets**: Refined AletheIA HUD and Sentiment Pulse with direct access to patient context.
- **Proactive Intelligence**: Standardized risk indicators (HealthDot) across all rosters.

### 🏗️ Data Infrastructure & Performance
Major refactor of the API communication layer to support professional-grade scaling.
- **The Metadata Envelope**: Universal API response structure `{ data, meta }` supporting server-side pagination and real-time KPIs.
- **Unified Pagination**: Standardized `<PaginationToolbar />` across Patients, Bookings, Services, and Forms.
- **Performance Optimization**: Restored trailing slash consistency across all frontend-backend communication to eliminate 307 redirects.

### 🛡️ System Integrity & Security
- **The Drift Check**: Integrated Alembic synchronization protocol for safer deployments.
- **Design System Reinforcement**: Audited and fixed structural regressions in the translation engine and global components.
- **Type-Safe Foundations**: Fully verified production builds in a monorepo context.

#### 🕹️ Unified Toolbar ("Control Deck")
- **High-Density Toolbars**: Consolidated search, filters, and tabs into a single unified toolbar inside the main content `Card`.
- **Segmented Control Tabs**: Replaced classic tabs with a sleeker, more tactile Segmented Control design (`bg-muted/20`).
- **Recessed Search**: Styled search and filter inputs with `bg-background` for a premium, integrated look.

#### 📊 Peripheral Clinical Insight
- **Metric Badge Injection**: Injected high-level metrics directly into the `PageHeader` subtitle using rich React components.
- **Visual Hierarchy**: Reduced global spacing between headers and content (from `mb-8` to `mb-6`) for a more connected feel.

#### 👻 Ghost Actions (Secondary Interactivity)
- **Ghost Action Standard**: Standardized table row actions (Edit, Preview, etc.) to use `text-muted-foreground` by default, reacting only on hover to maintain clinical focus.
- **Risk Actions**: Destructive actions now consistently use `hover:text-risk` instead of plain red.

#### 🛡️ Stability & Regressions
- **Forms Navigation**: Unified the Forms toolbar into a persistent component, solving the "navigation trap" where tabs would disappear in empty states.
- **ReferenceError Fixes**: 
    - Resolved missing `useMemo` in `patients/page.tsx`.
    - Restored missing `statusConfig` in `bookings/page.tsx`.

---

## [1.1.14] - 2026-01-01 🧼 CLEAN SLATE & CLINICAL ROSTER

### 🎉 Platform-Wide Standardization & Saneamiento
Complete overhaul of the tabular infrastructure and brand alignment for v1.1.14.

#### 🧼 Saneamiento (Protocolo Clean Slate)
- **Cache & Environment Purge**: Compulsive cleaning of build caches and local environment states.
- **Media Hygiene**: Audit and removal of orphaned static/media assets.
- **Docker Pruning**: Cleaned volumes and legacy containers for optimal local performance.

#### 📋 Clinical Roster (High-Density Tables)
Standardization of all primary data tables for high-fidelity clinical operations:
- **Bookings (Citas)**: New structure with `badge-success`/`badge-risk` semantic states and `.font-mono` alignment for time-sensitive data.
- **Patients (Clientes)**: Optimized Name/Email vertical stacking to resolve layout collisions in constrained spaces.
- **Services**: Revenue-critical columns (Price, Duration) migrated to monospace for easier scanability.
- **Forms**: Replaced card grid with a professional table, introducing the "Rule of 2 Actions" with a refined "More" dropdown.

#### 🤖 Agent Concept Rebranding
- **Agents · Asistentes**: Rebranded "Automations" to reflect the AletheIA Intelligence philosophy.
- **i18n Refactor**: Migrated module to full bilingual support (ES/EN) via `next-intl`.
- **Full-Width Layout**: Removed legacy `max-w-4xl` constraints for a fluid, full-width dashboard experience.

#### 🛡️ Design System & UX Hardening
- **Avatar Resilience**: Implemented `flex-shrink-0` to maintain perfect circular geometry on all Roster views.
- **Humbertix Fix**: Resolved "UNDEFINED" initials bug for patients missing surnames.
- **Sidebar UX**: Profile links now point directly to `/settings/general` for faster navigation.
- **Semantic Audit**: Removed forbidden raw dimensions (`text-[10px]`) in favor of design system tokens.

#### 🔧 Infrastructure
- **Build Blocker Fixed**: Resolved syntax error in `settings/payments/page.tsx` that prevented production compilation.

---

## [1.1.13] - 2025-12-30 🎫 PUBLIC BOOKING WIZARD

### 🎉 Complete Public Booking Flow with Stripe Payments

End-to-end session booking from public URL to confirmed payment.

#### 🧙 Multi-Step Wizard (`/book/[therapist_id]`)
- **Step 1 - Service Selection**: Rich service cards with duration, price, and group/individual badges
- **Step 2 - Date & Time**: Week calendar with availability dots (blue indicators on available days)
- **Step 3 - Client Details**: Name, email, phone, notes form with validation
- **Step 4 - Payment**: Stripe PaymentElement with 10-minute expiration timer
- **Step 5 - Confirmation**: Boarding pass style success page with booking reference

#### ⏱️ Zombie Booking Prevention
- **Expiration Timer**: Visual countdown (yellow → red when < 2 min)
- **Auto-Expire**: Blocks payment submission after timeout
- **"Start Over" CTA**: Clean reset on expiration

#### 🌍 Timezone Intelligence
- **Auto-Detection**: Uses browser's `Intl.DateTimeFormat` timezone
- **Visual Indicator**: "Horarios en tu zona: Europe/Madrid"
- **All Times Localized**: Slots displayed in client's timezone

#### 💳 Stripe Integration
- **PaymentElement**: Multi-method support (Card, Klarna, Bancontact, Amazon Pay)
- **Test Mode Detection**: `sk_test_*` allows direct payments without Connect
- **Connect Ready**: Production requires `stripe_connect_enabled` for split payments

#### 🏪 Zustand State Management
- **Persistent Store**: `useBookingStore` with `localStorage` persistence
- **Hydration Guard**: Skeleton loading prevents SSR/CSR mismatch
- **Cross-Step Persistence**: Data survives page refresh

#### 🎨 Design System Compliance
- **Semantic Tokens**: `bg-brand`, `text-foreground`, `border-border`
- **Tactile UI**: `active:scale-95` on buttons
- **Mobile Responsive**: Grid adapts to screen size

### 🔧 Infrastructure

#### Stripe Keys Updated
- **Local (.env)**: Sandbox keys (`pk_test_*`, `sk_test_*`)
- **Google Secret Manager**: Production keys (`pk_live_*`, `sk_live_*`)

#### New Files
```
apps/platform/
├── stores/booking-store.ts          # Zustand persistent store
├── components/booking/
│   ├── BookingWizard.tsx             # Orchestrator with hydration guard
│   ├── StepService.tsx               # Service selection
│   ├── StepSlot.tsx                  # Date/time picker with dots
│   ├── StepForm.tsx                  # Client details form
│   ├── StepPayment.tsx               # Stripe PaymentElement + timer
│   ├── StepSuccess.tsx               # Boarding pass confirmation
│   └── index.ts                      # Barrel exports
└── app/[locale]/book/[id]/page.tsx   # Public booking page
```

### 📊 Backend Enhancements
- **Dev Bypass**: `payments.py` allows direct payments in test mode
- **Retry Button**: StepSlot shows "Reintentar" on API errors

---

## [1.1.12] - 2025-12-30 🚦 AI COST HEALTH SEMAPHORE

### 🏦 Financial Health Indicators
- **Traffic Light System**: Visual health of AI costs vs subscription revenue
  - 🔴 RED: >100% (losing money)
  - 🟠 ORANGE: 50-100% (warning zone)
  - 🟡 YELLOW: 10-50% (acceptable)
  - 🟢 GREEN: 0-10% (healthy)
- **Prorated Calculation**: Budget adjusted to current day of month
- **Compact Format**: `3.0KTOK/0,0013€ 🟢`

### Technical
- Tier prices: BUILDER=0€, PRO=49€, CENTER=149€
- BUILDER always 🔴 (no subscription revenue)
- Technical debt: Will add Stripe booking margin when Box Office launches

---

## [1.1.11] - 2025-12-29 💰 INTERNAL MARGIN REPORT

### 🏦 Financial Governance (Safe Implementation)
- **Internal Ledger Analysis**: Gross margin calculation from AiUsageLog
  - COGS: `cost_provider_usd` (what we pay Google)
  - Revenue: `cost_user_credits` (what we charge users)
  - Margin: Revenue - COGS
- **Health Status Classification**: healthy/acceptable/low_margin/unprofitable
- **New Endpoint**: `GET /admin/finance/margins` (superuser only)

### 📊 Business Intelligence
- Real-time profitability tracking
- No external dependencies (pure SQL aggregation)
- 30-day default window (configurable)

### Technical
- New service: `app/services/finance/internal_ledger.py`
- Added to existing `admin.py` (no new route file)
- Zero deployment risk (no new libraries)

### Strategic Note
- Deferred v1.1.10 (BigQuery reconciliation) to v1.2.0
- Current implementation sufficient for financial safety
- External reconciliation awaits Vertex AI migration

---

## [1.1.10] - UNRELEASED ❌

**Status:** Deployment failed (4 attempts). Rolled back.  
**Root Cause:** Dependency conflicts with `google-cloud-bigquery`  
**Decision:** Deferred to v1.2.0 (Vertex AI migration)  
**See:** Forensic report in conversation artifacts

**Lesson Learned:** `git revert` doesn't delete new files. Manual cleanup required.

---

## [1.1.9.1] - 2025-12-29 💰 AI USE - FRONTEND

### 🎨 Admin UI Transparency
- **AI Usage Column**: Replaced abstract "Credits" with transparent "AI USE"
  - Format: `12.5K tok / €0.45` (tokens consumed / real cost)
  - Compact display with K/M suffix for readability
  - Monospace font for data clarity

### Technical
- Updated `AdminOrganization` interface with `ai_usage_tokens` and `ai_usage_cost_eur`
- Added `formatTokens` helper for human-readable token counts
- Modified Organizations table in Admin panel

---

## [1.1.9] - 2025-12-29 💰 AI USE - BACKEND

### 🔢 AI Usage Metrics
- **Real Token Tracking**: Backend now aggregates actual AI usage from `AiUsageLog`
  - `ai_usage_tokens`: Total tokens (input + output) consumed this month
  - `ai_usage_cost_eur`: Real cost with margin applied
- **UTC-Aware Aggregation**: Explicit timezone handling to avoid month-boundary edge cases
- **Optimized Queries**: Pre-fetched maps (2 queries instead of N+1 per organization)

### Technical
- Enhanced `/api/v1/admin/organizations` endpoint
- Aligns with Kura OS `DateTime(timezone=True)` standard
- Foundation for v1.2.0 Cost Reconciliation (Resource Labels + BigQuery)

---

## [1.1.8] - 2025-12-29 🤖 THE NEURAL LEDGER

### 🧠 AI Governance Overhaul
Complete modernization of the AI tracking and pricing infrastructure.

#### Neural Registry Updates (December 2025)
| Model | Audio | Input $/M | Output $/M |
|-------|-------|-----------|------------|
| gemini-3-pro | ✅ | $2.00 | $12.00 |
| gemini-2.5-pro | ✅ | $1.25 | $10.00 |
| gemini-2.5-flash | ✅ | $0.15 | $0.60 |
| gemini-2.5-flash-lite | ✅ | $0.10 | $0.40 |
| gemini-2.0-flash | ✅ | $0.10 | $0.40 |
| whisper-1 | ✅ | $0.006/min | - |

#### OpenAI Whisper Integration
- **Added to Neural Registry**: Whisper now visible in AI Gov dashboard
- **Usage Logging**: Transcriptions logged to `ai_usage_logs` with provider="openai"
- **Cost Tracking**: Estimates audio duration from file size for accurate billing
- **Twilio Webhook**: Now passes db context for Whisper usage logging

### ⚙️ Tier Settings Standardization
Renamed all tier configuration for clarity:

| Category | Old Name | New Name |
|----------|----------|----------|
| Patient Limits | `TIER_LIMIT_*` | `TIER_USERS_LIMIT_*` |
| Stripe Commission | `TIER_FEE_*` | `TIER_STRIPE_FEE_*` |
| AI Credits | - | `TIER_AI_CREDITS_*` |

- **Alembic Migration**: Tier settings now auto-seeded via migration
- **Code Updates**: `patients.py`, `auth.py` use new naming

### 🛡️ Safety & Operations

#### `--clean` Flag Protection
- **Production Block**: Refuses to run if `ENVIRONMENT=production`
- **Double Confirm**: Requires typing "BORRAR TODO" to proceed
- **HIPAA Warning**: Explains legal implications in error message

### 🎨 Theme System
- **Multi-Theme Support**: Océano and Sunset palettes
- **Hybrid Persistence**: Theme enum case alignment (uppercase)
- **CyberCard Polish**: Padding fixes in Appearance page

### 📚 Documentation & Agent Configuration

#### Agent Rules v1.1.4
- **Exceptions Protocol**: Ask for approval before bypassing strict rules
- **Design System Scope**: Rules now EXEMPT marketing apps (`apps/landing/`, `apps/investors/`)
- **Circuit Breaker**: Halts execution after presenting implementation_plan.md

#### New Workflows
- `/god-mode` - Complete Generator Protocol
- `/plan-cycle` - Planning phase only
- `/create-feature` - Feature scaffolding
- `/safe-migration` - Alembic with backup
- `/seed-demo` - Golden Seed refresh
- `/audit` - Semantic integrity check

#### Roadmap Updates
- **AI Infrastructure Migration**: GenerativeAI → Vertex AI Model Garden (Q1-Q2 2026)
- **Whisper → Chirp 2**: Migration planned for batch transcription ($0.003/min)

### 🔧 Admin Panel Refinements
- Renamed tabs: "Automations" → "Agents", "AI Governance" → "AI Gov"
- Fixed `terminology_preference` not saving in organization list
- Renamed "Form Templates" → "Forms", "Theme Engine" → "Themes"

---

## [1.1.7] - 2025-12-28 🔐 THE GOLDEN KEY

### 🔑 Native Google OAuth
Direct Google authentication bypassing NextAuth for full backend control.

- **Backend Endpoint**: `/auth/oauth/google` - Verifies Google ID tokens directly
- **Auto-Registration**: New Google users get automatic account + organization creation
- **Frontend Integration**: Google Identity Services SDK with custom styled button
- **Security**: httpOnly JWT cookies, server-side token verification

### 🔓 Password Recovery System
Complete "Forgot Password" flow with Brevo email integration.

- **Forgot Password Page**: `/forgot-password` - Email input with secure token generation
- **Reset Password Page**: `/reset-password?token=xxx` - New password form with validation
- **Email Template**: Professional HTML email via Brevo with reset link
- **Token Security**: 
  - Cryptographic tokens (`secrets.token_urlsafe(32)`)
  - 1-hour expiration
  - Single-use (cleared after password change)

### 🛡️ Auth Provider Hardening
Fixed client-side redirect loop on public auth pages.

- **Public Routes**: AuthProvider now skips auth checks for `/login`, `/register`, `/forgot-password`, `/reset-password`
- **Root Cause**: React context was redirecting unauthenticated users even on public pages
- **Fix**: Added `isPublicRoute` check before triggering auth verification

### 🐛 Bug Fixes
- Fixed timezone-aware datetime comparison in password reset expiry check
- Fixed Pydantic forward reference error for `GoogleOAuthRequest`
- Added `await` to async email send call

### 📦 Dependencies
- Added `google-auth` to backend requirements for OAuth token verification

---

## [1.1.6] - 2025-12-28 📊 INVESTOR DECK V12 "THE PITCH TEMPLE"

### 🎉 Complete Investor Deck Redesign

Strategic redesign of the investor presentation with premium aesthetics and compelling narrative flow.

#### 📊 Deck Structure (15 Slides)
| # | Slide | Content |
|---|-------|---------|
| 1 | **Hero** | Logo + CONNECT·PRACTICE·GROW + Gradient title |
| 2 | **Problem** | 4-quadrant pain grid (2x2 with red hover glow) |
| 3 | **Market** | $120B TAM with bento layout |
| 4 | **Kill Sheet** | Competitive matrix with valuations |
| 5 | **Market Map** | 2D positioning chart |
| 6 | **Advantage** | 3 unfair advantages |
| 7 | **Trinity** | CONNECT·PRACTICE·GROW (5 features each) |
| 8 | **Arsenal** | 6 proprietary tech pillars (color-coded) |
| 9 | **Sentinel Pulse** | Clinical Safety HUD with pulsing alert |
| 10 | **Security** | Sovereignty by Design (3 layers) |
| 11 | **Venture Economics** | €450 ARPU breakdown |
| 12 | **Financial** | J-curve trajectory |
| 13 | **Traction** | Early metrics |
| 14 | **Founder** | Humbert Torroella profile (Builder + Healer) |
| 15 | **Ask** | €250K SAFE, €1M ARR target |

#### 🎨 Visual Upgrades
- **Hero Slide**: Gradient text (INTELLIGENT/PRACTICE/INFRASTRUCTURE), gradient CTA button
- **Problem Slide**: 4 pain quadrants with hover red glow
- **Arsenal Slide**: 6 color-coded pillars (Sentinel, Shield, Trinity, Omni-Scribe, Neuro-Nurture, Vault)
- **Sentinel Pulse**: Real-time monitoring HUD with SVG risk chart
- **Founder Slide**: Organic layout with round photo, floating stats cards (±1° rotation)

#### 🖼️ Assets Added
- `/public/kura-logo-full.png` - Full KURA OS logo with transparency
- `/public/humbert-photo.jpg` - Founder portrait

#### 🔧 Technical Changes
- Removed page number display
- Slide reordering for optimal narrative flow
- Added `Sparkles` icon import for Trinity Agents

#### 🔐 Infrastructure
- **Brevo API Key**: Created `BREVO_API_KEY` secret in Google Secret Manager (kura-os project)
- **Sender**: humbert@kuraos.ai validated

---

## [1.1.5] - 2025-12-27 🏛️ THE CYBER-CLINICAL TEMPLE

### 🎉 Marketing Revolution

Complete rebuild of public-facing assets with premium Fintech/Cyber-Clinical aesthetic.

#### 🌐 Landing Page v2.0 (`apps/marketing/app/landing/page.tsx`)

**NEW Sections:**
| # | Section | Content |
|---|---------|---------|
| 1 | **Hero** | Layered dashboard preview (CRM → Clinical → Sentinel Pulse floating) |
| 2 | **Problem** | Chaos → Order visual (fragmented tools → unified Kura) |
| 3 | **Trinity** | 3 pillars × 5 features (Connect/Practice/Grow with glows) |
| 4 | **Deep Tech** | Sentinel Pulse (emotional curve) + Aletheia (risk alert demo) |
| 5 | **Security** | Clean Room / Vault / GDPR-HIPAA |
| 6 | **Pricing** | 3 cards + Full Comparison Table (17 features × 3 plans) |
| 7 | **Footer** | "HELP THEM HEAL. WE HANDLE THE REST." |

**Design System:**
- Background: Deep Space (#030305) with 40px grid
- Cards: Obsidian Glass (`bg-white/[0.02] border-white/10 backdrop-blur`)
- Typography: Massive gradients, `tracking-tighter`
- Glows: `blur-[200px]` atmospheric orbs (Teal/Violet/Blue)

#### 📊 Investor Deck v9.0 (`apps/marketing/app/investors/page.tsx`)

**Content Density Upgrade:**
- **Problem Section**: 5 friction cards (3+2 centered grid)
  - Revenue Bleed, Context Blindness, Hamster Wheel, Legal Roulette, Integration Void
- **Trinity Section**: 5 features per pillar (15 total)
- **Arsenal Section**: 5 proprietary techs (3+2 centered grid)
  - Sentinel Pulse, AI Margin Control, Neural Circuits, Privacy Vault, Draft Mode

**Navigation**: 10 slides with keyboard (←→ Space) + dot navigation

#### 🔧 Platform Fixes
- **Register Logo**: Fixed `h-42` → `h-24` to match login styling
- **Auth URLs**: All links now use `/es/login` and `/es/register` locales

#### 🛠 Development Workflow

**Marketing App Development:**
```bash
# Start local dev
cd apps/marketing && pnpm dev

# URLs:
# - Landing:   http://localhost:3002/landing
# - Investors: http://localhost:3002/investors
# - Root:      http://localhost:3002 (redirects to /landing)

# Production:
# - Marketing: kuraos.ai (Vercel)
# - Platform:  app.kuraos.ai (Vercel)
```

**Port Mapping:**
| App | Port | URL |
|-----|------|-----|
| Platform | 3001 | app.kuraos.ai |
| Marketing | 3002 | kuraos.ai |
| Backend | 8001 | api.kuraos.ai |

**Package Manager**: Use `pnpm` for marketing (faster than npm)

#### ⚠️ Known Issues & Troubleshooting

##### 1. PostCSS MapGenerator Error
```
TypeError: MapGenerator is not a constructor
```
**Cause**: Outdated PostCSS cache or dependency mismatch.
**Solution**:
```bash
cd apps/marketing && rm -rf .next node_modules/.cache && pnpm install
```

##### 2. Turbopack Freeze (Server Hangs on Compile)
```
○ Compiling /landing ...
# Server accepts connections but never responds
```
**Root Cause Analysis**:
- Next.js 16+ uses Turbopack by default for dev (faster than Webpack)
- Turbopack caches compiled modules in `.next/` directory
- When the cache becomes corrupted (often after git operations, dependency changes, or abrupt stops), Turbopack enters an infinite compile loop
- The server starts, accepts TCP connections, but the compile phase never completes

**Symptoms**:
- `curl` connects but hangs waiting for response
- Browser shows endless loading
- Log shows "Compiling /[route] ..." with no progress
- Restarting server or Mac doesn't help (cache persists)

**Solution**:
```bash
# 1. Kill all node processes
killall -9 node

# 2. Clear Turbopack cache and restart
cd apps/marketing && rm -rf .next && pnpm dev
```

**Prevention**:
- Always use `./scripts/stop-dev.sh` before closing terminal
- After major git operations (merge, rebase), clear `.next/`
- If in doubt, nuke the cache

---

## [1.1.4] - 2025-12-27 📚 HELP CENTER "THE KNOWLEDGE LIBRARY"

### 🎉 Documentation Reinvented

This release transforms an error 500 into a complete knowledge library with professional documentation architecture.

#### 🛠 Infrastructure Fix (Critical)
- **Migrated to `next-mdx-remote`**: Replaced `fs.readFileSync` which failed on Vercel serverless
- **Inline Content Strategy**: All help content embedded in TypeScript for Vercel compatibility
- **Production-Ready**: No more 500 errors on help pages

#### 🚚 Route Migration
- **NEW**: `/help` standalone route (was buried in `/settings/help`)
- **Sidebar Navigation**: Collapsible 4-pillar navigation (HelpSidebar component)
- **DocsLayout**: Professional documentation layout with persistent sidebar
- **TrinityNav**: Added "Ayuda" link with HelpCircle icon in footer

#### 📚 Content Architecture (4 Pillars)
Rewrote all help content from scratch with current KURA OS v1.1.3b features:

| Pillar | Articles | Topics |
|--------|----------|--------|
| 🚀 **Primeros Pasos** | 3 | Tu Primera Sesión, Journeys, Demo Mode |
| 📋 **Módulos Core** | 5 | Soul Record, Diario Clínico, Reservas, Forms, CRM |
| 🧠 **Inteligencia** | 4 | AletheIA, Sentinel Pulse, Agents, Chatbot |
| ⚙️ **Cuenta** | 4 | Settings, Integrations, Plans, Credits |

#### 🖼 Visual Components
- **FocusImage**: Smart zoom component with CSS transforms (for future calibration)
- **Master Screenshots**: Dashboard, Patient Profile, AletheIA Sidebar
- **Click-to-Expand**: Modal view for full context

#### 💡 Technical Notes
- `lib/mdx.tsx`: 900+ lines with 15 complete help articles
- `components/help/HelpSidebar.tsx`: Collapsible pillar navigation
- `components/mdx/FocusImage.tsx`: Reusable image zoom component

**Future Improvement (Q1 2026)**: Replace static screenshots with Live React Components in MDX for truly dynamic documentation.

#### ⚠️ Known Issue
- **500 on `/help/[slug]`**: Article pages may return 500 in production. Root cause under investigation (RSC serialization suspected). Index page `/help` works correctly.

---

## [1.1.3b] - 2025-12-27 🦅 SENTINEL PULSE & DATA COHERENCE

### 🎉 The System Speaks with One Voice

This release fixes the critical "data schizophrenia" bug where the Sentinel Pulse widget and AletheIA Observatory displayed conflicting risk scores.

#### 📡 Sentinel Pulse Widget
- **3 Visual States**: Active (SVG chart), Dormant (ghost), Locked (PRO upsell)
- **7-Day Emotional Timeline**: Dynamic green/red gradient based on sentiment
- **Pulsing "Now" Dot**: Real-time indicator with hover tooltips
- **Risk Flags Integration**: Critical alerts displayed inline

#### 🎨 Clinical Canvas Layout
- **2-Column Patient Profile**: Journey Boarding Pass + Sentinel Pulse side-by-side
- **Responsive Grid**: Proper spacing and mobile adaptation
- **The "WOW" Moment**: Structure meets Flow in visual harmony

#### 🔗 Operation Direct Line (Data Coherence)
- **Float Precision**: Exact `risk_score` (-0.60) instead of bucket approximations
- **Pydantic AliasChoices**: Accepts both snake_case (DB) and camelCase (AI cache)
- **serialization_alias**: Consistent camelCase API output for frontend
- **Fallback Intelligence**: Reads `last_insight_json.risk_score` before recalculating

#### 🌱 Golden Seed Enhancements
- **Marcus Thorne**: Growth archetype (+0.80, 7-day positive trajectory)
- **Julian Soler**: Crisis archetype (-0.60, 7-day negative trajectory)
- **Elena Velázquez**: Medical block archetype (-0.90, Lithium contraindication)
- **Schema Alignment**: `last_insight_json` now matches `PatientInsightsResponse` exactly

#### 🛠 Technical Fixes
- Added optional chaining (`?.`) safeguards in Observatory component
- `response_model_by_alias=True` for FastAPI serialization
- Journey definitions aligned with backend Golden Seed
- Technical documentation: `docs/Monitorizacion_Technical_Doc.md`

**Result**: Marcus +0.80 in both widgets. Julian -0.60 in both widgets. Elena -0.90 cached. ✅

---

## [1.1.3] - 2025-12-27 🏥 PATIENT PROFILE 2.0 "THE CLINICAL CANVAS"

### 🎨 Complete Patient Detail Refactor

Transformed the patient profile from a simple data page to a **Clinical Command Center**.

#### 📋 2-Column Layout
- **Left Column (8)**: Journey Boarding Pass with stage progression
- **Right Column (4)**: Sentinel Pulse real-time emotional monitoring
- **Responsive**: Stacks vertically on mobile

#### 🎫 Journey Boarding Pass Enhancements
- **Dynamic Stage Icons**: Past (✓), Current (pulsing), Future (ghost)
- **Status-Based Actions**: "Revisar Bloqueo", "Reenviar Link Pago", etc.
- **Collapsible Cards**: Expand/collapse per journey

#### 📊 Clinical Journal Tab
- **TipTap Rich Text Editor**: Notion-like clinical note experience
- **AI Analysis Indicators**: Shows when notes have been analyzed
- **Timeline View**: Chronological entry display

---

## [1.1.2] - 2025-12-27 💎 PREMIUM DEMO "GOLDEN SEED PROTOCOL"

### ✨ High-Fidelity Demo Environment

Created premium archetypes for investor demos and user testing.

#### 🧬 Character Archetypes
- **Marcus Thorne (CEO, 45)**: Executive burnout → Spiritual awakening journey
- **Elena Velázquez (Artist, 38)**: Depression treatment with Lithium contraindication
- **Julian Soler (Founder, 52)**: Financial crisis → Treatment stagnation
- **Sarah Jenkins (Coach, 41)**: Active integration member

#### 🎨 Visual Polish
- **Unsplash Avatars**: High-quality professional headshots
- **Static UUIDs**: Consistent IDs for screenshot reproducibility
- **Journey Histories**: Pre-populated stage progressions

#### 📝 Clinical Notes
- **Rich Text Content**: Realistic multi-session documentation
- **AI Analysis Results**: Pre-generated insights per archetype
- **Risk Flags**: Authentic clinical red flags where appropriate

---

## [1.1.1] - 2025-12-27 🧠 INTELLIGENCE ENGINE

### 🎉 Multi-Model AI Infrastructure

Complete overhaul of the AI subsystem with real-time cost tracking and governance.

#### 🏭 Provider Factory + Model Garden
- **ProviderFactory**: Smart routing for multi-model support (`gemini:2.5-flash`, future: Claude, Llama)
- **GeminiProvider**: Production-ready with real token extraction from `usage_metadata`
- **Centralized Prompts**: 8 clinical prompts in `/services/ai/prompts.py`

#### 💰 Cost Ledger (FinOps)
- **Real Token Tracking**: Actual input/output tokens per request
- **USD Cost Calculation**: Provider pricing table (Gemini Flash = $0.075/$0.30 per 1M)
- **Margin Configuration**: Configurable multiplier (default 1.5x = 50% markup)

#### 🧠 AI Governance Panel (Admin)
- **Financial HUD**: Provider Cost, Revenue, Net Margin in real-time
- **Neural Registry**: Active models with pricing and capabilities
- **Activity Ledger**: Per-request logs with user, model, tokens, cost
- **Margin Controller**: Live adjustment of billing multiplier

#### 🔧 Clean Ledger Refactor
- Removed all legacy `google.generativeai` calls from clinical flow
- `run_analysis_task` now uses `ProviderFactory` → `CostLedger` pipeline
- Audio/Document analysis with proper file path resolution

#### 🗄️ Database Schema
- Extended `ai_usage_logs` table with 9 new columns:
  - `provider`, `model_id`, `task_type`
  - `tokens_input`, `tokens_output`
  - `cost_provider_usd`, `cost_user_credits`
  - `patient_id`, `clinical_entry_id`

#### 🔌 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/ai/ledger` | GET | Financial stats (30d) |
| `/admin/ai/config` | GET/PATCH | Margin configuration |
| `/admin/ai/models` | GET | Available models |
| `/admin/ai/logs` | GET | Recent usage logs |

---


## [1.1.0] - 2025-12-27 🚀 THE COMMAND CENTER

### 🎉 Major Release - Dashboard Revolution

This release consolidates a full night of intensive development (23:30 → 03:06) into a cohesive **Command Center** experience.

#### 🧠 Core Philosophy: "Past, Present, Future"
- **The Present**: FocusSessionCard shows what's happening NOW
- **The Urgent**: ActiveJourneysWidget shows who needs attention
- **The Growth**: PipelineVelocity shows what's coming

#### 🎨 Design System Upgrades
- **Glass UI**: `backdrop-blur-sm`, `bg-card/80`, `border-white/5`
- **Tactile Buttons**: `active:scale-95` clicky feedback
- **Neural Flow**: Circuit board visualization for logic flows
- **Clinical Roster**: High-density patient table with Health Dots

#### 📊 Dashboard 3.0 "The WOOOOOW Layout"
- **Ghost Header**: Clean briefing without card container
- **Clinical First**: Urgency visible without scrolling
- **3-Row Grid**: Cockpit → Metrics → Growth

#### 🤖 Agent Detail "Neural Circuit"
- Connected flow diagram with dashed connector lines
- Semantic nodes: Trigger (purple) → Condition (orange) → Action (green)
- Glass KPI cards with `font-mono` technical typography

#### 📋 New Components
- `FocusSessionCard` - Next session hero card
- `PipelineVelocity` - Lead funnel visualization
- `ActiveJourneysWidget` - Mini-boarding pass cards
- `VitalSignCard` - Metrics with trend indicators

#### 🌐 Full Bilingual Support (EN/ES)
- **Navigation**: CONNECT/PRACTICE/GROW vs ATRAER/SERVIR/CRECER
- **Greeting**: "Good morning, {name}" vs "Buenos días, {name}"
- **Dashboard widgets**: All labels, badges, and status texts translated
- **TrinityNav**: Section titles, link labels, search placeholder

---

## [1.0.14] - 2025-12-27

### Refactored - Dashboard 3.0 "The WOOOOOW Layout"

Clinical First hierarchy - urgency visible without scrolling.

#### Ghost Header
- Removed card container from briefing
- Title directly on background (`type-h1`)
- Minimal, transparent audio player

#### New Layout Order
1. **CLINICAL COCKPIT** (Row 1): FocusCard (8) + ActiveJourneys (4)
2. **BUSINESS PULSE** (Row 2): Metrics row (full width)
3. **GROWTH & TOOLS** (Row 3): Pipeline (8) + QuickNote (4)

---

## [1.0.13] - 2025-12-27

### Added - Dashboard 2.0 "Past, Present, Future"

Complete Dashboard refactor with new philosophy: focus on **The Present** moment.

#### Part 1: Layout & Focus Card
- **FocusSessionCard**: Hero showing next session with patient avatar, Aletheia insights, "Preparar Sesión" CTA
- **Free Time State**: Coffee cup icon, "Agenda despejada" with quick links
- **Glass UI**: `backdrop-blur-sm` on hero section

#### Part 2: Metrics & Pipeline
- **VitalSignCard**: Now with trend indicators (📈📉➖), `font-mono` values
- **New Metrics**: "Tasa de Ocupación 85%" replaces static client count
- **PipelineVelocity**: 3-stage funnel (Nuevos → Contactados → Cierre) with progress bar

#### Part 3: Active Journeys Widget
- **Mini-Boarding Pass** cards with colored left borders by journey type
- **Status badges**: BLOCKED (red), PAYMENT_PENDING (amber), ACTIVE (green)
- **Priority queue**: Actionable list of journeys needing attention
- **Tactile**: `active:scale-[0.98]`, hover arrow reveal

---

## [1.0.12.1] - 2025-12-27

### Added - Logic & Flows to Design System

#### 🧩 New Section: "Logic & Flows (Neural Circuit Components)"
- **Individual Nodes**: Trigger (AI/Purple), Condition (Warning/Diamond), Action (Success/Green)
- **Connector Lines**: Dashed standard, Solid completed, Gradient transition
- **Connected Flow Example**: Full circuit with CUANDO → SI → ENTONCES → Completado
- **Usage Documentation**: Agent flows, Campaign funnels, Patient timelines

This transforms the Agent Detail UI into a **reusable architectural component**.

---

## [1.0.12] - 2025-12-27

### Added - Agent Detail "Neural Flow UI"

#### UI: Neural Circuit Visualization
- **Connected flow diagram** with vertical dashed connector line
- Nodes positioned **on the line** (Trigger → Condition → Action → Complete)
- **Semantic color coding**: AI/Purple triggers, Warning/Orange conditions, Success/Green actions
- **Diamond-style** condition nodes with rotate-45 effect

#### UX: Glass KPI Cards
- **Backdrop blur** glass effect (`bg-card/50 backdrop-blur-sm`)
- **Technical typography** with `font-mono` for metrics
- **Dark mode optimized** borders (`border-white/5`)

#### Interaction: "Radar Scan" Empty State
- **Pulsing Radio icon** for "Sistema en espera" state
- Elegant waiting visualization instead of plain text

#### Visual Upgrades
- **Hero icon** with type-based shadow glow
- **Email preview window** for send_email actions
- **Semantic badges** (badge-ai, badge-success, badge-warning)
- **Tactile buttons** (.btn classes with active:scale-95)

---

## [1.0.11] - 2025-12-27

### Fixed - Agents Navigation & Branding Cleanup

#### Navigation Fix
- **Agentes link** now correctly points to `/automations` (standalone page)
- Previously pointed to `/settings/automations` (nested page)
- Agent names are now **clickable** → navigate to stats detail page
- Removed "Volver a Configuración" button
- Added **BarChart3 icon** on hover indicating stats available

#### Branding Cleanup
- All scripts now use "KURA OS" instead of "TherapistOS"
- Database name updated to `kuraos` in backup/restore scripts
- Updated paths in `backup_db.sh`

---

## [1.0.10] - 2025-12-27

### Added - Journey Cards 2.0 "The Boarding Pass"

Transformed patient journey tracking from boring progress bars to living command centers.

#### Visual Design
- **"Boarding Pass" UI**: Rich cards with type-based left border gradients
- **Context Colors**: Psychedelic=Teal, Coaching=Blue, Medical=Risk, Wellness=AI
- **Collapsible cards** with hover feedback

#### Smart Timeline
- **✅ Past stages**: Green check icons with solid connector line
- **🔵 Current stage**: Pulsing brand-colored node with status icon
- **⚪ Future stages**: Ghost circles with dashed connectors
- **Tooltips**: Stage labels on hover

#### Action-Oriented
- **Dynamic "Next Action" area** per journey
- **Context-aware buttons**: 
  - "Revisar Bloqueo" (btn-destructive) for BLOCKED
  - "Reenviar Link Pago" (btn-brand) for AWAITING_PAYMENT
  - "Ver Diario Clínico" (btn-secondary) for ACTIVE
- **Quick message button** per journey card

#### Technical
- Semantic `.badge` classes for status pills
- `.btn` utilities with tactile feedback
- Popover-styled tooltips

---

## [1.0.9] - 2025-12-27

### Added - The Clinical Roster (High-Density Patient Table)

End of the "List Views Renaissance" - Grid cards → Professional data tables.

#### High-Density Table
- **15+ patients per screen** vs 6 with old card grid
- **Clickable rows** with `hover:bg-muted/40` transition
- **Responsive columns**: hide on mobile (`md:table-cell`)
- **Table skeleton** loading state for smooth UX

#### Semantic Badges
- `.badge-risk`: Blocked, High Risk
- `.badge-warning`: Payment Pending, Stagnation
- `.badge-success`: Active, Confirmed, Graduated
- `.badge-ai`: Analysis, Preparation phases
- `.badge-brand`: New patients

#### AletheIA Integration
- **Health Dot column**: Visual risk indicator
- **Tooltip on hover**: "Riesgo: Alto/Medio/Bajo"
- **Pulse animation** for high-risk patients

#### Tactile Actions
- **`.btn-brand` CTA**: Teal glow, irresistible
- **`.btn-ghost` actions**: Ver ficha, Mensaje
- **Row click** navigates to patient detail

---

## [1.0.8] - 2025-12-27

### Added - Design System & Tactile UI

#### Design System Playground
- **Route `/design-system`**: Internal Kitchen Sink page
- **Typography Scale**: type-h1, type-h2, type-body, type-ui
- **Color Palette**: Base, Brand, Status semantic tokens
- **Components**: Buttons, Badges, Cards, Inputs, AletheIA widgets

#### Tactile UI Layer (`globals.css`)
- **`.btn` base**: `active:scale-95` (clicky feel)
- **`.btn-brand`**: Shadow glow `shadow-brand/25` + hover lift
- **`.btn-*` variants**: primary, secondary, ghost, destructive, outline, success
- **`.card`**: Light/Dark mode optimized shadows
- **`.card-hover`**: Brand glow on interactive cards
- **Brand focus rings**: All inputs use `ring-brand/50`
- **`.badge-*`**: Semantic badges (risk, success, warning, ai, brand)

### Changed - Spanish Translations (Trinity)
- CONNECT → ATRAER
- PRACTICE → SERVIR  
- GROW → CRECER
- Bookings → Reservas
- Campaigns → Campañas
- Soon → Pronto

---

## [1.0.7] - 2025-12-27

### Added - The Clean Room (Data Retention & Anonymization)

Strategic infrastructure for GDPR-compliant clinical IP preservation.

#### The Incinerator (Phase 1)
- **GCS Bucket**: `kura-production-media` created in europe-west1
- **Lifecycle Policy**: Auto-delete audio files after 30 days
- **Config**: `GCS_BUCKET_NAME` added to settings

#### The Vault (Phase 2)
- **`anonymous_datasets` Table**: Orphan table with NO foreign keys
- **Survives GDPR Erasure**: Patient deletion doesn't destroy clinical patterns
- **Migration**: `b1234def5678_add_anonymous_datasets_vault.py`

#### The Scrubber (Phase 3)
- **`data_sanitizer.py`**: Regex-based PII removal service
- **Redacts**: Emails, phones, common Spanish names
- **TODO**: Google DLP integration for Series A

#### The Trigger (Phase 4)
- **BackgroundTasks Hook**: Clinical notes auto-sanitized on creation
- **Fire-and-forget**: Doesn't block HTTP response

---

## [1.0.6] - 2025-12-27

### Security - Data Protection & GDPR Compliance

This release focuses on hardening data protection across the platform to meet HIPAA and GDPR requirements.

#### PASO 1: PII Removal from Logs
- **`twilio_webhook.py`**: Removed phone numbers, patient names, and message content from all log statements
  - Now logs: `"✅ Stored message for patient_id=UUID"` instead of exposing names
  - Message content replaced with length: `"📱 WhatsApp message received (length: 42 chars)"`
- **`transcription.py`**: Removed transcription snippets from logs

#### PASO 2: Structured Lead Form Data
- **New**: `Lead.form_data` JSONB column for structured clinical data storage
- **Changed**: `public_forms.py` now stores form answers in `form_data`, not concatenated in `notes`
- **Migration**: `849384d89ca0_add_lead_form_data.py`
- **Backward Compatible**: Existing leads with data in `notes` remain functional

#### PASO 3: Strict ProfileData Schema
- **Removed Clinical Fields** from `ProfileData`: `previous_therapy`, `current_medications`, `medical_conditions`, `goals`, `notes`
  - These MUST now go to `ClinicalEntry`
- **Changed**: `extra = "ignore"` silently drops unknown fields to prevent data leakage
- **Typed**: `PatientCreate` and `PatientUpdate` now use typed `ProfileData` instead of `Dict[str, Any]`

### Added
- **`GOOGLE_API_KEY`** in Secret Manager and deploy.sh for AletheIA AI functionality
- **`GEMINI_API_KEY`** defined in `backend/app/core/config.py`
- **Journey Architecture Documentation**: `docs/arch/journeys-architecture.md`

### Fixed
- Corrected all 2024 dates to 2025 across ADRs and documentation
- **`ThemeConfigUpdate`** schema now accepts `dict[str, Any]` for nested light/dark themes

---

## [1.0.5.4.2] - 2025-12-26

### Changed - Final Dashboard Polish & Readability
- **DayAgenda**: Smart list showing only booked + 1 available slot
  - Beautiful empty state: "Agenda despejada. Tiempo para Nurture."
  - Removed grid noise, uses `type-body` for readability
- **QuickNote**: Post-it style with `bg-amber-50` tint, `font-mono`, no borders
- **AletheiaObservatory**: All `text-[10px]`/`text-[11px]`/`text-[9px]` → `type-body`/`type-ui`
  - 23 typography violations fixed for better readability

---

## [1.0.5.4.1] - 2025-12-26

### Changed - UI Harmonization (Strict Semantic Compliance)
- **TrinityNav**: Removed arbitrary `bg-orange/teal/emerald` backgrounds
  - Section headers use `type-ui tracking-widest`
  - Icon colors now `text-muted-foreground`
- **AletheiaObservatory**: Removed BriefingPlayer (stays only in Dashboard Hero)
- **QuickNote**: Initial post-it style with `bg-secondary/30`

### Removed
- BriefingPlayer duplication in Right Sidebar

---

## [1.0.5.4] - 2025-12-26

### Added - Dashboard Redesign (The Operational Cockpit)
- **VitalSignCard**: Reusable metric card component
- **DayAgenda**: Vertical timeline with real-time "NOW" line indicator
- **QuickNote**: Fast note with localStorage autosave (debounced)
- **RecentPatients**: localStorage tracking with API fallback

### Changed - Dashboard Layout
- **12-column Grid**: Hero (12) + Vital Signs (12/3) + Workspace (8+4)
- **Hero Section**: Greeting + BriefingPlayer
- **Vital Signs**: Ingresos Mes, Nuevos Leads, Pacientes Activos

### Removed
- AletheIA Sugiere block (moved to Right Sidebar)
- Tareas Pendientes widget (moved to Right Sidebar)
- Cluttered card layouts and excessive decorations

---

## [1.0.5.3] - 2025-12-26

### Added - Fine Tuning & Mechanics
- **Typography Recalibration**: Type Scale utility classes (`type-h1`, `type-h2`, `type-body`, `type-ui`)
  - Playfair Display restricted to H1/H2 (Editorial)
  - Space Grotesk for H3+ (Technical)
  - Inter with relaxed line-height (Body)
- **TrinityNav Collapsible**: Left sidebar collapses w-64 → w-16 with icons-only mode
- **AletheiaObservatory Collapsible**: Right sidebar collapses to vertical "AletheIA" tab (w-12)
- **Smooth Transitions**: `transition-all duration-300 ease-in-out` on both sidebars

### Changed - TrinityNav Redesign
- **Nav Groups**: Dashboard (solo), Engage (Calendar/Services/CRM), Practice (Clientes/Bookings/Forms), Nurture (Campaigns)
- **Collapsible Sections**: Click group header to collapse/expand, ChevronDown rotates -90°
- **Visual Polish**: Subtle colored backgrounds per section (orange/teal/emerald), removed separators
- **User Profile**: Links to Settings (removed separate Settings link)
- **Controls Row**: Theme toggle + Logout inline

### Fixed
- Cleaner search input design (removed kbd border)
- `User` icon for Clientes (vs `Users` for CRM)

---

## [1.0.5.2] - 2025-12-26

### Added - Theme Engine Dual Mode
- **Dark/Light Tabs**: Theme Editor now has separate tabs for each mode
- **next-themes Integration**: Preview switches actual theme via `setTheme()`
- **Dual CSS Injection**: ThemeHydration injects both `:root` and `.dark` blocks
- **Migration Support**: Legacy flat format auto-migrates to dark mode

### Added - Documentation
- **Typography Section** in THEME_SYSTEM.md (Space Grotesk, Inter, Playfair Display, JetBrains Mono)

---

## [1.0.5.1] - 2025-12-25 🎄

### Added - Global Observatory (Clinic Radar Mode)
- **BriefingPlayer in Sidebar**: Compact audio player with transcript toggle
- **Full PendingActions Widget**: Rule name, recipient, Edit/Approve/Reject buttons, detail modal
- **Risk Monitor**: HIGH/MEDIUM patient list with navigation links
- **System Health**: Status indicator

### Changed - Dashboard Cleanup
- Removed BriefingPlayer from central dashboard (now in sidebar)
- Removed PendingActionsWidget from dashboard (now in sidebar Agent Center)
- Removed AletheIA Sugiere block (now in sidebar Risk Monitor)

### Fixed
- **Daily Briefing Audio**: Configured OPENAI_API_KEY in Google Secret Manager and local .env

---

## [1.0.5] - 2025-12-25 🎄

### Added - AletheIA Observatory Dynamic Context
- **Zustand Patient Store**: Global state management for active patient context
- **Dynamic Observatory Sidebar**: Shows patient-specific insights when viewing a patient
  - Risk Score gauge with color coding (HIGH/MEDIUM/LOW)
  - AletheIA Summary from backend analysis
  - Key Themes (thematic pills)
  - Active Flags and Alerts
  - Engagement Score progress bar
- **Standby Mode**: "No patient selected" state when on dashboard
- **API Bridge**: `lib/api/aletheia.ts` connects to `POST /insights/patient/{id}`

### Added - Documentation
- **`docs/ALETHEIA_ARCHITECTURE.md`**: Complete architecture document for architects
  - 5 Core Functions detailed (Risk Assessment, Engagement Score, Thematic Pills, Daily Briefing, Lead Stale Monitor)
  - Daily Briefing pipeline and output documentation
  - Frontend component specifications
- **`docs/STATE_MANAGEMENT.md`**: Zustand guide and usePatientStore documentation

---

## [1.0.4.1] - 2025-12-25 🎄

### Fixed - Semantic Token Migration Completion
- **Final cleanup**: Removed remaining hardcoded colors missed in v1.0.3.1 batch
- **Ghost Kill Protocol**: 100% semantic compliance verified

---

## [1.0.4] - 2024-12-25 🎄

### Added - Theme Engine (Admin Panel)
- **Real-time Theme Editor**: New tab in Admin panel for CSS variable customization
  - 14 editable semantic tokens across 4 categories
  - **Base Architecture**: background, foreground, card, border
  - **Navigation**: sidebar, sidebar-foreground, sidebar-border
  - **Brand Identity**: brand, risk, ai, primary
  - **Feedback Colors**: success, warning, destructive
- **Live Preview Mode**: Changes apply instantly via `document.documentElement.style`
- **Reset Button**: Clears inline styles and reloads page

### Added - Theme Persistence (Full Stack)
- **`Organization.theme_config`**: New JSONB field for CSS variable storage
- **API Endpoint**: `PATCH /admin/organizations/{id}/theme` for saving themes
- **ThemeHydration Component**: Injects saved CSS variables on page load
- **`/auth/me` Enhanced**: Now returns organization with theme_config
- **Per-Tenant Theming**: Each organization can have its own custom branding

---


## [1.0.3.1] - 2024-12-25 🎄

### Changed - Semantic Token Migration (100% Complete)
- **Batch Refactored ~200 violations** using static code analysis:
- **Pages Migrated**: dashboard, patients, services, calendar, forms, leads, admin, automations, settings
- **Zero Violations**: Codebase now 100% free of hardcoded zinc/slate/gray colors

### Removed
- **`/ui-demo` Page**: Obsolete color demo page deleted

---

## [1.0.3] - 2024-12-25 🎄

### Added - Semantic Theme Engine
- **Theme Engine**: Installed `next-themes` for dark/light mode support
  - `ThemeProvider` wrapping the entire application
  - `ThemeToggle` component (Sun/Moon icons) in TrinityNav
  - Light ("The Clinic") and Dark ("The Void") themes
- **`@custom-variant dark`**: Tailwind v4 class-based dark mode directive
- **Light/Dark Logo Variants**: Separate PNGs that swap based on theme
- **`CyberCard` Component**: Universal container with `default`, `alert`, and `ai` variants

### Added - Semantic Design Tokens
- **Single Source of Truth**: All colors defined in `globals.css` via CSS variables
- **Token Categories**:
  - `--sidebar`, `--header` (layout surfaces)
  - `--card`, `--popover`, `--input` (component surfaces)
  - `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive` (actions)
  - `--brand`, `--risk`, `--success`, `--warning`, `--ai` (semantic colors)
- **Development Principles**: Updated Section 11 with "Abstraction over Implementation" theming protocol
- **Forbidden Patterns**: Hardcoded `bg-zinc-*`, `text-slate-*`, `border-gray-*` explicitly banned

### Added - Trinity Navigation
- **`TrinityNav` Sidebar**: New fixed-width navigation organized by pillars
  - 🔥 **ENGAGE**: CRM, Formularios
  - 🩺 **PRACTICE**: Calendario, Clientes, Servicios
  - 🌱 **NURTURE**: (Coming Soon)
- **3-Column Layout**: Sidebar | Main Content | AletheIA Intelligence Rail
- **⌘K Search Placeholder**: Ready for Command Palette integration
- **AletheIA Observatory**: Right sidebar with Risk Score, Biomarkers, Alerts widgets
- **Agentes Menu**: New link in TrinityNav footer pointing to `/settings/automations`

### Changed - Dashboard Bento Grid
- **Refactored Dashboard Layout**: From vertical stack to 12-column CSS grid
  - **Zone A**: Chief of Staff with PendingActionsWidget
  - **Zone B**: Focus Card (8 cols) + Pillar Stack metrics (4 cols)
  - **Zone C**: Recent Bookings + Patients lists with `CyberCard`
- **Removed Bright Gradients**: All cards now use semantic surfaces with colored icons
- **Typography**: `font-mono` for all metrics, timestamps, and stats

---

## [1.0.2] - 2024-12-24

### Added
- **The Black Box Backup System**: Automated PostgreSQL backup infrastructure
  - Automated backups every 6 hours with 7-day retention
  - Admin panel "Backups" tab for create/restore/download/delete
  - Nuclear confirmation modal requiring "RESTAURAR" text input
  - Path traversal security validation on all filename inputs
  - Download endpoint for Cloud Run ephemeral storage protection

### Added (ADRs)
- **ADR-005**: Membership Builder (subscriptions + content library)
- **ADR-006**: Smart Prescriptions (AI-suggested clinical content)
- **ADR-007**: The Mirror (progress visualization)
- **ADR-008**: Time Capsule (delayed messaging)
- **ADR-009**: Trinity Navigation (UI architecture)

### Fixed
- **Cascade Delete**: Deleting a Lead now also deletes associated `pending_actions`
- **Backend Dockerfile**: Added `postgresql-client` for backup/restore operations

### Removed
- **Pitch Deck**: Deprecated TherapistOS pitch deck at `/pitch`

### Documentation
- **ROADMAP_PROPOSAL_v1.1.md**: Consolidated 2026 strategic roadmap proposal

---

## [1.0.1] - 2024-12-24

### Fixed
- **Local Login Loop**: Resolved redirect loop caused by stale HttpOnly cookies after 401 errors
  - Frontend now calls `/auth/logout` before redirecting to clear server-side session
  - Backend cookie configuration made environment-aware (`secure=False` for localhost)
- **OAuth Callback URL**: Google Calendar integration now uses `FRONTEND_URL` environment variable instead of hardcoded localhost
- **Marketing App Links**: Navigation links now correctly point to `app.kuraos.ai` subdomain
- **Marketing Styles**: Added missing brand color definitions for Tailwind v4 (`brand-dark`, `brand-accent`, `brand-glow`)
- **Input Text Visibility**: Removed global CSS rule that forced dark text on inputs, fixing invisible text on dark backgrounds

### Infrastructure
- **Secret Management**: All sensitive credentials (Stripe, Twilio) now managed via Google Secret Manager
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- **Cloud Run Deploy**: Updated `deploy.sh` to inject secrets from Secret Manager via `--set-secrets`
- **Production Config**: Added `FRONTEND_URL` and `GOOGLE_REDIRECT_URI` to `env-vars.yaml`

### Developer Experience
- **Stripe CLI Automation**: `start-dev.sh` now auto-starts Stripe webhook listener with PID tracking
- **Twilio Webhook Automation**: Script attempts to auto-update WhatsApp sandbox webhook URL via Twilio API
- **Marketing Local Dev**: Marketing app now runs on port 3002 via `start-dev.sh`
- **Removed Turbopack Flag**: Explicit `--turbo` removed from marketing app (Next.js 16 uses it by default)

### Documentation
- **TECH_DEBT.md**: Updated with Sandbox-to-Production migration checklist for Stripe and Twilio

---

## [1.0.0] - 2024-12-23

### 🎉 Initial Public Release

KURA OS is now live! A complete operating system for therapists to manage their practice.

### Added

#### Core Platform
- **Authentication System**: JWT-based authentication with HttpOnly cookies, shared across `*.kuraos.ai` subdomains
- **Multi-tenant Architecture**: Organizations with SOLO/TEAM types, user roles (OWNER, ADMIN, THERAPIST, ASSISTANT)
- **Patient Management**: Full CRUD for patients with clinical journey tracking
- **Clinical Entries**: Session notes, preparation guides, integration notes with AI analysis
- **AI-Powered Insights**: Patient risk assessment, engagement scoring, and therapeutic suggestions

#### Booking & Scheduling
- **Service Types**: Create services (1:1 or group) with customizable duration, pricing, and forms
- **Availability Schedules**: Weekly recurring availability with specific date overrides
- **Public Booking Page**: Unauthenticated booking flow for clients at `/book/{therapist_id}`
- **Booking Management**: View, approve, and manage bookings from the dashboard

#### Forms & Automation
- **Form Builder**: Create intake forms with various field types
- **Form Assignments**: Send forms to patients with expiring tokens
- **Public Form Submissions**: Clients can submit forms without authentication

#### Settings & Billing
- **User Preferences**: Locale, AI output preferences, profile settings
- **Stripe Integration**: Payment processing for services
- **Credit System**: AI credits with monthly quotas and purchased credits

#### Admin Panel (Superuser)
- **Organization Management**: View and manage all organizations
- **System Settings**: Configure tier limits and global settings
- **Database Migrations**: In-app migration controls

### Infrastructure
- **Frontend**: Next.js 16 with Turbopack, deployed on Vercel
- **Backend**: FastAPI with async SQLAlchemy, deployed on Google Cloud Run
- **Database**: PostgreSQL on Cloud SQL
- **Authentication**: JWT tokens in HttpOnly cookies with `.kuraos.ai` domain sharing

### Fixed (Pre-release)
- Mixed Content errors resolved with `ProxyHeadersMiddleware` for correct HTTPS redirects
- Service creation 500 errors fixed by adding missing `schedule_id` and `scheduling_type` columns
- Public booking 404 errors fixed by correcting API paths and auto-linking therapists to services
- CORS configuration updated to support `localhost:3001` for local development
- Trailing slash redirects handled to prevent 307 loops

### Security
- All API calls enforce HTTPS for production domain
- HttpOnly cookies prevent XSS token theft
- CORS properly configured for production and development origins


---

## [0.9.9.17] - 2025-12-22

### Agente Fantasma
- **Cold Lead Follow-up Agent**: New automation playbook for re-engaging leads inactive for >48h.
- **Trigger**: `LEAD_STAGED_TIMEOUT`
- **Action**: Sends email "¿Sigues interesado/a?"

---

## [0.9.9.16] - 2025-12-22

### Form Editor - Target Entity
- **Destino de Envío**: Form builder option to target either `PATIENT` (Clinical) or `LEAD` (CRM).

---

## [0.9.9.15] - 2025-12-22

### Lead Stagnation Monitor
- **Stale Leads Check**: Background job to detect leads stuck in pipeline for >48h.
- **Integration**: Emits `LEAD_STAGED_TIMEOUT` event for automation.

---

## [0.9.9.14] - 2025-12-22

### Lead Fork in Form Submissions
- **Smart Routing**: Forms targeting `LEAD` now create CRM entries instead of patients.
- **Duplicate Check**: Prevents duplicate leads by email.

---

## [0.9.9.13] - 2025-12-22

### Draky Mode & Human-in-the-Loop
- **Draft Actions**: Automation actions can now be set to `DRAFT_ONLY` requiring manual approval.
- **Approval UI**: New "Tareas Pendientes" widget for reviewing draft emails.

---

## [0.9.9.12] - 2025-12-22

### Daily Briefing Audio (Spanish)
- **Localization**: Improved Spanish date formatting for audio briefings.
- **Caching**: Audio files cached with visual indicator.

---

## [0.9.9.11] - 2025-12-22

### Agent Settings UI
- **Agent Config**: UI for configuring agent personality (Tone, Mode, Signature).

---

## [0.9.9.9] - 2025-12-22

### Clinical Agents Rebranding
- **Rebranding**: Renamed "Automations" to "Agentes IA".
- **CRM Triggers**: Added `LEAD_CREATED`, `LEAD_CONVERTED` triggers.

---

## [0.9.9.8] - 2025-12-22

### Lead CRM & Speed-to-Lead
- **Lead Model**: Separate CRM table for pre-clinical leads.
- **Kanban Board**: Drag-and-drop pipeline management.
- **Speed-to-Lead**: WhatsApp button and Ghost Detector visual cues.

---

## [0.9.9.7] - 2025-12-20

### Dynamic Terminology
- **Terminology System**: Toggle between PATIENT / CLIENT / CONSULTANT labels globally.

---

## [0.9.9.5] - 2025-12-19

### Help Center & ChatBot
- **Help Center**: MDX-based documentation in `/settings`.
- **ChatBot**: AI assistant powered by Gemini 2.5 Flash with query logging.

---

## [0.9.8.2] - 2025-12-16

### Patient Cockpit
- **AletheiaHUD**: Unified clinical intelligence display.
- **Daily Insights**: Redesigned feed with accordion view.

---

## [0.9.8.1] - 2025-12-16

### Audio Transcription
- **Whisper Integration**: Automatic transcription of WhatsApp audio messages.
- **Hourly Analysis**: Frequency increased to hourly.

---

## [0.9.8] - 2025-12-16

### WhatsApp Integration
- **Twilio Webhook**: Ingestion of WhatsApp messages.
- **Conversation Analyzer**: Daily sentiment analysis of chat history.

---

## [0.9.7] - 2025-12-16

### Stripe Fintech Engine
- **Subscriptions**: SaaS billing for PRO/CENTER tiers.
- **Stripe Connect**: Marketplace infrastructure for split payments.

---

## [0.9.6] - 2025-12-16

### Landing Page & Patient Photos
- **Landing Page v2**: Product marketing site.
- **Patient Photos**: Profile image support.

---

## [0.9.5] - 2025-12-16

### Premium UI
- **Dashboard Data**: Real-time stats integration.
- **Section Headers**: Consistent gradient headers.

---

## [0.9.4] - 2025-12-15

### Multi-Tenancy & Tiers
- **RBAC**: Owner/Therapist/Assistant roles.
- **Tier System**: BUILDER (3), PRO (50), CENTER (150) limits.

---

## [0.9.3] - 2025-12-14

### Playbook Marketplace
- **Automation Rules**: Configurable playbooks.
- **Marketplace UI**: Catalogue of installable agents.

---

## [0.9.2] - 2025-12-14

### The Orchestrator
- **Journey Engine**: State machine for patient journeys.
- **Temporal Engine**: APScheduler for time-based triggers.

---

## [0.9.1] - 2025-12-14

### Investor Demo Polish
- **Demo Data**: Seed scripts for investor demo.
- **UI Polish**: Typography and color system upgrade.

---

## [0.9.0] - 2025-12-14

### automation Foundations
- **Event Bus**: SystemEventLog architecture.
- **Hardcoded Rules**: Initial Python-based rule engine.

---

## [0.8.6] - 2025-12-14

### Bookings Page
- **Bookings Management**: Dedicated page for reservation oversight.
- **Google Calendar**: Full bidirectional sync.

---

## [0.8.5] - 2025-12-12

### Availability Engine
- **Multiple Schedules**: Support for different availability sets.
- **Service Linking**: Map services to specific schedules.

---

## [0.8.3] - 2025-12-12

### Group Booking
- **Capacity Management**: Support for group sessions/retreats.
- **Specific Availability**: Date overrides.

---

## [0.8.2] - 2025-12-12

### Automation & DevEx
- **Startup Scripts**: Automated dev environment scripts.
- **Docker Compose**: Enhanced with stripe-webhook service.
---

## [0.8.1] - 2025-12-11

### Lead Automation
- **AI Clinical Agents Alpha**: First playbook automation system.
- **Memory Handover**: Lead notes preserved in patient profile on conversion.

---

## [0.8.0] - 2025-12-10

### Lead CRM
- **Lead Fork Architecture**: Separated Leads (CRM) from Patients (Clinical).
- **Kanban Board**: Drag-drop leads through NEW → CONTACTED → QUALIFIED.
- **Speed-to-Lead**: WhatsApp integration for immediate engagement.
- **Ghost Detector**: Visual urgency indicators for stale leads.
- **Auto-Conversion**: Public bookings auto-convert leads to patients.

---

## [0.7.0] - 2025-12-09

### Booking & Payments
- **Service Management**: 1:1 and Group session types.
- **Availability Schedules**: Weekly schedules with date overrides.
- **Public Booking Wizard**: 4-step flow (service → date → payment → confirm).
- **Stripe Integration**: Checkout Sessions + Webhooks.
- **Google Calendar Sync**: Bidirectional sync for availability.

---

## [0.6.1] - 2025-12-08

### Governance UI
- **SuperAdmin Panel**: System settings and org management.
- **Premium Settings**: Profile card, subscription status, AI preferences.
- **Credits Display**: Visual feedback on AI credit usage.

---

## [0.6.0] - 2025-12-08

### Governance Architecture
- **Subscription Tiers**: FREE, PRO, TRIAL with patient limits.
- **AI Credit System**: Cost tracking for text/audio/image analysis.
- **Dynamic Config**: Database-driven system settings.

---

## [0.5.5] - 2025-12-07

### Async AI Analysis
- **Async Processing**: Background task for AI analysis with polling.
- **Full-Context Audio**: Enhanced prompts for audio session synthesis.

---

## [0.5.0] - 2025-12-06

### AI Observatory & Multimedia
- **Multiple Analyses**: Support for multiple AI insights per entry.
- **Multimedia Input**: Audio recording and photo capture in-browser.
- **Timeline Redesign**: Modern clinical timeline UI.

---

## [0.4.0] - 2025-12-05

### Clinical Journal
- **ClinicalEntry Model**: Polymorphic entries (Note, Audio, Doc, AI).
- **Composer**: Rich text editor with file upload.

---

## [0.3.0] - 2025-12-04

### Patient Management
- **CRUD Operations**: Full patient profile management.
- **Search**: Patient list filtering.

---

## [0.2.0] - 2025-12-03

### Identity & Persistence
- **Migrations**: Alembic async setup.
- **JWT Auth**: HttpOnly cookies, full auth flow.
- **i18n**: Locale-aware routing (EN/ES).

---

## [0.1.0] - 2025-12-01 🌱 GENESIS

### 🪐 PsychedelicTherapistOS is Born

> The project began on **December 1st, 2025** with Google Antigravity. In just 27 days, we built a complete Clinical Operating System from scratch.

**The Problem We Solved:**
- Traditional medical software lacked flexibility for non-linear therapeutic journeys
- Audio-first clinical notes were unsupported
- Real-time risk triage during integration phases was missing
- Patient journey tracking was an afterthought, not core

**The Solution:**
- **Monorepo Architecture**: Next.js 15 + FastAPI unified "Cockpit"
- **Multimedia Clinical Entries**: Photos, audio recordings, rich text
- **Patient Journey Timeline**: Emphasized therapeutic arc over appointments
- **Target Vertical**: Psychedelic-assisted therapy, retreats, integration

---

## 📜 The Miracle Month: December 2025

> Built entirely with **Google Antigravity** in < 30 days.

### Week 1 (Dec 1-7): Foundation
- **v0.1.x-v0.2.x**: Database design, JWT auth, i18n (EN/ES/CA/IT)
- **v0.3.x**: Patient CRUD, search, profile data
- **v0.4.x-v0.5.x**: Clinical Journal, AI Observatory Alpha

### Week 2 (Dec 8-12): Business Layer
- **v0.6.x**: Governance & Subscription tiers
- **v0.7.x**: Booking & Payments (Stripe)
- **v0.8.x**: Lead CRM & Kanban board
- **v0.9.0**: Rebranding to KURA OS (kuraos.ai)

### Week 3 (Dec 12-20): Production Launch
- **v1.0.0**: Public Launch 🎉
- **v1.0.1-v1.0.3**: Black Box backups, Cyber-Clinical UI

### Week 4 (Dec 21-27): THE COMMAND CENTER
- **v1.0.4-v1.0.6**: Theme Engine, AletheIA Observatory, Security
- **v1.0.7-v1.0.9**: Clean Room, Design System, Clinical Roster
- **v1.0.10-v1.0.12**: Journey Cards, Neural Flow UI
- **v1.1.0**: Dashboard 3.0 "The Command Center" 🚀

---

## 🦋 The Rebranding Pivot (v0.9.0)

> **PsychedelicTherapistOS** became **KURA OS** (kuraos.ai).

**Rationale:**
- While psychedelic vertical remained the "North Star," the name "KURA" provided:
  - More professional, brandable identity
  - Versatility for broader practitioner types
  - Domain availability (kuraos.ai)

---

## 🛡️ The AletheIA Philosophy

- **Risk Assessment**: Not just medical safety, but clinical insight
- **Human-in-the-Loop**: "Draky Mode" (Draft Only) for therapeutic sovereignty
- **Engagement Scoring**: AI handles admin while therapist focuses on healing

---

## 🤖 Built with Google Antigravity

From zero to production in 27 days:
- 40+ database models
- 100+ API endpoints
- 50+ React components
- 10+ AI integrations
- Full Stripe/Twilio/Google Calendar integration
- HIPAA-ready architecture

*A testament to what's possible when human vision meets AI engineering.*

---

*Last updated: December 28, 2025 (v1.1.7 THE GOLDEN KEY)*

*© 2025 KURA OS. All rights reserved.*
