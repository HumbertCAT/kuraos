# KURA OS

> **The Operating System for Conscious Practitioners**

[![Version](https://img.shields.io/badge/version-1.5.9-HF2-purple.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-Production-green.svg)](https://app.kuraos.ai)

---

## 🌟 Vision

KURA OS is a clinical operating system for therapists, healers, and conscious practitioners. It unifies patient management, AI-driven insights, and automated workflows into a single command center.

### The Trinity Strategy

| Pillar | Purpose | Modules |
|:---|:---|:---|
| 🤝 **CONNECT** (Atraer) | Attract & qualify leads | CRM, Leads, Public Forms |
| 🩺 **PRACTICE** (Servir) | Deliver clinical excellence | Patients, Journeys, Bookings |
| 🌱 **GROW** (Crecer) | Scale your practice | Referrals, Analytics, Marketing |

### 💎 Value Proposition: The "Killer" Edge
*Solving clinical bottlenecks with sovereign intelligence.*

| 🚀 Motor Tecnológico | ⚡ Capacidad "Killer" | Impacto Clínico |
|:---|:---|:---|
| **Inteligencia Soberana** | **AletheIA (9 Units)** | 9 redes neuronales especializadas (Risk, Triage, Chat) trabajando 24/7. |
| **Automatización** | **Agentes Autónomos** | Protocolos activos que cualifican leads y reactivan pacientes sin intervención. |
| **Documentación** | **Scribe + Voice** | Transcripción clínica automática y síntesis de audio para WhatsApp. |
| **Growth Engine** | **Meta Cloud + Booking** | Sincronización total Calendar/Stripe y gestión nativa de leads vía WhatsApp. |
| **Historia Clínica** | **Patient 360 Timeline** | Perfil clínico unificado con trazabilidad total de la evolución del paciente. |

> [!TIP]
> **KURA OS isn't just a tool.** It's a clinical partner that bridges the gap between administrative chaos and therapeutic excellence.

---

## �️ Tech Stack

| Layer | Technology | Constraint |
|:---|:---|:---|
| **Frontend** | Next.js 16 (App Router) | Server Components by default |
| **State** | Zustand | `usePatientStore` for clinical context |
| **Styling** | Tailwind v4 | Semantic tokens only (no hardcoded colors) |
| **Backend** | FastAPI + SQLAlchemy 2.0 | Async only, filter by `organization_id` |
| **AI** | Gemini 2.5 + CostLedger | Use `ProviderFactory` for all AI calls |
| **Database** | PostgreSQL 15 | Soft Delete for Patients (HIPAA) |
| **Infra** | Cloud Run + Vercel + Cloud SQL | Unix sockets, `httpOnly` cookies |

### Monorepo Structure

| App | Path | Port | Description |
|:---|:---|:---:|:---|
| **Platform** | `apps/platform/` | 3001 | Main SaaS app (authenticated) |
| **Marketing** | `apps/marketing/` | 3002 | Landing pages (public) |
| **Backend** | `backend/` | 8001 | FastAPI REST API |
| **Database** | (Docker) | 5433 | PostgreSQL (local dev) |

---

## 📦 Core Modules

### 🧬 Patient 360 (Clinical Timeline)
Unified clinical profiles tracking medical and psychological evolution.
- Clinical Journal with rich text editor
- Journey status visualization
- Profile 360° (data integrity, language, consent)

### 📅 Box Office (Booking Engine)
Public booking wizard with integrated payments.
- 4-step flow: Service → Date → Payment → Confirm
- Stripe + Google Calendar sync
- Group sessions with capacity limits

### 🔭 AletheIA (AI Observatory)
Clinical intelligence that never sleeps.

#### The 9 Specialized Units

**L1 · Clinical Judgment** — AI that "understands" and "protects"

| Unit | Purpose |
|:---|:---|
| 🛡️ **SENTINEL** | Risk screening (suicide, crisis, self-harm) |
| 🩺 **ORACLE** | Session notes & deep clinical analysis |
| 📅 **NOW** | Daily briefing & next actions |
| 💓 **PULSE** | Chat sentiment monitoring |

**L2 · Transformation** — AI that "translates" and "creates"

| Unit | Purpose |
|:---|:---|
| ✍️ **SCRIBE** | Audio → verbatim text (transcription) |
| 🎤 **VOICE** | Full session audio analysis (≥15min) |
| 📝 **MEMO** | Quick audio notes → JSON (<15min) |

**L3 · Operations** — Routine information processing

| Unit | Purpose |
|:---|:---|
| 📄 **SCAN** | Document OCR & extraction |
| ❓ **HELPER** | Platform support assistant |

#### Key Capabilities
- **Risk Detection**: Suicide, self-harm, integration crisis
- **Session Synthesis**: From notes and audio transcription
- **Sentinel Pulse**: 7-day emotional trajectory
- **Light Memory**: Previous session context injection (v1.4.12)

### 🛤️ Journeys (Clinical Lifecycle)
Orchestrated patient workflows.
- Stage-based progression
- Timeout detection with automated nudges
- Lead → Patient conversion tracking

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- pnpm

### 1. Clone & Configure
```bash
git clone <repo-url>
cd kuraos
cp backend/.env.example backend/.env
cp apps/platform/.env.local.example apps/platform/.env.local
```

### 2. Start Development
```bash
./scripts/start-dev.sh
```

### 3. Access
| Service | URL |
|:---|:---|
| Platform | http://localhost:3001 |
| Backend API | http://localhost:8001 |
| API Docs | http://localhost:8001/docs |

---

## 🧪 Testing

>**The Immune System** - 5 layers of quality assurance

### Quick Test Commands

```bash
# Run all test layers
./scripts/test.sh all

# Run specific layer
./scripts/test.sh innate      # Backend unit tests
./scripts/test.sh adaptive    # Frontend E2E tests
./scripts/test.sh cognitive   # AI semantic evaluation
./scripts/test.sh email       # Email flow tests
```

### Test Coverage

| Layer | Technology | Tests |
|:---|:---|:---|
| **Innate** (Backend) | Pytest + testcontainers | 10+ unit tests |
| **Adaptive** (Frontend) | Playwright | 7 E2E tests |
| **Cognitive** (AI) | Vertex AI Evaluation | 3 golden cases |
| **Communication** (Email) | Mailpit | 4 email tests |

### Additional Setup for Testing

**Playwright browsers:**
```bash
cd apps/platform && pnpm exec playwright install
```

**Test dependencies:**
```bash
cd backend && .venv/bin/pip install -r requirements-test.txt
```

📚 **Full testing guide:** [docs/TESTING.md](docs/TESTING.md)

---

## 📚 Engineering Documentation

> *"Documentation is the map, Code is the territory."*

### 🧠 Architecture
| Document | Description |
|:---|:---|
| [aletheia-system.md](docs/architecture/aletheia-system.md) | AI engine, risk detection, automation agents |
| [journeys-engine.md](docs/architecture/journeys-engine.md) | Patient stages, lifecycle transitions |
| [decisions/](docs/architecture/decisions/) | Architecture Decision Records (ADRs) |

### 📘 Manuals
| Document | Topic |
|:---|:---|
| [booking-system.md](docs/manuals/booking-system.md) | The Box Office (Public Booking Engine) |
| [whatsapp-monitoring.md](docs/manuals/whatsapp-monitoring.md) | Twilio + AletheIA integration |
| [automation-agents.md](docs/manuals/automation-agents.md) | Playbooks and agent configuration |
| [forms-engine.md](docs/manuals/forms-engine.md) | Dynamic forms and lead capture |
| [plans-and-tiers.md](docs/manuals/plans-and-tiers.md) | Subscription tiers (BUILDER/PRO/CENTER) |

### ⚖️ Standards
| Document | Scope |
|:---|:---|
| [design-system.md](docs/standards/design-system.md) | UI palette, typography, theming |
| [state-management.md](docs/standards/state-management.md) | Zustand stores, hydration patterns |
| [terminology.md](docs/standards/terminology.md) | Dynamic labels (Patient/Client/Consultant) |

### ⚙️ Operations
| Document | Topic |
|:---|:---|
| [infrastructure-and-deploy.md](docs/ops/infrastructure-and-deploy.md) | GCP, Cloud Run, secrets, DR |
| [technical-debt.md](docs/ops/technical-debt.md) | Active debt registry |

---

## �️ Roadmap

See [ROADMAP.md](ROADMAP.md) for the strategic roadmap and pending features.

See [CHANGELOG.md](CHANGELOG.md) for complete release history.

---

## 🌐 Production URLs

| Environment | URL |
|:---|:---|
| **Platform** | https://app.kuraos.ai |
| **API** | https://api.kuraos.ai |
| **Marketing** | https://kuraos.ai |

---

## 💜 Built With Intention

KURA OS is crafted with the same care you bring to your practice. Every feature reduces friction, never adds complexity.

**Your work changes lives. Let us handle the rest.**

---

*© 2025-2026 KURA OS. All rights reserved.*
