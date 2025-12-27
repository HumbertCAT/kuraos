# KURA OS - Strategic Roadmap

> **Vision:** To become the operating system for the next generation of mental health, starting with Conscious Practitioners.

---

## 📊 Current Status: v1.1.3b (December 2025)

**🎉 LIVE at https://app.kuraos.ai**

The system now speaks with One Voice. Data coherence achieved between Sentinel Pulse and AletheIA Observatory.

---

## ✅ Completed Releases (Reverse Chronological)

### v1.1.3b — SENTINEL PULSE & DATA COHERENCE 🦅
*December 27, 2025*
- [x] Sentinel Pulse Widget: 7-day emotional chart with 3 states (Active/Dormant/Locked)
- [x] Operation Direct Line: Float precision fix, AliasChoices pattern
- [x] Golden Seed: Marcus (+0.80), Julian (-0.60), Elena (-0.90) archetypes
- [x] Schema alignment: `last_insight_json` matches `PatientInsightsResponse`

### v1.1.3 — THE CLINICAL CANVAS 🏥
*December 27, 2025*
- [x] 2-column patient layout: Journey Boarding Pass + Sentinel Pulse
- [x] PatientHero component refactor
- [x] Dynamic stage icons with status-based actions

### v1.1.2 — PREMIUM DEMO "GOLDEN SEED PROTOCOL" 💎
*December 27, 2025*
- [x] 4 character archetypes with rich histories
- [x] Unsplash avatars with static UUIDs
- [x] Pre-populated journey stages and clinical notes

### v1.1.1 — INTELLIGENCE ENGINE 🧠
*December 27, 2025*
- [x] ProviderFactory: Multi-model AI routing
- [x] CostLedger: Real-time token-based FinOps
- [x] AI Governance Admin Panel: Financial HUD, Model Registry
- [x] Clean Ledger Refactor: No legacy calls in clinical flow

### v1.1.0 — THE COMMAND CENTER 🚀
*December 27, 2025*
- [x] Dashboard 3.0: Ghost Header, Clinical-First Grid
- [x] FocusSessionCard, PipelineVelocity, ActiveJourneysWidget
- [x] VitalSignCard with live trend indicators

### v1.0.12 — NEURAL FLOW UI ⚡
*December 26, 2025*
- [x] Agent Circuit Board visualization
- [x] Glass KPI Cards with backdrop-blur
- [x] Semantic nodes: Trigger → Condition → Action

### v1.0.10 — JOURNEY CARDS 2.0 🎫
*December 26, 2025*
- [x] Boarding Pass style journey cards
- [x] Dynamic context-aware actions
- [x] Smart timelines with icon-nodes

### v1.0.9 — CLINICAL ROSTER 📋
*December 26, 2025*
- [x] High-density patient table
- [x] Health Dots risk indicators
- [x] Semantic status badges

### v1.0.8 — DESIGN SYSTEM & TACTILE UI 🎨
*December 26, 2025*
- [x] Design System Playground (`/design-system`)
- [x] Tactile buttons with `active:scale-95`
- [x] Glass cards, premium shadow effects

### v1.0.7 — THE CLEAN ROOM 🔐
*December 26, 2025*
- [x] The Incinerator: 30-day audio lifecycle
- [x] The Vault: Anonymous datasets for IP preservation
- [x] The Scrubber: PII sanitization service

### v1.0.6 — SECURITY & GOVERNANCE 🛡️
*December 25, 2025*
- [x] Log sanitization (no PII in Twilio logs)
- [x] Strict Pydantic schemas with `extra="ignore"`
- [x] Structured JSONB for clinical form data

### v1.0.5 — ALETHEIA OBSERVATORY 🔭
*December 25, 2025*
- [x] Intelligence Rail sidebar
- [x] Patient Mode: Risk score, themes, flags
- [x] Global Mode: Clinic Radar, pending actions
- [x] Zustand patient store for context

### v1.0.4 — THEME ENGINE 🌓
*December 25, 2025*
- [x] Real-time Theme Editor with live preview
- [x] Dual Dark/Light mode support
- [x] HSL color picker with persistence

### v1.0.3 — CYBER-CLINICAL UI 🖥️
*December 24, 2025*
- [x] Trinity Navigation (3-column layout)
- [x] `next-themes` integration
- [x] Semantic CSS variables (Tailwind v4)

### v1.0.2 — THE BLACK BOX 📦
*December 24, 2025*
- [x] PostgreSQL automated backups (6h cycle)
- [x] Admin Backups panel with restore
- [x] ADR-005 to ADR-009 documented

### v1.0.1 — PRODUCTION POLISH 🔧
*December 24, 2025*
- [x] Login loop fix
- [x] Secret Manager integration
- [x] Stripe/Twilio CLI automation

### v1.0.0 — PUBLIC LAUNCH 🎉
*December 23, 2025*
- [x] Core platform: Auth, Patients, Clinical Entries
- [x] Booking engine with Stripe
- [x] Clinical AI Agents (Playbooks)
- [x] Lead CRM with Kanban

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

**Goal:** First 50 paying organizations

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

### 🧪 Product Polish
- [ ] Google OAuth (SSO)
- [ ] Self-service onboarding wizard
- [ ] Demo Mode button for investors
- [ ] Form analytics (completion rates)

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

## 🌐 2027: Horizontal Expansion

### New Verticals
- [ ] Psychology (CBT, DBT, Psychoanalysis)
- [ ] Psychiatry (EHR integration, e-prescription)
- [ ] Coaching (Business, Life, Executive)

### AI Co-Pilot
- [ ] Real-time session suggestions
- [ ] Live transcription
- [ ] Auto-documentation

### Global Markets
- [ ] LATAM: Full Spanish support ✅
- [ ] US: HIPAA + insurance billing
- [ ] EU: GDPR + multilingual

---

## 🏆 Success Metrics

| Metric | Q1 2026 | Q4 2026 | 2027 |
|--------|---------|---------|------|
| Active Organizations | 50 | 500 | 2,000 |
| Monthly Active Users | 100 | 1,000 | 5,000 |
| MRR | $2,500 | $25,000 | $100,000 |
| Patient Records | 1,000 | 25,000 | 100,000 |
| Churn Rate | 10% | <5% | <3% |

---

## 💜 Guiding Principles

1. **Prosperity is Clinical**: An underpaid, burnt-out therapist cannot heal effectively. Financial health fuels clinical impact.

2. **Agents, Not Tools**: Active Intelligence, not passive software. AI is a teammate, not a feature.

3. **Institutional Trust**: Hospital-grade security for the independent practitioner. HIPAA/GDPR by default.

4. **Radical Simplicity**: If it needs a manual, it's broken. Zero-training required.

---

*Last updated: December 27, 2025 (v1.1.3b SENTINEL PULSE)*
