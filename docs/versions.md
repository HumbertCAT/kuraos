# TherapistOS - Version History

Internal document for tracking features per version. Used for GitHub release notes.

---

## v0.9.9.13 - Form target_entity (2025-12-22)

**Status:** ✅ Complete | **Milestone:** Backlog cleanup

### Form Target Entity
- ✅ **Model Update**
  - Added `target_entity` column to FormTemplate
  - Values: PATIENT (default) | LEAD
  - Enables forms to create Leads instead of Patients

- ✅ **Migration**
  - h8901bcdef2_add_target_entity_to_form_templates
  - Server default: 'PATIENT' (preserves existing behavior)

### Files Modified
- `backend/app/db/models.py` - FormTemplate model
- `backend/alembic/versions/h8901bcdef2_add_target_entity_to_form_templates.py`

---

## v0.9.9.12 - Agent Settings UI (2025-12-22)

**Status:** ✅ Complete | **Milestone:** Backlog cleanup

### Agent Personality Configuration
- ✅ **Frontend Modal**
  - Settings button (⚙️) on each agent card
  - Tone dropdown: Empático / Clínico / Directo
  - Draft mode toggle: "Requiere Aprobación Humana"
  - Signature input field

- ✅ **Backend API**
  - Updated PATCH /automations/rules/{id}
  - Accepts `agent_config` in request body
  - Added `agent_config` to AutomationRuleResponse

### Files Modified
- `frontend/app/[locale]/(dashboard)/settings/automations/page.tsx`
- `backend/app/api/v1/automations.py`

---

## v0.9.9.11 - Chief of Staff (2025-12-22)

**Status:** ✅ Complete | **Milestone:** Final feature before v1.0 🎉

### Daily Audio Briefing
- ✅ **BriefingEngine Service**
  - Data aggregation: calendar, clinical risks, payments, CRM pending
  - Gemini script generation (Spanish, 30-second format)
  - OpenAI TTS (tts-1, voice: nova)
  - Cache to static/briefings/{user_id}_{date}.mp3

- ✅ **API Endpoint**
  - GET /insights/daily-briefing
  - Returns audio_url, text_script, generated_at

- ✅ **BriefingPlayer Component**
  - Play/Pause audio controls
  - Animated waveform visualization
  - Transcript accordion
  - Premium gradient design

- ✅ **Dashboard Integration**
  - BriefingPlayer at top of Dashboard
  - "Tu Resumen Diario" - Command Center experience

### Files Created
- `backend/app/services/briefing_engine.py`
- `backend/static/briefings/.gitkeep`
- `frontend/components/BriefingPlayer.tsx`

---

## v0.9.9.10 - Agent Personality & Draft Mode (2025-12-22)

**Status:** ✅ Complete

### agent_config on AutomationRule
- ✅ **New JSONB Column**
  - `tone`: CLINICAL | EMPATHETIC | DIRECT
  - `mode`: AUTO_SEND | DRAFT_ONLY
  - `signature`: Custom signature

### PendingAction (Human-in-the-Loop)
- ✅ **New Model**
  - Draft actions awaiting approval
  - Status: PENDING → APPROVED/REJECTED

- ✅ **API Endpoints**
  - GET /pending-actions - List
  - PATCH /pending-actions/{id} - Edit draft
  - POST /pending-actions/{id}/approve - Send
  - POST /pending-actions/{id}/reject - Discard

### LLM Enhancement
- ✅ **enhance_message_with_ai()**
  - Gemini rewriting with tone personality
  - Graceful fallback if API key missing

### Dashboard Widget
- ✅ **PendingActionsWidget**
  - "Tareas Pendientes" card
  - View/Edit, Send, Discard actions

### Files Created
- `backend/alembic/versions/g7890abcdef1_add_agent_config_pending_actions.py`
- `backend/app/api/v1/pending_actions.py`
- `frontend/components/PendingActionsWidget.tsx`

---

## v0.9.9.9 - Clinical Agents Rebranding (2025-12-22)

**Status:** ✅ Complete

### Rebranding
- ✅ **Automatizaciones → Agentes IA**
  - Page: "Equipo de Agentes Clínicos"
  - Playbook → Protocolo
  - Marketplace → Catálogo de Agentes
  - Install → Activar
  - Trigger → Habilidad

- ✅ **Bot Icon**
  - Replaced Zap ⚡ with Bot 🤖 in sidebar and page header

### Lead Triggers
- ✅ **New TriggerEvent Values**
  - `LEAD_CREATED` - New lead added
  - `LEAD_STAGED_TIMEOUT` - Lead inactive X hours
  - `LEAD_CONVERTED` - Lead → Patient

- ✅ **Event Emission**
  - `leads.py` POST emits LEAD_CREATED with payload

### Agente Concierge Template
- ✅ **New Seed Playbook**
  - Trigger: LEAD_CREATED
  - Condition: source != "Manual"
  - Action: Send welcome email

### Files Changed
- `frontend/messages/es.json`, `en.json` - Translations
- `frontend/.../settings/automations/page.tsx` - Full UI rebrand
- `backend/app/schemas/automation_types.py` - Lead triggers
- `backend/app/api/v1/leads.py` - Event emit
- `backend/scripts/seed_automation_playbooks.py` - Concierge

---

## v0.9.9.8 - Lead CRM + Speed-to-Lead (2025-12-22)

**Status:** ✅ Complete

### Lead Management System
- ✅ **Lead Model & API**
  - `LeadStatus` enum: NEW → CONTACTED → QUALIFIED → CONVERTED/LOST
  - `Lead` model with `source_details` JSONB for attribution
  - Memory Handover: `lead.notes` → `patient.profile_data.initial_notes`
  - Full CRUD: GET, POST, PATCH, DELETE, `/convert`
  - Kanban hygiene: excludes CONVERTED/LOST by default

- ✅ **Kanban Board UI**
  - 3-column drag-drop with `@hello-pangea/dnd`
  - Create Modal, Detail Sheet with editable fields
  - "Convertir a {Terminology}" using dynamic labels
  - CRM nav item in sidebar

### Speed-to-Lead Features
- ✅ **WhatsApp Button** 💬
  - Green button on lead cards (only if phone exists)
  - Pre-filled message: "Hola {name}, soy {user}..."
  - `stopPropagation()` prevents modal opening

- ✅ **Ghost Detector** 👻
  | Age | Visual |
  |-----|--------|
  | <24h | 🟢 emerald border + "Nuevo" badge |
  | 24-72h | 🟡 amber border |
  | >72h | ⚪ slate border, 90% opacity |
  | >7d | 👻 ghost icon, grayscale filter |

- ✅ **Discovery Auto-Conversion** 🔄
  - Public booking checks `leads` table by email
  - Auto-converts Lead → Patient with Memory Handover
  - "Copy Booking Link" button with pre-filled `?email=&name=`

### Files Changed
- `backend/app/db/models.py` - LeadStatus enum, Lead model
- `backend/app/api/v1/leads.py` - Full CRUD router [NEW]
- `backend/app/api/v1/public_booking.py` - Auto-conversion logic
- `backend/alembic/versions/38323a7a5a29_add_leads_table_crm.py` [NEW]
- `frontend/app/[locale]/(dashboard)/leads/page.tsx` [NEW]

---

## v0.9.8.2 - Patient Cockpit & Global Intelligence (2025-12-16)

**Status:** ✅ Complete

### Features
- ✅ **AletheiaHUD - Clinical Intelligence Cockpit**
  - Unified HUD replacing scattered alerts
  - Source-agnostic: WhatsApp, Stagnation, or Clinical data
  - Priority hierarchy: CRISIS (red) → STAGNATION (orange) → INSIGHT (green) → EMPTY (gray)
  - Giant sentiment score display with trend indicator
  - Quick actions: Ver Chat, Contactar Paciente

- ✅ **DailyInsightsFeed Redesign**
  - Accordion logic: collapsed by default
  - Source icons: Mic 🎤 for audio, MessageSquare for text
  - Risk days: red left border + red background
  - Fake audio player with waveform
  - High contrast solid backgrounds (accessibility fix)

- ✅ **TimelineEntry UX Polish**
  - AI analysis collapsed by default
  - Reduces visual noise in Clinical Timeline

- ✅ **Development Scripts**
  - `start-dev.sh` now launches ngrok for Twilio webhooks
  - Auto-displays webhook URL for easy configuration
  - `stop-dev.sh` kills ngrok on shutdown

### Files Changed
- `frontend/components/AletheiaHUD.tsx` [NEW] - Clinical Intelligence HUD
- `frontend/components/DailyInsightsFeed.tsx` [REWRITE] - Accordion + contrast fix
- `frontend/components/TimelineEntry.tsx` - Analysis collapsed by default
- `frontend/app/[locale]/(dashboard)/patients/[id]/page.tsx` - HUD integration
- `scripts/start-dev.sh` - ngrok integration
- `scripts/stop-dev.sh` - ngrok cleanup

---

## v0.9.8.1 - Audio Transcription & Admin Tools (2025-12-16)

**Status:** ✅ Complete

### Features
- ✅ **WhatsApp Audio Transcription**
  - OpenAI Whisper API integration for audio-to-text
  - Automatic detection via `NumMedia > 0` and `audio/*` content type
  - `[🎤 AUDIO]:` prefix for transcribed messages
  - Fallback: `[🎤 AUDIO SIN TRANSCRIBIR]` on errors

- ✅ **Hourly Conversation Analysis**
  - Changed scheduler from daily (6AM) to hourly
  - Faster insights for active conversations
  
- ✅ **Admin Tools UI**
  - New "Admin Tools" section in Settings (superuser only)
  - "Forzar Análisis AletheIA" button for immediate execution
  - Displays patient count in success message

- ✅ **Environment Configuration Fixes**
  - `docker-compose.yml` now uses root `.env`
  - CORS parsing handles both comma-separated and JSON formats

### Files Changed
- `backend/app/services/transcription.py` [NEW] - Whisper integration
- `backend/app/api/v1/twilio_webhook.py` - Audio detection + transcription
- `backend/app/main.py` - Hourly scheduler + CORS parsing
- `backend/app/core/config.py` - CORS as string, new API keys
- `frontend/app/[locale]/(dashboard)/settings/page.tsx` - Admin Tools UI
- `backend/requirements.txt` - Added openai>=1.0.0

---

## v0.9.8 - Telehealth Audio Mixer & UX Improvements (2025-12-16)

**Status:** ✅ Complete

### Features
- ✅ **Telehealth Audio Mixer (AudioRecorder.tsx)**
  - Mode selector: "Nota de Voz" vs "Grabar Reunión"
  - Meeting mode captures System Audio + Microphone
  - Web Audio API mixer for stream combination
  - Warning about "Share tab audio" checkbox
  - Proper cleanup of all streams and AudioContext
  - Audio-only output (no video capture)
  
- ✅ **Error Modal for AI Analysis**
  - Clickable "⚠️ Error" badge on failed entries
  - Special modal for "Insufficient credits" with 💳 icon
  - Link to billing page for upgrades
  - Generic error modal for other failures

- ✅ **Audio Analysis Fixes**
  - Correct MIME type for .webm files (audio/webm)
  - 5-minute timeout for stale analyses
  - Polling for Gemini file ACTIVE state

### Files Changed
- `frontend/components/AudioRecorder.tsx` - Complete rewrite with mixer
- `frontend/components/TimelineEntry.tsx` - Error modal + clickable badge
- `backend/app/services/aletheia.py` - MIME type + polling fixes
- `backend/app/api/v1/clinical_entries.py` - Stale analysis timeout

---

## v0.9.7 - Stripe Fintech Engine (2025-12-16)

**Status:** ✅ Complete

### Features
- ✅ **SaaS Billing (Subscriptions)**
  - Checkout sessions for PRO/CENTER upgrades
  - Customer portal for subscription management
  - Webhook handlers for tier upgrades/downgrades
- ✅ **Stripe Connect (Marketplace)**
  - Therapist onboarding flow
  - Split payments with application fees
  - Commission rates by tier (5%/3%/2%)
- ✅ **Organization Model Updates**
  - `stripe_customer_id`, `stripe_subscription_id`
  - `stripe_connect_id`, `stripe_connect_enabled`
- ✅ **Frontend Pages**
  - `/settings/billing` - Tier display, upgrade cards
  - `/settings/payments` - Connect status, onboarding

### Files Changed
- `backend/app/core/config.py` - Price ID config vars
- `backend/app/db/models.py` - 4 new Organization fields
- `backend/app/services/stripe_service.py` - [NEW]
- `backend/app/api/v1/billing.py` - [NEW]
- `backend/app/api/v1/connect.py` - [NEW]
- `backend/app/api/v1/payments.py` - Connect split payments
- `frontend/.../settings/billing/page.tsx` - [NEW]
- `frontend/.../settings/payments/page.tsx` - [NEW]

---

## v0.9.6 - Landing Page & Patient Photos (2025-12-16)

**Status:** ✅ Complete

### Features
- ✅ **Landing Page v2 (Operating System Focus)**
  - Hero: Soul Record™ patient profile with timeline clínico
  - "Del Caos a la Claridad" comparison section
  - Formularios que Trabajan: Playbook visualization
  - AletheIA: Tu Co-Terapeuta (insights, patterns, security)
  - Gestión de Centros (roles, multi-user, Risk Shield)
  - Updated pricing copy (BUILDER/PRO/CENTER)
- ✅ **Patient Profile Photos**
  - Added `profile_image_url` field to Patient model
  - Demo photos for 10 seed patients
  - 72px avatars in list and detail views
  - Gradient fallback for patients without photos
- ✅ **UI Polish**
  - Journey Cards contrast fix (white badges)
  - Improved prev/next navigation icons
  - Reorganized patient detail header
  - Updated logo to Sparkles icon
- ✅ **Investor Pitch Deck** (`/pitch`)
  - 7-slide presentation with keyboard navigation
  - Covers: Problem, Solution, Market, Business, Traction, Ask
  - CSS transitions, no external dependencies

---


## v0.9.5 - Premium UI & Real Dashboard Data (2025-12-16)

**Status:** ✅ Complete

### Features
- ✅ **SectionHeader Component**
  - Reusable premium header with gradient icon, title, subtitle
  - Applied to all 7 main sections: Dashboard, Patients, Bookings, Calendar, Services, Automations, Forms
  - Each section has unique gradient colors (pink, blue, emerald, orange, teal, violet, indigo)
- ✅ **Standardized Page Layout**
  - All dashboard pages use consistent wrapper: `min-h-screen bg-slate-50 py-8 px-6`
  - Same max-width container: `max-w-6xl mx-auto`
  - Headers now appear at exact same position across all sections
- ✅ **Automations Grid Layout**
  - Changed from list to 3-column card grid (matches Forms style)
  - Simplified card design: icon top-left, badge top-right, action buttons in footer
  - "Biblioteca de Automatizaciones" tab also uses 3-column grid
  - Tabs styled consistently with Forms (bg-slate-200, w-fit)
- ✅ **Enhanced Section Subtitles**
  - Every section now has descriptive subtitle explaining capabilities
  - Example: "Activa playbooks que automatizan recordatorios, seguimientos y comunicaciones"
- ✅ **Dashboard Real Data**
  - Patient count now shows `totalPatients` from API (not slice length)
  - Forms stats fetched from API (totalForms, activeForms)
  - Added "Formularios" stat card replacing hardcoded data
  - Promise.allSettled for individual API error tracking
  - Error banner with console logging for debugging
- ✅ **Tier-Based Form Editor**
  - BUILDER tier: Can only toggle is_active and publish
  - PRO tier: Can edit form config (title, description, etc.)
  - CENTER tier: Can edit form schema/fields
  - Backend validation enforces tier restrictions
  - `/forms/{id}/duplicate` endpoint for cloning

### UI Components
- `SectionHeader.tsx` - Reusable gradient header component
- Props: icon, title, subtitle, gradientFrom, gradientTo, shadowColor

### Technical Details
- Dashboard uses `Promise.allSettled` for resilient API calls
- Detailed console logging for debugging session issues
- Error state with visible banner when APIs fail

---


## v0.9.4 - Multi-Tenancy & Tier System (2025-12-15)

**Status:** ✅ Complete

### Features
- ✅ **RBAC (Role-Based Access Control)**
  - `CurrentOwner` dependency for owner-only endpoints
  - `CurrentClinicalUser` dependency for clinical access (OWNER + THERAPIST)
  - ASSISTANT role blocked from clinical notes
- ✅ **Privacy Filtering for Clinical Entries**
  - OWNER sees all notes
  - THERAPIST sees public notes + own private notes
- ✅ **Tier System (BUILDER/PRO/CENTER)**
  - Dynamic patient limits from `system_settings`
  - BUILDER: 3 patients (free)
  - PRO: 50 patients
  - CENTER: 150 patients
  - `PLAN_LIMIT_REACHED` error with upgrade CTA
- ✅ **Risk Shield Tier Logic**
  - CENTER tier: Auto-block high-risk patients
  - BUILDER/PRO: Alert only, no blocking
  - Upgrade hint in email alerts
- ✅ **Service-Therapist M2M**
  - `service_therapist_link` table
  - Each therapist only sees their assigned services
  - Auto-assignment of existing services to OWNER on migration
- ✅ **Usage Widget**
  - `GET /auth/me/usage` endpoint
  - `PlanUsageWidget` component in user dropdown
  - Visual progress bar (green → yellow → red)

### API Endpoints
- `GET /auth/me/usage` - Get patient usage stats

### Technical Details
- Migration: `f01a2b3c4d5e_add_builder_center_tiers`
- Seed script: `scripts/seed_tiers.py`
- RBAC deps: `app/api/deps.py`
- Tier logic: `services/automation_engine.py`
- Widget: `components/PlanUsageWidget.tsx`

### Documentation
- Updated `docs/context.md` with tier system
- New `docs/howto_plans.md` comprehensive guide

---

## v0.9.3 - Playbook Marketplace (2025-12-14)

**Status:** ✅ Complete

### Features
- ✅ **Automation Rules Model**
  - New `AutomationRule` table for configurable playbooks
  - `is_system_template` flag for marketplace vs org rules
  - `conditions` (JSONB) for rule matching logic
  - `actions` (JSONB) for execution steps
  - `cloned_from_id` for tracking template provenance
- ✅ **Playbook Marketplace UI**
  - Two tabs: "Mis Automatizaciones" + "Marketplace"
  - System templates with Install button
  - Toggle ON/OFF for active rules
  - Visual workflow steps display (Si/→ format)
  - IconRenderer component for Lucide icons
  - "Solicitar Playbook" card for feature requests
- ✅ **Pre-configured Playbooks** (3 templates)
  - 🛡️ **Escudo de Seguridad**: Block high-risk patients, alert therapist
  - 💸 **Cobrador Automático**: 48h payment reminder email
  - ❤️ **Fidelización Post-Retiro**: 7-day satisfaction survey

### API Endpoints
- `GET /automations/rules` - List org's active rules
- `GET /automations/marketplace` - List system templates
- `POST /automations/rules/install/{id}` - Clone template to org
- `PATCH /automations/rules/{id}` - Toggle ON/OFF
- `DELETE /automations/rules/{id}` - Remove rule

### Technical Details
- Migration: `52c5abb515c1_add_automation_rules_table`
- Seed script: `scripts/seed_automation_playbooks.py`
- Frontend: `/settings/automations/page.tsx`
- Component: `components/IconRenderer.tsx`

---

## v0.9.2 - The Orchestrator (2025-12-14)

**Status:** ✅ Complete

### Features
- ✅ **Journey Formalization (Module A)**
  - `JourneyTemplate` model for configurable journeys
  - `JourneyLog` model for audit trail of state changes
  - Automatic logging on every journey status update
- ✅ **Temporal Engine (Module B)**
  - APScheduler integration in FastAPI lifespan
  - `stale_journey_monitor.py` with 48h/72h timeout rules
  - `/admin/trigger-cron` endpoint for demos
- ✅ **Clinical Triggers (Module C)**
  - `risk_detector.py` with keyword matching
  - `RISK_DETECTED_IN_NOTE` event on SESSION_NOTE creation
  - `JOURNEY_STAGE_TIMEOUT` event for stale journeys

### Technical Details
- New files: `automation_types.py`, `automation_engine.py`
- Migration: `cddc5420ce9d` (system_events + journey_status)
- Event injection in: `public_forms.py`, `payments.py`

---

## v0.9.1 - Investor Demo & Polish (2025-12-14)

**Status:** ✅ Complete

### Main Dashboard (Command Center)
- ✅ **Dashboard Page** (`/dashboard`)
  - Quick stats: Total patients, Active journeys, Upcoming bookings, AI credits
  - "Próximos 7 Días" section with upcoming appointments
  - Patient action cards with journey status
- ✅ **Dashboard Route**
  - Moved to `/dashboard` route
  - Logo now links to dashboard

### AletheIA Insights Engine
- ✅ **AI-Powered Patient Analysis**
  - New `/insights/patient/{id}` endpoint with Gemini integration
  - Asynchronous processing with `asyncio.to_thread()` (non-blocking)
  - 1-hour intelligent caching in database
  - Refresh button with spinning animation
- ✅ **AletheIAInsightsCard Component**
  - violet-fuchsia-pink gradient design
  - Summary, alerts (critical/warning/info), suggestions
  - Engagement score bar and risk level badge
  - Key themes pills
- ✅ **Date Context for AI**
  - AletheIA prompt includes current date
  - Rules: <7 days = PRÓXIMA, >30 days = LEJANA

### Demo Data for Investors
- ✅ **Cinematic Demo Data** (`seed_demo_data.py`)
  - 6 patient archetypes covering all journey stages
  - Complete bookings with services
  - Form assignments linked to patients
- ✅ **5 Form Templates**
  - Intake Inicial, Evaluación Pre-Retiro, Cuestionario Integración
  - Seguimiento Mensual, Formulario de Emergencia
- ✅ **Demo Services & Bookings**
  - Session services with prices
  - Sample bookings across date range
- ✅ **JourneyStatusCard Enhanced**
  - Visual journey state display
  - Color-coded badges per archetype

### Premium Typography System
- ✅ **3 Font Families**
  - Headlines: Playfair Display (elegant serif)
  - Body: Inter (clean sans-serif)
  - Captions: JetBrains Mono (monospace)
- ✅ **Utility Classes**
  - `.font-headline`, `.font-body`, `.font-caption`
  - Consistent application across all components
- ✅ **Vibrant Color Enhancement**
  - Upgraded color palette throughout UI

### Patient List Enhancements
- ✅ **Journey Status Badges**
  - Dynamic badges on each patient card
  - Color-coded by journey state
- ✅ **Status Filter Dropdown**
  - Filter patients by journey status
  - Quick access to blocked, pending, approved patients
- ✅ **JourneyStatusCard in Patient Detail**
  - Visual component showing all journey states
  - Color-coded badges (green=approved, red=blocked)

### Extended Patient Profiles
- ✅ **Flexible JSONB Storage**
  - New `profile_data` column on Patient model
  - Migration `98138315b4f8`
- ✅ **Collapsible Edit Form Sections**
  - 🔮 Datos Personales (violet): gender, pronouns, birth info, nationality, occupation
  - 📱 Contacto y Redes (emerald): contact method, social, emergency contact
  - 💗 Información Clínica (fuchsia): referral, therapy history, medications, goals

### Country/City Autocomplete
- ✅ **CountrySelect Component**
  - 249 countries with emoji flags 🇪🇸🇦🇩🇮🇹
  - Searchable combobox with keyboard navigation
- ✅ **CityAutocomplete Component**
  - Lazy-loads cities when country selected
  - Cities for ES (400+), AD (7), IT (120)
  - Free text fallback if no city file
- ✅ **GeoNames Attribution** (CC BY 4.0)

### Italian Language Support
- ✅ **Complete it.json Translation** (200+ strings)
- ✅ **Italian Cities** (120 cities)
- ✅ **4 locales**: en, es, ca, it

### Automation Enhancements
- ✅ **Stale Journey Monitor Expanded**
  - All 6 archetypes covered
  - 48h/72h timeout rules
- ✅ **FRONTEND_URL Setting**
  - Dynamic URL for dev/prod environments

### UI/UX Improvements
- ✅ **Logo Update**: "TherapistOS" → "Therapist OS"
- ✅ **FIXED_DATE Bookings**: Consistent time handling
- ✅ **Timezone Fix**: `datetime.now(timezone.utc)` for cache

### Technical Details
- New components: `AletheIAInsightsCard`, `CountrySelect`, `CityAutocomplete`, `CollapsibleSection`, `JourneyStatusCard`
- New pages: `/dashboard`, patient list enhancements
- New files: `aletheia.py`, `insights.py`, `countries.json`, `cities/*.json`, `it.json`, `seed_demo_data.py`
- Backend: `profile_data` JSONB, PatientResponse with journey_status
- Typography: Playfair Display, Inter, JetBrains Mono

---

## v0.9.0 - The Automator (2025-12-14)

**Status:** ✅ Complete (Hitos 0-2)

### Hitos Implementados

| Hito | Descripción | Estado | Commit |
|------|-------------|--------|--------|
| **0** | Estabilización tests (`test_group_booking.py`) | ✅ | `780b94e` |
| **1** | Cimientos: `SystemEventLog` + `Patient.journey_status` | ✅ | `e855d46` |
| **2** | Motor hardcoded: Reglas en código Python | ✅ | `8a6738e` |
| **3** | Reglas dinámicas (UI) | 🟡 Futuro | - |

### Features
- ✅ **Hito 0: Test Stabilization**
  - Fixed `test_group_booking.py` for schedule_id constraint
  - 9 passing tests total
- ✅ **Hito 1: Event-Driven Foundation**
  - `SystemEventLog` model for immutable audit trail
  - `Patient.journey_status` JSONB for fast state queries
  - Hybrid architecture: Rules Engine + State Machine
- ✅ **Hito 2: Hardcoded Rules Engine**
  - `automation_engine.py` with rule evaluation
  - HIGH risk form → `BLOCKED_HIGH_RISK`
  - LOW risk form → `AWAITING_PAYMENT`
  - Atomic JSONB merge via `jsonb_set`
- ✅ **Trigger Events Implemented**
  - `FORM_SUBMISSION_COMPLETED` → Risk-based routing
  - `PAYMENT_SUCCEEDED` → Status update
  - `PAYMENT_FAILED` → Cancel booking

### Architecture
```
ENDPOINTS (FastAPI)
    │
    ▼
AUTOMATION ENGINE (automation_engine.py)
    ├── Log Event (Audit)
    ├── Eval Rules (Hardcoded)
    └── Execute Actions (Update Status, Email)
    │
    ▼
system_events + patients.journey_status (JSONB)
```

### Technical Details
- New files: `automation_types.py`, `automation_engine.py`
- Migration: `cddc5420ce9d` (system_events + journey_status)
- Event injection in: `public_forms.py`, `payments.py`
- Commits: `780b94e` → `e855d46` → `8a6738e` → `d066b68`

---

## v0.8.6 - UX Improvements + Bookings Page (2025-12-14)


**Status:** ✅ Complete

### Features
- ✅ **Header Redesign**
  - Modern gradient logo (indigo → purple → pink) with Sparkles icon
  - Reordered menu: Pacientes → Reservas → Calendarios → Servicios → Formularios
  - Active state indicator on current menu item
  - User dropdown with profile info, credits display, settings link, and logout
- ✅ **Dedicated Bookings Page** (`/bookings`)
  - Tabs: Próximas / Anteriores (future/past)
  - Search by patient or service name
  - Status filter (Confirmed, Pending, Cancelled, Completed)
  - Actions menu: Confirm, Complete, Cancel, Delete
  - Patient name links to patient profile
  - Visual calendar below the list (react-big-calendar)
- ✅ **Google Calendar Integration (Full Backend)**
  - **Read (Blocking):** `slots.py` now queries Google Calendar FreeBusy API to block occupied times
  - **Write (Events):** Booking confirmation creates event in therapist's Google Calendar
  - New `google_calendar.py` service layer with token refresh
  - `google_calendar_event_id` field on Booking model
- ✅ **Google Calendar UI Reorganization**
  - Settings page simplified: connect/disconnect + global sync toggle
  - Calendar page: New "Google Calendar" card for blocking calendars per schedule
  - Services modal: Booking destination calendar selector
- ✅ **Calendar Page Improvements**
  - Removed "Reservas" tab (now in /bookings)
  - Fixed card colors: Specific Dates = green, Google Calendar = red
- ✅ **Backend**
  - `DELETE /booking/{id}` endpoint added
  - Fixed token expiry timezone comparison bug

### Technical Details
- Frontend: Layout restructure, `usePathname` for active menu
- Backend: `google_calendar.py` service, `booking.py` delete endpoint, `slots.py` GCal integration
- i18n: "bookings" translation added (es, en, ca)

---

## v0.8.5 - Multi-Calendar Availability (2025-12-12)

**Status:** ✅ Complete

### Features
- ✅ **Multiple Availability Schedules**
  - New `AvailabilitySchedule` model (name, is_default)
  - CRUD API: `/schedules/` (list, create, update, delete, set-default)
  - Each user can have multiple named schedules (e.g., "Morning Clinic", "Online Only")
- ✅ **Schedule-Linked Availability**
  - `schedule_id` (required) on `AvailabilityBlock`
  - `schedule_id` (nullable) on `TimeOff` and `SpecificAvailability`
  - NULL schedule_id = applies to ALL schedules (global blocks)
- ✅ **Service-Schedule Linking**
  - `schedule_id` field on `ServiceType`
  - Services can use specific schedules or default
  - Schedule selector in Services modal
- ✅ **FIXED_DATE Bypass**
  - `scheduling_type` field on `ServiceType` (CALENDAR | FIXED_DATE)
  - FIXED_DATE services skip recurring availability checks
- ✅ **Calendar UI**
  - Schedule selector dropdown in header
  - Create new schedules inline
  - Switch between schedules to view/edit blocks

### Technical Details
- Backend: `schedules.py`, updated `slots.py` for schedule filtering
- Frontend: Calendar schedule selector, Services schedule dropdown
- Migration: `migrate_schedules.py` for existing data
- i18n: Schedule-related translations (en, es, ca)

---

## v0.8.4 - Bookings Visibility + UI Polish (2025-12-12)

**Status:** ✅ Complete

### Features
- ✅ **Booking List API**
  - `GET /booking/` with filters: service_id, patient_id, status, date range
  - `PATCH /booking/{id}/status` for status updates
- ✅ **Services Page Integration**
  - "View Bookings" button on each service card
  - Modal with filtered reservation list
- ✅ **Patient Profile Integration**
  - "Reservas (N)" section showing patient's bookings
- ✅ **Calendar UX Redesign**
  - Dual tabs: Availability vs Bookings
  - Three management cards: Recurring, Specific dates, Blocks
  - Default hours 8:30-20:30
- ✅ **Navigation & Language Improvements**
  - Settings removed from menu, username links to /settings
  - Language switcher as dropdown (no flags)
  - Català locale added (es, en, ca)
- ✅ **i18n Expansions**
  - Forms page internationalized
  - Services page Catalan translations
  - Full ca.json translations file

### Technical Details
- Backend: `booking.py` CRUD endpoints
- Frontend: `api.bookings`, Calendar tabs, LanguageSwitcher dropdown
- i18n: middleware matcher updated for ca locale

---

## v0.8.3 - Group Booking (2025-12-12)

**Status:** ✅ Complete

### Features
- ✅ **Specific Availability**
  - One-off date overrides (e.g., retreats, weekends)
  - CRUD API: GET/POST/DELETE `/availability/specific`
  - Settings UI for managing specific slots
- ✅ **Group Session Capacity**
  - Service capacity field (default=1)
  - Booking wizard shows "X spots left"
  - Transactional locking prevents overbooking

### Technical Details
- Model: `SpecificAvailability` (start/end datetime)
- SlotService: Merges recurring + specific availability
- Concurrency: `SELECT ... FOR UPDATE` on therapist row

---

## v0.8.2 - Automation & DevEx (2025-12-12)

**Status:** ✅ Complete

### Features
- ✅ **Automated Startup Scripts**
  - `scripts/start-dev.sh`: One-command startup for all services
  - `scripts/stop-dev.sh`: Clean shutdown
  - Automatic Stripe webhook listener management
- ✅ **Docker Compose Enhancement**
  - Added `stripe-webhook` service for automatic webhook forwarding
- ✅ **E2E Test Improvements**
  - Fixed test to check URL instead of title
  - Added `/book/` to public routes in middleware
  - Added `data-testid` attributes to booking form

### Technical Details
- E2E Tests: 4/5 passing (80%)
- Backend Tests: 21/21 passing (100%)

---

## v0.8.1 - The Shield (2025-12-12)

**Status:** ✅ Complete

### Features
- ✅ **Backend Test Suite**
  - `test_slots.py`: 16 tests for SlotService (overlap, generation, filtering)
  - `test_webhooks.py`: 5 tests for payment webhooks
- ✅ **E2E Test Infrastructure**
  - Playwright configuration
  - `booking-flow.spec.ts` skeleton
- ✅ **Slot Locking (Concurrency Protection)**
  - `SELECT ... FOR UPDATE` with `nowait`
  - Returns 409 Conflict on race condition

### Technical Details
- Backend: 21/21 tests passing
- Playwright: Chromium-based E2E testing

---

## v0.8.0 - The Box Office (2025-12-12)

**Status:** ✅ Complete

### Features
- ✅ **Stripe Payment Integration**
  - `POST /create-payment-intent` creates intent from booking
  - Stripe Elements (PaymentElement) in frontend
  - Currency support: EUR (extensible)
- ✅ **Payment Webhooks**
  - `payment_intent.succeeded` → Booking CONFIRMED
  - `payment_intent.payment_failed` → Booking CANCELLED
- ✅ **Transactional Emails (Brevo)**
  - HTML booking confirmation emails
  - Triggers on successful payment
- ✅ **4-Step Booking Wizard**
  - Service selection → Date/Time → Patient Details → Payment
  - Dynamic step count (skips payment for free services)
- ✅ **Slot Management**
  - Auto-cancellation of PENDING booking on back navigation

### Technical Details
- Dependencies: `stripe-python`, `@stripe/stripe-js`, `sib-api-v3-sdk`
- New service: `backend/app/services/email.py`
- Environment: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, BREVO_API_KEY

---

## v0.7.6 - Rich Text Editor & Notion-like Experience (2025-12-11)

**Status:** ✅ Complete

### Features
- ✅ **RichTextEditor Component**
  - TipTap 2.27.1 integration (Headless ProseMirror)
  - Floating BubbleMenu on text selection
  - Bold, Italic, H2, List buttons
  - Markdown shortcuts (`#`, `-`, `**bold**`)
- ✅ **MarkdownRenderer Component**
  - Lightweight read-only Markdown display
  - For AI analysis outputs
- ✅ **Global CSS Architecture**
  - ProseMirror styles in `globals.css`
  - Headings, lists, blockquotes, code blocks
  - WCAG-compliant text contrast
  - Accessible selection styling (blue-200)
- ✅ **Integration Points**
  - Form Builder description field
  - Composer (clinical notes)
  - TimelineEntry (note edit, AI edit, pending analysis)

### Technical Details
- Dependencies: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*`, `tiptap-markdown`
- CSS: 130+ lines of ProseMirror-specific styles in globals.css
- Components: `RichTextEditor.tsx`, `MarkdownRenderer.tsx`

---

## v0.7.5 - UI/UX Polish Sprint (2025-12-11)

**Status:** ✅ Complete

### Features
- ✅ **New UI Components**
  - `ElevatedCard.tsx` - Consistent card elevation
  - `Skeleton.tsx` - Loading state placeholders
  - `EmptyState.tsx` - Empty state with icon + CTA
- ✅ **FormRenderer Mobile Enhancements**
  - Conditional progress bar for multi-step forms
  - 16px fonts for mobile readability
  - 44px minimum touch targets
  - Auto-growing textareas
- ✅ **Backend: FormTemplate Config**
  - Added `config` (JSONB) column for extensible rules
  - Journey rules foundation
- ✅ **Form Builder Settings**
  - "Journey Rules" section
  - "Requires 1:1 Screening" toggle

### Technical Details
- Migration: Added `config` column to `form_templates` table
- New components in `/components/ui/`
- FormRenderer refactored for accessibility

---

## v0.7.4 - Bug Fixes & Polish (2025-12-11)

**Status:** ✅ Complete

### Bug Fixes
- ✅ **Publish endpoint**: Missing `import secrets` in forms.py
- ✅ **Form submission**: `author_id` NOT NULL causing public form failures
- ✅ **Patient view**: ClinicalEntryResponse schema missing Optional author_id
- ✅ **Translation**: Added FORM_SUBMISSION entry type to en/es
- ✅ **Forms list**: Added `public_token` to list endpoint response

### Features
- ✅ **Expandable form answers**: Click form title in timeline to see answers
- ✅ **QR Code icon**: Replaced emoji with proper SVG icon

### Technical
- Migration: `5421c9b1cd68` - author_id nullable
- 22 backend tests passing

---

## v0.7.3 - UX/UI Polish Phase (2025-12-10)

**Status:** ✅ Complete

### Features
- ✅ **Patient Profile Safety**
  - Removed red Delete button from header
  - Moved Delete to "Danger Zone" section in Edit page
  - Added Quick Actions row: Email, Call, WhatsApp chips
- ✅ **Patient List Enhancement**
  - Colorful initials avatar based on name
  - Active status badge on each card
  - Improved hover effects with shadow
- ✅ **AI Analysis Typography**
  - Added prose-like styling with light background
  - Purple left border for visual distinction
  - Better text contrast and readability

---

## v0.7.2 - Frictionless Sharing UX Boost (2025-12-10)

**Status:** ✅ Complete

### Features
- ✅ **Magic Links (Pre-filling)**
  - Form links include `?prefill_name=X&prefill_email=Y`
  - FormRenderer accepts initialValues prop
  - Auto-populates patient data on assigned forms
- ✅ **WhatsApp Integration**
  - "Send via WhatsApp" button in SendFormModal
  - Opens wa.me with pre-filled message and link
  - Phone number auto-cleaned
- ✅ **QR Code Sharing**
  - QR button on published form cards
  - Modal with scannable QR code
  - Uses api.qrserver.com (no npm dependency)
- ✅ **Non-Admin Template Editing**
  - GET/PUT /templates/{id} for org templates
  - POST /templates/{id}/publish toggle
  - New `/forms/{id}/edit` page for therapists

---

## v0.7.1 - Therapist UI Bridge (2025-12-10)

**Status:** ✅ Complete

### Features
- ✅ **Forms Dashboard** (`/forms`)
  - "My Forms" tab: Organization templates with actions
  - "Template Library" tab: System templates with Clone
  - Copy Public Link, View Submissions, Settings buttons
- ✅ **Send Form Modal**
  - Patient profile integration
  - Form selection dropdown
  - Generates unique assignment link
- ✅ **Submissions View** (`/forms/{id}/submissions`)
  - Data table with patient name, status, date
  - Clickable rows navigate to patient profile

### Technical Details
- New endpoint: GET /forms/assignments/template/{template_id}
- Added "Forms" to main navigation (en/es translations)

---

## v0.7.0 - Forms & Validation System (2025-12-10)

**Status:** ✅ Complete

### Features
- ✅ **Form Template Builder**
  - Admin can create/edit form templates
  - Field types: text, email, textarea, boolean, scale (1-10), emotion_multi
  - Required field validation
  - Risk level assessment (low/medium/high)
- ✅ **Public Form Rendering**
  - Beautiful multi-step form UI
  - Real-time validation with error messages
  - Accessible via public token URL
- ✅ **Form Assignments**
  - Assign forms to specific patients
  - Track completion status
  - Link submissions to clinical entries
- ✅ **Template Cloning**
  - Clone system templates to organization
  - Copies all fields and configuration

### Technical Details
- Backend: FormTemplate, FormField, FormAssignment models
- FormRenderer component with validation hooks
- Public endpoints: /f/{token}, /f/public/{token}

---

## v0.6.2 - UI Polish & Credit Refinements (2025-12-10)

**Status:** ✅ Complete

### Features
- ✅ **Catalan Language Support**
  - Added `CA` (Català) to patient language options
- ✅ **Admin Panel Improvements**
  - Fixed input text contrast (darker text for readability)
  - AI_MODEL now uses dropdown with current Gemini models
  - Models: gemini-3-pro-preview, 2.5-flash, 2.5-pro, 2.5-flash-lite, 2.0-flash, 2.0-flash-lite
- ✅ **Patient Detail Navigation**
  - Previous/Next patient navigation buttons
  - Chevron icons for quick patient switching
- ✅ **Consistent SVG Icons**
  - Replaced emoji icons with SVG in Composer, AudioRecorder, PhotoCapture
  - Unified icon style across the app
- ✅ **Granular Credit Costs**
  - Text notes: 5 credits
  - Images: 5 credits
  - Live audio recording: 10 credits
  - Uploaded audio file: 20 credits
  - Backend detects type based on metadata

### Technical Details
- New system settings: `AI_COST_IMAGE`, `AI_COST_AUDIO_LIVE`, `AI_COST_AUDIO_FILE`
- Updated `AI_COST_TEXT` from 1 to 5 credits
- Smart detection: live audio (filename starts with `audio_`), images (content_type `image/*`)

---

## v0.6.1 - Governance UI (2024-12-10)

**Status:** ✅ Complete

### Features
- ✅ **Super Admin Panel** (`/admin`)
  - System Settings table with inline JSON editing
  - Organization Manager with tier dropdown
  - Add Credits functionality per organization
  - Patient count and credits display
- ✅ **Premium Settings Page** (`/settings`)
  - Profile card with gradient header
  - Subscription card with credits progress bar
  - AI Output Language preference (Auto/Spanish/English)
  - Interface Language selector
  - Credits visualization (monthly quota + purchased)
- ✅ **Patient Language Field**
  - Primary Language dropdown in new/edit forms
  - Top 20 languages for therapy context
- ✅ **Credits Display in Header**
  - Badge showing available credits
  - Tooltip with breakdown (monthly used, quota, purchased)
  - Visual warning when credits ≤ 10

### Technical Details
- New endpoint: `GET /auth/me/credits`
- New component: `CreditsDisplay.tsx`
- Added `is_superuser` to UserResponse schema
- Added `language` to Patient interface
- 30+ new translation keys for Settings

---

## v0.6.0 - Governance & Commercial Architecture (2024-12-10)

**Status:** ✅ Complete

### Features
- ✅ **Subscription Tiers** (FREE, PRO, TRIAL)
  - Organization-level tier field
  - FREE tier defaults with 5 patient limit, 100 monthly credits
- ✅ **AI Credit System**
  - Monthly quota + purchased credits tracking
  - Cost: Text=1 credit, Audio/Image=5 credits
  - Deduction logic: monthly quota first, then purchased
  - 402 Payment Required when exhausted
- ✅ **Patient Limits**
  - FREE tier limited to 5 patients
  - 403 Forbidden with upgrade prompt
- ✅ **Dynamic Configuration** (SystemSetting)
  - All limits and prompts configurable from DB
  - No magic numbers in code
- ✅ **Usage Logging** (AiUsageLog)
  - Ledger of all AI credit consumption
  - Org, user, entry, cost, activity_type
- ✅ **SuperAdmin API** (`/api/v1/admin`)
  - GET/PATCH settings
  - GET/PATCH organizations
  - POST add-credits
- ✅ **User & Patient Preferences**
  - User: is_superuser, locale, ai_output_preference
  - Patient: language

### Technical Details
- Migration: `d1670cffdea6`
- New models: SystemSetting, AiUsageLog
- Enums: OrgTier, OutputLanguage
- Services: settings.py (get_setting, set_setting)

---

## v0.5.5 - Async AI Analysis & Full-Context Audio (2024-12-10)

**Status:** ✅ Complete

### Features
- ✅ **Async AI Analysis with Polling**
  - `/analyze` returns 202 Accepted immediately
  - Background processing with FastAPI BackgroundTasks
  - Frontend polls every 5s while PENDING/PROCESSING
  - Processing status badge ("En cola...", "Analizando...")
  - Error handling with FAILED status display
- ✅ **Full-Context Audio Synthesis**
  - New prompt: Synthesize instead of verbatim transcription
  - Covers entire session (beginning to end)
  - Chronological key moments timeline
  - Risk assessment section
  - Only 2-4 selective verbatim quotes
  - Follow-up recommendations
- ✅ **Editable Analyses**
  - Inline edit for saved AI analyses
  - Model name badge (e.g., "gemini-2.5-flash")
- ✅ **Inline Note Editing**
  - Edit SESSION_NOTE entries in-place
  - Save/Cancel buttons

### Technical Details
- Backend: `ProcessingStatus` enum (IDLE, PENDING, PROCESSING, COMPLETED, FAILED)
- Backend: Background task with independent DB session
- Migration: `407cec59ed8d` adds processing_status columns
- Frontend: Polling effect with useRef for interval cleanup

---

## v0.5.0 - AI Observatory & Multimedia (2024-12-09)

**Status:** ✅ Complete

### Features
- ✅ **AI Analysis with Multiple Analyses per Entry**
  - Generate AI analyses on any clinical entry
  - Save analyses to `entry_metadata.ai_analyses` array
  - Delete individual analyses
  - Each analysis has id, text, and date
- ✅ **Audio Recording** via MediaRecorder API
  - Record audio directly in Composer
  - Timer display during recording
  - Microphone permission handling
- ✅ **Photo Capture** via getUserMedia API
  - Full-screen camera capture
  - Camera permission handling
  - Instant photo upload
- ✅ **Language Switcher** (EN/ES toggle in header)
- ✅ **Fixed next-intl v4.x** (requestLocale parameter)
- ✅ **Full i18n Coverage** for all UI strings
- ✅ **TimelineEntry Redesign**
  - Material Design SVG icons
  - Color-coded entry type badges
  - 10-line content truncation with "Ver más"
  - Expandable/collapsible AI analysis section

### Technical Details
- Frontend: `AudioRecorder.tsx`, `PhotoCapture.tsx` components
- Frontend: Multiple analyses stored as array in entry_metadata
- i18n: Fixed `requestLocale` for next-intl v4.x compatibility
- 30+ new translation keys (EN/ES)

---

## v0.4.0 - Clinical Journal & Data Foundation (2024-12-09)

**Status:** ✅ Complete

### Features
- ✅ ClinicalEntry model with JSONB entry_metadata
- ✅ 5 entry types: SESSION_NOTE, AUDIO, DOCUMENT, AI_ANALYSIS, ASSESSMENT
- ✅ CRUD endpoints for clinical entries
- ✅ File upload with StaticFiles serving
- ✅ TimelineEntry component with icons per type
- ✅ Composer component for notes and file uploads
- ✅ Patient detail page with clinical timeline

### Technical Details
- Backend: Alembic migration for clinical_entries table
- Frontend: Auto-redirect to login on 401 errors
- File storage: Local `/static/uploads/` (GCS in production)

---

## v0.3.0 - Patient Management (2024-12-09)

**Status:** ✅ Complete

### Features
- ✅ Full CRUD backend endpoints with multi-tenant isolation
- ✅ Patient list page with search
- ✅ Create/Edit/Delete patient flows
- ✅ Patient detail view (Soul Record)

### Technical Details
- Backend: 5 endpoints with organization_id filtering
- Frontend: 4 pages using next-intl navigation
- API client extended with patients methods

---

## v0.2.0 - Identity & Persistence (2024-12-09)

**Status:** ✅ Complete

### Features
- ✅ Alembic async migrations configured and working
- ✅ JWT authentication with httpOnly cookies (secure against XSS)
- ✅ Full auth flow: register, login, logout, /me endpoint
- ✅ Frontend auth context with React Context API
- ✅ Protected routes via middleware (dashboard requires auth)
- ✅ Proper next-intl implementation with `createNavigation`
- ✅ Locale-aware routing (auto prefix for /en, /es)
- ✅ Environment configuration (.env.example)
- ✅ Backend pytest tests (10 auth tests)

### Technical Details
- Backend auth: `python-jose` (JWT), `passlib` + `bcrypt==4.0.1` (hashing)
- Cookie config: `httponly=True`, `samesite="lax"`, `secure=False` (dev)
- Frontend: `credentials: 'include'` in all API calls
- CORS: `allow_credentials=True` with specific origins
- next-intl: v4.5.8 (latest) with `createNavigation`

### Breaking Changes
- None (first auth implementation)

### Known Limitations
- `secure=True` not set on cookies (requires HTTPS in production)
- No password reset flow yet
- No email verification yet
- Next.js 16 middleware deprecation warning (cosmetic, next-intl pending update)

---

## v0.1.0 - Project Scaffold (2024-12-09)

**Status:** ✅ Complete

### Features
- ✅ Monorepo structure (backend + frontend)
- ✅ Docker Compose for local development
- ✅ FastAPI backend with async SQLAlchemy 2.0
- ✅ Multi-tenant data model (Organization, User, Patient, Event, Attendee)
- ✅ Next.js frontend with App Router
- ✅ Internationalization (EN/ES) via next-intl
- ✅ TailwindCSS + Shadcn/UI utilities
