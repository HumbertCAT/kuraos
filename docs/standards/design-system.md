# Design System

> **Status**: Production (v1.1.20)  
> **Aesthetic**: Organic No-White / Cyber-Clinical  
> **Last Updated**: 2026-01-03

---

## 1. Philosophy

### The Organic Aesthetic (v1.1.19+)

KURA OS uses a **soft, organic palette** that avoids harsh whites and pure blacks. This reduces eye strain for clinical professionals working long hours.

| ❌ OLD (Harsh) | ✅ NEW (Organic) |
|:---|:---|
| `#FFFFFF` (Pure White) | `#FAF9F6` (Soft Parchment) |
| `#000000` (Pure Black) | `#040F10` (The Void - Teal-tinted) |
| `#121212` (Flat Dark) | `#0C1414` (Teal-Lifted Cards) |

### The Zinc Protocol (Core Rule)

> **Semantic over Hardcoded. Always.**

| ❌ FORBIDDEN | ✅ REQUIRED |
|:---|:---|
| `bg-white` | `bg-card` |
| `text-gray-500` | `text-muted-foreground` |
| `bg-[#F3F4F6]` | `bg-muted` |
| `text-[14px]` | `.type-body` |

---

## 2. Dark/Light Mode Handling

### Architecture

KURA OS uses **class-based dark mode** via `next-themes`:

```css
/* globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

### How It Works

1. **next-themes** adds `.dark` class to `<html>` based on user preference
2. CSS variables in `.dark {}` block override `:root` values
3. Components use semantic tokens that automatically adapt

### Theme Priority Cascade

```
┌─────────────────────────────────────────────────────────┐
│                    Theme Priority                       │
├─────────────────────────────────────────────────────────┤
│  1. Organization theme_config (per-tenant override)     │
│  2. data-theme attribute (OCEAN, SUNSET presets)        │
│  3. .dark class (light/dark toggle)                     │
│  4. :root defaults (globals.css)                        │
└─────────────────────────────────────────────────────────┘
```

### Theme Presets

| Preset | Light Background | Dark Background | Brand Color |
|:---|:---|:---|:---|
| **DEFAULT** | `#FAF9F6` Parchment | `#040F10` Void | `#247C7D` Teal |
| **OCEAN** | `#F0F9FF` Sky | `#0C1929` Deep Blue | `#0EA5E9` Sky Blue |
| **SUNSET** | `#FFFBEB` Amber | `#1C1410` Warm Dark | `#F59E0B` Amber |

---

## 3. The Palette (Current Production Values)

### Light Mode (The Clinic)

| Token | Value | Purpose |
|:---|:---|:---|
| `--background` | `#FAF9F6` | Soft Parchment canvas |
| `--foreground` | `#1A1A14` | Matted Earth text |
| `--sidebar` | `#F2F1EC` | Structured framing |
| `--card` | `#FFFEFB` | Bone White surfaces |
| `--border` | `#E5E4DB` | Soft Earth dividers |
| `--muted` | `#F2F1EC` | Subtle backgrounds |
| `--muted-foreground` | `#78716C` | Secondary text |

### Dark Mode (The Void)

| Token | Value | Purpose |
|:---|:---|:---|
| `--background` | `#040F10` | Central Void (teal-tinted) |
| `--foreground` | `#F2F2EB` | Warm off-white text |
| `--sidebar` | `#020606` | Deep Root sidebar |
| `--card` | `#0C1414` | Teal-Lifted surfaces |
| `--border` | `#142020` | Teal-tinted dividers |
| `--muted` | `#111C1C` | Subtle dark backgrounds |
| `--muted-foreground` | `#94A3B8` | Slate secondary text |

### Brand & Status (Both Modes)

| Token | Light | Dark | Purpose |
|:---|:---|:---|:---|
| `--brand` | `#247C7D` | `#247C7D` | Official KURA OS Teal |
| `--brand-hover` | `#0D6769` | `#0D6769` | Hover state |
| `--risk` | `#E11D48` | `#FB7185` | Crisis/Error |
| `--success` | `#059669` | `#34D399` | Success states |
| `--warning` | `#D97706` | `#FBBF24` | Warning states |
| `--ai` | `#7C3AED` | `#A78BFA` | AletheIA/Intelligence |

---

## 4. Typography

### Font Stack

| Token | Font | Usage |
|:---|:---|:---|
| `--font-serif` | Playfair Display | H1, H2 only (elegant headings) |
| `--font-display` | Space Grotesk | H3+, technical headers |
| `--font-body` | Inter | Body text, UI labels |
| `--font-mono` | JetBrains Mono | Stats, code, data |

### Type Scale Classes

| Class | Font | Usage |
|:---|:---|:---|
| `.type-h1` | Serif | Page titles only |
| `.type-h2` | Display | Section headers (uppercase, tracked) |
| `.type-body` | Body | Content paragraphs |
| `.type-ui` | Body | Buttons, labels, small text |
| `.font-mono` | Mono | Numbers, identifiers |

---

## 5. Mobile Responsiveness

### Breakpoint Strategy

KURA OS is **mobile-first** with progressive enhancement:

| Breakpoint | Width | Usage |
|:---|:---|:---|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets, small laptops |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Shows Observatory Sidebar |

### Key Mobile Patterns

| Component | Mobile | Desktop |
|:---|:---|:---|
| **Sidebar** | Hidden (hamburger menu) | Fixed left |
| **Observatory** | Hidden | `xl:flex` (right sidebar) |
| **Tables** | Horizontal scroll | Full width |
| **Header Navigation** | Condensed | Full menu |
| **Touch Targets** | Minimum 44px | Standard sizing |

### Mobile-First Classes

```tsx
// Example: Hide on mobile, show on desktop
className="hidden xl:flex"

// Example: Full width on mobile, constrained on desktop
className="w-full md:w-auto"

// Example: Stack on mobile, row on desktop
className="flex flex-col md:flex-row"
```

---

## 6. Component Patterns

### UI Physics (Tactile Quality)

| Element | Requirement |
|:---|:---|
| **Buttons** | `active:scale-95 transition-all` |
| **Cards** | `hover:bg-muted/50` for interactivity |
| **Dark Borders** | `border-white/5` for glass effect |

### Card Depth Standard (Sovereign Card v1.1.21)

All cards use centralized shadow depth:

```tsx
className="card"  // Uses .card utility class
// OR
className="bg-card border border-border rounded-xl shadow-sm"
```

---

## 7. Theming Engine (Admin)

### Admin Panel Configuration
**Location**: `/admin?tab=theme`

### API Endpoints

```bash
# Save theme
PATCH /api/v1/admin/organizations/{org_id}/theme
Body: { "theme_config": { "--brand": "#247C7D" } }

# Get theme (included in auth)
GET /api/v1/auth/me → { organization.theme_config, global_theme }
```

### Runtime Injection

`ThemeHydration.tsx` applies theme via:
```ts
document.documentElement.style.setProperty('--brand', value)
```

---

## 8. Key Files Reference

| File | Purpose |
|:---|:---|
| `apps/platform/app/globals.css` | All CSS variables, theme presets |
| `apps/platform/tailwind.config.ts` | Tailwind theme extensions |
| `apps/platform/components/theme/ThemeHydration.tsx` | Runtime injection |
| `apps/platform/components/theme/ThemeProvider.tsx` | next-themes wrapper |
