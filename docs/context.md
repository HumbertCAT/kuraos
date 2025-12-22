# 🧠 TherapistOS: Project Context & Architecture

> **Codename:** therapist-os  
> **Version:** 0.9.9.8 (CRM + Speed-to-Lead)  
> **Status:** Active Beta  
> **Repository:** https://github.com/HumbertCAT/therapistos-claude

---

## 1. Project Vision

**TherapistOS** is a specialized SaaS platform designed for Therapists, Healers, and Conscious Practitioners. It acts as a **System of Record** that unifies:

- **Patient Management** (CRM with Clinical Journal)
- **Booking & Payments** (Stripe, Google Calendar)
- **AI-driven Analysis** (Risk detection, session synthesis)
- **Automation Playbooks** (One-click clinical workflows)

### Target Audience

| Segment | Needs |
|---------|-------|
| **Independent Practitioners** | Simplicity, automation, affordable |
| **Retreat Centers & Clinics** | Multi-user, shared calendars, audit trails |
| **Modalities** | Therapy, psychedelics, astrology, somatic, integration |

### Core Value Proposition

1. **The Soul Record**: Patient profiles that track medical, psychological, and spiritual history
2. **CRM Pipeline**: Lead management with Kanban board before clinical conversion
3. **Clinical Journeys**: Orchestrated workflows (Lead → Form → Screening → Payment → Retreat → Integration)
4. **Frictionless Sharing**: WhatsApp/QR forms that auto-create leads or patients
5. **AletheIA Observatory**: AI that flags risks and suggests therapeutic paths
6. **Automation Playbooks**: Pre-configured recipes activated with one click

---

## 2. Technology Stack

### Frontend (The Clinic)
| Technology | Purpose |
|------------|---------|
| Next.js 14+ | App Router, React Server Components |
| TypeScript | Type safety |
| TailwindCSS | Utility-first styling |
| TipTap 2.x | Rich text editor (ProseMirror) |
| next-intl | i18n (EN, ES, CA, IT) |

### Backend (The Brain)
| Technology | Purpose |
|------------|---------|
| FastAPI | Async Python API |
| SQLAlchemy 2.0 | Async ORM |
| PostgreSQL 15 | Primary database |
| Alembic | Database migrations |
| Google Gen AI SDK | Gemini Pro for analysis |
| APScheduler | Temporal automation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker Compose | Local development |
| Google Cloud Run | Production hosting |
| Stripe | Payment processing |
| Brevo | Transactional email |
| Google Calendar API | Availability sync |

---

## 3. Core Business Modules

### A. Multi-Tenancy & Governance

**Organizations** are the billing entity with subscription tiers:

| Tier | Patients | Features |
|------|----------|----------|
| **BUILDER** | 3 | Free, basic features |
| **PRO** | 50 | Extended limits |
| **CENTER** | 150 | Full features + Risk auto-block |

**User Roles (RBAC):**
- **OWNER**: Full access, sees all clinical notes, billing
- **THERAPIST**: Clinical access, sees own private notes + public
- **ASSISTANT**: No clinical access, booking/scheduling only

**Key Dependencies:**
- `CurrentOwner` - Owner-only endpoints (billing, org settings)
- `CurrentClinicalUser` - Therapist+ access (clinical notes)

**Service-Therapist M2M:**
- `service_therapist_link` table connects services to specific therapists
- Each therapist only sees/offers their assigned services

### B. Patient Management (Soul Record)
- **Profile 360**: Contact, birth data, language, journey status
- **Clinical Journal**: Timeline of entries (notes, forms, audio, AI analyses)
- **JSONB Flexibility**: Extensible profile fields
- **Security**: Encrypted at rest, multi-tenant isolation

### C. Forms & Frictionless Sharing
- **Templates**: System (global) vs Organization (custom)
- **Public Forms**: Magic links for lead generation
- **Assignments**: Secure one-time links for existing patients
- **Risk Analysis**: Automatic AI assessment on submission
- **Sharing**: Copy link, QR code, WhatsApp direct send

### D. Booking Engine (Box Office)
| Service Type | Configuration | Example |
|--------------|---------------|---------|
| **1:1 Therapy** | `ONE_ON_ONE` + `CALENDAR` | Standard session slots |
| **Retreat** | `GROUP` + `FIXED_DATE` | Ayahuasca ceremony, limited capacity |
| **VIP Session** | `ONE_ON_ONE` + `FIXED_DATE` | Guest therapist, specific dates |

- **Stripe Payments**: Payment intents + webhooks
- **Google Calendar**: Bidirectional sync (FreeBusy + Event creation)
- **Multi-Schedule**: Different availability per service type

### E. AI Observatory (AletheIA)
1. **Ingestion**: Form submission or therapist note
2. **Processing**: Async background task → Gemini Pro
3. **Analysis**: Risk flags, synthesis, key moments
4. **Caching**: 1-hour intelligent caching

### F. Automation Playbooks (NEW v0.9.3)
Pre-configured automation recipes that execute on system events.

| Component | Description |
|-----------|-------------|
| **AutomationRule** | Database model with trigger, conditions, actions |
| **System Templates** | Pre-built playbooks (Escudo, Cobrador, Fidelización) |
| **Organization Rules** | Cloned from templates, toggle ON/OFF |
| **Marketplace UI** | Browse and install playbooks |

**Current Playbooks:**
- 🛡️ **Escudo de Seguridad**: Block high-risk patients (CENTER tier only), alert therapist
- 💸 **Cobrador Automático**: 48h payment reminder
- ❤️ **Fidelización Post-Retiro**: 7-day satisfaction survey

> **Note:** Risk auto-blocking only works for CENTER tier. BUILDER/PRO get alerts but no blocking.

### G. Lead Management CRM (NEW v0.9.9.8)
Pre-clinical pipeline management separating **Sales** from **Clinical Operations**.

| Component | Description |
|-----------|-------------|
| **Lead Model** | NEW → CONTACTED → QUALIFIED → CONVERTED/LOST |
| **Kanban Board** | 3-column drag-drop with `@hello-pangea/dnd` |
| **Memory Handover** | Lead notes preserved in Patient.profile_data on conversion |
| **Speed-to-Lead** | WhatsApp button, Ghost Detector, Auto-Conversion |

**Speed-to-Lead Features:**
- 💬 **WhatsApp Button**: Pre-filled message on lead cards
- 👻 **Ghost Detector**: Visual urgency (<24h green, 24-72h amber, >72h gray, >7d ghost)
- 🔄 **Discovery Auto-Conversion**: Public bookings auto-convert matching leads

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 14 + TypeScript + TailwindCSS + TipTap             │
│  ├── /dashboard (protected)                                  │
│  │   ├── /patients (Soul Record)                            │
│  │   ├── /bookings (Box Office)                             │
│  │   ├── /calendar (Availability)                           │
│  │   ├── /forms (Template Builder)                          │
│  │   └── /settings/automations (Playbook Marketplace)       │
│  └── /public (booking wizard, forms)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  FastAPI + SQLAlchemy 2.0 + PostgreSQL                      │
│  ├── /api/v1/auth (JWT httpOnly cookies)                    │
│  ├── /api/v1/patients (CRUD + journal)                      │
│  ├── /api/v1/booking (slots + payments)                     │
│  ├── /api/v1/forms (templates + assignments)                │
│  ├── /api/v1/automations (playbook marketplace)             │
│  └── /services                                              │
│      ├── automation_engine.py (event processing)            │
│      ├── risk_detector.py (keyword analysis)                │
│      └── stale_journey_monitor.py (temporal rules)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                        │
│  ├── Google Gemini Pro (AI analysis)                        │
│  ├── Stripe (payments + webhooks)                           │
│  ├── Google Calendar API (sync)                             │
│  └── Brevo (transactional email)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Event-Driven Automation Architecture

```
┌──────────────┐     emit      ┌──────────────┐     match      ┌──────────────┐
│   Triggers   │ ──────────▶  │  Event Bus   │ ──────────▶   │    Rules     │
│              │              │              │               │              │
│ • Form Submit│              │ SystemEvent  │               │ if HIGH_RISK │
│ • Payment OK │              │ Log + Queue  │               │ then BLOCK   │
│ • Journey    │              │              │               │ and EMAIL    │
│   Timeout    │              │              │               │              │
└──────────────┘              └──────────────┘               └──────────────┘
```

**Trigger Events:**
- `FORM_SUBMISSION_COMPLETED`
- `PAYMENT_SUCCEEDED` / `PAYMENT_FAILED`
- `BOOKING_CONFIRMED`
- `JOURNEY_STAGE_TIMEOUT`
- `RISK_DETECTED_IN_NOTE`

---

## 6. Directory Structure

```
TherapistOS-Claude/
├── backend/
│   ├── app/
│   │   ├── api/v1/              # REST Endpoints
│   │   │   ├── auth.py
│   │   │   ├── patients.py
│   │   │   ├── clinical_entries.py
│   │   │   ├── booking.py
│   │   │   ├── forms.py
│   │   │   ├── automations.py   # Playbook Marketplace
│   │   │   └── insights.py      # AI analysis
│   │   ├── core/                # Config, security
│   │   ├── db/                  # SQLAlchemy models
│   │   ├── schemas/             # Pydantic + automation types
│   │   └── services/            
│   │       ├── automation_engine.py
│   │       ├── risk_detector.py
│   │       └── stale_journey_monitor.py
│   ├── alembic/                 # Migrations
│   ├── scripts/                 # Seed scripts
│   └── tests/                   # Pytest suite
│
├── frontend/
│   ├── app/[locale]/
│   │   ├── (auth)/              # Login, register
│   │   ├── (dashboard)/         # Protected routes
│   │   │   ├── patients/
│   │   │   ├── bookings/
│   │   │   ├── calendar/
│   │   │   ├── forms/
│   │   │   └── settings/
│   │   │       └── automations/ # Playbook UI
│   │   └── (public)/            # Booking, forms
│   ├── components/
│   │   ├── ui/                  # Reusable (IconRenderer, etc.)
│   │   └── domain/              # Business components
│   └── messages/                # i18n (en, es, ca, it)
│
├── docs/                        # Documentation
└── scripts/                     # Dev automation
```

---

## 7. Current State (2025-12-22)

### Completed Features ✅
- Multi-tenant patient CRM with clinical journal
- **Lead Management CRM** with Kanban board and Speed-to-Lead
- **Dynamic Terminology System** (Patient/Client/Consultant labels)
- **RBAC (Role-Based Access Control)** with CurrentOwner/CurrentClinicalUser
- **Tier System (BUILDER/PRO/CENTER)** with dynamic patient limits
- **Risk Shield** with tier-based auto-blocking (CENTER only)
- **Service-therapist M2M** for multi-therapist calendars
- Rich text editor (TipTap) for notes
- Form builder with public sharing and risk assessment
- Booking engine with Stripe payments
- Google Calendar bidirectional sync
- AI analysis (Gemini Pro) with risk detection
- Automation engine with event bus
- Playbook Marketplace with 3 pre-built templates
- Help Center with AI ChatBot
- i18n support (EN, ES, CA, IT)
- **Usage widget** in user dropdown

### In Progress 🚧
- Public form → Lead creation (instead of Patient)
- WhatsApp integration for notifications

### Planned 🔮
- Public beta launch (v1.0.0)
- Mobile app (React Native)

---

## 8. For New Developers

### Getting Started
1. Clone the repo
2. Copy `.env.example` files
3. Run `./scripts/start-dev.sh`
4. Read the howto guides in `/docs`

### Key Files to Understand
- `backend/app/db/models.py` - All database models
- `backend/app/services/automation_engine.py` - Event processing
- `frontend/app/[locale]/(dashboard)/settings/automations/page.tsx` - Playbook UI

### Testing
```bash
docker-compose exec backend pytest tests/ -v
```

---

*Last updated: 2025-12-22*