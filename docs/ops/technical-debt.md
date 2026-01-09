# Technical Debt Register

> [!NOTE]
> **Status**: Living Document (v1.6.4)  
> **Purpose**: Active technical debt tracking for KURA OS  
> **Last Updated**: 2026-01-08 (v1.6.4 The Identity Vault)

This document tracks **actionable** technical debt that requires resolution. Resolved items belong in the [CHANGELOG](../../CHANGELOG.md).

---

## 🔴 CRITICAL (Active Debt)

### TD-86: CI Innate Pipeline Broken
**File**: `.github/workflows/ci-innate.yml`  
**Symptom**: All GitHub Actions runs failing since v1.5.9-HF9+  
**Impact**: No automated backend tests running on push  
**Risk**: Regressions can slip into production undetected  
**Action**: Investigate failure cause, fix pipeline, re-enable green builds  

---

### TD-87: Duplicate Warning Modal Not Triggering
**File**: `apps/platform/app/[locale]/(dashboard)/leads/page.tsx`  
**Issue**: `DuplicateWarningModal` created but not triggering on Lead/Patient creation  
**Impact**: Duplicate contacts can still be created without warning  
**Action**: Debug API call timing in `CreateLeadModal.handleCreate()`, verify frontend hot reload  

---

### TD-89: Meta Audio Processing Logs Not Appearing
**File**: `backend/app/api/v1/connect/meta_webhook.py`  
**Origin**: v1.6.7/v1.6.8 debugging session  
**Symptom**: Webhook POST returns 200 OK, but `🎤 Audio...` logs never appear in Cloud Logging  
**Impact**: Cannot verify if audio is being downloaded/transcribed  
**Root Cause**: Unknown - added DEBUG logging (line 209) to diagnose  
**Action**: Send test audio, verify message type detection, check if `is_audio_message()` is correct  

### TD-90: META_APP_SECRET Typo Hazard
**File**: Google Secret Manager `META_APP_SECRET`  
**Origin**: v1.6.8 debugging - secret had 3 'a's instead of 4  
**Symptom**: All Meta webhook POSTs returned 403 Forbidden  
**Resolution**: Fixed manually via `gcloud secrets versions add`  
**Action**: Add Secret Manager verification script to deployment workflow  

---

## 🟠 MEDIUM (Should Fix Soon)

### TD-81: Identity Vault Missing Composite Index
**File**: `backend/alembic/versions/e6766c8a25d4...py`  
**Issue**: No composite index on `(org_id, email, phone)` for faster lookups  
**Impact**: Slower identity resolution at scale (>10k identities)  
**Action**: Add migration with composite index

### TD-82: Contacts 360 Page No Pagination
**File**: `apps/platform/app/[locale]/(dashboard)/contacts/[id]/page.tsx`  
**Issue**: Loads ALL leads + patients for an identity without pagination  
**Impact**: Slow load for high-volume contacts (>50 records)  
**Action**: Add pagination or lazy loading to timeline

---

## 🟡 LOW (When Convenient)

### TD-80: Health Endpoint Version Hardcoded
**File**: `backend/app/main.py:386`  
**Issue**: Version string manually updated each release  
**Impact**: Easy to forget, causes confusion about deployed version  
**Action**: Read version from `pyproject.toml` or env var

### TD-83: Lead `is_prospect` Flag Deferred
**Origin**: v1.6.4 planning  
**Issue**: Leads lack `is_prospect` boolean for qualified-but-not-converted tracking  
**Impact**: Cannot distinguish "warm lead" from "cold lead" in CRM  
**Action**: Add column + migration when CRM v2 prioritized

### TD-84: Identity Backfill Script Manual
**File**: `backend/scripts/backfill_identities.py`  
**Issue**: Requires manual execution after migration  
**Impact**: New deployments need extra step  
**Action**: Integrate into migration or post-migrate hook

---

## ✅ Recently Resolved (v1.6.x)

| ID | Description | Resolved In |
|----|-------------|-------------|
| TD-69 | Action Interpolation missing | v1.6.2 |
| TD-73 | Email Placeholders hardcoded | v1.6.2 |
| TD-75 | Form Submissions Blindness | v1.6.3 |
| TD-77 | Sherlock Score not updating | v1.6.2 |

---

## 📋 Debt Tracking Protocol

1. **NEVER** mark items as "Resolved" here. Move them to the [CHANGELOG](../../CHANGELOG.md).
2. **ALWAYS** include file paths and risk assessment.
3. **PRIORITIZE** by clinical and business impact.
4. **REVIEW** quarterly with the engineering team.
