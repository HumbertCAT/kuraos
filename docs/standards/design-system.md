# Design System

> **Status**: Production (v1.7.6)  
> **Aesthetic**: Organic No-White / Cyber-Clinical  
> **Last Updated**: 2026-01-12

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

## 5. Mobile & PWA Architecture

> **Updated:** v1.7.6 (2026-01-12)

### PWA Foundation

KURA OS is a **Progressive Web App** optimized for iOS/Android home screen installation.

#### Key Files

| File | Purpose |
|:---|:---|
| `public/manifest.json` | App name, icons, display mode |
| `public/sw.js` | Service Worker with cache strategy |
| `components/layout/PWAUpdater.tsx` | Update notification component |

#### PWA Manifest Configuration

```json
{
  "name": "Kura OS",
  "short_name": "Kura",
  "display": "standalone",
  "start_url": "/es/dashboard",
  "theme_color": "#040F10"
}
```

#### Service Worker (SKIP_WAITING Pattern)

The SW enables instant updates when user approves:

```javascript
// sw.js
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

#### PWAUpdater Component

Displays update modal when new version detected:
```tsx
<PWAUpdater />  // Added to root layout.tsx
```

---

### Breakpoint Strategy

KURA OS is **mobile-first** with progressive enhancement:

| Breakpoint | Width | Usage |
|:---|:---|:---|
| `sm` | 640px | Small tablets, compact cards |
| `md` | 768px | Tablets, small laptops |
| `lg` | 1024px | Laptops, full sidebar |
| `xl` | 1280px | Shows Observatory Sidebar |

---

### Mobile-First Patterns (v1.7.6)

#### Compact Card Variant

`VitalSignCard` supports a `compact` prop for mobile density:

```tsx
// Mobile: Inline, dense
<VitalSignCard compact icon={...} value="€1,200" trend={{...}} />

// Desktop: Full height with labels
<VitalSignCard icon={...} label="Revenue" value="€1,200" trend={{...}} />
```

#### Responsive Dual-Render Pattern

Show different layouts per breakpoint:

```tsx
{/* Mobile: Compact 3-col */}
<div className="grid grid-cols-3 gap-2 sm:hidden">
  <CompactCard />
</div>

{/* Desktop: Full cards */}
<div className="hidden sm:grid sm:grid-cols-3 gap-4">
  <FullCard />
</div>
```

#### Horizontal Snap Scroll (Kanban)

For Kanban/carousel layouts on mobile:

```tsx
<div className="flex lg:grid lg:grid-cols-4 gap-4 
                overflow-x-auto pb-4 
                snap-x snap-mandatory lg:snap-none
                -mx-4 px-4 lg:mx-0 lg:px-0">
  <div className="min-w-[280px] lg:min-w-0 snap-center">
    {/* Column content */}
  </div>
</div>
```

#### Safe Area Padding

For iOS notch/home indicator:

```tsx
<div className="pb-[env(safe-area-inset-bottom)] mb-4">
  <button className="w-full">Cargar más</button>
</div>
```

---

### Responsive Typography

#### PageHeader Pattern

```tsx
// Smaller on mobile, larger on desktop
<h1 className="text-xl lg:text-2xl font-serif">
  {title}
</h1>

// Hide subtitle on mobile
{subtitle && (
  <div className="hidden sm:block text-sm text-muted-foreground">
    {subtitle}
  </div>
)}
```

---

### Mobile Component Adaptation

| Component | Mobile | Desktop |
|:---|:---|:---|
| **Sidebar** | Hidden (hamburger menu) | Fixed left |
| **Observatory** | Hidden | `xl:flex` (right sidebar) |
| **VitalSignCards** | Compact 3-col row | Full height cards |
| **PageHeader** | `text-xl`, no subtitle | `text-2xl`, full subtitle |
| **Pagination** | "Load More" button | Full pagination toolbar |
| **Kanban** | Horizontal scroll | 4-col grid |
| **AletheiaHUD** | Stacked, inline score badge | 12-col grid layout |

---

### Touch Targets

All interactive elements must meet minimum touch size:

| Element | Minimum Size |
|:---|:---|
| Buttons | 44x44px |
| List items | 48px height |
| Icon buttons | 40x40px with padding |

```tsx
// Example: Large touch target
<button className="p-3 min-h-[44px] min-w-[44px]">
  <Icon size={20} />
</button>
```

---

### Mobile-First Classes Reference

```tsx
// Hide on mobile, show on desktop
className="hidden xl:flex"

// Full width on mobile, auto on desktop
className="w-full md:w-auto"

// Stack on mobile, row on desktop
className="flex flex-col md:flex-row"

// Compact on mobile, spacious on desktop
className="p-3 lg:p-5"

// Different text sizes
className="text-xl lg:text-2xl"
```

---

## 6. Component Patterns

### UI Physics (Tactile Quality)

| Element | Requirement |
|:---|:---|
| **Buttons** | `active:scale-95 transition-all` |
| **Cards** | `hover:bg-muted/50` for interactivity |
| **Dark Borders** | `border-white/5` for glass effect |

### Card Depth Standard (v1.4.14 - Diffuse Shadows)

All cards use the `.card` utility class with **super-diffuse shadows** that have no direction:

```css
/* Light Mode: Prominent diffuse shadow */
:root .card {
  box-shadow: 0 0 60px -15px rgba(0, 0, 0, 0.15),
              0 0 25px -5px rgba(0, 0, 0, 0.05);
}

/* Dark Mode: Subtle elevation glow */
.dark .card {
  box-shadow: 0 0 50px -20px rgba(0, 0, 0, 0.6);
  border-color: rgba(var(--border), 0.4);
}
```

### Interactive Cards

```tsx
className="card card-hover"  // Adds cursor + hover effects
```

| State | Light Mode | Dark Mode |
|:---|:---|:---|
| Hover | `border-brand/50 shadow-md` | `border-brand/30` + brand glow |

### Brand Button (`.btn-brand`)

The primary CTA button with premium feel:

```css
.btn-brand {
  @apply bg-brand text-white font-semibold;
  @apply shadow-lg shadow-brand/25;
  @apply hover:bg-brand/90 hover:shadow-xl hover:shadow-brand/30;
  @apply hover:-translate-y-0.5; /* Lift on hover */
  @apply active:scale-95; /* Clicky feel */
}
```

### Focus Rings

All inputs use brand-colored focus rings:

```css
input:focus-visible {
  @apply ring-2 ring-brand/50 border-brand;
}
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
