# ADR-009: Trinity Navigation & Bento Dashboard

**Status:** 🟡 PLANNED (UI Architecture Refactor)  
**Date:** 2024-12-24  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Navigation restructure from flat menu to lifecycle pillars  

---

## Summary

Reorganize app navigation into 3 lifecycle pillars + redesign dashboard with "Bento Grid" layout.

**Problem:** Current dashboard is a "junk drawer" — mixes billing, AI tasks, appointments without telling a story. An OS must give mental order.

**Solution:** Trinity structure = Customer Lifecycle Strategy

---

## The Trinity Navigation

```
┌─────────────────────────────────────┐
│ 🏠 Command Center                   │
├─────────────────────────────────────┤
│ 🍄 MICELIO (Attract)                │
│   ├─ CRM / Leads                    │
│   ├─ Tu Web (Sanctuary)             │
│   └─ La Red (Referrals)             │
├─────────────────────────────────────┤
│ 🩺 CLÍNICA (Treat)                  │
│   ├─ Pacientes                      │
│   ├─ Calendario                     │
│   └─ Servicios                      │
├─────────────────────────────────────┤
│ ♾️ COMUNIDAD (Retain)               │
│   ├─ Membresías                     │
│   ├─ Biblioteca / Prescriptions     │
│   └─ Cápsulas del Tiempo            │
├─────────────────────────────────────┤
│ 🤖 Equipo IA                        │
│ ⚙️ Ajustes                          │
└─────────────────────────────────────┘
```

---

## The 4 Dashboards Concept

| Dashboard | Purpose | Key Question |
|-----------|---------|--------------|
| **Command Center** | Eagle view | "Am I winning or losing today?" |
| **Micelio** | Sales view | Pipeline, conversion, traffic |
| **Clínica** | Operations | Agenda, pending notes, risks |
| **Comunidad** | Retention | MRR, churn, engagement |

---

## Command Center Redesign (Bento Grid)

### Layout Structure

```
┌──────────────────────────────────────────────────────┐
│ 🎙️ CHIEF OF STAFF AUDIO                    (span-12) │
│ "Buenos días, Humbert. Tienes el control."           │
├────────────────────────────────┬─────────────────────┤
│                                │ 🍄 MICELIO          │
│ 📍 FOCUS CARD                  │ 3 Leads Nuevos      │
│                                │ [Ver Pipeline]      │
│ Dynamic based on time:         ├─────────────────────┤
│ • Next appointment < 1h        │ 🩺 CLÍNICA          │
│ • Critical tasks               │ 4 Citas Hoy         │
│ • Pending approvals            │ ⚠️ 1 Riesgo Alto    │
│                          (8)   │ [Ir a Agenda]       │
│                                ├─────────────────────┤
│                                │ ♾️ COMUNIDAD        │
│                                │ 450€ MRR            │
│                                │ 2 Cápsulas hoy      │
│                                │ [Ver Retención] (4) │
└────────────────────────────────┴─────────────────────┘
```

### Focus Card Logic

```
if (nextAppointment.startsIn < 60min):
    show: Patient card + "Start Session" + last AI summary
else:
    show: Critical Tasks (approve agent draft, risk alerts)
```

---

## Route Structure

```
/dashboard                    → Command Center
/micelio/leads               → CRM
/micelio/profile             → Sanctuary/Web
/micelio/network             → Referrals
/clinic/patients             → Patients
/clinic/patients/[id]        → Patient Detail
/clinic/calendar             → Calendar
/clinic/services             → Services
/loyalty/memberships         → Membership Builder
/loyalty/library             → Content Library
/loyalty/capsules            → Time Capsules
/agents                      → AI Agents
/settings                    → Settings
```

---

## Visual Design

**Bento Style Cards:**
- `bg-white rounded-2xl shadow-sm border border-slate-100`
- Consistent headers: Icon + UPPERCASE title + `tracking-wider text-xs`
- Example: "🍄 MICELIO"

**Responsive:**
- Desktop: 12-column grid, Focus Card (8) + Pillar Stack (4)
- Mobile: Stack vertically (Focus → Micelio → Clínica → Comunidad)

---

## Implementation Phases

### Phase 1: Route Migration (1 week)
- [ ] Create new folder structure
- [ ] Move existing pages to new routes
- [ ] Update Sidebar component
- [ ] Add dividers and grouping

### Phase 2: Command Center (1 week)
- [ ] Bento Grid layout
- [ ] Focus Card (dynamic)
- [ ] Pillar Stats cards
- [ ] Mobile responsive

### Phase 3: Sub-Dashboards (2 weeks)
- [ ] Micelio Dashboard (pipeline view)
- [ ] Clínica Dashboard (operations)
- [ ] Comunidad Dashboard (retention metrics)

---

## Why This is "God Level"

- **Cognitive Clarity:** User knows where to go (Money → Micelio, Work → Clínica, Future → Comunidad)
- **Focus:** Dashboard only shows what matters NOW
- **Scalability:** New features have clear homes (Retreats → Clínica or Comunidad)

---

*This ADR restructures the entire navigation architecture for v1.1+*
