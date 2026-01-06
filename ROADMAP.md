# Product Roadmap

> **Status**: Living Document (v1.3.6)  
> **Scope**: Strategic Feature Planning 2026  
> **Last Updated**: 2026-01-06 (v1.3.6 Release)

---

## 📋 Resumen Ejecutivo

Features prioritizadas por:
1. **Impacto en Revenue** (€ directo)
2. **Esfuerzo de Desarrollo** (semanas)
3. **Dependencias Técnicas**

---

## 🚀 Priorización
### TIER 1: Q1 2026 (INMEDIATO)

#### 1.1 Meta Cloud API - WhatsApp Migration
**ADR:** [ADR-004](./docs/architecture/decisions/ADR-004-meta-cloud-api-integration.md)  
**Esfuerzo:** 3 semanas  
**Impacto:** Reducción 30-50% costos operativos  

**Implementación:**
- Facebook Business verification
- WhatsApp Business API approval
- Unified webhook `/webhooks/meta`
- Migrar de Twilio (keep as fallback)

**Prioridad:** 🔴 CRITICAL (Cost Reduction)

---

### TIER 1.5: Q1 2026 (The Fortress - Structural Integrity)

> **Theme:** "Sovereignty by Design" — Hardening infrastructure for HIPAA/GDPR compliance.

#### 1.5.1 API Trinity Refactor (Modular Monolith)
**ADR:** [ADR-011](./docs/architecture/decisions/ADR-011-modular-monolith-api.md)  
**Esfuerzo:** 1.5 semanas  
**Impacto:** Security Boundaries + Developer Experience

**Objetivo:** Eliminar el "Monolith Sprawl" y establecer fronteras físicas de seguridad.

**Implementación:**
- **Reestructuración de Dominios (`backend/app/api/v1`):**
  - `core/` (Auth, Admin, Config) → Infraestructura Crítica
  - `connect/` (Leads, Forms) → Zona Pública (Marketing)
  - `practice/` (Patients, Clinical) → **Zona Blindada (HIPAA PHI)** 🔴
  - `grow/` (Analytics, Finance) → Zona de Negocio
  - `intelligence/` (AletheIA) → Motor Transversal
- **Beneficio:** Permite aplicar *AuditMiddlewares* estrictos solo a la carpeta `practice/`.

**Prioridad:** 🔴 CRITICAL (Bloqueante para Auditoría)

---

#### 1.5.2 The Panopticon (HIPAA Access Logs)
**Esfuerzo:** 2 semanas  
**Dependencia:** API Trinity Refactor  
**Impacto:** Compliance Legal & Enterprise Sales

**Contexto:** HIPAA exige registrar **accesos de lectura** (no solo escritura).

**Implementación:**
- Middleware de Auditoría aplicado exclusivamente al router `/practice`.
- Tabla inmutable `access_logs`: `who` (user), `what` (resource:id), `intent` (route), `timestamp`.
- Visor de auditoría en Admin Panel.

**Prioridad:** 🔴 CRITICAL

---

#### 1.5.3 The Shredder (GDPR Right to Erasure)
**Esfuerzo:** 2 semanas  
**Impacto:** Liability Reduction

**Contexto:** El "Soft Delete" (`is_deleted=True`) es insuficiente si un usuario ejerce su Derecho al Olvido.

**Implementación:**
- Endpoint `POST /api/v1/compliance/erasure/{id}`.
- **Protocolo de Destrucción:**
  1. **Sanitizar:** Mover patrones clínicos anónimos a `anonymous_datasets` (The Vault).
  2. **Destruir:** `DELETE` físico de registros con PII en `patients` y `clinical_entries`.
  3. **Certificar:** Generar PDF "Certificate of Erasure" como prueba legal.

**Prioridad:** 🟠 HIGH

---

### TIER 2: Q2 2026 (Foundation)

#### 2.1 Membership Builder (El Netflix)
**ADR:** [ADR-005](./docs/architecture/decisions/ADR-005-membership-builder.md)  
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
**ADR:** [ADR-006](./docs/architecture/decisions/ADR-006-smart-prescriptions.md)  
**Esfuerzo:** 4 semanas  
**Impacto:** Clinical Value, Daily Usage  

**Modelos:**
- Prescription (estados: SENT, OPENED, COMPLETED)
- ContentPrescription (acceso temporal)

**Features:**
- AI Matchmaker (tags → contenido sugerido)
- Magic Link (`kura.bio/p/rx/{token}`)
- Adherence tracking (progress %)
- Timeline integration
- WhatsApp/Email delivery

**Prioridad:** 🟠 HIGH (Fastest Daily Value)

---

#### 2.3 Instagram Growth Module
**ADR:** [ADR-004](./docs/architecture/decisions/ADR-004-meta-cloud-api-integration.md)  
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
**ADR:** [ADR-007](./docs/architecture/decisions/ADR-007-the-mirror.md)  
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
**ADR:** [ADR-008](./docs/architecture/decisions/ADR-008-time-capsule.md)  
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

### TIER 4: 2027+ (Deferred)

#### 4.1 Database v2.0
**ADR:** [ADR-001](./docs/architecture/decisions/ADR-001-database-v2-proposal.md)  
**Decisión:** DEFERRED  
**Razón:** Sin demanda de mercado inmediata  

---

## 📊 Timeline

```
2026
├── Q1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   ├── [3w] WhatsApp Business Migration
│   ├── [3w] WhatsApp Business Migration
│   └── [DONE] v1.3.6 Operation Open Heart (Async Refactor)
│
├── Q2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   ├── [6w] Membership Builder
│   ├── [4w] Smart Prescriptions
│   └── [4w] Instagram Growth
│
├── Q3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   └── [6w] The Mirror (Progress Reports)
│
└── Q4 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    └── [4w] Time Capsule
```

---

## 💰 Impacto Proyectado

| Feature | Revenue Impact | Cost Impact |
|---------|---------------|-------------|
| WhatsApp Migration | - | -30% messaging costs |
| Membership Builder | +MRR | - |
| Smart Prescriptions | +Retention | - |
| Instagram Growth | +Leads | - |
| The Mirror | -Churn | - |

---

## 🔧 Consideraciones Técnicas

**Dependencias Críticas:**
1. **Meta Cloud API** → Bloquea Instagram y mejora WhatsApp
2. **ContentLibrary** → Bloquea Smart Prescriptions
3. **MembershipPlan** → Bloquea Netflix features

**Riesgos:**
- Meta App Review puede tardar 2-4 semanas
- Stripe subscriptions requiere testing exhaustivo

---

## 📎 ADRs Relacionados

| ADR | Status | Target |
|:----|:-------|:-------|
| [ADR-001: Database v2.0](./docs/architecture/decisions/ADR-001-database-v2-proposal.md) | DEFERRED | 2027+ |
| [ADR-004: Meta Cloud API](./docs/architecture/decisions/ADR-004-meta-cloud-api-integration.md) | PLANNED | Q1-Q2 |
| [ADR-005: Membership Builder](./docs/architecture/decisions/ADR-005-membership-builder.md) | PLANNED | Q2 |
| [ADR-006: Smart Prescriptions](./docs/architecture/decisions/ADR-006-smart-prescriptions.md) | PLANNED | Q2 |
| [ADR-007: The Mirror](./docs/architecture/decisions/ADR-007-the-mirror.md) | PLANNED | Q3 |
| [ADR-008: Time Capsule](./docs/architecture/decisions/ADR-008-time-capsule.md) | PLANNED | Q4 |

---

## Guiding Principles

1. **Prosperity is Clinical** — Financial health fuels clinical impact
2. **Agents, Not Tools** — AI is a teammate, not a feature
3. **Institutional Trust** — Hospital-grade security
4. **Radical Simplicity** — If it needs a manual, it's broken
