# 🗺️ KURA OS ROADMAP PROPOSAL v1.1+
## Documento para Revisión del Arquitecto
### Fecha: 24 Diciembre 2024
### Autor: GAG (Engineering) | Para: Arquitecto de Producto

---

## 📋 RESUMEN EJECUTIVO

Este documento consolida **9 ADRs** y múltiples features discutidas, organizadas por prioridad de implementación basada en:
1. **Impacto en Revenue** (€ directo)
2. **Esfuerzo de Desarrollo** (semanas)
3. **Dependencias Técnicas**

---

## 🎯 ESTADO ACTUAL: v1.0.1 (Producción)

**Features YA IMPLEMENTADAS:**
- ✅ Lead Fork (target_entity PATIENT/LEAD)
- ✅ Lead Stagnation Monitor (48h threshold)
- ✅ Ghost Detector (visual urgency en Lead Cards)
- ✅ WhatsApp Speed-to-Lead button (wa.me)
- ✅ Auto-Conversion Lead→Patient on booking
- ✅ Agent Personality (agent_config JSONB)
- ✅ Draft Mode (pending_actions + Human-in-the-loop)
- ✅ Chief of Staff (Audio Briefing con Gemini+TTS)
- ✅ Form Editor target_entity selector
- ✅ Agents Rebranding ("Agentes IA")
- ✅ LEAD_CREATED trigger
- ✅ Agente Concierge seed

---

## 🚀 PROPUESTA DE PRIORIZACIÓN

### TIER 1: Q1 2026 (INMEDIATO - Quick Wins)

#### 1.1 The Mycelium Protocol (Referidos) 🍄
**ADR:** No requiere (ya en ROADMAP)  
**Esfuerzo:** 2 semanas  
**Impacto:** CAC → 0  

**Implementación:**
- `referral_code` + `referred_by` en Organization
- Signup acepta `?ref=` param
- "Powered By Kura OS" en footers (Sanctuary, Booking, Emails)
- Dashboard: "Tu enlace de invitación" + stats
- Karma Credits (AletheIA credits como reward)

**Prioridad:** 🔴 CRITICAL (Growth Engine)

---

#### 1.2 Meta Cloud API - WhatsApp Migration
**ADR:** [ADR-004](./docs/adr/ADR-004-meta-cloud-api-integration.md)  
**Esfuerzo:** 3 semanas  
**Impacto:** Reducción 30-50% costos operativos  

**Implementación:**
- Facebook Business verification
- WhatsApp Business API approval
- Unified webhook `/webhooks/meta`
- Migrar de Twilio (keep as fallback)

**Prioridad:** 🔴 CRITICAL (Cost Reduction)

---

### TIER 2: Q2 2026 (Foundation)

#### 2.1 Membership Builder (El Netflix)
**ADR:** [ADR-005](./docs/adr/ADR-005-membership-builder.md)  
**Esfuerzo:** 6 semanas  
**Impacto:** MRR, Retention  

**Modelos:**
- MembershipPlan
- ContentLibrary
- PatientSubscription
- PlanContentAccess (M2M)

**Features:**
- Stripe subscriptions (mode=subscription)
- Creator Studio UI (drag & drop)
- Patient Library (Netflix view)
- MRR Dashboard card

**Prioridad:** 🟠 HIGH (Revenue Foundation)

---

#### 2.2 Smart Prescriptions (La Farmacia)
**ADR:** [ADR-006](./docs/adr/ADR-006-smart-prescriptions.md)  
**Esfuerzo:** 4 semanas  
**Impacto:** Clinical Value, Daily Usage  

**Modelos:**
- Prescription (con estados: SENT, OPENED, COMPLETED)
- ContentPrescription (acceso temporal)

**Features:**
- AI Matchmaker (tags → contenido sugerido)
- Magic Link (`kura.bio/p/rx/{token}`)
- Adherence tracking (progress %)
- Timeline integration (✅ Completado / ❌ Sin abrir)
- WhatsApp/Email delivery

**Prioridad:** 🟠 HIGH (Fastest Daily Value)

---

#### 2.3 Instagram Growth Module
**ADR:** [ADR-004](./docs/adr/ADR-004-meta-cloud-api-integration.md)  
**Esfuerzo:** 4 semanas  
**Impacto:** Lead Acquisition  

**Features:**
- Instagram DM ingestion
- Unified Lead Inbox
- Auto-Responder integration
- 24h window indicator

**Dependencia:** WhatsApp Migration primero

**Prioridad:** 🟡 MEDIUM (After WhatsApp)

---

### TIER 3: Q3-Q4 2026 (Polish & Retention)

#### 3.1 The Mirror (El Espejo)
**ADR:** [ADR-007](./docs/adr/ADR-007-the-mirror.md)  
**Esfuerzo:** 6 semanas  
**Impacto:** Churn Prevention  

**Features:**
- ProgressEngine service
- SoulReport model
- Sentiment trend chart
- Semantic shift (word clouds)
- "Spotify Wrapped" animated view
- PDF download

**Prioridad:** 🟡 MEDIUM (Quarterly feature)

---

#### 3.2 Time Capsule (La Esperanza)
**ADR:** [ADR-008](./docs/adr/ADR-008-time-capsule.md)  
**Esfuerzo:** 4 semanas  
**Impacto:** Emotional Retention  

**Features:**
- TimeCapsule model
- Audio/image upload
- Scheduled delivery (cron)
- "Time Travelled" reveal page
- Seal animation

**Prioridad:** 🟢 NICE-TO-HAVE (Cherry on top)

---

#### 3.3 Trinity Navigation (Nivel DIOS)
**ADR:** [ADR-009](./docs/adr/ADR-009-trinity-navigation.md)  
**Esfuerzo:** 3 semanas  
**Impacto:** UX, Cognitive Load  

**Cambios:**
- Reorganizar navegación en 3 pilares (Micelio/Clínica/Comunidad)
- Bento Grid Dashboard
- Focus Card (dynamic)
- Route migration

**Prioridad:** 🟡 MEDIUM (Can ship incrementally)

---

### TIER 4: 2027+ (Deferred)

#### 4.1 Database v2.0
**ADR:** [ADR-001](./docs/adr/ADR-001-database-v2-proposal.md)  
**Decisión:** DEFERRED  
**Razón:** Sin demanda de mercado inmediata  

---

#### 4.2 Cyber-Clinical Design System
**ADR:** [ADR-002](./docs/adr/ADR-002-design-system-proposal.md)  
**Decisión:** PHASED ADOPTION  
**Razón:** Complejidad de rewrite completo  

---

#### 4.3 Marketing Growth Engine
**ADR:** [ADR-003](./docs/adr/ADR-003-marketing-growth-engine.md)  
**Decisión:** DEFERRED  
**Razón:** Legal review (Content Alchemist), infra needs  

---

## 📊 VISTA DE TIMELINE

```
2026
├── Q1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   ├── [2w] Mycelium Protocol (Referidos)
│   ├── [3w] WhatsApp Business Migration
│   └── [--] Twilio deprecation
│
├── Q2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   ├── [6w] Membership Builder
│   ├── [4w] Smart Prescriptions
│   └── [4w] Instagram Growth
│
├── Q3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   ├── [6w] The Mirror (Progress Reports)
│   ├── [3w] Trinity Navigation (Phase 1)
│   └── [--] AletheIA Content Co-Pilot
│
└── Q4 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ├── [4w] Time Capsule
    ├── [2w] Trinity Navigation (Phase 2)
    └── [--] Polish & Optimization
```

---

## 💰 IMPACTO PROYECTADO

| Feature | Revenue Impact | Cost Impact |
|---------|---------------|-------------|
| Mycelium (Referidos) | CAC → ~€0 | - |
| WhatsApp Migration | - | -30% messaging costs |
| Membership Builder | +MRR | - |
| Smart Prescriptions | +Retention | - |
| Instagram Growth | +Leads | - |
| The Mirror | -Churn | - |

---

## 🔧 CONSIDERACIONES TÉCNICAS

**Dependencias Críticas:**
1. **Meta Cloud API** → Bloquea Instagram y mejora WhatsApp
2. **ContentLibrary** → Bloquea Smart Prescriptions
3. **MembershipPlan** → Bloquea Netflix features

**Riesgos:**
- Meta App Review puede tardar 2-4 semanas
- Stripe subscriptions requiere testing exhaustivo
- Route migration puede romper bookmarks

---

## ✅ RECOMENDACIÓN DEL INGENIERO

**Orden de ejecución sugerido:**

1. **Mycelium Protocol** (2 semanas) — ROI inmediato
2. **WhatsApp Migration** (3 semanas) — Reducción de costos
3. **Smart Prescriptions** (4 semanas) — Valor clínico diario
4. **Membership Builder** (6 semanas) — MRR foundation
5. **Instagram Growth** (4 semanas) — Después de Meta API
6. **Trinity Navigation** (incremental) — UX improvement
7. **The Mirror** (6 semanas) — Quarterly feature
8. **Time Capsule** (4 semanas) — Cherry on top

**Total estimado para el stack completo:** ~35 semanas (9 meses)

---

## 📎 ANEXOS

### Lista de ADRs
1. [ADR-001: Database v2.0](./docs/adr/ADR-001-database-v2-proposal.md) — DEFERRED
2. [ADR-002: Design System](./docs/adr/ADR-002-design-system-proposal.md) — DEFERRED
3. [ADR-003: Marketing Engine](./docs/adr/ADR-003-marketing-growth-engine.md) — DEFERRED
4. [ADR-004: Meta Cloud API](./docs/adr/ADR-004-meta-cloud-api-integration.md) — Q1-Q2 2026
5. [ADR-005: Membership Builder](./docs/adr/ADR-005-membership-builder.md) — Q2 2026
6. [ADR-006: Smart Prescriptions](./docs/adr/ADR-006-smart-prescriptions.md) — Q2 2026
7. [ADR-007: The Mirror](./docs/adr/ADR-007-the-mirror.md) — Q3 2026
8. [ADR-008: Time Capsule](./docs/adr/ADR-008-time-capsule.md) — Q4 2026
9. [ADR-009: Trinity Navigation](./docs/adr/ADR-009-trinity-navigation.md) — Q3 2026

### Guiding Principles (Updated Dec 24, 2024)
1. **Prosperity is Clinical** — Financial health fuels clinical impact
2. **Agents, Not Tools** — AI is a teammate, not a feature
3. **Institutional Trust** — Hospital-grade security
4. **Radical Simplicity** — If it needs a manual, it's broken

---

*Documento preparado para revisión del Arquitecto de Producto*  
*Fecha de expiración: Este documento es válido hasta que el Arquitecto lo apruebe o modifique.*
