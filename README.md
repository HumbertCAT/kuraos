# KURA OS

> **The Operating System for Conscious Practitioners**

[![Version](https://img.shields.io/badge/version-1.1.4-purple.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-Production-green.svg)](https://app.kuraos.ai)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)]()

---

## 🌟 The Vision

**KURA OS** is a specialized SaaS platform designed for **Therapists, Healers, and Conscious Practitioners**. 

We believe that every healing journey deserves a system as intentional as the work itself. KURA OS replaces the chaos of spreadsheets, scattered notes, and disconnected tools with a **unified command center** that honors both clinical rigor and spiritual depth.

### The Problem We Solve

| Pain Point | KURA OS Solution |
|------------|-----------------|
| **Scattered patient records** | The Soul Record: 360° patient profile with clinical timeline |
| **Manual follow-ups** | AI Clinical Agents: automated clinical workflows |
| **Risk blindspots** | AletheIA AI: automatic risk detection in notes, forms, and WhatsApp |
| **Booking chaos** | Integrated calendar with Stripe payments + Google sync |
| **Generic software** | Built specifically for therapy, retreats, and ceremonial work |
| **Emotional volatility** | Sentinel Pulse: 7-day emotional monitoring with crisis alerts |

---

## 🚀 Live Production

| Environment | URL |
|-------------|-----|
| **Platform** | https://app.kuraos.ai |
| **API** | https://api.kuraos.ai |
| **Marketing** | https://kuraos.ai |

---

## ✨ Core Modules

### 1. 🧬 The Soul Record (Patient CRM)
A patient profile that goes beyond contact info—tracking medical, psychological, and spiritual history.

- **Clinical Journal**: Timeline of session notes, forms, audio recordings, AI analyses
- **Rich Text Editor**: Notion-like experience for clinical notes (TipTap)
- **Journey Status**: Visual tracking of patient progress through your programs
- **Profile 360°**: Birth data, language preferences, consent tracking
- **Clinical Canvas**: 2-column layout with Journey Boarding Pass + Sentinel Pulse

### 2. 🔭 AletheIA Observatory (AI Core)
Your AI-powered clinical assistant that never sleeps.

- **Risk Detection**: Automatic flagging of suicide risk, self-harm, spiritual emergency
- **Session Synthesis**: AI-generated clinical summaries from notes and audio
- **Pattern Recognition**: Multi-session insights and therapeutic suggestions
- **Daily Briefing**: Audio summary of your day ahead
- **Sidebar Intelligence**: Context-aware insights when viewing any patient

### 3. 📡 Sentinel Pulse (Real-Time Monitoring)
*NEW in v1.1.3b* — See your patient's emotional trajectory at a glance.

- **7-Day Emotional Chart**: SVG visualization of sentiment over time
- **3 Visual States**:
  - 🟢 **Active**: Full chart with green/red gradient curve
  - 👻 **Dormant**: Ghost graph for new patients (no data yet)
  - 🔒 **Locked**: PRO tier upsell for BUILDER plans
- **Pulsing "Now" Dot**: Real-time emotional state indicator
- **Risk Flags**: Inline critical alerts (Crisis Inminente, Ideación Negativa)
- **Data Coherence**: Same risk score everywhere—Pulse, Observatory, and Dashboard

### 4. 📝 Frictionless Forms
Share intake forms via WhatsApp, QR codes, or magic links—and watch the data flow in automatically.

- **Form Builder**: Drag-and-drop with conditional logic and risk scoring
- **Public Forms**: Lead generation from Instagram bio links
- **Auto-Ingestion**: Submissions create patients and trigger AI analysis
- **Multi-language**: Forms adapt to patient's language preference

### 5. 📅 The Box Office (Booking Engine)
A complete booking system with payments, built for the realities of therapeutic practice.

- **Public Booking Wizard**: 4-step flow (service → date → payment → confirm)
- **Stripe Integration**: Instant payments with webhook automation
- **Google Calendar Sync**: Bidirectional sync for availability + event creation
- **Group Sessions**: Capacity-based booking for retreats and workshops

### 6. 🤖 Clinical AI Agents
Pre-configured automation recipes that work like magic—activate with one click.

| Agent | Trigger | Action |
|-------|---------|--------|
| 🛡️ **Escudo de Seguridad** | High-risk form submission | Block patient + alert therapist |
| 💸 **Cobrador Automático** | 48h without payment | Send reminder email |
| ❤️ **Fidelización Post-Retiro** | 7 days after retreat | Send satisfaction survey |
| 🤝 **Agente Concierge** | New lead created | Welcome email with booking |

**Install from the Catálogo → Toggle ON → Done.**

### 7. 💼 Lead CRM
Separate your **Sales Pipeline** from **Clinical Operations**.

- **Kanban Board**: Drag-drop leads through NEW → CONTACTED → QUALIFIED
- **Speed-to-Lead**: WhatsApp button, Ghost Detector (visual urgency)
- **Auto-Conversion**: Public bookings auto-convert matching leads to patients
- **Memory Handover**: Lead notes preserved in patient profile on conversion

### 8. 🧠 AI Governance (Admin)
*NEW in v1.1.1* — Full visibility into your AI costs and usage.

- **Financial HUD**: Provider Cost, Revenue, Net Margin
- **Neural Registry**: Active models with per-token pricing
- **Activity Ledger**: Every AI call logged with user, tokens, cost
- **Margin Controller**: Adjust markup on AI credits in real-time

---

## 🎨 Design System

KURA OS features a **Cyber-Clinical** aesthetic—professional enough for medical settings, beautiful enough to inspire.

### Visual Language
- **Glass UI**: `backdrop-blur-sm` with subtle transparency
- **Tactile Buttons**: `active:scale-95` for satisfying clicks
- **Semantic Tokens**: 100% abstracted colors via CSS variables
- **Dark/Light Modes**: Full theme support with one-click toggle

### Key Components
- **Journey Boarding Pass**: Stage progression visualization
- **Clinical Roster**: High-density data tables
- **Neural Flow**: Circuit board UI for automation flows
- **Health Dots**: Pulsing risk indicators

---

## 🎯 Who Is This For?

### Independent Practitioners
- Solo therapists, healers, and coaches
- Need simplicity without sacrificing depth
- Want automation without configuration hell

### Retreat Centers & Clinics
- Multi-therapist teams with shared calendars
- Complex journeys (screening → payment → ceremony → integration)
- Need role-based access and audit trails

### Modalities Supported
- 🧘 Psychotherapy & Counseling
- 🍄 Psychedelic-Assisted Therapy
- ⭐ Astrology & Human Design
- 🔄 Integration Coaching
- 🌿 Somatic & Breathwork

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), TypeScript, TailwindCSS v4 |
| **Backend** | FastAPI (Python 3.11+), Async SQLAlchemy 2.0 |
| **Database** | PostgreSQL 15 + Alembic Migrations |
| **AI Engine** | Google Gemini 2.5 (via ProviderFactory + CostLedger) |
| **Messaging** | Twilio WhatsApp (Sandbox → Business API) |
| **Payments** | Stripe (Checkout + Webhooks + Connect) |
| **Email** | Brevo (Transactional) |
| **Calendar** | Google Calendar API (OAuth + FreeBusy) |
| **Storage** | Google Cloud Storage (audio/media with 30-day lifecycle) |
| **Infra** | Docker Compose (Dev), Google Cloud Run (Prod) |

---

## ⚡️ Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Stripe CLI (for webhook testing)

### 1. Clone & Configure
```bash
git clone https://github.com/HumbertCAT/kuraos.git
cd kuraos

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Frontend environment
cp apps/platform/.env.local.example apps/platform/.env.local
```

### 2. Start Everything
```bash
./scripts/start-dev.sh
```

### 3. Access
| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3001 |
| **Backend API** | http://localhost:8001 |
| **API Docs** | http://localhost:8001/docs |

### 4. Seed Premium Demo Data
```bash
docker-compose exec backend python scripts/reboot_local_universe_PREMIUM.py
```

This creates 4 archetype patients (Marcus, Elena, Julian, Sarah) with rich histories for testing.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**CHANGELOG**](CHANGELOG.md) | Version history and release notes |
| [**Context & Architecture**](docs/context.md) | System design and modules |
| [**Forms Guide**](docs/howto_forms.md) | How forms work |
| [**Playbooks Guide**](docs/howto_playbooks.md) | Automation system |
| [**Plans Guide**](docs/howto_plans.md) | Tier system (BUILDER/PRO/CENTER) |
| [**Monitoring Technical Doc**](docs/Monitorizacion_Technical_Doc.md) | Sentinel Pulse architecture |

---

## 📂 Project Structure

```
kuraos/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # REST Endpoints
│   │   ├── db/               # SQLAlchemy Models
│   │   └── services/         # Business Logic + AI
│   │       ├── ai/           # ProviderFactory, CostLedger
│   │       └── aletheia/     # Clinical Intelligence
│   └── scripts/              # Seed, migrations, utilities
├── apps/
│   ├── platform/             # Main Next.js App
│   │   ├── app/[locale]/     # Pages (i18n)
│   │   ├── components/       # React Components
│   │   │   ├── SentimentPulseWidget.tsx  # Sentinel Pulse
│   │   │   └── AletheiaObservatory.tsx   # AI Sidebar
│   │   ├── stores/           # Zustand global state
│   │   └── messages/         # i18n (en, es, ca, it)
│   └── marketing/            # Landing Page
├── docs/                     # Documentation
└── scripts/                  # Dev automation
```

---

## 🌱 Roadmap

See [ROADMAP.md](ROADMAP.md) for the full strategic roadmap.

### Completed
- [x] **v1.1.4** - HELP CENTER: Documentation Library + Sidebar Navigation (December 2025)
- [x] **v1.1.3b** - SENTINEL PULSE: Real-time emotional monitoring + Data Coherence (December 2025)
- [x] **v1.1.3** - CLINICAL CANVAS: 2-column patient profile layout (December 2025)
- [x] **v1.1.2** - GOLDEN SEED: Premium demo archetypes (December 2025)
- [x] **v1.1.1** - INTELLIGENCE ENGINE: AI Governance + FinOps (December 2025)
- [x] **v1.1.0** - THE COMMAND CENTER: Dashboard 3.0 (December 2025)
- [x] **v1.0.12** - Neural Flow UI: Agent Circuit Board (December 2025)
- [x] **v1.0.10** - Journey Cards 2.0: Boarding Pass Style (December 2025)
- [x] **v1.0.9** - Clinical Roster: High-Density Tables (December 2025)
- [x] **v1.0.8** - Design System: Playground + Tactile UI (December 2025)
- [x] **v1.0.7** - The Clean Room: Privacy & Data Retention (December 2025)
- [x] **v1.0.6** - Security & Governance: HIPAA Hardening (December 2025)
- [x] **v1.0.5** - AletheIA Observatory (December 2025)
- [x] **v1.0.0** - Public Launch 🎉 (December 2025)

### Coming Soon
- [ ] Google OAuth Integration (SSO)
- [ ] WhatsApp Business API (Meta Cloud)
- [ ] Onboarding Wizard (self-service setup)
- [ ] Live Components in MDX (dynamic documentation)
- [ ] Mobile App (React Native)
- [ ] The Mirror: Patient-facing progress visualization
- [ ] Time Capsule: Delayed messaging system


---

## 💜 Built With Intention

KURA OS is crafted with the same care and intentionality that you bring to your practice. Every feature is designed to reduce friction, not add complexity.

**Your work changes lives. Let us handle the rest.**

---

## 🦅 The System Speaks with One Voice

*"This is no longer a prototype. This is a Clinical Decision Support System."*

— The Architect, December 2025

---

*© 2025-2026 KURA OS. All rights reserved.*
