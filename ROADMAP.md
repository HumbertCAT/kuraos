# KURA OS - Strategic Roadmap

> **Vision:** To become the operating system for the next generation of mental health, starting with Conscious Practitioners.

---

## ✅ Completed: v1.0.0 Public Launch (December 2024)

**Status:** 🎉 LIVE at https://app.kuraos.ai

### Core Platform
- [x] JWT authentication with shared domain cookies
- [x] Multi-tenant organizations (SOLO/TEAM)
- [x] Patient CRM with clinical journey tracking
- [x] Clinical entries with AI analysis (AletheIA)

### Booking & Payments
- [x] Service management (1:1 + Group)
- [x] Availability schedules with overrides
- [x] Public booking page
- [x] Stripe checkout + webhooks

### Automation & AI
- [x] Clinical AI Agents (Playbook system)
- [x] Human-in-the-loop draft mode
- [x] Daily audio briefing (Gemini + TTS)
- [x] Help Center ChatBot (Gemini 2.5 Flash)

### Lead CRM
- [x] Kanban board with drag-drop
- [x] Speed-to-lead (WhatsApp, Ghost Detector)
- [x] Auto-conversion to patients

---

## 📅 Q1 2026: Growth & Polish

**Goal:** First 50 paying organizations

### Product Improvements
- [ ] **Lifecycle Megamenu**: Reorganize navigation into 3 pillars (Captación → Clínica → Inteligencia) with Shadcn NavigationMenu
- [ ] **Google OAuth**: One-click login with Google
- [ ] **WhatsApp Business API**: Native Meta Cloud API (replace Twilio)
- [ ] **Form Analytics**: Completion rates, drop-off points
- [ ] **Patient Portal**: Self-service for clients

### Growth Engine: "The Mycelium Protocol" 🍄
- [ ] **Referral Engine MVP**: `referral_code` + `referred_by` in Organization, signup with `?ref=` param
- [ ] **Karma Credits**: Reward referrers with AletheIA credits (not cash) for activations
- [ ] **"Powered By" Attribution**: Footer links on Sanctuary Pages, Booking, Emails with 90-day cookie
- [ ] **Referral Dashboard**: "Tu enlace de invitación" + stats + WhatsApp/LinkedIn share buttons
- [ ] **Self-Service Onboarding**: Guided setup wizard
- [ ] **Demo Mode UI**: Dashboard button to seed demo data for new orgs/investors

---

## 🚀 Q2-Q3 2026: Scale (The "500" Goal)

**Goal:** 500 active therapist users by EOY 2025


### Enterprise Features (B2B)
- [ ] **KURA Business (Admin Dashboard)**: Separate app (`admin.kuraos.ai`) for superadmin control.
- [ ] **Team Management**: Invite therapists to organization
- [ ] **Advanced RBAC**: Granular permissions

- [ ] **Audit Logs**: HIPAA/GDPR compliant activity tracking
- [ ] **API for Developers**: Public REST API

### Mobile Experience
- [ ] **React Native App**: iOS + Android
- [ ] **Push Notifications**: Booking reminders, risk alerts
- [ ] **Offline Mode**: View patient data without internet

---

## 🔮 2026: Horizontal Expansion

**Goal:** Enter broader Mental Health & Medical markets

### New Verticals
- [ ] **Psychology**: CBT, DBT, Psychoanalysis adaptations
- [ ] **Psychiatry**: EHR integration, e-prescription support
- [ ] **Coaching**: Business coaching, life coaching

### AI Co-Pilot
- [ ] **Real-time Suggestions**: During-session therapeutic prompts
- [ ] **Transcription**: Live session transcription
- [ ] **Auto-Documentation**: AI-generated session notes

### Global Expansion
- [ ] **LATAM**: Spanish-speaking markets
- [ ] **US**: HIPAA compliance, insurance billing
- [ ] **EU**: Full GDPR compliance, multilingual

---

## 🏆 Success Metrics

| Metric | Q1 2026 | Q4 2026 | 2027 |
|--------|---------|---------|------|
| Active Organizations | 50 | 500 | 2,000 |
| Monthly Active Users | 100 | 1,000 | 5,000 |
| MRR | $2,500 | $25,000 | $100,000 |
| Patient Records | 1,000 | 25,000 | 100,000 |

---

## 📐 Architecture Decision Records

> Future-looking technical proposals that are **documented but deferred** until market validation.

- [ADR-001: Database v2.0](./docs/adr/ADR-001-database-v2-proposal.md) — Hybrid Ledger, Row Level Security (RLS), Biomarkers Schema
- [ADR-002: Design System](./docs/adr/ADR-002-design-system-proposal.md) — Cyber-Clinical Interface, Dark Mode, Intelligence Rail
- [ADR-003: Marketing Growth Engine](./docs/adr/ADR-003-marketing-growth-engine.md) — Sanctuary Page, Content Alchemist, Karma Loop

---

## 💜 Guiding Principles

1. **Therapist-First**: Every feature must reduce friction, not add complexity
2. **Privacy by Default**: Clinical data is sacred
3. **AI as Ally**: Augment human judgment, never replace it
4. **Sustainable Growth**: Quality over quantity

---

*Last updated: December 23, 2024*
