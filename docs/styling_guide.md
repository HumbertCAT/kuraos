# TherapistOS - CSS & Styling Architecture

This document describes where styles are defined and how they apply across the application.

---

## Style Sources

### 1. Global Styles (`frontend/app/globals.css`)

**Purpose:** Base styles and third-party library CSS.

**Contents:**
- Tailwind CSS import and theme configuration
- CSS custom properties (`:root` variables)
- **TipTap/ProseMirror editor styles** (130+ lines)
  - `.ProseMirror` base styling
  - Headings (h1-h3), paragraphs, lists
  - Bold, italic, blockquotes, code blocks
  - Text selection and focus states

**When to edit:** Adding styles for third-party libraries or global CSS rules.

---

### 2. Tailwind Classes (Inline)

**Purpose:** Component-level styling using utility classes.

**Location:** Directly in `.tsx` files via `className` props.

**Example:**
```tsx
<div className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
```

**When to use:** All component styling should use Tailwind utilities first.

---

### 3. Component-Specific Styles (`/components/ui/`)

**Purpose:** Reusable UI components with encapsulated styling.

| Component | Purpose |
|-----------|---------|
| `RichTextEditor.tsx` | TipTap wrapper with BubbleMenu |
| `MarkdownRenderer.tsx` | Read-only Markdown display |
| `IconRenderer.tsx` | Dynamic Lucide icon by name |
| `ElevatedCard.tsx` | Consistent card elevation |
| `Skeleton.tsx` | Loading state placeholders |
| `EmptyState.tsx` | Empty state with icon + CTA |

**When to add:** Creating new reusable UI patterns.

---

## IconRenderer Component

The `IconRenderer` component renders Lucide icons dynamically by name.

### Performance Optimization

Instead of importing all ~1000 Lucide icons, we use a curated registry:

```tsx
// components/IconRenderer.tsx
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
    ShieldAlert,
    Banknote,
    HeartHandshake,
    Zap,
    Mail,
    // ... only icons we actually use
};
```

### Usage

```tsx
import IconRenderer from '@/components/IconRenderer';

// Render icon by name from database
<IconRenderer name={rule.icon} className="w-6 h-6" />
```

### Adding New Icons

1. Import the icon at the top of `IconRenderer.tsx`
2. Add it to the `ICON_MAP` object
3. Use the exact Lucide icon name (PascalCase)

---

## TipTap Editor Styling

The TipTap/ProseMirror editor is "headless" - it has no default styles.

### Where Styles Apply

1. **globals.css** → `.ProseMirror` selector
   - Defines how rendered content looks (headings, lists, etc.)
   - Must be in globals.css because ProseMirror generates DOM at runtime

2. **RichTextEditor.tsx** → Component wrapper
   - Border, padding, focus ring
   - BubbleMenu positioning and button styling
   - Placeholder styling via extension config

### Key Selectors

```css
.ProseMirror { ... }           /* Base editor */
.ProseMirror h1 { ... }        /* Headings */
.ProseMirror ul { ... }        /* Lists */
.ProseMirror strong { ... }    /* Bold */
.ProseMirror ::selection { ... }  /* Text selection */
```

---

## Automation UI Styling

The Playbook Marketplace uses specific gradient patterns:

### Color Palette

| Element | Gradient |
|---------|----------|
| **Playbook Icon** | `from-violet-500 to-fuchsia-500` |
| **Active Toggle** | `bg-emerald-500` |
| **Condition Badge** | `bg-amber-50 text-amber-700` |
| **Action Badge** | `bg-emerald-50 text-emerald-700` |
| **Install Button** | `from-violet-500 to-fuchsia-500` |

### Card States

```tsx
// Active rule
className="border-emerald-200 shadow-sm"

// Inactive rule
className="border-slate-200"

// Marketplace hover
className="hover:border-violet-200 hover:shadow-md"
```

---

## Tailwind Configuration

**File:** `frontend/tailwind.config.ts`

**Plugins:**
- `@tailwindcss/typography` (prose classes) - *available but not actively used*

**Theme Extensions:**
- Custom colors defined in `:root` CSS variables
- Font configuration via `--font-sans`, `--font-mono`

---

## Best Practices

1. **Prefer Tailwind** for component styling
2. **Use globals.css** for third-party library styling (TipTap, etc.)
3. **Create components** in `/ui/` for reusable patterns
4. **WCAG compliance:** Ensure text contrast ratios (slate-800 on white = 7.5:1)
5. **Touch targets:** Minimum 44px for mobile buttons
6. **Use IconRenderer** for dynamic icons from database

---

## Quick Reference: Where to Add Styles

| Need | Location |
|------|----------|
| New component styling | Tailwind classes in component |
| TipTap content appearance | `globals.css` → `.ProseMirror` |
| Reusable UI pattern | New component in `/ui/` |
| Theme colors/fonts | `globals.css` → `:root` variables |
| Dynamic Lucide icon | Import in `IconRenderer.tsx` |
| Automation gradients | See Automation UI Styling section |

