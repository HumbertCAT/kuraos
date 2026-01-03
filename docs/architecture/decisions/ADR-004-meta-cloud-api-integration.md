# ADR-004: Meta Cloud API Integration (Instagram + WhatsApp Business)

**Status:** 🟡 PLANNED (Phase 2 Priority)  
**Date:** 2025-12-24  
**Decision Makers:** Humbert (Product), GAG (Engineering)  
**Context:** Growth Module & WhatsApp Migration  

---

## Summary

This ADR documents the comprehensive integration with Meta Cloud API to:
1. **Replace Twilio** with native WhatsApp Business API (cost reduction + reliability)
2. **Add Instagram DM** as a lead acquisition channel (Kura Growth module)

Both channels share the same OAuth flow and webhook infrastructure, making this a unified integration effort.

---

## Strategic Importance

**Why Meta Cloud API is Priority:**
- WhatsApp Business API via Meta = **Lower cost** than Twilio
- Instagram DMs = Untapped **lead acquisition** channel
- Unified webhook = Single integration for both platforms
- Facebook Login = OAuth already familiar to users

**Business Model Impact:**
- Transforms Kura from cost center (management) to **revenue generator** (marketing)
- Increases LTV by providing client acquisition tools
- Available only for PRO & CENTER tiers = upsell opportunity

---

## Architecture Overview

### Dual-Channel Strategy

```
┌──────────────────────────────────────────────────────────┐
│                    META CLOUD API                        │
├─────────────────────────┬────────────────────────────────┤
│   WhatsApp Business     │      Instagram Graph           │
│   (Clinical Domain)     │      (Marketing Domain)        │
├─────────────────────────┼────────────────────────────────┤
│   1:1 Therapist→Patient │      1:N Therapist→Audience    │
│   HIPAA-conscious       │      Public funnel             │
│   Encrypted history     │      Lead acquisition          │
└─────────────────────────┴────────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   /webhooks/meta    │
         │   (Unified Endpoint)│
         └─────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   WhatsApp Handler        Instagram Handler
   (Update Patient         (Create/Update Lead
    Conversations)          Marketing Messages)
```

---

## Part 1: WhatsApp Business Migration (Priority)

### Current State (Twilio)
- Twilio Sandbox for dev
- Twilio Business API requires separate approval
- Cost: ~$0.005-0.015 per message
- Works but adds vendor dependency

### Target State (Meta Direct)
- Meta Cloud API via Facebook Business
- Cost: Template messages from $0.004
- Direct integration with same Meta account as Instagram
- Webhook consolidation

### Migration Path
1. Apply for WhatsApp Business via Meta Business Suite
2. Implement Meta OAuth flow (Facebook Login)
3. Create unified `/webhooks/meta` endpoint
4. Keep Twilio as fallback during transition
5. Deprecate Twilio once stable

---

## Part 2: Kura Growth Module (Instagram)

### The Automatic Funnel

```
[Instagram Post/Story]
        │
        ▼
[Follower sends DM] ─────────► [Lead Created in Kura]
        │                              │
        ▼                              ▼
[Auto-Responder]              [Unified Lead Inbox]
"Thanks! Here's my booking      Therapist sees all
 link: kura.os/book/maria"      DMs in one place
        │
        ▼
[Lead books via Public Form]
        │
        ▼
[Lead → Patient Conversion]
   (Explicit action)
```

### Features Breakdown

**A. Unified Lead Inbox**
- Separate interface from Clinical Chat
- 24h response window indicator (Meta API limit)
- Quick Reply templates
- Lead status tracking (NEW → CONTACTED → QUALIFIED → CONVERTED)

**B. Auto-Responder Integration**
- Connect to existing Automation Playbooks
- New trigger: `INCOMING_DM_KEYWORD`
- New action: `SEND_IG_MESSAGE`
- Keyword detection: "retiro", "ansiedad", "precio"

**C. AletheIA Content Co-Pilot** (Future)
- Caption Generator: Upload photo → AI generates empathetic copy
- Sentiment Analysis: Detect "hot leads" with emotional urgency
- Consumes AletheIA credits from monthly quota

---

## Technical Specification

### OAuth Requirements
```
Scopes Required:
- instagram_basic
- instagram_manage_messages  
- pages_show_list
- pages_manage_posts
- whatsapp_business_messaging (for WA)
- whatsapp_business_management
```

### Webhook Endpoint
```python
# backend/app/api/v1/webhooks/meta.py

@router.post("/webhooks/meta")
async def meta_webhook(request: Request):
    payload = await request.json()
    
    object_type = payload.get("object")
    
    if object_type == "whatsapp_business_account":
        return await handle_whatsapp_webhook(payload)
    elif object_type == "instagram":
        return await handle_instagram_webhook(payload)
    else:
        logger.warning(f"Unknown Meta object type: {object_type}")
        return {"status": "ignored"}
```

### Data Model Extension

```sql
-- New table for marketing messages (separate from clinical)
CREATE TABLE marketing_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    lead_id UUID REFERENCES leads(id),
    
    channel VARCHAR(20) NOT NULL, -- 'INSTAGRAM', 'WHATSAPP_MARKETING'
    direction VARCHAR(10) NOT NULL, -- 'INBOUND', 'OUTBOUND'
    
    content TEXT,
    meta_message_id VARCHAR(255),
    
    -- 24h window tracking
    window_expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Extend leads table (already exists)
ALTER TABLE leads ADD COLUMN ig_username VARCHAR(255);
ALTER TABLE leads ADD COLUMN ig_user_id VARCHAR(255);
ALTER TABLE leads ADD COLUMN meta_psid VARCHAR(255);
```

### Automation Triggers (New)

```python
class TriggerEvent(str, Enum):
    # ... existing triggers ...
    
    # Meta/Instagram triggers
    INCOMING_DM = "INCOMING_DM"
    INCOMING_DM_KEYWORD = "INCOMING_DM_KEYWORD"
    IG_COMMENT_MENTION = "IG_COMMENT_MENTION"
```

---

## Security & Compliance

**Role Segregation:**
- Role `ASSISTANT` CAN access Lead Inbox (marketing)
- Role `ASSISTANT` CANNOT access converted Patient clinical history
- Clear separation between marketing and clinical data

**Lead → Patient Conversion:**
- MUST be explicit action (manual or triggered by Public Form)
- NEVER automatic from chat alone
- Audit trail of conversion event

**Data Classification:**
- `marketing_messages` = NOT clinical data
- `leads` = NOT PHI until converted
- Different retention policies may apply

---

## Implementation Phases

### Phase 1: Meta OAuth + WhatsApp Migration (Q2 2026)
- [ ] Facebook Business verification
- [ ] WhatsApp Business API approval
- [ ] Meta OAuth implementation
- [ ] Unified webhook endpoint
- [ ] Migrate from Twilio (keep as fallback)

### Phase 2: Instagram Lead Inbox (Q3 2026)
- [ ] Instagram DM ingestion
- [ ] `marketing_messages` table
- [ ] Lead Inbox UI (separate from clinical)
- [ ] 24h window indicator
- [ ] Quick Reply templates

### Phase 3: Automation Integration (Q3-Q4 2026)
- [ ] `INCOMING_DM_KEYWORD` trigger
- [ ] `SEND_IG_MESSAGE` action
- [ ] Playbook templates for marketing

### Phase 4: AletheIA Content Co-Pilot (Q4 2026+)
- [ ] Caption Generator
- [ ] Sentiment analysis for "hot leads"
- [ ] Credit consumption from quota

---

## Prerequisites

**Before Phase 1:**
- [ ] Facebook Business Manager account verified
- [ ] WhatsApp Business API approval (2-4 weeks)
- [ ] Instagram account linked to FB Page
- [ ] Privacy Policy URL for OAuth app review

**Before Phase 2:**
- [ ] Meta App Review passed (instagram_manage_messages)
- [ ] Lead Inbox UI designs approved

---

## Cost Analysis

**Twilio vs Meta Direct (WhatsApp):**
- Twilio: ~$0.005-0.015/msg + platform fee
- Meta Direct: ~$0.004-0.009/msg (template-based)
- **Estimated savings: 30-50%** at scale

**Revenue Potential (Instagram):**
- PRO tier upsell: €49/mo includes Kura Growth
- CENTER tier: Included
- Estimated conversion: 20% of users upgrade for marketing tools

---

## References

- [Meta Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [ADR-003: Marketing Growth Engine](./ADR-003-marketing-growth-engine.md)
- Current implementation: `backend/app/api/v1/webhooks/twilio_whatsapp.py`

---

*This ADR consolidates WhatsApp migration and Instagram integration into a single Meta Cloud API strategy. Priority is WhatsApp (Q2 2026) followed by Instagram (Q3 2026).*
