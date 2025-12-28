---
description: Scaffold a new feature following Trinity Architecture
---

# Create Feature Protocol

> **USE CASE:** Starting ANY new functionality (Widget, Page, Service).
> **GOAL:** Enforce Trinity Architecture & Semantic Integrity from Line 1.

---

## 🏗️ Phase 1: Architectural Definition (The Interview)

**Ask the user to define the Feature Domain:**

1. **Domain (MANDATORY FIRST QUESTION):**
   * **CONNECT** (CRM/Leads) → `apps/platform/app/[locale]/(dashboard)/leads/`
   * **PRACTICE** (Patients/Clinical) → `apps/platform/app/[locale]/(dashboard)/patients/`
   * **GROW** (Analytics/Marketing) → `apps/platform/app/[locale]/(dashboard)/analytics/`
   * **GLOBAL** (Shared/Cross-domain) → `apps/platform/components/`

2. **Type:**
   * **UI Component** → `components/{domain}/`
   * **Page/Route** → `app/[locale]/(dashboard)/{domain}/`
   * **Logic/Hook** → `hooks/` or `stores/`
   * **Backend Service** → `backend/app/services/{domain}/`

3. **State Strategy:**
   * Needs Global Clinical Context? → **Use `usePatientStore`**
   * Local UI state? → Use `useState` inside component

---

## 📝 Phase 2: The Scaffold (Files)

**Create files with "The Golden Rule" applied:**

### If UI Component (`.tsx`):
- Import `CyberCard` for containers
- Use `.type-h*` classes for headers
- Use `text-muted-foreground` for labels
- Use `lucide-react` for icons
- **NO hardcoded colors**

### If Page (`page.tsx`):
- **Server Component** by default
- Add `"use client"` only if interactive
- Async data fetching
- Metadata export (i18n aware)

### If Backend Service (`.py`):
- Filter by `organization_id`
- Use Pydantic models with `extra="ignore"`
- Soft delete for Patient-related entities

---

## 🌍 Phase 3: Integration

1. **Translations:** Add keys to `messages/{es,en,ca,it}.json`
2. **Exports:** Add to `components/index.ts` if applicable
3. **Navigation:** Update sidebar if new route

---

## ✅ Output

Confirm to user:
- 📂 Created: `path/to/NewFeature.tsx`
- 🎨 Style: Semantic Tokens applied
- 🧠 State: Strategy defined (Zustand/Server)
- 🌐 Domain: CONNECT | PRACTICE | GROW | GLOBAL
