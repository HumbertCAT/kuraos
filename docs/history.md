# TherapistOS - Change History

This document tracks significant changes made to the project.

---

## 2025-12-22: Agente Fantasma (v0.9.9.17)

### Cold Lead Follow-up Agent
New automation playbook available in **Agentes IA > Catálogo**:
- **Trigger**: `LEAD_STAGED_TIMEOUT` (48h+ inactividad)
- **Action**: Envía email "¿Sigues interesado/a?"
- **Toggle**: Activar/desactivar desde UI

---

## 2025-12-22: Form Editor - target_entity (v0.9.9.16)

### Destino de Envío
Campo añadido al editor de formularios:
- **Paciente (Clínico)**: Crea Patient con historial
- **Lead (Captación)**: Crea Lead en CRM, dispara automatizaciones

---

## 2025-12-22: Lead Stagnation Monitor (v0.9.9.15)

### Temporal Automation for Cold Leads
New `check_stale_leads()` function detects inactive leads and triggers automation.

### Rules
- **Target**: Leads with `status IN (NEW, CONTACTED, QUALIFIED)`
- **Threshold**: `updated_at < NOW - 48 hours`
- **Anti-spam**: No event if `LEAD_STAGED_TIMEOUT` already fired in past 24h

### Integration
- Added to hourly APScheduler in `main.py`
- Emits `LEAD_STAGED_TIMEOUT` event → triggers "Agente Fantasma" automation

### Files Changed
- `backend/app/workers/stale_journey_monitor.py` - check_stale_leads function
- `backend/app/main.py` - stale_leads_monitor scheduler job

---

## 2025-12-22: Lead Fork in Form Submissions (v0.9.9.14)

### Smart Form Routing
Public form submissions now respect `FormTemplate.target_entity`:

| target_entity | Behavior |
|---------------|----------|
| `LEAD` | Creates Lead, emits `LEAD_CREATED`, NO Patient |
| `PATIENT` | Creates Patient + ClinicalEntry (existing behavior) |

### Lead Path Details
- Parses name into `first_name` / `last_name`
- Checks for existing Lead by email (avoids duplicates)
- Sets `source = "Form: {template.title}"`
- Triggers automation (Agente Concierge)

### Files Changed
- `backend/app/api/v1/public_forms.py` - Lead Fork implementation

---

## 2025-12-22: Draft Mode Pipeline Complete (v0.9.9.13)

### Human-in-the-Loop Draft Mode Working End-to-End
Full automation pipeline for Agente Concierge with draft email approval.

### Backend Fixes
| Issue | Fix |
|-------|-----|
| `neq` operator not supported | Added `eq`, `neq`, `<>` to `_check_conditions()` |
| `source neq Manual` blocking CRM leads | Removed restrictive condition from Agente Concierge |
| PendingAction field name mismatch | `automation_rule_id` → `rule_id`, `entity_id` → `recipient_id`, etc. |
| `status.value` AttributeError | Added `hasattr()` check for Enum vs string |
| `Unknown email template: generic` | Added `generic` template to `send_automation_email()` |

### Frontend Fixes
- Added `api.pendingActions.list()`, `approve()`, `reject()` to API client
- Fixed PendingActionsWidget to use new API methods

### Files Changed
- `backend/app/services/automation_engine.py` - Condition operators, PendingAction creation
- `backend/app/api/v1/pending_actions.py` - Status value handling
- `backend/app/services/email.py` - Generic email template
- `frontend/lib/api.ts` - pendingActions namespace
- `frontend/components/PendingActionsWidget.tsx` - API integration

---

## 2025-12-22: Daily Briefing Audio in Spanish (v0.9.9.12)

### Audio Briefing Fixes
- Fixed Spanish date formatting using manual translation dictionaries (locale-independent)
- Voice synthesis now uses Spanish correctly
- Cached audio with "En caché" indicator

### Files Changed
- `backend/app/services/briefing_engine.py` - DAYS_ES/MONTHS_ES dictionaries

---

## 2025-12-22: Agent Settings UI & Toggle Fix (v0.9.9.11)

### UI Improvements
- Fixed toggle button alignment in agent cards
- Increased card right padding
- Added `flex-shrink-0` to prevent overflow

### Files Changed
- `frontend/app/[locale]/(dashboard)/automations/page.tsx`

---

## 2025-12-22: Dependency Fix (v0.9.9.10)

### Frontend Build Fix
- Installed missing `@hello-pangea/dnd` package for drag-and-drop in Leads page

---

## 2025-12-22: Clinical Agents Rebranding (v0.9.9.9)

### The Agent Metaphor
Rebranded "Automations" to **Clinical Agents** to increase perceived value as AI-powered team members.

### UI Changes
| Before | After |
|--------|-------|
| Automatizaciones | Agentes IA |
| Playbook | Protocolo |
| Marketplace | Catálogo de Agentes |
| Instalar | Activar |
| Trigger | Habilidad |

- Page title: "Equipo de Agentes Clínicos"
- Bot icon (🤖) instead of Zap (⚡)
- Skills-style badges for triggers

### Lead Triggers (CRM Automation)
New `TriggerEvent` enum values for Lead lifecycle:
- `LEAD_CREATED` - Fires when new lead is added
- `LEAD_STAGED_TIMEOUT` - Lead inactive for X hours
- `LEAD_CONVERTED` - Lead successfully converted to patient

### Event Emission
`leads.py` POST endpoint now emits `LEAD_CREATED` event to automation engine with payload:
```python
{lead_id, first_name, last_name, email, phone, source}
```

### Agente Concierge
New seed template in `seed_automation_playbooks.py`:
- Trigger: `LEAD_CREATED`
- Condition: `source != "Manual"` (don't msg self-added leads)
- Action: Send welcome email with booking link

### Files Changed
- `frontend/messages/es.json` - Navigation + Automations namespace
- `frontend/messages/en.json` - AI Agents translation
- `frontend/app/[locale]/(dashboard)/settings/automations/page.tsx` - Full rebrand
- `backend/app/schemas/automation_types.py` - Lead triggers
- `backend/app/api/v1/leads.py` - LEAD_CREATED emit
- `backend/scripts/seed_automation_playbooks.py` - Agente Concierge

---

## 2025-12-22: Lead Management System / CRM (v0.9.9.8)

### Growth Engine - Sales Pipeline Before Clinical

Organizations now have a proper CRM to manage prospective clients BEFORE they become clinical patients. This separates **Sales** from **Clinical Operations**.

### Data Model
- `LeadStatus` enum: NEW → CONTACTED → QUALIFIED → CONVERTED/LOST
- `Lead` model with `source_details` JSONB for attribution tracking
- `converted_patient_id` FK for conversion tracking
- GDPR compliant: no clinical data in leads table

### API Layer (`/api/v1/leads`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/leads` | GET | List with Kanban hygiene (excludes CONVERTED/LOST by default) |
| `/leads` | POST | Create manual lead |
| `/leads/{id}` | PATCH | Update status (drag-drop) |
| `/leads/{id}/convert` | POST | Lead → Patient with Memory Handover |

### Memory Handover
When converting Lead to Patient, `lead.notes` is preserved in `patient.profile_data.initial_notes` for clinical context continuity.

### Frontend Kanban UI
- 3-column board: **Nuevos** → **Contactados** → **Cualificados**
- Drag-and-drop status updates (`@hello-pangea/dnd`)
- Create Modal, Detail Sheet with notes
- "Convertir a {Terminology}" button using dynamic labels
- CRM nav item in sidebar

### Files Created
- `backend/app/db/models.py` - LeadStatus enum, Lead model
- `backend/app/api/v1/leads.py` - Full CRUD router
- `backend/alembic/versions/38323a7a5a29_add_leads_table_crm.py`
- `frontend/app/[locale]/(dashboard)/leads/page.tsx` - Kanban board

### CRM v2: Speed-to-Lead Features

**Feature 1: WhatsApp Button**
- Green button on lead cards (visible only if phone exists)
- Pre-filled message: `"Hola {first_name}, soy {user}. Recibí tu interés..."`
- `stopPropagation()` prevents modal opening when clicking

**Feature 2: Ghost Detector**
| Age | Visual |
|-----|--------|
| Fresh (<24h) | 🟢 `border-l-emerald-400` + "Nuevo" badge |
| Warning (24-72h) | 🟡 `border-l-amber-400` |
| Cold (>72h) | ⚪ `border-l-slate-300`, 90% opacity |
| Ghost (>7d) | 👻 Ghost icon, grayscale filter, 75% opacity |

**Feature 3: Discovery Auto-Conversion**
- Public booking flow now checks `leads` table by email
- If matching Lead found → auto-converts to Patient with Memory Handover
- "Copy Booking Link" button in LeadDetailSheet pre-fills `?email=&name=`

---

## 2025-12-20: Dynamic Terminology System (v0.9.9.7)

### Practitioner-Aligned UI Labels
Organizations can now choose their preferred terminology:
- **PATIENT** - Clinical/Medical model
- **CLIENT** - Coaching/Business (default)
- **CONSULTANT** - Holistic/Humanist

### The "Participant" Rule
Automatic override to "Participante" in group contexts (retreats, workshops, events).

### UI Integration
Components updated with dynamic `useTerminology()` hook:
- **Sidebar Nav**: Dynamic terminology in main navigation
- **Patients Page**: Header, buttons, empty states, count
- **Dashboard**: Stats card, section headers ("Clientes Totales", "Clientes Recientes")
- **Settings/General**: Terminology selector preview

### Hardcoded Strings Replaced (15+ strings)
- `AletheIAInsightsCard.tsx`: Suggestions, summaries, loading states
- `HelpChatBot.tsx`: Quick action prompts
- `MonitoringTab.tsx`: Empty state messages
- `AletheiaHUD.tsx`: Contact button
- `bookings/page.tsx`: Search placeholder, table headers
- `settings/general/page.tsx`: Admin tool descriptions

### Technical Implementation
- **Backend**: `TerminologyPreference` enum, `Organization.terminology_preference` field
- **Migration**: `7993cb9acf03_add_terminology_preference.py`
- **Frontend Hook**: `useTerminology()` with GROUP context override
- **i18n**: `terminology` namespace in ES/EN messages

### Polish
- Fixed Settings redirect locale preservation (`permanentRedirect`)
- Generic terminology for system-wide consistency

---

## 2025-12-20: ChatBot Polish & Analytics (v0.9.9.6)

### Query Logging Enabled
- **HelpQueryLog** now persists to PostgreSQL via sync session
- Uses `psycopg2-binary` for BackgroundTasks (runs in thread pool)
- Topic auto-detection: billing, patients, forms, bookings, whatsapp, ai, audio

### ChatBot Mobile Hide
- Button hidden on mobile (< 768px) with `hidden md:flex`
- Only visible on tablet and desktop for cleaner mobile UX

### i18n Translations
- **Settings tabs**: Added `Settings.tabs.configuration`, `plan`, `help`
- **Help section**: Added 11 new keys for chatbot UI and 8 chapter labels
- Translations added for both EN and ES locales

---

## 2025-12-19: Therapist Help Center (v0.9.9.5)

### Help Center Architecture
- **Settings 3-Tab Refactor**: Reorganized `/settings` into Configuración, Mi Plan, Ayuda tabs
- **Shared Layout**: New `settings/layout.tsx` with tab navigation and gradient header
- **Clean Redirects**: `/settings` → `/settings/general`

### MDX Documentation System
- **8 Quick Reference Chapters**:
  - primeros-pasos, pacientes, diario-clinico, formularios
  - reservas, automatizaciones, whatsapp, facturacion
- **Dynamic Chapter Pages**: Server-side MDX reading with chapter navigation
- **SSG Enabled**: `generateStaticParams` for pre-built chapter pages

### AI ChatBot (Gemini 2.5 Flash)
- **Backend**: New `HelpAssistant` service with "hallucination zero" directive
- **ThreadPoolExecutor**: Sync Gemini client wrapped for async FastAPI compatibility
- **System Prompt**: Context-aware (user name, tier, current route) with 3-sentence max
- **FREE/UNLIMITED**: No credit consumption, retention infrastructure

### HelpQueryLog Model
- Analytics table for anonymized user queries
- Stores: user_id, org_id, query_text (500 char max), detected_topic, current_route
- Simple keyword-based topic detection: billing, patients, forms, bookings, whatsapp, ai, audio

### Global ChatBot UI
- **Glassmorphism Design**: Deep teal gradient, backdrop-blur, rounded corners
- **Positioned in Dashboard Layout**: Visible on ALL dashboard pages (desktop & tablet)
- **Welcome Message**: Personalized greeting with user's first name
- **Quick Action Chips**: 3 common questions for zero-friction onboarding
- **localStorage History**: Last 20 messages persisted across sessions

### New Endpoints
- `POST /api/v1/help/chat`: Chat with KuraOS AI assistant

### Files Created
- `backend/app/api/v1/help.py` - Chat endpoint
- `backend/app/services/help_assistant.py` - Gemini 2.5 Flash service
- `frontend/components/help/HelpChatBot.tsx` - Global chatbot component
- `frontend/content/help/es/*.mdx` - 8 documentation chapters

---

## 2025-12-18: Demo Day Fixes & Stabilization (v0.9.9.4)

### SendFormModal Authentication Fix
- **Centralized API client**: Migrated from direct `fetch` to `api.forms.listTemplates()` and `api.forms.createAssignment()`
- **Fixed intermittent auth bug**: Button now works on first click (was failing on fresh sessions)
- **WhatsApp message localization**: Spanish/English based on locale

### Audio Recording Stability
- **SilentErrorBoundary component**: Catches benign DOM errors (removeChild) during re-renders
- **isRecordingRef**: Fixed stale closure in MediaRecorder callbacks
- **BubbleMenu fix**: Appended to document.body to prevent DOM conflicts

### Internationalization (i18n)
- New `SendForm` namespace in en.json/es.json with modal translations
- Patient detail tabs translated: "Clinical Journal", "Monitoring", "Bookings"
- AletheIA status banner: "AletheIA is analyzing X entries..."

### Demo Patient Coherence
- Added `stabilization_program` journey for demo patient Javier Roca
- New journey stages: INTAKE → TREATMENT_ACTIVE → CONSOLIDATION → MAINTENANCE → GRADUATED
- Narrative: Patient blocked from retreat but active in stabilization therapy

---

## 2025-12-17: Premium Login & Landing Polish (v0.9.9.3)

### Premium Auth Pages
- **Dark mode design**: Gradient backgrounds (purple/indigo/pink)
- **Glassmorphism cards**: Frosted glass effect with blur
- **Fixed input visibility**: White text on dark backgrounds
- **Brand consistency**: PsychedelicTherapistOS logo with mushroom icon

### Landing Page CTAs
- Fixed locale routing: Buttons now use `next-intl` Link component
- "Empezar Gratis" → `/es/register`, "Login" → `/es/login`
- Added Login button to Navbar

### Branding
- Mushroom/brain logo in dashboard header
- "PsychedelicTherapistOS" without spaces
- Headline without trailing periods

---

## 2025-12-17: Comparison Table & Pitch Slides (v0.9.9.0-v0.9.9.2)

### Pitch Deck v2.0 (v0.9.9.0)
- 5 investor-ready slides at `/pitch`
- Dense feature matrix (Slide 5) with 30+ capabilities
- Embedded screenshots and diagrams

### Landing Comparison Table (v0.9.9.1)
- 16-row feature comparison: TherapistOS vs Excel vs Generic CRM vs Paper
- Accordion toggle for "Ver todas las funcionalidades"
- Checkmarks (✓) and crosses (✗) with color coding

### Functional CTAs (v0.9.9.2)
- All landing page buttons now route correctly
- Pricing cards link to register page

---

## 2025-12-17: Unified Routing & Landing Integration (v0.9.8.5-v0.9.8.9)

### Homepage → Landing (v0.9.8.8)
- Root `/` now shows marketing landing page
- Dashboard moved to `/dashboard` (protected)
- Post-login redirect: `/login` → `/dashboard`

### Unified Routing Architecture (v0.9.8.7)
- All pages under `/[locale]/` for consistent i18n
- Landing page components: Hero, Features, FeaturesGrid, TechSection, Pricing, Footer
- Navbar with language switcher

### Build Fixes (v0.9.8.5-v0.9.8.6)
- Added `layout.tsx` to landing page (html/body root tags)
- TypeScript fixes for strict mode
- Unified styling across landing and dashboard

---

## 2025-12-16: Audio Recording Modes (v0.9.8.3)

### Dual Recording Modes
- **🎙️ Voice Note**: Microphone only (for dictating clinical notes)
- **💻 Meeting Recording**: System audio + Microphone (for Zoom/Meet sessions)
- Dropdown mode selector with visual icons

### Meeting Recording Technical
- `getDisplayMedia` for system audio capture
- `AudioContext` to mix system + mic streams
- Auto-stop when screen share ends
- Warning: "Compartir audio de la pestaña" checkbox required

---

## 2025-12-16: Patient Cockpit & Global Intelligence (v0.9.8.2)

### AletheiaHUD - Clinical Intelligence Cockpit
- **New unified HUD** replacing scattered `AletheIAInsightsCard`
- **Source-agnostic intelligence**: Displays data from WhatsApp, Stagnation flags, or Clinical history
- **Priority hierarchy**:
  1. CRISIS (red): WhatsApp sentiment < -0.3
  2. STAGNATION (orange): Journey blocked/stagnated
  3. INSIGHT (green/violet): Normal WhatsApp analysis
  4. EMPTY (gray): Informative message when no data
- Giant sentiment score with trend indicator (↗↘→)
- Quick actions: Ver Chat Original, Contactar Paciente

### DailyInsightsFeed Redesign
- **Accordion logic**: Cards collapsed by default (Progressive Disclosure)
- **Source icons**: Mic 🎤 for audio, MessageSquare 💬 for text
- **Risk styling**: Red left border + subtle red background for risky days
- **Fake audio player**: Waveform visualization in expanded view
- **Accessibility fix**: High contrast solid backgrounds (no more glassmorphism)

### UX Polish
- TimelineEntry: AI analysis collapsed by default
- Cleaner Clinical Timeline with "Expand" button for details

### Dev Scripts
- `start-dev.sh`: Now launches ngrok for Twilio webhooks
- Auto-displays webhook URL for easy Twilio sandbox configuration
- `stop-dev.sh`: Properly kills ngrok process on shutdown

---

## 2025-12-16: Audio Transcription & Hourly Analysis (v0.9.8.1)

### WhatsApp Audio Transcription
- **OpenAI Whisper Integration**: Audio messages are now automatically transcribed
- `transcription.py`: Downloads audio from Twilio, transcribes with Whisper API
- Webhook detects `NumMedia > 0` and `MediaContentType0 = audio/*`
- Transcribed text stored with `[🎤 AUDIO]:` prefix for visual identification
- Fallback: `[🎤 AUDIO SIN TRANSCRIBIR]` if transcription fails

### Hourly Conversation Analysis
- Changed scheduler from daily (6AM UTC) to **hourly**
- Conversation analyzer now runs every hour for fresher insights
- Admin can still force analysis manually via Settings page

### Admin Tools UI
- New "Admin Tools" section in Settings (superuser only)
- "Forzar Análisis AletheIA" button for immediate analysis execution
- Displays count of analyzed patients in success message

### Environment Configuration Fixes
- `docker-compose.yml`: Changed from `./backend/.env` to `./.env` (root)
- `config.py`: CORS as raw string to avoid pydantic JSON parsing issues
- `main.py`: Manual CORS parsing (accepts comma-separated or JSON array)

---

## 2025-12-16: WhatsApp + AletheIA Integration (v0.9.8)

### Twilio WhatsApp Webhook
- New `POST /webhooks/twilio/whatsapp` endpoint
- Receives incoming WhatsApp messages from Twilio sandbox
- Matches sender phone to patient, stores in MessageLog
- Duplicate message detection via provider_id

### AletheIA Conversation Analyzer
- `conversation_analyzer.py` worker for daily batch analysis
- Aggregates last 24h messages per patient
- Analyzes with Gemini: sentiment, emotional state, risk flags
- Creates `DailyConversationAnalysis` entries

### Dashboard Risk Alerts
- New `/monitoring/risk-alerts` endpoint
- `chat_risk` suggestion type with highest priority (-1)
- Pulsing red border (`animate-pulse`) for critical WhatsApp alerts
- Javier Roca's crisis message appears first in AletheIA Suggestions

### Monitoring Tab
- `SentimentChart.tsx` with 7-day emotional evolution graph
- `DailyInsightsFeed.tsx` with expandable daily analyses
- Conversation messages displayed within each day's analysis

### Tests
- `test_whatsapp_monitoring.py` with 5 tests for monitoring endpoints

---

## 2025-12-15: Stripe Checkout & Subscription Management (v0.9.7)

### Stripe Checkout Sessions
- New `create-checkout-session` endpoint for subscription upgrades
- Redirects user to Stripe-hosted checkout page
- Supports PRO and CENTER tier pricing

### Subscription Portal
- "Gestionar Suscripción" button opens Stripe Customer Portal
- Users can update payment method, view invoices, cancel subscription
- Automatic sync on subscription.updated webhook

### Webhook Improvements
- Handles `checkout.session.completed` for new subscriptions
- Handles `customer.subscription.updated` for plan changes
- Handles `customer.subscription.deleted` for cancellations

### Billing UI
- `/settings/billing` page with current plan details
- Upgrade buttons for each tier
- Monthly revenue display based on tier

---

## 2025-12-14: Patient Journeys & Timeline (v0.9.6)

### Journey Status System
- Added `journey_status` JSONB column to Patient model
- Tracks multiple journeys: DISCOVERY, INTAKE_PENDING, ACTIVE, etc.
- Visual status badges in patient cards

### Clinical Timeline Improvements
- Timeline grouped by date with clear separators
- AI analysis card redesign with model badge
- "Ver más/Ver menos" toggle for long content

### Stale Journey Monitor
- Background job detects journeys stuck >48h
- Creates JOURNEY_STAGE_TIMEOUT events
- Visible in admin dashboard

---

## 2025-12-14: Services & Availability Engine (v0.9.4)

### Service Management
- Full CRUD for therapy services
- Service types: INDIVIDUAL, GROUP, FIXED_DATE
- Duration, price, capacity configuration
- Schedule linking for availability

### Availability System
- Weekly recurring blocks (AvailabilityBlock)
- Time-off exceptions
- Specific date overrides
- Smart slot calculation

### Booking Widget
- 4-step public booking wizard
- Calendar date picker with available slots
- Patient information collection
- Stripe payment integration

---

## 2025-12-16: Premium UI & Real Dashboard Data (v0.9.5)

### SectionHeader Component
- New reusable `SectionHeader.tsx` component
- Gradient icon background, gradient title, descriptive subtitle
- Applied to all 7 main dashboard sections
- Each section has unique color scheme (pink, blue, emerald, orange, teal, violet, indigo)

### Standardized Page Layout
- All pages now use same wrapper: `min-h-screen bg-slate-50 py-8 px-6`
- Same max-width: `max-w-6xl mx-auto`
- Headers appear at exact same position across all sections

### Automations Grid Layout
- Changed from list view to 3-column card grid
- Card design simplified: icon top-left, status badge, footer actions
- "Biblioteca de Automatizaciones" also uses 3-column grid
- Tabs styled like Forms page (bg-slate-200, w-fit, rounded)

### Enhanced Subtitles
- Every section now has descriptive subtitle explaining capabilities
- Helps users understand what each section offers at a glance

### Dashboard Real Data
- Fixed patient count (was showing slice length, now shows totalPatients)
- Forms stats now fetched from API (totalForms, activeForms)
- New "Formularios" stat card replacing hardcoded demo data
- `Promise.allSettled` for resilient API calls
- Error banner with debugging info when APIs fail
- Console logging for troubleshooting session issues

### Tier-Based Form Editor
- BUILDER: Only toggle active/publish
- PRO: Edit config (title, description)
- CENTER: Edit schema/fields
- Backend validation enforces restrictions
- New duplicate endpoint: `POST /forms/{id}/duplicate`

---


## 2025-12-14: Playbook Marketplace (v0.9.3)

### Automation Rules Model
- New `AutomationRule` table for configurable playbooks
- `is_system_template` flag distinguishes marketplace vs org rules
- `conditions` (JSONB) for rule matching logic
- `actions` (JSONB) for execution steps
- `cloned_from_id` for tracking template provenance

### Playbook Marketplace UI
- New `/settings/automations` page with two tabs
- "Mis Automatizaciones": Toggle ON/OFF, delete rules
- "Marketplace": Browse and install system templates
- Visual workflow steps display (Si/→ format)
- IconRenderer component for dynamic Lucide icons
- "Solicitar Playbook" card for feature requests

### Pre-configured Playbooks
- 🛡️ **Escudo de Seguridad**: Block high-risk patients + alert therapist
- 💸 **Cobrador Automático**: 48h payment reminder email
- ❤️ **Fidelización Post-Retiro**: 7-day satisfaction survey

### API Endpoints
- `GET /automations/rules` - List org's active rules
- `GET /automations/marketplace` - List system templates
- `POST /automations/rules/install/{id}` - Clone template to org
- `PATCH /automations/rules/{id}` - Toggle ON/OFF
- `DELETE /automations/rules/{id}` - Remove rule

### Performance
- Optimized IconRenderer with curated icon registry (15 vs ~1000 icons)
- Faster frontend compilation in development mode

---

## 2025-12-14: The Orchestrator (v0.9.2)

### Journey Formalization
- `JourneyTemplate` model for configurable journeys
- `JourneyLog` model for audit trail of state changes
- Automatic logging on every journey status update

### Temporal Engine
- APScheduler integration in FastAPI lifespan
- `stale_journey_monitor.py` with 48h/72h timeout rules
- `/admin/trigger-cron` endpoint for demos

### Clinical Triggers
- `risk_detector.py` with keyword matching
- `RISK_DETECTED_IN_NOTE` event on SESSION_NOTE creation
- `JOURNEY_STAGE_TIMEOUT` event for stale journeys

### New Files
- `automation_types.py`, `automation_engine.py`
- Migration: `cddc5420ce9d`

---

## 2025-12-14: Investor Demo & Polish (v0.9.1)

### Main Dashboard (Command Center)
- **Dashboard Page** (`/dashboard`)
  - Quick stats: Total patients, Active journeys, Upcoming bookings, AI credits
  - "Próximos 7 Días" section with upcoming appointments
  - Patient action cards with journey status
- Moved to `/dashboard` route
- Logo now links to dashboard

### AletheIA Insights Engine
- **AI-Powered Patient Analysis**
  - New `/insights/patient/{id}` endpoint with Gemini integration
  - Asynchronous processing with `asyncio.to_thread()` (non-blocking)
  - 1-hour intelligent caching in database
  - Refresh button with spinning animation
  - Premium card display with AI insights

---

## 2025-12-14: UX Improvements + Bookings Page (v0.8.6)

### Header Redesign
- New gradient logo (indigo/purple/pink) with Sparkles icon
- Reordered menu: Pacientes → Reservas → Calendarios → Servicios → Formularios
- Active state indicator (indigo background + border)
- User dropdown on hover with profile, credits, settings, logout

### Dedicated Bookings Page
- New `/bookings` route with tabbed view (future/past)
- Search filter by patient or service
- Status filter (Confirmed, Pending, Cancelled, Completed)
- Actions dropdown: Confirm, Complete, Cancel, Delete
- Patient name links to profile
- Visual calendar view (react-big-calendar) below list

### Google Calendar UI Reorganization
- Settings simplified: clean connect/disconnect buttons
- Calendar page: New "Google Calendar" card for blocking configuration
- Services modal: Booking destination calendar selector
- Fixed card colors: Specific Dates = green, Google Cal = red

### Google Calendar Backend (Full Sync)
- **Read (FreeBusy):** `slots.py` now queries Google Calendar API when calculating availability
  - Busy times from selected blocking calendars block those slots
  - Graceful fallback if Google API fails
- **Write (Events):** `payments.py` webhook creates Google Calendar event on booking confirmation
  - Event includes service title, patient name, and attendee email
  - Stores `google_calendar_event_id` in Booking model for future updates
- New `app/services/google_calendar.py` service layer with token refresh logic

### Backend
- Added `DELETE /booking/{id}` endpoint
- Fixed timezone comparison bug in token expiry check

### Timezone Architecture (UTC Sandwich Pattern)
- **Phase 1 - API Validation:** New `app/core/validators.py` with `ISODateTimeWithTZ`
  - Rejects naive datetimes (requires Z or +HH:MM offset)
- **Phase 2 - Wall Clock Pattern:** New `target_timezone` column on Booking
  - Stores IANA timezone (e.g., `America/Mexico_City`) for DST protection
- **Phase 3 - Frontend Utilities:** New `utils/datetime.ts`
  - `getUserTimezone()`, `formatLocalDateTime()`, `toISOWithTimezone()`
  - Booking wizard now sends `target_timezone` in API requests

---
## 2025-12-12: Multi-Calendar Availability (v0.8.5)

### Multiple Schedules
- New `AvailabilitySchedule` model (name, is_default)
- CRUD API: `/schedules/` (list, create, update, delete, set-default)
- Each user can have multiple named schedules

### Schedule-Linked Availability
- `schedule_id` on AvailabilityBlock (required)
- `schedule_id` on TimeOff and SpecificAvailability (optional)
- NULL schedule_id = applies to ALL schedules

### Service Integration
- Services can be linked to specific schedules
- FIXED_DATE services bypass recurring availability

---
## 2025-12-12: Bookings Visibility + UI Polish (v0.8.4)


### Booking List API
- Implemented `GET /booking/` with filters: service_id, patient_id, status, dates
- Added `PATCH /booking/{id}/status` for confirming/cancelling bookings

### Frontend Integration
- **Services Page**: "View Bookings" button opens modal
- **Patient Profile**: "Reservas (N)" section
- **Calendar UX Redesign**: Dual tabs (Availability/Bookings), 3 management cards

### Navigation & i18n
- Removed "Configuración" from menu, username links to /settings
- Language switcher as dropdown (no flags)
- Added Català locale (es, en, ca)
- Internationalized Forms and Services pages

---
## 2025-12-12: Group Booking (v0.8.3)

### Specific Availability
- New `SpecificAvailability` model for one-off date overrides
- CRUD API: GET/POST/DELETE `/availability/specific`
- Settings UI panel to add/remove specific availability blocks

### Group Session Capacity
- `ServiceType.capacity` field (default=1)
- Booking wizard shows "X spots left" for group services
- Transactional locking (`SELECT ... FOR UPDATE`) prevents overbooking

---
## 2025-12-12: Automation & DevEx (v0.8.2)

### Development Automation
- **Automated Startup Scripts**:
    - `scripts/start-dev.sh`: One-command startup for all services + Stripe webhook
    - `scripts/stop-dev.sh`: Clean shutdown of all services
- **Docker Compose Enhancement**:
    - Added `stripe-webhook` service for automatic webhook forwarding
    - Simplified local development workflow

### E2E Test Improvements
- Fixed E2E test to check URL instead of page title (more reliable)
- Added `/book/` route to public routes in middleware
- Added `data-testid` attributes to booking form inputs
- E2E test results: 4/5 passing (80% success rate)

### Documentation
- Updated README with new startup scripts
- Added Stripe CLI prerequisite documentation
- Improved environment setup instructions

---
## 2025-12-12: The Shield (v0.8.1)

### Test Suite Implementation
- **Backend Unit Tests** (`pytest`):
    - `test_slots.py`: 16 tests covering SlotService (overlap logic, slot generation, filtering)
    - `test_webhooks.py`: 5 tests covering payment webhooks (success, failure, signature verification)
- **E2E Tests** (Playwright):
    - Added `playwright.config.ts` for Chromium-based testing
    - Created `booking-flow.spec.ts` skeleton for full booking journey tests
    - Added `test:e2e` and `test:e2e:ui` scripts to package.json

### Concurrency Protection (Slot Locking)
- Implemented `SELECT ... FOR UPDATE` with `nowait` in `create_public_booking`
- Prevents double-booking race conditions when two users select same slot
- Returns `409 Conflict` with user-friendly message on race condition

---
## 2025-12-12: The Box Office (v0.8.0)

### Phase 4: Payments & Monetization
- **Stripe Integration**:
    - Backend: `POST /create-payment-intent` creates intent from booking.
    - Webhooks: `payment_intent.succeeded` confirms booking, `payment_intent.failed` cancels it.
    - Frontend: 4-step Booking Wizard with embedded Stripe Payment Element.
    - Currency support: EUR (extensible).
    - Security: Keys moved to `.env` variables.

### Booking System Core
- **Public Booking Interface**:
    - `/book/[therapist_id]` wizard with service selection and calendar picker.
    - Smart slot generation based on `AvailabilityBlock` (recurring) and `TimeOff` exceptions.
    - Logic: `(Availability - (Bookings + TimeOff)) = Slots`
- **Slot Management**:
    - Fixed infinite slot recursion bug.
    - Added "pending booking" slot reservation logic.
    - Auto-cancellation of PENDING booking when user navigates back from payment step.

### Transactional Emails (Brevo)
- Integrated Brevo (Sendinblue) SDK for transactional emails.
- Beautiful HTML email template for booking confirmations.
- Triggers automatically via Stripe webhook on successful payment.
- Includes service details, date/time, amount paid, and booking reference.

### UI Improvements
- **Booking Wizard**:
    - 4-step progress indicator.
    - Dynamic step count (skips payment step for free services).
    - Summary card with price display.
    - Confirmation page with full booking details.
- **Global Styling**:
    - Improved input/select text contrast for better readability (slate-800).

### Bug Fixes
- Fixed `[object Object]` error in Service creation toast.
- Fixed Patient creation `TypeError` (split `full_name` into first/last).
- Fixed timezone comparison crash in slot generation (naive vs aware datetimes).
- Fixed slot blocking issue where user's own pending booking blocked the slot.

---
## 2025-12-11: Rich Text Editor & Notion-like Experience (v0.7.6)

### Rich Text Editing (TipTap)
- Created `RichTextEditor.tsx` component with TipTap 2.27.1
- Floating BubbleMenu on text selection (Bold, Italic, H2, List)
- Markdown shortcuts support (`#` for headings, `-` for lists, `**bold**`)
- Created `MarkdownRenderer.tsx` for read-only display of AI outputs

### Integration Points
- Form Builder: Template description field
- Composer: Clinical notes input
- TimelineEntry: Note editing, AI analysis editing

### CSS Architecture
- Added comprehensive TipTap/ProseMirror styles to `globals.css`
- Headings (h1-h3), paragraphs, lists, bold, italic, blockquotes, code
- Accessible text contrast (WCAG compliant)
- Selection styling (blue-200 background)

### Dependencies Added
- `@tiptap/react@^2.27.1`
- `@tiptap/starter-kit@^2.27.1`
- `@tiptap/extension-bubble-menu@^2.27.1`
- `@tiptap/extension-link@^2.27.1`
- `@tiptap/extension-placeholder@^2.27.1`
- `tiptap-markdown@^0.8.10`

---

## 2025-12-11: UI/UX Polish Sprint (v0.7.5)

### New UI Components
- `ElevatedCard.tsx` - Consistent card styling with elevation
- `Skeleton.tsx` - Loading skeleton component
- `EmptyState.tsx` - Empty state with icon and CTA

### FormRenderer Mobile Enhancements
- Conditional progress bar for multi-step forms
- 16px fonts for mobile readability
- Larger touch targets (44px minimum)
- Auto-growing textareas

### Backend Architecture
- Added extensible `config` (JSONB) column to FormTemplate model
- Journey rules support: "Requires 1:1 Screening" toggle

### Form Builder Settings
- New "Journey Rules" section in settings tab
- Toggle for pre-retreat screening requirement

---

## 2025-12-11: Bug Fixes & Polish (v0.7.4)

### Critical Fixes
- `import secrets` missing in forms.py caused publish endpoint to fail
- `author_id` NOT NULL in clinical_entries prevented public form submissions
- ClinicalEntryResponse schema missing Optional author_id broke patient view
- FormTemplateResponse missing `public_token` caused forms list to show "Not published"

### Form Submission UX
- Added FORM_SUBMISSION translation to entryTypes (en/es)
- Added expandable form answers in TimelineEntry component
- Click form title to toggle answers visibility
- Shows risk level with color coding

### Polish
- Replaced QR button emoji with proper SVG icon

---

## 2025-12-10: UX/UI Polish Phase (v0.7.3)

### Patient Profile Safety
- Removed red Delete button from header (safety net)
- Moved Delete action to "Danger Zone" section in Edit page
- Added Quick Actions row: Email, Call, WhatsApp chips (clickable)

### Patient List Enhancement
- PatientCards now show colorful initials avatar (color from name hash)
- Added "Active" status badge
- Improved hover effects with shadow

### AI Analysis Typography
- AI analysis blocks now have prose-like styling
- Light gray background with purple left border
- Better text contrast and line height

---

## 2025-12-10: Frictionless Sharing UX Boost (v0.7.2)

### Magic Links
- Form assignment links include prefill params: `?prefill_name=X&prefill_email=Y`
- FormRenderer accepts initialValues prop for auto-population

### WhatsApp Integration
- "Send via WhatsApp" button in SendFormModal
- Opens wa.me with pre-composed message and form link

### QR Code Sharing
- QR button on each published form card
- Modal displays scannable QR code (via api.qrserver.com)

### Non-Admin Template Editing
- Backend: GET/PUT /templates/{id}, POST /templates/{id}/publish
- Frontend: New /forms/{id}/edit page for therapists

---

## 2025-12-10: Therapist UI Bridge (v0.7.1)

### Forms Dashboard Page
- New page at `/forms` with two tabs
- "My Forms": Organization templates with Copy Link, View Submissions, Settings
- "Template Library": System templates with Clone button

### Send Form Modal
- Integrated into Patient Profile header
- Dropdown to select active form
- Generates unique assignment link with Copy button

### Submissions View
- New page at `/forms/{id}/submissions`
- Table showing patient name, status, date
- Click row to navigate to patient profile

### Backend
- New endpoint: GET /forms/assignments/template/{template_id}
- Returns all assignments for a template with patient info

### Navigation
- Added "Forms" link to main dashboard nav
- Translations added for EN/ES

---

## 2025-12-10: Forms & Validation System (v0.7.0)

### Form Template System
- FormTemplate model with therapy type, risk level, service mode
- FormField model with 6 field types: text, email, textarea, boolean, scale, emotion_multi
- Required field validation in backend and frontend

### Public Form Rendering
- FormRenderer component with multi-step layout
- Real-time validation with error highlighting
- Two public routes: /f/{token} (assigned), /f/public/{token} (lead gen)

### Form Assignments
- Assign forms to patients with unique tokens
- Track completion status
- Create clinical entries on submission

### Template Cloning
- Clone system templates to organization
- Copies all fields and configuration
- Adds "(Copy)" suffix to title

---

## 2025-12-10: UI Polish & Credit Refinements (v0.6.2)

### Languages
- Added Catalan (CA) to patient language options

### Admin Panel
- Fixed text contrast in inputs (text-slate-800 for readability)
- AI_MODEL setting now uses dropdown with current Gemini models
- Available models: gemini-3-pro-preview, 2.5-flash, 2.5-pro, 2.5-flash-lite, 2.0-flash, 2.0-flash-lite

### Patient Detail Page
- Added previous/next patient navigation buttons with chevron icons
- Quick navigation between patients without returning to list

### UI Consistency
- Replaced all emoji icons with SVG icons in Composer, AudioRecorder, PhotoCapture
- Unified icon style across the application

### Credit System
- Separated credit costs by entry type:
  - Text notes: 5 credits (AI_COST_TEXT)
  - Images: 5 credits (AI_COST_IMAGE)
  - Live audio recording: 10 credits (AI_COST_AUDIO_LIVE)
  - Uploaded audio file: 20 credits (AI_COST_AUDIO_FILE)
- Backend detects entry type based on metadata (filename prefix, content_type)
- New system settings added to database

---

## 2024-12-10: Governance UI (v0.6.1)

### Frontend - Admin Panel
- **Admin Page** (`/admin`) with superuser protection
- System Settings table with inline JSON editing
- Organization Manager with tier dropdown and +Credits button
- Patient count display per organization

### Frontend - Settings Page
- Complete redesign with premium gradient cards
- Profile section with user avatar, email, name, role
- Subscription card with credits counter and progress bar
- AI Output Language preference (Auto/Spanish/English)
- Interface Language selector (ES/EN)
- Save Preferences functionality

### Frontend - Patient Forms
- Added Primary Language dropdown to new/edit forms
- Top 20 languages list for therapy context

### Frontend - Dashboard Header
- CreditsDisplay component showing available credits
- Tooltip with breakdown (monthly/quota/purchased/tier)
- Visual warning state when credits ≤ 10

### Backend Updates
- `GET /auth/me/credits` - Returns organization credit balance
- `is_superuser` field added to UserResponse schema
- `language` field added to Patient interface

### Translations
- 30+ new keys in en.json and es.json for Settings page

---

## 2024-12-10: Governance & Commercial Architecture (v0.6.0)

### Database Schema
- **Organization**: Added `tier` (enum), `ai_credits_monthly_quota`, `ai_credits_purchased`, `ai_credits_used_this_month`, `credits_reset_at`, `settings` (JSONB)
- **User**: Added `is_superuser`, `locale`, `ai_output_preference` (enum)
- **Patient**: Added `language`
- **NEW SystemSetting**: Key-value store for dynamic config (prompts, limits)
- **NEW AiUsageLog**: Credit consumption ledger

### Business Logic
- Patient limit check (403 for FREE tier >= limit)
- Credit deduction (monthly quota first, then purchased)
- 402 Payment Required when credits exhausted
- Usage logging for each AI analysis

### Admin API (`/api/v1/admin`)
- **SuperUser guard**: All endpoints require `is_superuser=True`
- `GET/PATCH /settings` - Manage system settings
- `GET/PATCH /organizations` - Manage orgs (tier, quota)
- `POST /organizations/{id}/add-credits` - Add purchased credits

### Seed Data
- FREE_PATIENT_LIMIT: 5
- FREE_CREDITS_MONTHLY: 100
- PRO_CREDITS_MONTHLY: 500
- AI_COST_TEXT: 1
- AI_COST_MULTIMODAL: 5
- AI_MODEL: gemini-2.5-flash

---

## 2024-12-10: Async AI Analysis & Full-Context Audio (v0.5.5)

### Backend - Async Processing
- Added `ProcessingStatus` enum (IDLE, PENDING, PROCESSING, COMPLETED, FAILED)
- Added `processing_status` and `processing_error` columns to ClinicalEntry
- Refactored `/analyze` endpoint to return 202 Accepted
- Background task with independent DB session (FastAPI BackgroundTasks)
- Alembic migration: `407cec59ed8d`

### Backend - Audio Prompt Engineering
- New synthesis-focused prompt (not verbatim transcription)
- Full session coverage: Opening → Main themes → Closing
- Chronological key moments timeline
- Risk assessment section with explicit flags
- Only 2-4 selective verbatim quotes
- Follow-up recommendations for therapist

### Frontend - Polling & Status Display
- Polling effect (5s interval) while PENDING/PROCESSING
- Animated status badge ("En cola...", "Analizando...")
- Error indicator for FAILED status
- IA button hidden during processing

### Frontend - Editing Features
- Inline editing for SESSION_NOTE entries
- Inline editing for saved AI analyses
- Model name badge on each analysis (e.g., "gemini-2.5-flash")

---

## 2024-12-09: AI Observatory & Multimedia (v0.5.0)

### Frontend - AI Analysis
- Added AI analysis button to each `TimelineEntry`
- Multiple analyses per entry (stored in `ai_analyses` array)
- Each analysis: `{ id, text, date }`
- Save/Delete buttons for each analysis (centered UI)
- Expandable/collapsible analysis section

### Frontend - Multimedia Input
- Created `AudioRecorder.tsx` - MediaRecorder API with timer
- Created `PhotoCapture.tsx` - getUserMedia with fullscreen camera
- Integrated into `Composer` component (4 input types: note, file, audio, photo)

### Frontend - UI/UX Improvements
- `TimelineEntry` redesign with Material Design SVG icons
- Color-coded entry type badges (blue/amber/slate/purple/green)
- 10-line content truncation with "Ver más" / "Ver menos"
- `LanguageSwitcher.tsx` component in dashboard header

### Frontend - Internationalization
- Fixed next-intl v4.x: `requestLocale` instead of deprecated `locale`
- Full i18n coverage for all patient/clinical UI
- 30+ new translation keys (EN/ES)

### Bug Fixes
- Fixed camera video not displaying (useEffect for srcObject)
- Fixed language switcher not updating UI content

---

## 2024-12-09: Clinical Journal (v0.4.0)

### Backend (FastAPI)
- Created `ClinicalEntry` model with JSONB `entry_metadata`
- Added `EntryType` enum: SESSION_NOTE, AUDIO, DOCUMENT, AI_ANALYSIS, ASSESSMENT
- CRUD endpoints: POST, GET by patient, PATCH, DELETE
- File upload endpoint with StaticFiles serving
- Alembic migration for `clinical_entries` table

### Frontend (Next.js)
- Created `TimelineEntry` component with icons per entry type
- Created `Composer` component for notes and file uploads
- Refactored patient detail page with clinical timeline
- Auto-redirect to login on 401 session expiry
- Fixed patient list persistence when navigating back

### Bug Fixes
- Fixed static file URLs to use full backend URL
- Fixed 401 redirect loop on auth pages

---

## 2024-12-09: Patient Management (v0.3.0)

### Backend (FastAPI)
- Full CRUD endpoints for patients with multi-tenant filtering
- `GET /patients` - List with search and pagination
- `POST /patients` - Create patient
- `GET /patients/{id}` - Get detail
- `PUT /patients/{id}` - Update patient
- `DELETE /patients/{id}` - Delete patient
- Added `patient_schemas.py` with Pydantic models

### Frontend (Next.js)
- `/patients` - List page with search and patient cards
- `/patients/new` - Create patient form
- `/patients/{id}` - Patient detail view with delete
- `/patients/{id}/edit` - Edit patient form
- Empty state when no patients

---

## 2024-12-09: Identity & Persistence (v0.2.0)

### Database & Migrations
- Configured Alembic for async SQLAlchemy migrations
- Generated initial migration: `organizations`, `users`, `patients`, `events`, `attendees`
- Successfully applied migration to PostgreSQL (6 tables created)

### Backend Authentication
- Implemented JWT authentication with **httpOnly cookies** (XSS protection)
- Created `POST /api/v1/auth/register` - Creates Organization + Owner User
- Created `POST /api/v1/auth/login` - Validates credentials, sets JWT cookie
- Created `POST /api/v1/auth/logout` - Clears JWT cookie
- Created `GET /api/v1/auth/me` - Returns current user from token
- Added `deps.py` with `get_current_user` dependency for protected routes
- Added `schemas.py` with Pydantic models for auth requests/responses
- Fixed bcrypt compatibility (pinned to v4.0.1 for passlib support)

### Frontend Authentication
- Created `lib/api.ts` - API client with `credentials: 'include'` for cookies
- Created `context/auth-context.tsx` - React context for auth state management
- Created `types/auth.ts` - TypeScript interfaces for User, Organization, etc.
- Updated Login/Register pages with working forms connected to backend
- Added Sign Out button to dashboard navigation

### Internationalization (next-intl)
- Created `i18n/navigation.ts` with `createNavigation` for locale-aware routing
- All navigation now uses next-intl's `Link` and `useRouter` (auto locale prefix)
- Updated middleware to use centralized locale configuration
- Protected routes redirect to localized login (e.g., `/en/login`, `/es/login`)

### Infrastructure
- Fixed `NEXT_PUBLIC_API_URL` in docker-compose.yml (added `/api/v1` path)
- Removed obsolete `version: '3.8'` from docker-compose.yml
- Created `.env.example` with all required environment variables
- Added `.gitignore` to protect secrets

### Bug Fixes
- Fixed login/register redirect to use next-intl router (locale-aware)
- Fixed locale extraction (use `usePathname` → `createNavigation`)
- Fixed dashboard navigation links to use next-intl `Link` component

### Testing
- Added `tests/conftest.py` with async pytest fixtures
- Added `tests/test_auth.py` with 10 authentication tests
- Added `pytest.ini` configuration

---

## 2024-12-09: Project Initialization (v0.1.0)

### Infrastructure
- Created monorepo structure with `/backend` and `/frontend` directories
- Added `docker-compose.yml` for local development (backend, frontend, postgres)
- Added `.github/workflows` directory for future CI/CD

### Backend (FastAPI)
- Created core modules: `config.py`, `security.py`, `logging.py`
- Created async SQLAlchemy database layer with models:
  - `Organization` (multi-tenant, with referral system)
  - `User` (roles: OWNER, THERAPIST, ASSISTANT)
  - `Patient` (the "Soul Record")
  - `Event` (group events with capacity)
  - `Attendee` (links patients to events)
- Created API v1 route stubs: auth, patients, booking, events, forms, analysis, growth
- Added Dockerfile for containerization

### Frontend (Next.js 14)
- Initialized Next.js with App Router and TypeScript
- Configured `next-intl` for i18n (EN/ES support)
- Set up TailwindCSS with Shadcn/UI utilities
- Created `[locale]` routing structure:
  - `(auth)`: login, register pages
  - `(dashboard)`: patients, calendar, observatory, settings
