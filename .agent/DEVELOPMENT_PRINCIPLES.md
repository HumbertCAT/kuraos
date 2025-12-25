# KURA OS Development Principles

> **CRITICAL**: Always consult these principles before implementing new features.

---

## 1. Data Separation (HIPAA/GDPR Ready)

**Principle:** Clinical data must remain separate from commercial/marketing data.

| Table | Purpose | Data Type |
|-------|---------|-----------|
| `leads` | CRM/Marketing | MQLs, curious inquiries, pre-screening |
| `patients` | Clinical/Medical | Only real clinical relationships |

### Enforcement:
- `FormTemplate.target_entity` routes submissions: `LEAD` → CRM, `PATIENT` → Clinical
- Lead → Patient conversion is **manual only**

### Checklist:
- [ ] Does this create patient records? → Use `target_entity` routing
- [ ] Does this access clinical data? → Guard with proper authorization
- [ ] Would marketing/sales use this? → Keep in Lead/CRM domain

---

## 2. Dynamic Terminology

**Principle:** Never hardcode "paciente" or "cliente". Use the organization's preference.

```
Organization.terminology_preference: PATIENT | CLIENT | CONSULTANT
```

| Value | Profession | UI Labels |
|-------|------------|-----------|
| `PATIENT` | Clinical/Medical | "Paciente", "Pacientes" |
| `CLIENT` | Coaching/Business | "Cliente", "Clientes" |
| `CONSULTANT` | Holistic/Humanist | "Consultante", "Consultantes" |

### Usage:
```tsx
// Frontend
const { singular, plural } = useTerminology();
```

---

## 3. Multi-Tenancy (Organization Isolation)

**Principle:** Every query MUST be scoped to the user's organization.

### Enforcement:
- All database models have `organization_id` foreign key
- API endpoints filter by `current_user.organization_id`
- Never expose data across organizations

### Checklist:
- [ ] Does this query filter by `organization_id`?
- [ ] Is there a `.where(Model.organization_id == org_id)` in the query?

---

## 4. Internationalization (i18n)

**Principle:** All user-facing strings must be translatable.

### Implementation:
- Frontend: `next-intl` with messages in `apps/platform/messages/{locale}.json`
- Supported locales: `es`, `en`, `ca`, `it`
- Patient language: `Patient.language` field for AI output

### Checklist:
- [ ] Are new strings in the translation files?
- [ ] Does AI output respect `Patient.language` or `User.ai_output_preference`?

---

## 5. AI Philosophy: Agents, Not Tools

**Principle:** AI features are "Clinical Agents" (team members), not abstract tools.

### Naming:
- ✅ "Agente de Seguridad", "Agente Concierge", "Chief of Staff"
- ❌ "AI Tool", "Bot", "Automation"

### Human-in-the-Loop:
- Draft mode for sensitive actions (emails, messages)
- `PendingAction` table for approval queue
- Super Admin can override

---

## 6. Authentication & Sessions

**Principle:** JWT stored in HttpOnly cookies, shared across subdomains.

### Production:
- Domain: `.kuraos.ai` (shared between `app.` and `api.`)
- Secure: `true` in production
- SameSite: `lax`

### Checklist:
- [ ] Does this endpoint need authentication? → Use `Depends(get_current_user)`
- [ ] Is it admin-only? → Use `Depends(require_super_admin)`
- [ ] Is it organization-scoped? → Filter by `current_user.organization_id`

---

## 7. Release Process

**Principle:** Follow `/publish-release` workflow. Never skip documentation.

### Mandatory Steps:
1. CHANGELOG.md - Add version entry
2. README.md - Update version badge + Completed section
3. ROADMAP.md - Mark milestones done
4. Git tag + push
5. Deploy via `./scripts/deploy.sh`

---

## 8. Cloud Run / Production

**Principle:** Production uses Cloud SQL Unix sockets, not TCP.

### Connection:
- Use `DATABASE_URL` env var (includes socket path)
- Parser must handle special chars in password (`_parse_database_url()`)

### Secrets:
- All secrets in Google Secret Manager
- Never commit credentials to git
- `.env` is for LOCAL development only

---

## 9. Deletion Policy (Hard vs Soft)

**Principle:** Clinical data is legally sensitive. Marketing data is disposable.

| Entity | Delete Type | Behavior |
|--------|-------------|----------|
| `Lead` | **HARD DELETE** | Cascade delete `pending_actions`, `messages`. Clean up clutter. |
| `Patient` | **SOFT DELETE** | Set `is_active = False`. **NEVER** hard delete clinical history by default (Legal Retention). |

### Rationale:
- **HIPAA/GDPR**: Clinical records may need to be retained for 7+ years
- **Audit Trail**: Therapists may need historical patient data for legal defense
- **Right to Erasure**: GDPR deletion requests require Super Admin verification

### Checklist:
- [ ] Am I deleting a Lead? → Hard Delete is okay
- [ ] Am I deleting a Patient? → **STOP**. Use `archive()` or `soft_delete()`
- [ ] Hard delete Patient requires: Super Admin + GDPR Request verification

---

## 10. Mobile-First UX

**Principle:** Critical UI must work on mobile (3rem touch targets, safety zones).

### Patterns:
- Navigation buttons: ≥3rem on mobile
- Bottom navigation: Account for iOS home indicator
- Tables: Horizontal scroll wrapper on mobile

---

## 11. CYBER-CLINICAL DESIGN SYSTEM v2.1 (The Zinc Protocol - Architect Refinement)

**Philosophy:** "Precision & Void". A sterile, sophisticated interface inspired by medical HUDs.
**Core Rule:** Design for **Light Mode ("The Clinic")** cleanliness, but verify **Dark Mode ("The Void")** immersion.
**Tech Stack:** Tailwind CSS v4 (CSS-first, no tailwind.config.ts).

### A. The Color Architecture (Zinc-Based + Neon Accents)
We strictly use the **Zinc** scale for neutrals, with **neon accents** in dark mode.

| Token | Purpose | Light Mode | Dark Mode |
| :--- | :--- | :--- | :--- |
| **Canvas** | App Background | `#FAFAFA` | `#0a0a0a` (True Black) |
| **Surface** | Cards/Panels | `#FFFFFF` | `#121212` (Elevated) |
| **Border** | Structural Lines | `#E4E4E7` | `#1f1f1f` (Ultra subtle) |
| **Brand** | Primary Accent | `#0D9488` (Teal 600) | `#2DD4BF` (Teal 400) |
| **Risk** | Alerts/Danger | `#E11D48` (Rose 600) | `#ff3366` (Neon Red) |
| **AI** | Intelligence | `#7C3AED` (Violet 600) | `#A78BFA` (Violet 400) |
| **AI Accent** | Cyan Highlights | `#0891B2` (Cyan 600) | `#00ffcc` (Neon Cyan) |

### B. Typography System (Architect Stack)

**⚠️ CRITICAL: We use Tailwind v4 - configure fonts in `globals.css` via `@theme`, NOT tailwind.config.ts.**

| Role | Font | Use Case |
| :--- | :--- | :--- |
| **Display** | `Space Grotesk` | Headers, titles - cyber/technical |
| **Body** | `Inter` | Content, paragraphs - clean/functional |
| **Mono** | `JetBrains Mono` | Stats, IDs, timestamps, biomarkers |

**Utility Classes:**
- `.font-display` - Space Grotesk, weight 600, tracking tight
- `.font-body` - Inter (default)
- `.font-mono` / `.font-stats` - JetBrains Mono with tabular nums
- `.font-label` - ALL CAPS, 0.1em tracking, 0.65rem

**⚠️ Architect Note:** Never use Serif fonts in dashboards - they create "Magazine" feel instead of "Herramienta/Software".

### C. Component Patterns (The Atoms)

#### 1. The "CyberCard" (Universal Container)
* **Classes:** `bg-surface border border-border-subtle rounded-xl`
* **Shadow:** Light mode only with `shadow-sm`

#### 2. The "Action Button" (High Contrast)
* **Classes:** `bg-brand text-white rounded-xl hover:opacity-90`

#### 3. Status Badges (The "Pill")
* **High Risk:** `bg-risk/10 text-risk`
* **AI/Beta:** `bg-ai/10 text-ai`

### D. Layout Architecture (The Trinity Shell)

* **Left:** Navigation Sidebar (`w-64`, Fixed).
* **Center:** Main Stage (Fluid, Scrollable).
* **Right:** Intelligence Rail (`w-80`, Collapsible, reserved for AletheIA).

### E. Implementation Strategy (Tailwind v4 CSS-First)

**1. CSS Configuration (`app/globals.css`)**
We define the theme directly in CSS using `@theme inline`. We do NOT use `tailwind.config.ts`.

```css
@import "tailwindcss";

@theme {
  /* Semantic Color Mapping */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  
  --color-surface: var(--surface);
  --color-border-subtle: var(--border-subtle);

  /* Brand Aliases */
  --color-brand: var(--color-teal-600);
  --color-brand-foreground: var(--color-teal-50);
  
  --color-risk: var(--color-rose-600);
  --color-risk-bg: var(--color-rose-50);

  --color-ai: var(--color-violet-600);
}

/* 2. The Variables (Zinc Protocol) */
:root {
  /* Light Mode (The Clinic) - Zinc 50 Base */
  --background: #FAFAFA; 
  --foreground: #18181B; /* Zinc 900 */
  --surface: #FFFFFF;
  --border-subtle: #E4E4E7; /* Zinc 200 */
}

/* Dark Mode (The Void) - Zinc 950 Base */
.dark {
  --background: #09090B; 
  --foreground: #E4E4E7; /* Zinc 200 */
  --surface: #18181B; /* Zinc 900 */
  --border-subtle: #27272A; /* Zinc 800 */
  
  /* Re-map brand colors for dark mode contrast */
  --color-brand: var(--color-teal-400);
  --color-risk: var(--color-rose-400);
}
```

**2. Usage in Components**
- Use semantic names: `bg-background`, `text-foreground`, `border-border-subtle`
- Use specific accents: `text-brand`, `bg-risk`

**3. Theme Toggle (next-themes)**
- `next-themes` injects `.dark` class on `<html>` element
- CSS variables in `.dark { ... }` override `:root` automatically
- Components just use `bg-background` - browser decides the color based on mode

---

## Quick Reference

```python
# Backend: Multi-tenant query
patients = await db.execute(
    select(Patient).where(Patient.organization_id == current_user.organization_id)
)

# Backend: Target entity routing
if template.target_entity == "LEAD":
    create_lead(...)
else:
    create_patient(...)
```

```tsx
// Frontend: Dynamic terminology
const { singular, plural } = useTerminology();
<h1>{plural}</h1>  // "Clientes" or "Pacientes"

// Frontend: i18n
const t = useTranslations('Dashboard');
<p>{t('welcome')}</p>
```

