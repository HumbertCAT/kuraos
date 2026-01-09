# Product Roadmap

> **v2.0** · Work Units · Updated 2026-01-09

---

## 📊 Ranking

| # | ID | Unidad | Score | Status |
|:-:|:---|:-------|------:|:-------|
| 1 | WU-016 | Next-Gen Shield | **34** | 🔵 BACKLOG |
| 2 | WU-022 | The Panopticon | **32** | 🔵 BACKLOG |
| 3 | WU-004 | Meta Cloud API | **28** | 🟡 READY |
| 4 | WU-017 | Model Distillation | **24** | 🔵 BACKLOG |
| 5 | WU-015 | AutoSxS Evaluation | **22** | 🔵 BACKLOG |
| 6 | WU-018 | Clinical RAG | **21** | 🔵 BACKLOG |
| 7 | WU-023 | The Shredder | **20** | 🔵 BACKLOG |
| 8 | WU-005 | Membership Builder | **18** | 🔵 BACKLOG |
| 9 | WU-006 | Smart Prescriptions | **16** | 🔵 BACKLOG |
| 10 | WU-004b | Instagram Growth | **12** | ⏸️ BLOCKED |
| 11 | WU-007 | The Mirror | **10** | 🔵 BACKLOG |
| 12 | WU-008 | Time Capsule | **6** | 🔵 BACKLOG |

**Scoring:** `(Revenue×3) + (Compliance×4) + (Unlocks×2) - (Effort×1.5) - (BlockedBy×2)`

---

##  Work Units

---
**Score: 34** · Size: M · Status: 🔵 BACKLOG  
Revenue: 2 · Compliance: 5 · Unlocks: 2 · Effort: 2 · BlockedBy: 0

### WU-016 · Next-Gen Shield

**ADR:** [ADR-016](./docs/architecture/decisions/ADR-016-content-safety-and-dlp.md)

- [ ] `PrivacyShield` con Cloud DLP
- [ ] `SemanticShield` con Vertex AI Safety
- [ ] Tests de bypass para contexto clínico

---
**Score: 32** · Size: M · Status: 🔵 BACKLOG  
Revenue: 0 · Compliance: 5 · Unlocks: 1 · Effort: 2 · BlockedBy: 0

### WU-022 · The Panopticon

**ADR:** [ADR-022](./docs/architecture/decisions/ADR-022-the-panopticon.md)

- [ ] Modelo `AccessLog` y migración
- [ ] `PanopticonMiddleware` para `/api/v1/practice/*`
- [ ] Admin viewer `/admin/audit/logs`

---
**Score: 28** · Size: M · Status: 🟡 READY  
Revenue: 2 · Compliance: 0 · Unlocks: 2 · Effort: 2 · BlockedBy: 0

### WU-004 · Meta Cloud API

**ADR:** [ADR-004](./docs/architecture/decisions/ADR-004-meta-cloud-api-integration.md)

- [ ] Unified webhook gateway `/webhooks/meta`
- [ ] Message normalization layer
- [ ] Twilio fallback handler

---
**Score: 24** · Size: XL · Status: 🔵 BACKLOG  
Revenue: 2 · Compliance: 0 · Unlocks: 0 · Effort: 8 · BlockedBy: 0

### WU-017 · Model Distillation

**ADR:** [ADR-017](./docs/architecture/decisions/ADR-017-supervised-fine-tuning.md)

- [ ] LoRA Fine-Tuning pipeline
- [ ] CorrectionCollector para feedback loop
- [ ] Promotion Gate con AutoSxS

---
**Score: 22** · Size: M · Status: 🔵 BACKLOG  
Revenue: 2 · Compliance: 0 · Unlocks: 1 · Effort: 2 · BlockedBy: 0

### WU-015 · AutoSxS Evaluation

**ADR:** [ADR-015](./docs/architecture/decisions/ADR-015-autosxs-model-evaluation.md)

- [ ] Pipeline AutoSxS
- [ ] Golden Datasets por Unit
- [ ] Dashboard de métricas

---
**Score: 21** · Size: L · Status: 🔵 BACKLOG  
Revenue: 3 · Compliance: 0 · Unlocks: 0 · Effort: 4 · BlockedBy: 0

### WU-018 · Clinical RAG

**ADR:** [ADR-018](./docs/architecture/decisions/ADR-018-vector-search-memory.md)

- [ ] Vertex AI Vector Search integration
- [ ] Hybrid Search (semántico + keywords)
- [ ] Ranking API + Streaming updates

---
**Score: 20** · Size: M · Status: 🔵 BACKLOG  
Revenue: 0 · Compliance: 3 · Unlocks: 0 · Effort: 2 · BlockedBy: 0

### WU-023 · The Shredder

- [ ] Endpoint `POST /compliance/erasure/{id}`
- [ ] Generador de certificados PDF
- [ ] Tests de completitud

---
**Score: 18** · Size: XL · Status: 🔵 BACKLOG  
Revenue: 4 · Compliance: 0 · Unlocks: 1 · Effort: 8 · BlockedBy: 0

### WU-005 · Membership Builder

**ADR:** [ADR-005](./docs/architecture/decisions/ADR-005-membership-builder.md)

- [ ] Modelos y migraciones
- [ ] Stripe subscription integration
- [ ] Creator Studio UI
- [ ] Patient portal library

---
**Score: 16** · Size: L · Status: 🔵 BACKLOG  
Revenue: 3 · Compliance: 0 · Unlocks: 0 · Effort: 4 · BlockedBy: 0

### WU-006 · Smart Prescriptions

**ADR:** [ADR-006](./docs/architecture/decisions/ADR-006-smart-prescriptions.md)

- [ ] Modelo Prescription con estados
- [ ] AI content matching
- [ ] Magic link generator
- [ ] WhatsApp/Email delivery

---
**Score: 12** · Size: L · Status: ⏸️ BLOCKED  
Revenue: 3 · Compliance: 0 · Unlocks: 0 · Effort: 4 · BlockedBy: 1

### WU-004b · Instagram Growth

**ADR:** [ADR-004](./docs/architecture/decisions/ADR-004-meta-cloud-api-integration.md)  
**Blocked By:** WU-004

- [ ] Instagram webhook handler
- [ ] DM → Lead conversion
- [ ] 24h window alerts

---
**Score: 10** · Size: XL · Status: 🔵 BACKLOG  
Revenue: 3 · Compliance: 0 · Unlocks: 0 · Effort: 8 · BlockedBy: 0

### WU-007 · The Mirror

**ADR:** [ADR-007](./docs/architecture/decisions/ADR-007-the-mirror.md)

- [ ] ProgressEngine + SoulReport model
- [ ] Visualización animada
- [ ] PDF generator

---
**Score: 6** · Size: L · Status: 🔵 BACKLOG  
Revenue: 3 · Compliance: 0 · Unlocks: 0 · Effort: 4 · BlockedBy: 0

### WU-008 · Time Capsule

**ADR:** [ADR-008](./docs/architecture/decisions/ADR-008-time-capsule.md)

- [ ] TimeCapsule model
- [ ] Scheduler job
- [ ] Reveal page con animación
