# Theme System Documentation

## Overview

KURA OS uses a **semantic CSS variable system** for theming. All colors are defined as CSS custom properties (variables) that can be customized per-organization.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Theme Priority                       │
├─────────────────────────────────────────────────────────┤
│  1. Organization theme_config (per-tenant override)     │
│  2. GLOBAL_THEME (system setting, superuser-controlled) │
│  3. CSS defaults (globals.css :root variables)          │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### Saving Themes (Admin Panel)
- **Location:** `/admin?tab=theme`
- **Access:** Only users with admin panel access
- **Superuser Behavior:** When superuser saves, GLOBAL_THEME is also updated automatically
- **Storage:** `organizations.theme_config` (JSONB field)

### Loading Themes (Page Load)
1. `auth/me` endpoint returns `organization.theme_config` and `global_theme`
2. `ThemeHydration` component applies `effectiveTheme = org.theme_config || global_theme`
3. CSS variables are injected via `document.documentElement.style.setProperty()`

## Editable Tokens

| Category | Token | Label | Default |
|----------|-------|-------|---------|
| **Base** | `--background` | App Background | `#0f0f24` |
| **Base** | `--foreground` | Main Text | `#fafafa` |
| **Base** | `--card` | Card Surface | `#121212` |
| **Base** | `--border` | Structural Borders | `#27272a` |
| **Navigation** | `--sidebar` | Sidebar Background | `#09090b` |
| **Navigation** | `--sidebar-foreground` | Sidebar Text | `#a1a1aa` |
| **Navigation** | `--sidebar-border` | Sidebar Border | `#27272a` |
| **Brand** | `--brand` | Primary Brand (Teal) | `#2dd4bf` |
| **Brand** | `--risk` | Risk/Error (Red) | `#fb7185` |
| **Brand** | `--ai` | Intelligence (Violet) | `#a78bfa` |
| **Brand** | `--primary` | Main Action Buttons | `#fafafa` |
| **Feedback** | `--success` | Success (Green) | `#34d399` |
| **Feedback** | `--warning` | Warning (Amber) | `#fbbf24` |
| **Feedback** | `--destructive` | Destructive (Red) | `#7f1d1d` |

## Typography

| Token | Font Family | Usage |
|-------|-------------|-------|
| `--font-display` | Space Grotesk | Headers, Titles, Navigation |
| `--font-serif` | Playfair Display | Elegant accents, Patient names |
| `--font-body` | Inter | Body text, UI labels, Forms |
| `--font-mono` | JetBrains Mono | Code, Data, Technical values |

**Tailwind Classes:**
- `font-display` → Space Grotesk (Bold headers)
- `font-serif` → Playfair Display (Elegant touch)
- `font-body` → Inter (Default readable)
- `font-mono` → JetBrains Mono (Stats, codes)

## API Endpoints

### Save Theme
```
PATCH /api/v1/admin/organizations/{org_id}/theme
Body: { "theme_config": { "--brand": "#2dd4bf", ... } }
```

### Get Theme (with auth/me)
```
GET /api/v1/auth/me
Response: { user, organization: { theme_config }, global_theme }
```

## Database Schema

```sql
-- Per-organization theme
ALTER TABLE organizations ADD COLUMN theme_config JSONB;

-- Global default theme
INSERT INTO system_settings (key, value, description) 
VALUES ('GLOBAL_THEME', '{"--brand": "#2dd4bf", ...}', 'Default theme for all organizations');
```

## Roadmap (v1.1+)

- [ ] Allow non-admin users to customize their org theme (requires new role/permission)
- [ ] Theme presets (Dark, Light, High Contrast)
- [ ] Export/Import theme configurations
- [ ] Preview mode without saving
