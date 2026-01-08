# ADR-026: The Observatory — Master Observability Architecture

**Status**: PROPOSED  
**Date**: 2026-01-08  
**Author**: GEM (Architect)  
**Priority**: 🔴 STRATEGIC  
**Tier**: Foundation (Q1-Q2 2026)

---

## Vision

> *"What gets measured gets managed. What gets observed gets optimized."*

The Observatory is **the single source of truth** for everything that happens in Kura OS. It captures, stores, and surfaces data that powers:

1. **Clinical Excellence** → Therapists serve clients better
2. **Business Intelligence** → Founder makes data-backed decisions
3. **Growth Engine** → Marketing efforts are measurable
4. **Cost Optimization** → AI and infrastructure spend is visible
5. **Product Evolution** → Features are validated, UX is refined
6. **AI Supremacy** → Models are trained on real therapeutic data

---

## The Five Pillars of Observation

```
┌────────────────────────────────────────────────────────────────────┐
│                      THE OBSERVATORY                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│   │ BEACON  │  │PANOPTIC.│  │ COMPASS │  │ LEDGER  │  │COLLECTOR│  │
│   │ Events  │  │ Access  │  │ Product │  │ Costs   │  │ AI Gold │  │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │
│        │           │           │           │           │          │
│        └───────────┴───────────┴───────────┴───────────┘          │
│                              │                                     │
│                     ┌────────▼────────┐                           │
│                     │   DATA LAKE     │                           │
│                     │   (BigQuery)    │                           │
│                     └────────┬────────┘                           │
│                              │                                     │
│        ┌─────────────────────┼─────────────────────┐              │
│        ▼                     ▼                     ▼              │
│   ┌─────────┐          ┌─────────┐          ┌─────────┐          │
│   │DASHBOARDS│         │ AI TRAIN │         │ ALERTS  │          │
│   │ Looker  │          │ Datasets │         │ PagerD. │          │
│   └─────────┘          └─────────┘          └─────────┘          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Pillar 1: BEACON — Business Events

**Purpose**: Every meaningful business action becomes a structured event.

**What it captures**:
- User lifecycle: signup, login, churn
- Lead funnel: created, qualified, converted
- Clinical flow: session booked, completed, cancelled
- Revenue: payment, refund, subscription change
- Feature adoption: first use of X, habitual use of Y

**Strategic Value**:
| Question | Beacon Answers |
|----------|---------------|
| What's my conversion rate? | `LEAD_CREATED` → `LEAD_CONVERTED` ratio |
| Which features drive retention? | Users who use X have 3x retention |
| When do users churn? | 70% churn after 14 days of no `SESSION_COMPLETED` |
| What's my viral coefficient? | `REFERRAL_CREATED` → `REFERRAL_CONVERTED` |

**Schema Concept**:
```
event_id, timestamp, org_id, user_id, event_type, entity_type, entity_id, metadata{}
```

**Retention**: 2 years (analytics gold)

---

## Pillar 2: PANOPTICON — HIPAA Access Audit

**Purpose**: Immutable record of WHO accessed WHAT clinical data WHEN.

**What it captures**:
- Every read/write to `/practice/*` endpoints
- Patient records, clinical entries, journeys
- Even failed attempts (403, 404)

**Strategic Value**:
| Question | Panopticon Answers |
|----------|-------------------|
| Who accessed patient X's file? | Full audit trail |
| Can we sign a hospital contract? | Yes, we're BAA-ready |
| Is there insider threat? | User Y accessed 200 patients in 1 hour |

**Scope**: ONLY clinical data (not leads, not settings, not marketing)

**Retention**: 7 years (HIPAA requirement)

**Reference**: ADR-022

---

## Pillar 3: COMPASS — Product Analytics

**Purpose**: Understand HOW users interact with the product.

**What it captures**:
- Page views, time on page
- Feature usage frequency
- UI interaction patterns (clicks, scrolls, rage clicks)
- Session recordings (optional, with consent)
- Error encounters

**Strategic Value**:
| Question | Compass Answers |
|----------|----------------|
| Is the new UI better? | A/B test shows 20% more engagement |
| Where do users get stuck? | 40% abandon at step 3 of wizard |
| Which feature is underused? | Journeys have 5% adoption |
| What should we build next? | Users click "Export" 100x/day but it doesn't exist |

**Tools**: PostHog, Mixpanel, or custom (OpenTelemetry)

**Retention**: 1 year (rolling)

---

## Pillar 4: LEDGER — Cost & Resource Accounting

**Purpose**: Track every euro spent on AI, infrastructure, and operations.

**What it captures**:
- AI usage: tokens, model, latency, cost per request
- Storage: GCS usage per org
- Compute: Cloud Run requests, cold starts
- External services: Twilio, Stripe fees

**Strategic Value**:
| Question | Ledger Answers |
|----------|---------------|
| What's my AI cost per user? | €2.30/therapist/month |
| Which model is most cost-effective? | Flash 2.5 at 90% quality, 30% cost |
| Am I profitable per tier? | PRO users cost €4, pay €49 = 92% margin |
| Where should I optimize? | SCRIBE is 60% of AI costs |

**Already Exists**: `ai_usage_log`, `ai_governance_log` ✅

**Retention**: 2 years (billing reconciliation)

---

## Pillar 5: COLLECTOR — AI Training Gold

**Purpose**: Capture human corrections to AI output for fine-tuning.

**What it captures**:
- Original AI-generated content
- Therapist's edited version
- Delta (what changed)
- Context (patient type, session type)

**Strategic Value**:
| Question | Collector Answers |
|----------|------------------|
| How accurate is ORACLE? | 85% of outputs accepted without edits |
| What does SENTINEL miss? | 3 false negatives in Q1 (critical!) |
| Can we train a better model? | Yes, 10,000 correction pairs ready |
| What's our proprietary moat? | Fine-tuned `kura-oracle-v2` trained on 50,000 real sessions |

**Reference**: ADR-017 (Model Distillation)

**Retention**: Forever (anonymized, aggregated)

---

## Data Flows: Who Gets What

### For Therapists (End Users)
```
BEACON + LEDGER → Dashboard
- "You've had 12 sessions this month"  
- "Your AI usage: 15,000 tokens"
- "Your top 3 leads are X, Y, Z"
```

### For Founder (You)
```
ALL PILLARS → Executive Dashboard
- MRR, churn, cohort analysis (BEACON)
- Feature adoption (COMPASS)
- Unit economics (LEDGER)
- Compliance status (PANOPTICON)
- AI quality metrics (COLLECTOR)
```

### For Product Team
```
COMPASS + BEACON → Feature Decisions
- Funnel analysis
- A/B test results
- Rage click heatmaps
- Error rates
```

### For AI/ML Team
```
COLLECTOR + LEDGER → Model Training
- Correction pairs for SFT
- Cost per model comparison
- Quality benchmarks
```

### For Compliance/Legal
```
PANOPTICON → Audit Reports
- Access logs exportable to PDF
- BAA evidence package
```

---

## AutoSxS Integration (ADR-015)

**How AutoSxS fits into The Observatory**:

AutoSxS (Automatic Side-by-Side Evaluation) is the **quality control layer** that consumes Observatory data to evaluate AI model performance.

```
┌─────────────────────────────────────────────────────────────────┐
│                     MODEL EVALUATION LOOP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COLLECTOR ───┐                                                  │
│  (corrections)│                                                  │
│               ▼                                                  │
│         ┌───────────┐     ┌───────────┐     ┌───────────┐       │
│         │  Golden   │ ──▶ │  AutoSxS  │ ──▶ │  Win Rate │       │
│         │ Datasets  │     │ Evaluator │     │  Report   │       │
│         └───────────┘     └───────────┘     └───────────┘       │
│               ▲                                   │              │
│  LEDGER ──────┘                                   ▼              │
│  (cost data)                              ┌───────────┐         │
│                                           │  Promote  │         │
│                                           │  or Drop  │         │
│                                           │   Model   │         │
│                                           └───────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Data Flow**:

| Source | Data | AutoSxS Use |
|--------|------|-------------|
| COLLECTOR | Therapist corrections | Golden test cases for evaluation |
| LEDGER | Cost per token/model | Cost-quality trade-off analysis |
| BEACON | Session metadata | Segment performance by use case |

**What AutoSxS produces**:

1. **Win Rate**: "Model A wins 65% vs Model B on ORACLE tasks"
2. **Cost Efficiency**: "Flash is 90% quality at 30% cost"
3. **Promotion Gate**: "kura-oracle-v2 passes if win_rate > 55%"
4. **Regression Alerts**: "New model worse on SENTINEL risk detection"

**Reference**: ADR-015 (AutoSxS Evaluation Framework)

---

## Integration Architecture

```
                         ┌────────────────┐
                         │  KURA OS APP   │
                         └───────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   FRONTEND    │      │    BACKEND    │      │   AI ENGINE   │
│   (Next.js)   │      │   (FastAPI)   │      │   (Cortex)    │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   COMPASS     │      │ BEACON+PANOPT │      │ LEDGER+COLL.  │
│   (PostHog)   │      │  (PostgreSQL) │      │  (PostgreSQL) │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                       ┌───────▼───────┐
                       │   BigQuery    │  ← Nightly sync
                       │   Data Lake   │
                       └───────┬───────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │  Looker   │   │  AI Train │   │  Alerts   │
        │ Dashboards│   │  Pipeline │   │   Slack   │
        └───────────┘   └───────────┘   └───────────┘
```

---

## Retention Policy

| Pillar | Hot (PostgreSQL) | Cold (BigQuery) | Archive (GCS) |
|--------|------------------|-----------------|---------------|
| BEACON | 90 days | 2 years | 5 years |
| PANOPTICON | 1 year | 7 years | 7 years |
| COMPASS | 30 days | 1 year | — |
| LEDGER | 1 year | 2 years | 5 years |
| COLLECTOR | Forever (in BigQuery) | — | — |

---

## Implementation Roadmap

### Phase 1: Foundation (Q1 2026)
- ✅ LEDGER: `ai_usage_log` exists
- [ ] PANOPTICON: ADR-022 implementation
- [ ] BEACON: Event schema + core events

### Phase 2: Intelligence (Q2 2026)
- [ ] COLLECTOR: Correction capture for SFT
- [ ] COMPASS: PostHog integration
- [ ] BigQuery sync pipeline
- [ ] AutoSxS integration (model evaluation)

### Phase 3: Dashboards (Q3 2026)
- [ ] Founder Dashboard (Looker/Metabase)
- [ ] Therapist Dashboard enhancements
- [ ] Automated alerts (Slack)

### Phase 4: AI Training Loop (Q4 2026)
- [ ] Fine-tuning pipeline active
- [ ] A/B testing framework for models
- [ ] Continuous improvement cycle

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Event coverage | 100% of business actions captured |
| HIPAA audit readiness | Pass simulated audit |
| Query latency | <100ms for dashboard queries |
| Storage cost | <€50/month at 750 therapists |
| AI training data | 10,000+ correction pairs/year |

---

## Final Note

The Observatory is not just logging—it's **institutional memory**. Every session, every click, every correction becomes knowledge. In 3 years, you'll have:

- The largest dataset of therapeutic AI interactions in Spanish
- Proprietary models no competitor can replicate
- Data to make any business decision with confidence
- Compliance documentation that opens enterprise doors

**Build The Observatory. Own the future.**

---

**Last Updated**: 2026-01-08  
**Status**: Ready for GAG Implementation
