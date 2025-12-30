# KURA OS - Strategic Roadmap

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Project overview & quick start |
| [CHANGELOG.md](CHANGELOG.md) | Complete release history |

---

## � Architecture Decision Records (ADRs)

> Formal design decisions that govern the evolution of KURA OS.

| ADR | Title | Domain | Status |
|-----|-------|--------|--------|
| [ADR-001](./docs/adr/ADR-001-database-v2-proposal.md) | Database v2.0 | Infrastructure | 🟡 Deferred |
| [ADR-002](./docs/adr/ADR-002-design-system-proposal.md) | Design System "Zinc Protocol" | Frontend | ✅ **Implemented (v1.0.3-v1.0.8)** |
| [ADR-003](./docs/adr/ADR-003-marketing-growth-engine.md) | Marketing Growth Engine | Growth | 🟢 Q1 2026 |
| [ADR-004](./docs/adr/ADR-004-meta-cloud-api-integration.md) | Meta Cloud API (WhatsApp/IG) | Infrastructure | 🟢 Q1 2026 |
| [ADR-005](./docs/adr/ADR-005-membership-builder.md) | Membership Builder (Netflix Model) | Retention | 🟢 Q2 2026 |
| [ADR-006](./docs/adr/ADR-006-smart-prescriptions.md) | Smart Prescriptions | Clinical | 🟢 Q2 2026 |
| [ADR-007](./docs/adr/ADR-007-the-mirror.md) | The Mirror (Progress Visualization) | Retention | 🟢 Q3 2026 |
| [ADR-008](./docs/adr/ADR-008-time-capsule.md) | Time Capsule (Delayed Messaging) | Clinical | 🟢 Q3 2026 |
| [ADR-009](./docs/adr/ADR-009-trinity-navigation.md) | Trinity Navigation | UX | ✅ **Implemented (v1.0.3)** |
| ADR-010 | The Clean Room (Data Retention) | Compliance | ✅ **Implemented (v1.0.7)** |
| ADR-011 | Multi-Model Intelligence Engine | AI | ✅ **Implemented (v1.1.1)** |

---

## 📅 Q1 2026: Growth & Polish


### 🍄 The Mycelium Protocol (Viral Growth)
| Feature | Description | Priority |
|---------|-------------|----------|
| **Referral Engine** | `referral_code` + `referred_by` in Organization | 🔴 HIGH |
| **Karma Credits** | Reward referrers with AletheIA credits | 🔴 HIGH |
| **"Powered By" Attribution** | Footer links on public pages (90-day cookie) | 🟡 MEDIUM |
| **Referral Dashboard** | Share stats, WhatsApp/LinkedIn buttons | 🟡 MEDIUM |

### 🔗 Meta Cloud API Migration (ADR-004)
| Feature | Description | Priority |
|---------|-------------|----------|
| **WhatsApp Business API** | Replace Twilio sandbox | 🔴 HIGH |
| **Message Templates** | Transactional templates for booking/reminders | 🔴 HIGH |
| **Instagram DM Lead Capture** | Unified inbox for IG leads | 🟡 MEDIUM |

### 🔌 Dashboard Data Wiring
| Component | API Integration | Priority |
|-----------|-----------------|----------|
| **PipelineVelocity** | `/leads?group_by=nurture_status` | 🟡 MEDIUM |
| **ActiveJourneysWidget** | `/journeys/active` endpoint | 🟡 MEDIUM |
| **VitalSignCard Trends** | Booking aggregations by week | 🟢 LOW |

### ✨ v1.1.14 - THE ACTIVATION PROTOCOL (Prioridad 1)
Onboarding de lujo para enseñar al terapeuta a usar el sistema.

| Feature | Description | Status |
|---------|-------------|--------|
| **Truth-Based Onboarding** | Estado derivado de `COUNT(*)` real, no flags | 📋 Planificado |
| **ActivationWidget** | Progress tracker gamificado en Dashboard | 📋 Planificado |
| **driver.js Tours** | Spotlights interactivos para guiar acciones | 📋 Planificado |
| **canvas-confetti** | Celebraciones al completar misiones | 📋 Planificado |

**Misiones**:
1. Crear primer paciente (33%)
2. Crear servicio (66%)
3. Recibir primera reserva (100%)

---

### 🚪 v1.2.0 - THE PATIENT PORTAL (Prioridad 2)
Portal token-based para pacientes. Referencia: `_legacy_recovery/`

| Feature | Description | Legacy Reference |
|---------|-------------|------------------|
| **Form Viewer** | `/portal/forms/[token]` - Formularios de ingesta | `forms/form_page_legacy.tsx` |
| **Booking Manager** | `/portal/booking/[token]` - Ver/cancelar/reagendar | `booking/manage_page_legacy.tsx` |
| **Progress View** | `/portal/progress` - The Mirror (ADR-007) | Nuevo |

**Arquitectura**:
```
apps/platform/app/[locale]/portal/
├── booking/[token]/page.tsx   # Gestión de reserva
├── forms/[token]/page.tsx     # Formularios públicos
└── progress/page.tsx          # Visualización de progreso
```

---

### 🧪 Product Polish (Ongoing)
- [ ] Self-service onboarding wizard
- [ ] Demo Mode button for investors
- [ ] Form analytics (completion rates)
- [ ] Live Components in MDX (dynamic help documentation)

---

## 🚀 Q2 2026: The Fidelization Stack

**Goal:** Reduce churn to <5% monthly

### 📺 Membership Builder (ADR-005)
| Feature | Description |
|---------|-------------|
| **Netflix-Style Content Library** | Meditations, exercises, guides |
| **Subscription Tiers** | BASIC, PRO, CENTER with feature gates |
| **Content Delivery** | Drip-fed materials post-session |

### 💊 Smart Prescriptions (ADR-006)
| Feature | Description |
|---------|-------------|
| **AI-Suggested Content** | Based on session themes |
| **Adherence Tracking** | Did they watch/complete? |
| **Therapeutic Homework** | Auto-assigned between sessions |

---

## 🔮 Q3-Q4 2026: Loyalty & Scale

**Goal:** 500 active organizations

### 🪞 The Mirror (ADR-007)
| Feature | Description |
|---------|-------------|
| **Progress Visualization** | "Spotify Wrapped" for therapy |
| **Before/After Comparisons** | Visual journey evolution |
| **Patient Portal Access** | Self-service progress view |

### ⏳ Time Capsule (ADR-008)
| Feature | Description |
|---------|-------------|
| **Delayed Messaging** | Letters to future self |
| **Milestone Triggers** | Send on 90-day anniversary |
| **Therapeutic Hope** | Emotional anchoring technique |

### 📱 Mobile App
| Feature | Description |
|---------|-------------|
| **React Native** | iOS + Android |
| **Push Notifications** | Risk alerts, booking reminders |
| **Offline Mode** | View patient data without internet |

---

*Last updated: December 30, 2025 (v1.1.13 PUBLIC BOOKING WIZARD)*
