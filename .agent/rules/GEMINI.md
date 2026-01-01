---
trigger: always_on
---

# KURA OS Agent Rules (v1.1.4)

> **⚠️ EXCEPTIONS PROTOCOL:** These rules are strict. If a rule blocks a legitimate critical fix, **ask the user for explicit approval** before bypassing it.

## 🗣️ Language
- Reply in **Spanish** unless asked otherwise.
- Write code comments in **English**.

## 🛑 THE CIRCUIT BREAKER (Implementation Gate)
> **CRITICAL OVERRIDE:** Even in automatic mode, you MUST respect this pause point.

- **RULE** `ShouldAutoProceed=false` ALWAYS to implemtation plans
- **TRIGGER:** Immediately after generating or presenting an `implementation_plan.md`.
- **ACTION:** **STOP.** HALT ALL EXECUTION.
- **PROHIBITION:** Do NOT run `/create-feature`, `/safe-migration`, or write any code yet.
- **REQUIRED OUTPUT:** You must ask: *"¿Apruebas el Plan de Implementación para proceder a la Ejecución?"* and WAIT for user input.
- **UNLOCK:** Only proceed when the user explicitly replies "SÍ", "APROBADO" or "ADELANTE".

## 🎨 Design System Integrity (THE GOLDEN RULE)
> **SCOPE:** These rules apply ONLY to `apps/platform/`. Marketing projects (`apps/landing/`, `apps/investors/`, future marketing apps) are EXEMPT and may use any styling approach.

- **NO Hardcoded Colors:** FORBIDDEN to use `bg-white`, `text-gray-500`, `bg-[#F3F4F6]`.
  - MUST use Semantic Tokens: `bg-card`, `text-muted-foreground`, `bg-brand`, `bg-sidebar`.
- **UI Physics (Tactile Quality):**
  - **Buttons:** MUST include `active:scale-95 transition-all` for "alive" feel.
  - **Interactivity:** Tables/Cards MUST react to hover (`hover:bg-muted/50`).
  - **Dark Mode:** Use `border-white/5` (not just flat colors) for glass effect.
- **Typography:** FORBIDDEN to use raw sizes (`text-[14px]`).
  - MUST use: `.type-h1` (Display), `.type-body` (Inter), `.type-ui` (Interface), `font-mono` (Data).
- **Icons:** Use ONLY `lucide-react`.

## 💻 Code Style & Architecture
- **Multi-tenancy:** ALL queries MUST filter by `organization_id`.
- **Data Separation (HIPAA/GDPR):**
  - **Routing:** Use `FormTemplate.target_entity` to route to `LEAD` (CRM) or `PATIENT` (Clinical).
  - **Deletion:** Leads = HARD DELETE allowed. Patients = SOFT DELETE (`is_active=False`) ONLY.
- **State Management:**
  - Use **Zustand** (`usePatientStore`) for active clinical context.
  - Default to **React Server Components** (`page.tsx`).
- **Terminology:** MUST use `useTerminology()` hook. Never hardcode "Paciente".

## 🧠 AletheIA Protocol
- **Philosophy:** "Agents, Not Tools". Naming matters (e.g., "Agente de Seguridad").
- **Data Coherence:** Sentinel Pulse risk score MUST match `last_insight_json`.
- **Location:** Intelligence widgets live ONLY in the **Right Sidebar** or **Dashboard Hero**.

## 🚀 Releases & Ops
- **Workflow:** Use `/publish-release` workflow. Update `CHANGELOG.md` first.
- **Infrastructure:** Production uses Cloud SQL via Unix sockets.
- **Security:** Secrets in Google Secret Manager. Auth via `httpOnly` cookies.
## 📂 Working Directory Rules
> **CRITICAL:** Many commands are path-sensitive. Always verify CWD before execution.

- **Scripts** (`start-dev.sh`, `stop-dev.sh`, `deploy.sh`, `backup_db.sh`):
  - **ALWAYS** execute from project root: `/Users/humbert/Documents/KuraOS`
  - **NEVER** from `/scripts/` directory (relative paths will fail)
- **Vercel CLI**:
  - **DO NOT** run `vercel --prod` from `apps/marketing/` (causes path duplication error)
  - **USE** GitHub auto-deploy (push to `main` triggers Vercel)
- **Docker/Git**: Execute from project root for `docker-compose.yml` access
- **Frontend apps**: `cd apps/platform` or `cd apps/marketing` first, then `pnpm` commands
