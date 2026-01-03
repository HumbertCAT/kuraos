# ADR-002: Cyber-Clinical Design System

**Status:** 🟡 DEFERRED (Partial Implementation Recommended)  
**Date:** 2025-12-24  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** UX Evolution for Series-A Readiness  

---

## Summary

This ADR documents a comprehensive UI/UX overhaul proposal code-named **"Cyber-Clinical Interface"**. The vision is a Bloomberg Terminal-like experience for therapists: dark-first, data-dense, AI-integrated. After analysis, **incremental adoption** is recommended over full rewrite.

---

## Problem Statement

Current Kura OS v1.0 UI works but lacks:
1. **Visual Distinctiveness**: Looks like "another SaaS app"
2. **Information Density**: Therapists context-switch too much
3. **AI Integration**: AletheIA insights feel disconnected from workflow
4. **Power User Features**: No keyboard navigation, no density options

### The "Wellness Trap" Diagnosis

> "What I see is a competent B2C SaaS product. Clean, friendly, modern. The problem: It looks like a 'Coaching and Wellness' app, not a Clinical Operating System." — System Architect

| Issue | Current State | Impact |
|-------|--------------|--------|
| **Candy Palette** | Pink/fuchsia gradients | Signals "Lifestyle Startup" to MedTech investors |
| **Light Mode Only** | White/light gray backgrounds | Guaranteed visual fatigue for 6+ hour sessions |
| **Alert Design** | Massive red blocks | Displaces content instead of integrating intelligence |

---

## Design Philosophy

### "Radical Calm" + "Neo-Brutalist Clinical"
- Dark by default (reduce 8-hour fatigue)
- Swiss typography (precision, clarity)
- Bioluminescent accents (subtle glows for attention)

---

## Design Specifications

### 1. Color Palette: "Deep Void"

```typescript
// tailwind.config.ts
colors: {
  // BACKGROUNDS: Obsidian, not pure black
  background: {
    DEFAULT: '#09090B',  // Zinc-950 base
    card: '#121212',     // Lighter for card density
    elevated: '#1A1A1D'  // Modals/Floaters
  },
  
  // PRIMARY: "Kura Teal" - Clinical trust + Future
  primary: {
    DEFAULT: '#0D9488',     // Teal-600
    foreground: '#F0FDFA',
    glow: 'rgba(13, 148, 136, 0.5)'
  },
  
  // STATES: Functional, not decorative
  status: {
    risk: '#9F1239',      // Rose-800 (Suicide/Critical)
    stagnant: '#B45309',  // Amber-700 (Alert)
    flow: '#047857',      // Emerald-700 (Progress)
    neutral: '#52525B'    // Zinc-600 (Inactive)
  },
  
  // AI LAYER: AletheIA's signature
  aletheia: {
    DEFAULT: '#7C3AED',   // Violet-600
    subtle: '#2E1065'     // Violet-950 (Chat backgrounds)
  }
}
```

**Rule**: Color only for directing attention (alerts, CTAs, data). Everything else is monochrome Zinc scale.

---

### 2. Layout: "Cockpit" Architecture

```
┌──────────┬─────────────────────────┬──────────────┐
│ Sidebar  │      Main Stage         │ Intelligence │
│  (60px   │   (The Focus Area)      │    Rail      │
│ /240px)  │                         │   (350px)    │
│          │                         │  [AletheIA]  │
└──────────┴─────────────────────────┴──────────────┘
```

| Component | Spec |
|-----------|------|
| **Sidebar** | 60px collapsed / 240px expanded. Lucide icons (stroke-width: 1.5) |
| **Main Stage** | Primary work area (notes, calendar, forms) |
| **Intelligence Rail** | Collapsible panel for AI context, history, biomarkers |

---

### 3. Typography

| Element | Font | Weight | Tracking |
|---------|------|--------|----------|
| **Headlines** | Geist Sans (or Inter) | Medium | -0.02em |
| **Body** | Geist Sans | Regular | Normal |
| **Data/Numbers** | Geist Mono | Regular | Normal |

Monospaced for clinical data adds precision: `$120.00`, `Score: 8.5`, `PHQ-9: 12`

---

### 4. Critical Components

#### A. Waiting Room (Digital Radar)
Patient cards with real-time awareness:
- **Pulse Effect**: Card border "beats" (`animate-pulse`) when patient checks in
- **Waveform Indicator**: Small graph showing voice analysis
  - Green/flat = Calm
  - Red/agitated = Anxiety detected

> **Dependencies**: Biomarkers Schema (ADR-001), Real-time voice analysis API

#### B. Soul Record Header (360° Profile)
Replace traditional patient header with hero-style component:
- Large avatar with risk-level ring indicator
- **Journey Bar**: Segmented progress (Lead → Intake → Active → Integration)
- **Quick Actions**: Floating chips (WhatsApp, Call, Email)

#### C. AletheIA Insights Card
AI presentation that doesn't feel like a chatbot:
```css
.aletheia-card {
  background: rgba(46, 16, 101, 0.3); /* aletheia-subtle/30 */
  backdrop-filter: blur(12px);
}
```
- Speaks only when asked OR when critical risk detected
- Risk detection shows as subtle `border-status-risk` on input field, not popup

---

### 5. UX Behaviors

#### Optimistic UI
```typescript
// Don't wait for server
const saveNote = async (content: string) => {
  setStatus('saved'); // Instant feedback
  await api.notes.save(content); // Sync background
};
```

#### Skeleton Loading
No spinners. Use pulsing blocks that mirror content shape:
```tsx
<div className="animate-pulse bg-zinc-800 h-4 w-3/4 rounded" />
```

#### Command-K Menu (Spotlight)
Implementation: `cmdk` from shadcn/ui
```
Cmd+K → "Mar..." → Enter (Opens María's profile) → N (New note)
```

#### Density Toggle
Settings switch: **Comfort** (spacious) vs **Compact** (spreadsheet-like for power users)

---

### 6. Implementation Guidelines

```markdown
**For Development Team:**

- Radius: 0.5rem (rounded-lg). Not too square, not too round.
- Shadows: Eliminate diffuse shadows. Use subtle borders (border-zinc-800).
- Icons: lucide-react, stroke-width 1.5px
- Charts: Recharts with theme colors (no defaults)
- Motion: framer-motion, max 0.2s, easeInOutQuad (snappy, not floaty)
```

---

## Decision: PHASED ADOPTION

### Risks of Full Rewrite
1. **Mobile Unknown**: Proposal doesn't address responsive. 40% usage may be mobile.
2. **User Disruption**: Radical UI change disorients existing users.
3. **Performance**: Glassmorphism + blur can lag on older hardware.
4. **Testing Gap**: Need Storybook documentation before implementing.

### Recommended Implementation Order

| Phase | Feature | Effort | Value | Risk |
|-------|---------|--------|-------|------|
| **Q1 2026** | Semantic color tokens | 3 days | Medium | Low |
| **Q1 2026** | Optimistic UI + Skeletons | 1 week | High | Low |
| **Q2 2026** | AletheIA Card (glassmorphism) | 1 week | High | Low |
| **Q2 2026** | Soul Record Header | 2 weeks | Medium | Medium |
| **Q3 2026** | Command-K navigation | 1 week | Medium | Low |
| **Future** | Intelligence Rail (3-col layout) | 1 month+ | High | High |
| **v3.0+** | Waiting Room with waveforms | 2 months+ | Wow | High |

---

## Prerequisites

### Before Any Implementation
- [ ] Create Storybook instance for component documentation
- [ ] Define responsive breakpoints for mobile adaptation
- [ ] Performance benchmark current vs glassmorphism
- [ ] User research: Do therapists WANT dark mode?

### For Intelligence Rail
- [ ] WebSocket infrastructure for real-time updates
- [ ] Refactor dashboard layout component
- [ ] Mobile fallback strategy (drawer? bottom sheet?)

### For Waiting Room
- [ ] Biomarkers Schema (ADR-001)
- [ ] Voice analysis API integration
- [ ] Real-time event system

---

## What To Implement NOW (v1.x)

These require no dependencies and improve UX immediately:

1. **Semantic color tokens** in `tailwind.config.ts`
2. **Skeleton loading** replacing spinners
3. **Optimistic UI** for form saves
4. **Dark mode as option** (not replacing light mode)

---

## Annex A: Reference Implementation

The following component demonstrates the "Quantum Leap" from current UI to Cyber-Clinical v2.0. This is a **reference implementation** for the Patient Profile screen, showing the full Design System applied.

### CyberPatientProfile.tsx

```tsx
import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Mic, 
  BrainCircuit, 
  Calendar, 
  Clock, 
  MessageSquare, 
  ChevronRight, 
  MoreHorizontal,
  Phone,
  Mail,
  Zap,
  Search
} from 'lucide-react';

/**
 * KURA OS DESIGN SYSTEM v2.0 - CYBER-CLINICAL
 * 
 * Palette Strategy:
 * - Background: Zinc-950 (#09090B) - The Void
 * - Surface: Zinc-900/50 (#18181B) - Glass Panels
 * - Border: Zinc-800 (#27272A) - Structural Lines
 * - Text Main: Zinc-200 (#E4E4E7) - High Readability
 * - Text Muted: Zinc-500 (#71717A) - Metadata
 * - Accent: Teal-500 (#14B8A6) - Kura Identity
 * - Danger: Rose-500 (#F43F5E) - Clinical Risk
 * - Warning: Amber-500 (#F59E0B) - Stagnation
 */

const CyberPatientProfile = () => {
  return (
    <div className="flex h-screen w-full bg-[#09090B] text-zinc-300 font-sans overflow-hidden selection:bg-teal-900 selection:text-white">
      
      {/* 1. TACTICAL SIDEBAR (Simulated for context) */}
      <aside className="w-16 flex-shrink-0 border-r border-zinc-800 bg-[#09090B] flex flex-col items-center py-6 gap-6 z-20">
        <div className="w-8 h-8 rounded-full bg-teal-900/30 border border-teal-500/50 flex items-center justify-center text-teal-400">
          <Zap size={16} fill="currentColor" />
        </div>
        <nav className="flex flex-col gap-6 mt-4">
          <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-100"><Activity size={20} /></div>
          <div className="p-2 text-zinc-600 hover:text-zinc-400"><Calendar size={20} /></div>
          <div className="p-2 text-zinc-600 hover:text-zinc-400"><MessageSquare size={20} /></div>
        </nav>
      </aside>

      {/* 2. MAIN STAGE (The Work Area) */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
        
        {/* HEADER: COMMAND CENTER */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-medium text-white tracking-tight">
              Javier Roca <span className="text-zinc-500 font-mono text-sm ml-2">#PT-4921</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-rose-950/30 text-rose-400 border border-rose-900">
              HIGH RISK
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-sm text-zinc-500 gap-2">
              <Search size={14} />
              <span className="font-mono text-xs">CMD+K</span>
            </div>
            <button className="h-8 px-3 bg-zinc-100 text-zinc-950 hover:bg-white text-sm font-medium rounded transition-colors">
              Start Session
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* PATIENT 360 CARD */}
            <section className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-8 flex items-start gap-5">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-medium text-zinc-400 relative">
                  JR
                  {/* Status Indicator Ring */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#09090B] rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 hover:text-white transition-colors">
                      <Phone size={12} /> Call
                    </button>
                    <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 hover:text-white transition-colors">
                      <Mail size={12} /> Email
                    </button>
                    <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 hover:text-white transition-colors">
                      <MessageSquare size={12} /> WhatsApp
                    </button>
                  </div>

                  {/* Stealth Journey Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider">
                      <span>Journey: Retiro Ibiza 2025</span>
                      <span className="text-amber-500">Stagnation Alert</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                      <div className="h-full bg-teal-600 w-1/4 shadow-[0_0_10px_rgba(20,184,166,0.4)]"></div>
                      <div className="h-full bg-zinc-800 w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CLINICAL TIMELINE (The Feed) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Activity size={16} className="text-teal-500" />
                  Clinical Timeline
                </h2>
                <div className="h-px flex-1 bg-zinc-800 ml-4"></div>
              </div>

              {/* CRITICAL EVENT CARD (Redesigned Alert) */}
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-600 rounded-l-md"></div>
                <div className="bg-zinc-900/40 border border-zinc-800 border-l-0 rounded-r-md p-4 hover:bg-zinc-900/60 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-rose-400">
                      <ShieldAlert size={16} />
                      <span className="text-sm font-medium">Critical Risk Detected</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-600">Today, 09:41 AM</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Patient expressed severe anguish via WhatsApp voice note. Keywords detected: "no veo salida", "todo oscuro". 
                    <span className="text-rose-400 hover:underline cursor-pointer ml-1">View Transcription</span>
                  </p>
                </div>
              </div>

              {/* STANDARD NOTE (The "Radical Calm" Look) */}
              <div className="relative pl-6 border-l border-zinc-800 ml-2 py-2">
                <div className="absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-600"></div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-zinc-200">Session Note #42</span>
                    <span className="text-xs font-mono text-zinc-500">Dec 12</span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-400">
                    <p>Standard integration session. Patient reported improved sleep patterns but continued resistance to discussing family dynamics...</p>
                  </div>
                </div>
              </div>

            </section>
          </div>
        </div>
      </main>

      {/* 3. INTELLIGENCE RAIL (The HUD) */}
      <aside className="w-80 border-l border-zinc-800 bg-[#0C0C0E] flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-violet-400 mb-1">
            <BrainCircuit size={16} />
            <span className="text-xs font-bold tracking-wider uppercase">AletheIA Observatory</span>
          </div>
          <p className="text-[10px] text-zinc-500">Real-time inference active</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* RISK GAUGE */}
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Activity size={64} />
            </div>
            <span className="text-xs font-mono text-zinc-500 block mb-1">CURRENT RISK SCORE</span>
            <div className="text-3xl font-mono font-medium text-rose-500 mb-2">-0.90</div>
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-rose-600 to-rose-400 w-[90%] h-full"></div>
            </div>
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Trending Negative (72h)
            </p>
          </div>

          {/* AI INSIGHTS LIST */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Latest Inference</h3>
            
            <div className="p-3 rounded-md bg-violet-950/10 border border-violet-900/30">
              <div className="flex items-center gap-2 mb-2 text-violet-400">
                <Mic size={14} />
                <span className="text-xs font-medium">Voice Analysis</span>
              </div>
              <p className="text-xs text-zinc-400 leading-snug">
                Tone indicates <span className="text-zinc-200">high flatness</span> and <span className="text-zinc-200">latency</span> in response. Correlation with depressive episode: 85%.
              </p>
            </div>

            <div className="p-3 rounded-md bg-zinc-900 border border-zinc-800">
               <div className="flex items-center gap-2 mb-2 text-teal-500">
                <Activity size={14} />
                <span className="text-xs font-medium">Biomarkers (Oura)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="block text-[10px] text-zinc-500">HRV</span>
                  <span className="text-sm font-mono text-zinc-300">22ms</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="block text-[10px] text-zinc-500">Sleep</span>
                  <span className="text-sm font-mono text-zinc-300">4h 12m</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* AI ACTION FOOTER */}
        <div className="p-4 border-t border-zinc-800 bg-[#09090B]">
          <button className="w-full py-2 bg-zinc-100 hover:bg-white text-black text-xs font-bold uppercase tracking-wide rounded transition-colors flex items-center justify-center gap-2">
            <BrainCircuit size={14} />
            Generate Clinical Summary
          </button>
        </div>
      </aside>
    </div>
  );
};

export default CyberPatientProfile;
```

### Key Patterns Demonstrated

| Pattern | Location in Code | Purpose |
|---------|------------------|---------|
| **Glow Shadow** | `shadow-[0_0_8px_rgba(244,63,94,0.6)]` | Bioluminescent risk indicator |
| **Glass Header** | `backdrop-blur-md` | Depth without heavy shadows |
| **Stealth Progress** | `bg-zinc-900` base + `bg-teal-600` fill | Subdued journey bar |
| **Risk Sidebar** | `border-l-rose-600` accent | Non-intrusive alert integration |
| **Monospace Data** | `font-mono` on scores/IDs | Clinical precision |

---

## References

- Original proposal: System Architect (December 2025)
- Analysis: GAG Engineering Review
- Design inspiration: Bloomberg Terminal, Linear, Vercel Dashboard
- Related: [ADR-001: Database v2.0](./ADR-001-database-v2-proposal.md)

---

*This ADR will be revisited during Q1 2026 planning.*
