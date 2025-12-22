# Therapist OS

> **The Operating System for Conscious Practitioners**

[![Version](https://img.shields.io/badge/version-0.9.9.8-purple.svg)](docs/versions.md)
[![Status](https://img.shields.io/badge/status-Active%20Beta-green.svg)]()
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)]()

---

## 🌟 The Vision

**Therapist OS** is a specialized SaaS platform designed for **Therapists, Healers, and Conscious Practitioners**. 

We believe that every healing journey deserves a system as intentional as the work itself. TherapistOS replaces the chaos of spreadsheets, scattered notes, and disconnected tools with a **unified command center** that honors both clinical rigor and spiritual depth.

### The Problem We Solve

| Pain Point | TherapistOS Solution |
|------------|---------------------|
| **Scattered patient records** | The Soul Record: 360° patient profile with clinical timeline |
| **Manual follow-ups** | Automation Playbooks: one-click clinical workflows |
| **Risk blindspots** | AletheIA AI: automatic risk detection in notes and forms |
| **Booking chaos** | Integrated calendar with Stripe payments + Google sync |
| **Generic software** | Built specifically for therapy, retreats, and ceremonial work |

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
- **Credit System**: Fair pricing with monthly quotas + top-ups

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

### 5. ⚡ Automation Playbooks
Pre-configured automation recipes that work like magic—activate with one click.

| Playbook | Trigger | Action |
|----------|---------|--------|
| 🛡️ **Escudo de Seguridad** | High-risk form submission | Block patient + alert therapist |
| 💸 **Cobrador Automático** | 48h without payment | Send reminder email |
| ❤️ **Fidelización Post-Retiro** | 7 days after retreat | Send satisfaction survey |

**Install from the Biblioteca → Toggle ON → Done.**

### 6. 🎨 Premium Dashboard (NEW in v0.9.5)
A beautiful, consistent interface across all sections.

- **SectionHeader**: Gradient icons and descriptive subtitles
- **Real-time Stats**: Patients, bookings, forms, revenue from live API
- **AletheIA Suggestions**: AI-powered action recommendations
- **Tier-based Features**: BUILDER/PRO/CENTER with appropriate limits

### 7. 💼 Lead CRM (NEW in v0.9.9.8)
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
| **Frontend** | Next.js 14+ (App Router), TypeScript, TailwindCSS |
| **Backend** | FastAPI (Python 3.11+), Async SQLAlchemy 2.0 |
| **Database** | PostgreSQL 15 + Alembic Migrations |
| **AI Engine** | Google Gemini Pro (Vision + Audio) |
| **Payments** | Stripe (Checkout + Webhooks) |
| **Email** | Brevo (Transactional) |
| **Calendar** | Google Calendar API (OAuth + FreeBusy) |
| **Infra** | Docker Compose (Dev), Google Cloud Run (Prod) |

---

## ⚡️ Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (optional)
- Stripe CLI (for webhook testing)
- ngrok (for Twilio WhatsApp webhooks)

### 1. Clone & Configure
```bash
git clone https://github.com/HumbertCAT/therapistos-claude.git
cd therapistos-claude

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# Frontend environment
cp frontend/.env.local.example frontend/.env.local
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
| [**Context & Architecture**](docs/context.md) | System design and modules |
| [**Version History**](docs/versions.md) | Detailed changelog |
| [**Forms Guide**](docs/howto_forms.md) | How forms work |
| [**Playbooks Guide**](docs/howto_playbooks.md) | Automation system |
| [**Plans Guide**](docs/howto_plans.md) | Tier system (BUILDER/PRO/CENTER) |
| [**Styling Guide**](docs/styling_guide.md) | CSS architecture |
| [**History Log**](docs/history.md) | Development chronicle |

---

## 🧪 Testing

```bash
# Backend unit tests
docker-compose exec backend pytest tests/ -v

# E2E tests (Playwright)
cd frontend && npm run test:e2e
```

---

## 📂 Project Structure

```
TherapistOS-Claude/
├── backend/
│   ├── app/
│   │   ├── api/v1/           # REST Endpoints
│   │   ├── db/               # SQLAlchemy Models
│   │   └── services/         # Business Logic + AI
│   └── tests/                # Pytest Suite
├── frontend/
│   ├── app/[locale]/         # Next.js Pages (i18n)
│   │   ├── (dashboard)/      # Protected Routes
│   │   └── (public)/         # Booking + Forms
│   ├── components/           # React Components
│   └── messages/             # i18n (en, es, ca, it)
├── docs/                     # Documentation
└── scripts/                  # Dev automation
```

---

## 🌱 Roadmap

- [x] **v0.9.6** - Landing Page & Public Marketing Site
- [x] **v0.9.5** - Premium UI & Real Dashboard Data
- [x] **v0.9.4** - Multi-Tenancy & Tier System
- [x] **v0.9.3** - Playbook Marketplace
- [x] **v0.9.2** - Journey Engine & Temporal Automation
- [x] **v0.9.1** - AI Insights Dashboard
- [x] **v0.9.7** - Stripe Checkout & Payment Flow 🚀
- [x] **v0.9.8** - Telehealth Audio Mixer & UX
- [x] **v0.9.9.5** - Help Center with AI ChatBot
- [x] **v0.9.9.6** - Help Quick Wins (Query Logging, Mobile Hide)
- [x] **v0.9.9.7** - Dynamic Terminology System
- [x] **v0.9.9.8** - Lead CRM + Speed-to-Lead Features 🔥
- [ ] **v0.9.10** - WhatsApp Integration
- [ ] **v1.0.0** - Public Beta Launch

---

## 💜 Built With Intention

TherapistOS is crafted with the same care and intentionality that you bring to your practice. Every feature is designed to reduce friction, not add complexity.

**Your work changes lives. Let us handle the rest.**

---

*© 2024-2025 TherapistOS. All rights reserved.*
