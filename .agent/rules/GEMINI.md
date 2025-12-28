# KURA OS Agent Rules (v1.1.4)

> **⚠️ EXCEPTIONS PROTOCOL:** These rules are strict by default. If a rule blocks a legitimate critical fix or debugging task, **ask the user for explicit approval** before bypassing it.

## 🗣️ Language
- Reply in **Spanish** unless asked otherwise.
- Write code comments in **English**.

## 🎨 Design System Integrity (THE GOLDEN RULE)
- **NO Hardcoded Colors:** FORBIDDEN to use `bg-white`, `text-gray-500`, `bg-[#F3F4F6]`.
  - MUST use Semantic Tokens: `bg-card`, `text-muted-foreground`, `bg-brand`, `border-border`.
- **Typography:** FORBIDDEN to use raw sizes like `text-[14px]` or `text-xl` arbitrarily.
  - MUST use Type Scale: `.type-h1` (Display), `.type-body` (Inter), `.type-ui` (Interface), `font-mono` (Data).
- **Icons:** Use ONLY `lucide-react`. No FontAwesome or inline SVGs.
- **Layout:** Respect **Trinity Nav** structure (Sidebar | Workspace | AletheIA Rail). Do NOT create floating widgets.
- **Components:** Use `CyberCard` for containers to ensure semantic borders/shadows.

## 💻 Code Style & Architecture
- **Multi-tenancy:** ALL database queries MUST filter by `organization_id`.
- **Data Safety:**
  - Patients = SOFT DELETE only (HIPAA/GDPR compliance).
  - Leads = HARD DELETE allowed.
- **State Management:**
  - Use **Zustand** (`usePatientStore`) for active clinical context. Avoid prop-drilling.
  - Default to **React Server Components** (`page.tsx`). Only use `"use client"` for interactive leaves.
- **Terminology:** MUST use `useTerminology()` hook. Never hardcode "Paciente" or "Client" in UI text.

## 🧠 AletheIA Protocol
- **Data Coherence:** Sentinel Pulse risk score MUST match `last_insight_json`. No discrepancies allowed.
- **Location:** Intelligence widgets live ONLY in the **Right Sidebar** or **Dashboard Hero**.
- **Agentic Behavior:** AletheIA is an Active Agent, not a passive tool.

## 🚀 Releases & Ops
- **Documentation:** ALWAYS update `CHANGELOG.md` → `README.md` → `ROADMAP.md` on significant changes.
- **Workflow:** Use `/publish-release` workflow for deployments.
- **Versioning:** Tag format `vX.Y.Z` (Semantic Versioning).
- **Infrastructure:** Production uses Cloud SQL via Unix sockets.

## 🛡️ Security
- **Credentials:** Never commit `.env` or secrets to git.
- **Secrets:** Use Google Secret Manager for production keys.
- **Auth:** JWT tokens must always be `httpOnly` cookies.
