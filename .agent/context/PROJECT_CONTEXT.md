# KURA OS PROJECT CONTEXT

## 🧠 Core Identity
**Kura OS** is the Operating System for Conscious Practitioners.
* **Soul Record:** 360° patient profile (Clinical + Spiritual).
* **AletheIA:** Active AI Agents (Risk Detection, Sentinel Pulse).
* **Trinity Strategy:**
  1. **CONNECT (Atraer):** CRM, Leads.
  2. **PRACTICE (Servir):** Clinical Ops, Patients, Journeys.
  3. **GROW (Crecer):** Analytics, Marketing.

## 🛠️ Tech Stack (Strict)
| Layer | Technology | Key Constraint |
|-------|------------|----------------|
| **Frontend** | Next.js 16 (App Router) | Use Server Components by default |
| **State** | Zustand | Use `usePatientStore` for clinical context |
| **Styling** | Tailwind v4 | **NO hardcoded colors**. Use tokens only |
| **Backend** | FastAPI + SQLAlchemy 2.0 | Async only. Filter by `organization_id` |
| **AI** | Gemini 2.5 + CostLedger | Use `ProviderFactory` for all AI calls |
| **Database** | PostgreSQL 15 | Soft Delete for Patients (HIPAA) |

## 🎨 Design System (The Golden Rule)
* **Layout:** **Trinity Nav** (3-Col): Sidebar (`bg-sidebar`) | Workspace | AletheIA Rail.
* **Typography:**
  - `Playfair Display`: Elegant Headings.
  - `Space Grotesk`: Technical Headers/UI.
  - `Inter`: Body content.
  - `JetBrains Mono`: Data/Stats.
* **Tokens:** `bg-background`, `bg-card`, `bg-brand`, `bg-popover`.
* **Physics:** Tactile UI (`active:scale-95`, `transition-all`).

## 📂 Key Maps
| Domain | Path | Purpose |
|--------|------|---------|
| **UI** | `apps/platform/app/globals.css` | The Source of Truth for Styles |
| **AI** | `backend/app/services/ai/` | ProviderFactory & CostLedger |
| **Logic** | `backend/app/services/aletheia/` | Risk & Clinical Logic |
| **Config** | `backend/app/core/config.py` | Settings & Tiers |
| **Text** | `apps/platform/messages/{locale}.json`| i18n (EN/ES/IT/CA) |

## 🛡️ Production Ops
* **Infra:** Cloud Run (Backend) + Vercel (Frontend) + Cloud SQL (Unix Socket).
* **Security:** Secrets in Google Secret Manager. Cookies are `httpOnly`.
* **Terminology:** `PATIENT` | `CLIENT` | `CONSULTANT` (Respect via `useTerminology`).

## 📦 Monorepo Structure
| App | Path | Port | Description |
|-----|------|------|-------------|
| **Platform** | `apps/platform/` | `:3001` | Main SaaS app (authenticated) |
| **Marketing** | `apps/marketing/` | `:3002` | Landing pages (public) |
| **Backend** | `backend/` | `:8001` | FastAPI REST API |
| **Database** | (Docker) | `:5433` | PostgreSQL (local) |

> ⚠️ **Port Sensitivity:** Always use `:3001` for Platform, `:3002` for Marketing, `:8001` for Backend.

## 🗄️ Alembic Migration Safety
* **Migrations path:** `backend/alembic/versions/`
* **Enum handling:** Use `checkfirst=True` when creating Enum types to avoid `DuplicateObjectError`
* **Production sync:** If migration fails in prod, manually stamp version in `alembic_version` table:
  ```sql
  UPDATE alembic_version SET version_num = 'target_revision_id';
  ```
* **Downgrade:** Never hard-drop Enum types without `IF EXISTS`
