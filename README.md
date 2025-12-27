# KURA OS

> **The Operating System for Conscious Practitioners**

[![Version](https://img.shields.io/badge/version-1.1.1-purple.svg)](CHANGELOG.md)
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
| **Risk blindspots** | AletheIA AI: automatic risk detection in notes and forms |
| **Booking chaos** | Integrated calendar with Stripe payments + Google sync |
| **Generic software** | Built specifically for therapy, retreats, and ceremonial work |

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

### 2. 🔭 AletheIA Observatory (AI Core)
Your AI-powered clinical assistant that never sleeps.

- **Risk Detection**: Automatic flagging of suicide risk, self-harm, spiritual emergency
- **Session Synthesis**: AI-generated clinical summaries from notes and audio
- **Pattern Recognition**: Multi-session insights and therapeutic suggestions
- **Daily Briefing**: Audio summary of your day ahead

### 3. 📝 Frictionless Forms
Share intake forms via WhatsApp, QR codes, or magic links—and watch the data flow in automatically.

- **Form Builder**: Drag-and-drop with conditional logic and risk scoring
- **Public Forms**: Lead generation from Instagram bio links
- **Auto-Ingestion**: Submissions create patients and trigger AI analysis
- **Multi-language**: Forms adapt to patient's language preference

### 4. 📅 The Box Office (Booking Engine)
A complete booking system with payments, built for the realities of therapeutic practice.

- **Public Booking Wizard**: 4-step flow (service → date → payment → confirm)
- **Stripe Integration**: Instant payments with webhook automation
- **Google Calendar Sync**: Bidirectional sync for availability + event creation
- **Group Sessions**: Capacity-based booking for retreats and workshops

### 5. 🤖 Clinical AI Agents
Pre-configured automation recipes that work like magic—activate with one click.

| Agent | Trigger | Action |
|-------|---------|--------|
| 🛡️ **Escudo de Seguridad** | High-risk form submission | Block patient + alert therapist |
| 💸 **Cobrador Automático** | 48h without payment | Send reminder email |
| ❤️ **Fidelización Post-Retiro** | 7 days after retreat | Send satisfaction survey |
| 🤝 **Agente Concierge** | New lead created | Welcome email with booking |

**Install from the Catálogo → Toggle ON → Done.**

### 6. 💼 Lead CRM
Separate your **Sales Pipeline** from **Clinical Operations**.

- **Kanban Board**: Drag-drop leads through NEW → CONTACTED → QUALIFIED
- **Speed-to-Lead**: WhatsApp button, Ghost Detector (visual urgency)
- **Auto-Conversion**: Public bookings auto-convert matching leads to patients
- **Memory Handover**: Lead notes preserved in patient profile on conversion

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
| **Frontend** | Next.js 16 (App Router), TypeScript, TailwindCSS |
| **Backend** | FastAPI (Python 3.11+), Async SQLAlchemy 2.0 |
| **Database** | PostgreSQL 15 + Alembic Migrations |
| **AI Engine** | Google Gemini 2.5 (via ProviderFactory + CostLedger) |
| **Payments** | Stripe (Checkout + Webhooks + Connect) |
| **Email** | Brevo (Transactional) |
| **Calendar** | Google Calendar API (OAuth + FreeBusy) |
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

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**CHANGELOG**](CHANGELOG.md) | Version history and release notes |
| [**Context & Architecture**](docs/context.md) | System design and modules |
| [**Forms Guide**](docs/howto_forms.md) | How forms work |
| [**Playbooks Guide**](docs/howto_playbooks.md) | Automation system |
| [**Plans Guide**](docs/howto_plans.md) | Tier system (BUILDER/PRO/CENTER) |

---

## 📂 Project Structure

```
kuraos/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # REST Endpoints
│   │   ├── db/               # SQLAlchemy Models
│   │   └── services/         # Business Logic + AI
│   └── tests/                # Pytest Suite
├── apps/
│   ├── platform/             # Main Next.js App
│   │   ├── app/[locale]/     # Pages (i18n)
│   │   ├── components/       # React Components
│   │   └── messages/         # i18n (en, es, ca, it)
│   └── marketing/            # Landing Page
├── docs/                     # Documentation
└── scripts/                  # Dev automation
```

---

## 🌱 Roadmap

See [ROADMAP.md](ROADMAP.md) for the full strategic roadmap.

### Completed
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
- [ ] Google OAuth Integration
- [ ] WhatsApp Business API (Meta Cloud)
- [ ] Mobile App (React Native)

---

## 💜 Built With Intention

KURA OS is crafted with the same care and intentionality that you bring to your practice. Every feature is designed to reduce friction, not add complexity.

**Your work changes lives. Let us handle the rest.**

---

*© 2025-2026 KURA OS. All rights reserved.*
