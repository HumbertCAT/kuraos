# KURA OS - Strategic Roadmap

> **Vision:** To become the operating system for the next generation of mental health, starting with Conscious Practitioners.

---

## 📊 Current Status: v1.1.7 (December 2025)

**🎉 LIVE at https://app.kuraos.ai**

Native Google OAuth + Password Recovery deployed. The Golden Key unlocked.

---

## � Release History

> For completed releases, see [CHANGELOG.md](CHANGELOG.md)

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
- [ ] **v1.1.8** - THE ACTIVATION PROTOCOL: Luxury onboarding with driver.js tours
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
