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
**Score: 28** · Size: M · Status: 🟢 IN PROGRESS  
Revenue: 2 · Compliance: 0 · Unlocks: 2 · Effort: 2 · BlockedBy: 0

### WU-004 · Meta Cloud API

**ADR:** [ADR-004](./docs/architecture/decisions/ADR-004-meta-cloud-api-integration.md)

**✅ Completed:**
- [x] Phase 1: Unified webhook gateway `/webhooks/meta` (v1.6.5)
- [x] Phase 2: Chronos Logic - session windows, identity resolution, MessageLog (v1.6.6)
- [x] Phase 3: Deep Listening - Audio download → GCS → Whisper transcription (v1.6.7)
- [x] Phase 4: The Voice - OutboundService + Safety Switch + `/connect/send` API (v1.6.8)

**🎯 NEXT: Phase 5 - The Visual Interface (v1.7.0)**

El terapeuta necesita VER los mensajes, no tenerlos enterrados en DB.

**Implementación:**

1. **API Extension** (`apps/platform/lib/api.ts`):
   - `connect.getHistory(identityId)` - MessageLogs ordenados
   - `connect.sendMessage(payload)` - Llama POST `/connect/send`
   - `connect.approveDraft(msgId)` - Liberar mensajes bloqueados

2. **ChatWidget** (`components/connect/ChatWidget.tsx`):
   - Layout: Tab "Conversación" en LeadSheet/PatientProfile
   - `ChatBubble`: INBOUND (izq/blanco) vs OUTBOUND (der/verde-brand)
   - Audio: `<audio controls src={media_url} />` para reproducir `.ogg`
   - Estados: Enviado, Leído, Bloqueado (candado rojo)
   - Window Status: Verde=ABIERTA, Gris=CERRADA (24h)

3. **Input Area:**
   - Textarea auto-expandible + Botón "Enviar"
   - Si ventana CERRADA: input deshabilitado, tooltip "Usa template"

4. **Integration:**
   - `leads/page.tsx` → Tab "Conversación" con ChatWidget
   - `patients/[id]/page.tsx` → Panel derecho o nueva tab "Connect"

**Criterios de Éxito:**
- [ ] Abrir Lead → Ver historial de mensajes
- [ ] Reproducir audio desde UI
- [ ] Escribir respuesta → Aparece en UI + llega a WhatsApp
- [ ] Mensajes bloqueados visibles con badge de seguridad

**💡 Notas de Antigravity (para comentar con Arquitecto):**

> Esta fase es el "Gran Reveal". Tenemos un motor potentísimo (Identidad → Gateway → Tiempo → Oído → Voz) pero está invisible. Esta fase convierte 5 releases de backend en algo tangible. El impacto percibido va a ser enorme.

1. **¿Tab o inline con badge?** - Una tab se puede ignorar. Considerar badge con contador de mensajes no leídos para crear urgencia.

2. **Ventana 24h cerrada** - El tooltip "Usa template" es bueno, pero añadir link directo a templates o botón "Enviar Template" inline sería mejor UX.

3. **Audio player** - El `<audio>` nativo es feo. Considerar mini visualizador de onda o botón estilizado tipo WhatsApp (no replicar exacto, pero mejorar estética).

4. **Quick Win para impresionar** - Optimistic UI + sonido "whoosh" al enviar. Tick gris → tick azul cuando confirma servidor. Hace que se sienta como WhatsApp Web real.

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

---
**Score: 28** · Size: M · Status: 🟢 APPROVED  
Revenue: 3 · Compliance: 0 · Unlocks: 2 · Effort: 3 · BlockedBy: 0

### WU-024 · Mobile Native Evolution

**Theme:** "Native Shell" — Transform mobile experience from unusable to native-feel.

**Diagnóstico:** Sidebar actual ocupa 50% del viewport en móvil. CRM Kanban ilegible.

**Estrategia:** Bottom Navigation + View Transformation + AletheIA Mobile Sheet.

**Phase 1: The Shell**
- [ ] `MobileNavBar.tsx`: Bottom nav (`Home | Leads | Patients | Agenda | Menu`)
- [ ] `DashboardLayout`: Hide sidebar (`hidden md:flex`), show MobileNavBar (`flex md:hidden`)
- [ ] Safe area padding (`pb-safe` for iPhone home indicator)

**Phase 2: View Transformation**
- [ ] Leads: Segmented Control tabs + vertical list + FAB
- [ ] Patients: `PatientMobileCard` replacing table
- [ ] Dashboard: Force `grid-cols-1` on mobile

**Phase 3: Clinical Sovereignty**
- [ ] AletheIA Observatory → Mobile trigger (Brain icon in header)
- [ ] Bottom Sheet with Risk Score + Sentinel Pulse
- [ ] Search icon → Full-screen Omni-Search (`⌘K` logic)

---
**Score: 18** · Size: S · Status: 🟢 APPROVED  
Revenue: 0 · Compliance: 0 · Unlocks: 1 · Effort: 1 · BlockedBy: 0

### WU-025 · The Locust Swarm (Meta Webhook Load Test)

**Theme:** Verificar que la DB aguanta tráfico simulado de WhatsApp.

**Objetivo:** Script de carga con Locust simulando mensajes entrantes.

**Implementación:**
- [ ] `backend/tests/load/locust_meta.py`:
  - `generate_signature(payload, secret)` - HMAC-SHA256 para bypass seguridad
  - `MetaUser(HttpUser)` con task `send_whatsapp_message`
  - Payloads válidos de Meta (entry → changes → value → messages)
- [ ] `backend/scripts/run_load_test.sh`: Cargar env + ejecutar Locust

**Criterios de Éxito:**
- [ ] 200 OK (no 403) en peticiones
- [ ] RPS ≥ 20-30 estable
- [ ] Latencia media < 200ms
- [ ] 0 errores durante smoke test (50 usuarios, spawn 5/seg)

