# Changelog

All notable changes to KURA OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2024-12-25 🎄

### Added - Cyber-Clinical Design System v2.0
- **Theme Engine**: Installed `next-themes` for dark/light mode support
  - `ThemeProvider` wrapping the entire application
  - `ThemeToggle` component (Sun/Moon icons)
  - Light (`#FAFAFA`) and Dark (`#09090B`) Zinc Protocol colors
- **Light/Dark Logo Variants**: New transparent PNGs for each theme
- **`CyberCard` Component**: Universal container with `default`, `alert`, and `ai` variants

### Added - Trinity Navigation
- **`TrinityNav` Sidebar**: New fixed-width navigation organized by pillars
  - 🔥 **ENGAGE**: CRM, Formularios
  - 🩺 **PRACTICE**: Calendario, Clientes, Servicios
  - 🌱 **NURTURE**: (Coming Soon - commented out)
- **3-Column Layout**: Sidebar | Main Content | AletheIA Intelligence Rail
- **⌘K Search Placeholder**: Ready for Command Palette integration
- **AletheIA Observatory**: Right sidebar visible on XL screens

### Changed - Dashboard Bento Grid
- **Refactored Dashboard Layout**: From vertical stack to 12-column CSS grid
  - **Zone A**: Chief of Staff with dark violet gradient header
  - **Zone B**: Focus Card (8 cols) + Pillar Stack metrics (4 cols)
  - **Zone C**: Recent Bookings + Patients lists with `CyberCard`
- **Removed Bright Gradients**: All cards now use Zinc surfaces with colored icons
- **Typography**: `font-mono` for all metrics, timestamps, and stats
- **Code Reduction**: Dashboard reduced from 648 to ~350 lines

### Changed - Tailwind v4 Migration
- **CSS-First Configuration**: Moved color definitions from `tailwind.config.ts` to `globals.css`
- **Semantic Variables**: `--background`, `--foreground`, `--surface`, `--border-subtle`, `--brand`, `--risk`, `--ai`
- **Updated `DEVELOPMENT_PRINCIPLES.md`**: Section 11.E now reflects Tailwind v4 approach

### Changed - Page-Level Styling
- **CRM/Leads**: Updated header, Kanban columns with dark mode support
- **Patients**: Simplified header, search/filter forms with brand colors
- **Calendar**: Updated schedule selector, calendar preview with Zinc surfaces
- **Services**: Updated header, card surfaces with border styling

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
