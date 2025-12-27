# KURA OS - Strategic Roadmap

> **Vision:** To become the operating system for the next generation of mental health, starting with Conscious Practitioners.

---

## ✅ Completed: v1.0.0 Public Launch (December 2025)

**Status:** 🎉 LIVE at https://app.kuraos.ai

### Core Platform
- [x] JWT authentication with shared domain cookies
- [x] Multi-tenant organizations (SOLO/TEAM)
- [x] Patient CRM with clinical journey tracking
- [x] Clinical entries with AI analysis (AletheIA)

### Booking & Payments
- [x] Service management (1:1 + Group)
- [x] Availability schedules with overrides
- [x] Public booking page
- [x] Stripe checkout + webhooks

### Automation & AI
- [x] Clinical AI Agents (Playbook system)
- [x] Human-in-the-loop draft mode
- [x] Daily audio briefing (Gemini + TTS)
- [x] Help Center ChatBot (Gemini 2.5 Flash)

### Lead CRM
- [x] Kanban board with drag-drop
- [x] Speed-to-lead (WhatsApp, Ghost Detector)
- [x] Auto-conversion to patients

---

## ✅ Completed: v1.0.2 The Black Box (December 2025)

### Infrastructure
- [x] Automated PostgreSQL backups (every 6h, 7-day retention)
- [x] Admin panel Backups tab (create/restore/download/delete)
- [x] Nuclear confirmation modal for restore operations
- [x] Cascade delete for pending_actions when leads deleted

### Documentation
- [x] ADR-005 to ADR-009: Fidelization Stack roadmap
- [x] ROADMAP_PROPOSAL_v1.1.md consolidated

---

## ✅ Completed: v1.0.3 Cyber-Clinical UI (December 2025)

### Design System - The Zinc Protocol
- [x] `next-themes` for dark/light mode switching
- [x] `ThemeProvider` and `ThemeToggle` components
- [x] `CyberCard` universal container component
- [x] Semantic CSS variables in Tailwind v4

### Layout Architecture - Trinity Navigation
- [x] 3-column HUD shell (TrinityNav + Main + AI Rail)
- [x] Dashboard Bento Grid (12-column layout)
- [x] Agentes menu item in navigation footer

### Page-Level Refactors
- [x] Dashboard, CRM/Leads, Patients, Patient Detail
- [x] Calendar, Services, Forms
- [x] Dark mode support across all pages

---

## ✅ Completed: v1.0.4 Theme Engine (December 2025)

### Design System - Bimodal Identity
- [x] Real-time Theme Editor with live preview
- [x] Dark/Light dual tabs with `next-themes` integration
- [x] HSL color picker with semantic token mapping
- [x] Persistence to PostgreSQL via `user_preferences` JSONB
- [x] ThemeHydration with CSS injection for `:root` and `.dark`

### Typography System
- [x] Type Scale classes: `type-h1`, `type-h2`, `type-body`, `type-ui`
- [x] Font family separation: Playfair (editorial), Space Grotesk (UI), Inter (body)

---

## ✅ Completed: v1.1.0 THE COMMAND CENTER (December 2025)

**Status:** 🎉 LIVE - Dashboard Revolution

### Dashboard 3.0 "The WOOOOOW Layout"
- [x] Ghost Briefing Header: Minimalist "Zero-Box" design
- [x] Clinical-First Grid: Sessions + Journeys at top priority
- [x] FocusSessionCard: Active/Free states for prioritized clinical action
- [x] PipelineVelocity: CRM funnel visualization in tactical sidebar
- [x] ActiveJourneysWidget: Mini-Boarding Pass priority queue
- [x] VitalSignCard: Metrics with live trend indicators

---

## ✅ Completed: v1.1.1 INTELLIGENCE ENGINE (December 2025)

### Multi-Model AI Infrastructure
- [x] ProviderFactory: Smart routing for Gemini (Phase 1), Claude/Llama (Phase 3)
- [x] CostLedger: Real token-based cost calculation with configurable margin
- [x] AI Governance Admin Panel: Financial HUD, Model Registry, Activity Ledger
- [x] Clean Ledger Refactor: No legacy `google.generativeai` in clinical flow

---

## ✅ Completed: v1.0.12 Neural Flow UI (December 2025)

### Agent Detail - Circuit Board Visualization
- [x] Neural Flow Pattern: Visual "Circuit Board" with connected nodes
- [x] Glass KPI Cards: Backdrop-blur with `font-mono` metrics
- [x] Semantic Nodes: Trigger (purple) → Condition (orange) → Action (green)
- [x] Logic & Flows: Added to Design System Playground (v1.0.12.1)

---

## ✅ Completed: v1.0.10 Journey Cards 2.0 (December 2025)

### Clinical Views - Action-Oriented
- [x] Journey Overhaul: Static progress bars → Boarding Pass style
- [x] Dynamic Actions: Context-aware buttons for interventions
- [x] Smart Timelines: Semantic icon-nodes for journey scannability

---

## ✅ Completed: v1.0.9 Clinical Roster (December 2025)

### High-Density Patient Table
- [x] Refactored Patient List from grid cards to high-density table
- [x] Health Dots: AletheIA risk indicators in list views
- [x] Semantic Badges: Standardized status pills

---

## ✅ Completed: v1.0.8 Design System (December 2025)

### Visual Bible & Tactile Architecture
- [x] Design System Playground: `/design-system` Kitchen Sink
- [x] Tactile UI Layer: `active:scale-95` micro-interactions
- [x] Glass Cards: `backdrop-blur-sm`, `bg-card/80`
- [x] Premium Buttons: Shadow glow and lift effects

---

## ✅ Completed: v1.0.7 The Clean Room (December 2025)

### Privacy & Intellectual Property
- [x] The Incinerator: GCS Lifecycle for 30-day audio deletion
- [x] The Vault: `anonymous_datasets` orphan table for legal IP storage
- [x] The Scrubber: BackgroundTask sanitization service

---

## ✅ Completed: v1.0.6 Security & Governance (December 2025)

### HIPAA/GDPR Hardening
- [x] Log Sanitization: PII removed from Twilio/Transcription logs
- [x] Data Segregation: Clinical form answers to structured JSONB
- [x] Strict Schema: Pydantic models with `extra="ignore"`

---

## ✅ Completed: v1.0.5 AletheIA Observatory (December 2025)

### AletheIA Intelligence Rail
- [x] Patient Mode: Risk score, themes, flags, engagement when viewing a patient
- [x] Global Mode (Clinic Radar): Risk monitor, pending actions, system health
- [x] Zustand patient store for global clinical context
- [x] Collapsible sidebar (64px → 12px vertical tab)

### Dashboard Redesign - The Operational Cockpit
- [x] 12-column grid layout
- [x] Hero: Daily Briefing audio player
- [x] Vital Signs: Revenue, Leads, Active Patients cards
- [x] DayAgenda: Smart list (booked + 1 available, beautiful empty state)
- [x] QuickNote: Post-it style with localStorage persistence
- [x] RecentPatients: localStorage tracking

### UI Harmonization
- [x] TrinityNav: collapsible sections, semantic `type-ui` headers
- [x] Strict compliance: no hardcoded `text-[Xpx]` or `bg-[#...]`

---

## 📅 Q1 2026: Growth & Polish

**Goal:** First 50 paying organizations

### Product Improvements
- [ ] **Dashboard Data Wiring**: Connect v1.1.0 components to real APIs (see TECH_DEBT.md)
  - PipelineVelocity → Lead counts by nurture_status
  - ActiveJourneysWidget → /journeys/active endpoint
  - VitalSignCard trends → Booking aggregations
  - FocusSessionCard → Aletheia patient insights
- [ ] **Impact Index**: Clinical correlation dashboard (Investor-Ready)
  - Dual-axis chart: Sessions (activity) vs Wellness Score (outcomes)
  - Narrative: "Your interventions correlate with X% improvement"
  - Requires: Historical Aletheia scores per patient
- [ ] **Lifecycle Megamenu**: Reorganize navigation into 3 pillars (Captación → Clínica → Inteligencia) with Shadcn NavigationMenu
- [ ] **Google OAuth**: One-click login with Google
- [ ] **WhatsApp Business API**: Native Meta Cloud API (replace Twilio)
- [ ] **Form Analytics**: Completion rates, drop-off points
- [ ] **Patient Portal**: Self-service for clients

### Growth Engine: "The Mycelium Protocol" 🍄
- [ ] **Referral Engine MVP**: `referral_code` + `referred_by` in Organization, signup with `?ref=` param
- [ ] **Karma Credits**: Reward referrers with AletheIA credits (not cash) for activations
- [ ] **"Powered By" Attribution**: Footer links on Sanctuary Pages, Booking, Emails with 90-day cookie
- [ ] **Referral Dashboard**: "Tu enlace de invitación" + stats + WhatsApp/LinkedIn share buttons
- [ ] **Self-Service Onboarding**: Guided setup wizard
- [ ] **Demo Mode UI**: Dashboard button to seed demo data for new orgs/investors

---

## 🚀 Q2-Q3 2026: Scale (The "500" Goal)

**Goal:** 500 active therapist users by EOY 2025


### Enterprise Features (B2B)
- [ ] **KURA Business (Admin Dashboard)**: Separate app (`admin.kuraos.ai`) for superadmin control.
- [ ] **Team Management**: Invite therapists to organization
- [ ] **Advanced RBAC**: Granular permissions

- [ ] **Audit Logs**: HIPAA/GDPR compliant activity tracking
- [ ] **API for Developers**: Public REST API

### Mobile Experience
- [ ] **React Native App**: iOS + Android
- [ ] **Push Notifications**: Booking reminders, risk alerts
- [ ] **Offline Mode**: View patient data without internet

---

## 🔮 2026: Horizontal Expansion

**Goal:** Enter broader Mental Health & Medical markets

### New Verticals
- [ ] **Psychology**: CBT, DBT, Psychoanalysis adaptations
- [ ] **Psychiatry**: EHR integration, e-prescription support
- [ ] **Coaching**: Business coaching, life coaching

### AI Co-Pilot
- [ ] **Real-time Suggestions**: During-session therapeutic prompts
- [ ] **Transcription**: Live session transcription
- [ ] **Auto-Documentation**: AI-generated session notes

### Global Expansion
- [ ] **LATAM**: Spanish-speaking markets
- [ ] **US**: HIPAA compliance, insurance billing
- [ ] **EU**: Full GDPR compliance, multilingual

---

## 🏆 Success Metrics

| Metric | Q1 2026 | Q4 2026 | 2027 |
|--------|---------|---------|------|
| Active Organizations | 50 | 500 | 2,000 |
| Monthly Active Users | 100 | 1,000 | 5,000 |
| MRR | $2,500 | $25,000 | $100,000 |
| Patient Records | 1,000 | 25,000 | 100,000 |

---

## 📐 Architecture Decision Records

> Future-looking technical proposals that are **documented but deferred** until market validation.

- [ADR-001: Database v2.0](./docs/adr/ADR-001-database-v2-proposal.md) — Hybrid Ledger, Row Level Security (RLS), Biomarkers Schema
- [ADR-002: Design System](./docs/adr/ADR-002-design-system-proposal.md) — Cyber-Clinical Interface, Dark Mode, Intelligence Rail
- [ADR-003: Marketing Growth Engine](./docs/adr/ADR-003-marketing-growth-engine.md) — Sanctuary Page, Content Alchemist, Karma Loop
- [ADR-004: Meta Cloud API](./docs/adr/ADR-004-meta-cloud-api-integration.md) — WhatsApp Business Migration, Instagram Growth Module
- [ADR-005: Membership Builder](./docs/adr/ADR-005-membership-builder.md) — Subscriptions, Content Library, Smart Prescription (1/3 Fidelization)
- [ADR-006: Smart Prescriptions](./docs/adr/ADR-006-smart-prescriptions.md) — AI-Suggested Content, Adherence Tracking (2/3 Fidelization)
- [ADR-007: The Mirror](./docs/adr/ADR-007-the-mirror.md) — Progress Visualization, Spotify Wrapped Reports (3/3 Fidelization)
- [ADR-008: Time Capsule](./docs/adr/ADR-008-time-capsule.md) — Delayed Messaging, Hope to the Future (4/4 Loyalty)
- [ADR-009: Trinity Navigation](./docs/adr/ADR-009-trinity-navigation.md) — Micelio/Clínica/Comunidad + Bento Dashboard

---

## 💜 Guiding Principles

1. **Prosperity is Clinical**: An underpaid, burnt-out therapist cannot heal effectively. Our duty is not just to save clicks, but to maximize the practitioner's revenue and vital energy. We believe that financial health fuels clinical impact.
2. **Agents, Not Tools**: Active Intelligence, not passive software. We don't build tools that wait for input; we build Agents that act. If a task is repetitive—scheduling, billing, transcribing—Kura handles it autonomously 24/7. AI is not a feature; it’s a teammate.
3. **Institutional Trust**: Hospital-grade security for the independent practitioner. Clinical data is sacred, and privacy is our moat. We enforce military-grade encryption and HIPAA/GDPR compliance by default, future-proofing our users for the B2B/Insurance era.
4. **Radical Simplicity**: Complexity kills adoption. We prioritize "Fast & Easy" workflows to enable viral growth. Every feature must be intuitive enough to require zero training. If it needs a manual, it’s broken.


---

*Last updated: December 27, 2025 (v1.1.1 INTELLIGENCE ENGINE)*
