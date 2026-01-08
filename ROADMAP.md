# Product Roadmap

> **Status**: Living Document (v1.6.4)  
> **Scope**: Strategic Feature Planning 2026  
> **Last Updated**: 2026-01-08 (The Identity Vault Complete)

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

### TIER 1.7: Q1-Q2 2026 (AletheIA Cerebral Upgrade) 🧠

> **Theme:** "From Wrapper to Engine" — Transforming Kura from an AI consumer to an AI producer.

#### 1.7.1 AutoSxS Model Evaluation Framework
**ADR:** [ADR-015](./docs/architecture/decisions/ADR-015-autosxs-model-evaluation.md)  
**Esfuerzo:** 2 semanas  
**Impacto:** Data-Driven Model Selection

**Contexto:** Actualmente seleccionamos modelos por intuición. Necesitamos evaluación científica.

**Implementación:**
- Vertex AI AutoSxS para comparación automatizada
- Golden Datasets por AletheIA Unit (SENTINEL, ORACLE, etc.)
- Win Rate metrics + explicaciones en lenguaje natural
- Promotion Gate: Modelo candidato debe superar baseline

**Prioridad:** 🟠 HIGH (Foundation for all AI improvements)

---

#### 1.7.2 Next-Gen Shield (Intelligent Safety + DLP)
**ADR:** [ADR-016](./docs/architecture/decisions/ADR-016-content-safety-and-dlp.md)  
**Esfuerzo:** 3 semanas  
**Impacto:** HIPAA/GDPR Compliance + Clinical Safety

**Contexto:** El Shield actual usa regex/listas negras. Fallos críticos en contexto clínico.

**Implementación:**
- **Layer 1 (Privacy):** Cloud DLP sanitiza PII antes del LLM
- **Layer 2 (Safety):** Vertex AI Safety Attributes detecta intención, no palabras
- Umbrales diferenciados: SENTINEL permite leer riesgo, bloquea generar daño
- InfoTypes españoles: DNI/NIE, direcciones, teléfonos

**Prioridad:** 🔴 CRITICAL (Bloqueante para Enterprise)

---

#### 1.7.3 Model Distillation Factory (SFT)
**ADR:** [ADR-017](./docs/architecture/decisions/ADR-017-supervised-fine-tuning.md)  
**Esfuerzo:** 6 semanas (ongoing)  
**Impacto:** 10x Cost Reduction + Proprietary IP

**Contexto:** Usamos modelos genéricos caros. Podemos entrenar especialistas con nuestros datos.

**Implementación:**
- LoRA Fine-Tuning sobre Gemini 2.5 Flash
- Naming: `kura-oracle-v2`, `kura-sentinel-v2`, etc.
- Ciclo virtuoso: Producción → Correcciones → Dataset → Retrain → Evaluación
- CorrectionCollector captura ediciones de terapeutas

| Unit | Base Model | Target Model | Objetivo |
|------|------------|--------------|----------|
| ORACLE | Flash 2.5 | `kura-oracle-v2` | Terminología DSM-5/CIE-11 |
| SENTINEL | Pro 2.5 | `kura-sentinel-v2` | Zero-tolerance falsos negativos |
| PULSE | Flash 2.5 | `kura-pulse-v2` | Tono cálido + sin alucinaciones médicas |

**Prioridad:** 🟠 HIGH (Competitive Moat)

---

#### 1.7.4 Clinical RAG Engine (Vector Search + Grounding)
**ADR:** [ADR-018](./docs/architecture/decisions/ADR-018-vector-search-memory.md)  
**Esfuerzo:** 4 semanas  
**Impacto:** Infinite Clinical Memory

**Contexto:** Los LLMs olvidan todo al cerrar sesión ("Amnesia Clínica").

**Implementación:**
- Vertex AI Vector Search con Hybrid Search (semántico + keywords)
- Ranking API elimina falsos positivos vectoriales
- Streaming Updates: memoria disponible en ~2 segundos
- Grounding: El LLM responde basado en documentos, no imaginación

**Arquitectura:**
```
Query → Embedding → Vector Search (50 candidates) → Reranker → Top 5 → LLM
```

**Prioridad:** 🟠 HIGH (Enables Long-Term Therapeutic Continuity)

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
│   ├── [2w] 🧠 AutoSxS Evaluation Framework (ADR-015)
│   ├── [3w] 🛡️ Next-Gen Shield (ADR-016)
│   └── [DONE] v1.5.9 Operation Cortex Completion
│
├── Q1-Q2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   ├── [6w] 🧬 Model Distillation Factory (ADR-017)
│   └── [4w] 🧠 Clinical RAG Engine (ADR-018)
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
| [ADR-015: AutoSxS Evaluation](./docs/architecture/decisions/ADR-015-autosxs-model-evaluation.md) | 🆕 PROPOSED | Q1 |
| [ADR-016: Next-Gen Shield](./docs/architecture/decisions/ADR-016-content-safety-and-dlp.md) | 🆕 PROPOSED | Q1 |
| [ADR-017: Model Distillation](./docs/architecture/decisions/ADR-017-supervised-fine-tuning.md) | 🆕 PROPOSED | Q1-Q2 |
| [ADR-018: Clinical RAG](./docs/architecture/decisions/ADR-018-vector-search-memory.md) | 🆕 PROPOSED | Q1-Q2 |

---

## Guiding Principles

1. **Prosperity is Clinical** — Financial health fuels clinical impact
2. **Agents, Not Tools** — AI is a teammate, not a feature
3. **Institutional Trust** — Hospital-grade security
4. **Radical Simplicity** — If it needs a manual, it's broken
