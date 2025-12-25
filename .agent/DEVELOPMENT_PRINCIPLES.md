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

## 11. SEMANTIC DESIGN SYSTEM (Theming Protocol)

**Philosophy:** "Abstraction over Implementation". We style with **Intent**, not with Color.
**Core Objective:** The application must support instant re-theming (Light/Dark/Custom) via a future Admin Panel. This requires 100% abstraction.

### A. The Golden Rule: NO HARDCODED COLORS
It is **STRICTLY FORBIDDEN** to use raw color utility classes in components.

* ❌ **FORBIDDEN (Hardcoded):**
    * `bg-white`, `bg-black`, `bg-zinc-900`, `bg-[#0A0A0A]`
    * `text-white`, `text-zinc-500`, `text-teal-500`
    * `border-gray-200`, `border-zinc-800`

* ✅ **REQUIRED (Semantic Tokens):**
    * `bg-card`, `bg-background`, `bg-sidebar`
    * `text-foreground`, `text-muted-foreground`, `text-brand`
    * `border-border`, `border-input`

### B. The Token Dictionary (Tailwind v4)
All styles must be derived from `app/globals.css`.

| Area | Token Class | Purpose |
| :--- | :--- | :--- |
| **Lienzo Global** | `bg-background` | El fondo base de la página (App Shell). |
| **Contenedores** | `bg-card` | Tarjetas, paneles, bloques de contenido. |
| **Navegación** | `bg-sidebar` | Barra lateral izquierda (Trinity Nav). |
| **Cabeceras** | `bg-header` / `bg-card` | Barras superiores (Sticky Headers). |
| **Overlays** | `bg-popover` | Dropdowns, Modales, Tooltips. |
| **Inputs** | `bg-input` | Campos de texto, Search bars. |
| **Bordes** | `border-border` | Líneas estructurales genéricas. |
| **Acción Principal** | `bg-primary` | Botones principales (Tactical Look). |
| **Texto Base** | `text-foreground` | Texto principal de lectura. |
| **Texto Secundario**| `text-muted-foreground`| Metadatos, etiquetas, subtítulos. |

### C. Component Construction Rules

1.  **The "CyberCard" Standard:**
    * Always use the `<CyberCard>` component for containers.
    * If building a custom container, it MUST use `bg-card border-border text-card-foreground`.
    * **Never** assume a card is white or black. It is simply "Card Color".

2.  **Buttons (Tactical):**
    * Primary Actions: `bg-primary text-primary-foreground` (This handles the White/Black inversion automatically).
    * Secondary Actions: `bg-secondary text-secondary-foreground`.

3.  **Brand & Status:**
    * Use `text-brand` for the main identity color (Teal).
    * Use `text-risk` for alerts (Rose/Neon Red).
    * Use `text-ai` for Intelligence features (Violet).

### D. CSS Variables as Source of Truth
Configuration happens **ONLY** in `app/globals.css` inside `:root` and `.dark`.

**Example Configuration:**
```css
@import "tailwindcss";

/* Enable class-based dark mode (required for next-themes) */
@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-border: var(--border);
  --color-brand: var(--brand);
  --color-risk: var(--risk);
  --color-ai: var(--ai);
}

:root {
  /* Light Mode */
  --background: #F8FAFC;
  --foreground: #0F172A;
  --card: #FFFFFF;
  --border: #E2E8F0;
  --brand: #0D9488;
  --risk: #E11D48;
  --ai: #8b5cf6;
}

.dark {
  /* Dark Mode */
  --background: #09090b;
  --foreground: #E4E4E7;
  --card: #121212;
  --border: #27272a;
  --brand: #2DD4BF;
  --risk: #FB7185;
  --ai: #a78bfa;
}
```

### E. Typography System (Architect Stack)

| Role | Font | Use Case |
| :--- | :--- | :--- |
| **Serif** | `Playfair Display` | Elegant headings (h1-h6 default) |
| **Display** | `Space Grotesk` | Technical headers (`.font-display`) |
| **Body** | `Inter` | Content, paragraphs (default) |
| **Mono** | `JetBrains Mono` | Stats, IDs, timestamps, biomarkers |

### F. Theming Principle
* To change the app from "Zinc" to "Slate", we modify **ONLY** the CSS variables in `globals.css`.
* **NEVER** touch React components to change colors.
* Components use `bg-card` - whether that's white, gray, or purple is decided by the theme.

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

