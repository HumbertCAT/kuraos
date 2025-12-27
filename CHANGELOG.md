# Changelog

All notable changes to KURA OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [0.6.1] - 2024-12-10

### Governance UI
- **SuperAdmin Panel**: System settings and org management.
- **Premium Settings**: Profile card, subscription status, AI preferences.
- **Credits Display**: Visual feedback on AI credit usage.

---

## [0.6.0] - 2024-12-10

### Governance Architecture
- **Subscription Tiers**: FREE, PRO, TRIAL with patient limits.
- **AI Credit System**: Cost tracking for text/audio/image analysis.
- **Dynamic Config**: Database-driven system settings.

---

## [0.5.5] - 2024-12-10

### Async AI Analysis
- **Async Processing**: Background task for AI analysis with polling.
- **Full-Context Audio**: Enhanced prompts for audio session synthesis.

---

## [0.5.0] - 2024-12-09

### AI Observatory & Multimedia
- **Multiple Analyses**: Support for multiple AI insights per entry.
- **Multimedia Input**: Audio recording and photo capture in-browser.
- **Timeline Redesign**: Modern clinical timeline UI.

---

## [0.4.0] - 2024-12-09

### Clinical Journal
- **ClinicalEntry Model**: Polymorphic entries (Note, Audio, Doc, AI).
- **Composer**: Rich text editor with file upload.

---

## [0.3.0] - 2024-12-09

### Patient Management
- **CRUD Operations**: Full patient profile management.
- **Search**: Patient list filtering.

---

## [0.2.0] - 2024-12-09

### Identity & Persistence
- **Migrations**: Alembic async setup.
- **JWT Auth**: HttpOnly cookies, full auth flow.
- **i18n**: Locale-aware routing (EN/ES).


### Project Scaffold
- **Monorepo**: Next.js + FastAPI + Docker structure.
- **Authentication**: JWT, HttpOnly cookies, RBAC.
- **i18n**: Multi-language support foundation.
