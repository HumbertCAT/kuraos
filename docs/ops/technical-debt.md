# Technical Debt Register

> [!NOTE]
> **Status**: Living Document (v1.7.5)  
> **Purpose**: Active technical debt tracking for KURA OS  
> **Last Updated**: 2026-01-11 (v1.7.5 TD-115/116/117 Resolved)

This document tracks **actionable** technical debt that requires resolution. Resolved items belong in the [CHANGELOG](../../CHANGELOG.md).

---

## 🔴 CRITICAL (Active Debt)

### TD-89: Meta Audio Processing Logs Not Appearing
**File**: `backend/app/api/v1/connect/meta_webhook.py`  
**Origin**: v1.6.7/v1.6.8 debugging session  
**Symptom**: Webhook POST returns 200 OK, but `🎤 Audio...` logs never appear in Cloud Logging  
**Impact**: Cannot verify if audio is being downloaded/transcribed  
**Root Cause**: Unknown - added DEBUG logging (line 209) to diagnose  
**Action**: Send test audio, verify message type detection, check if `is_audio_message()` is correct  

---

##  MEDIUM (Should Fix Soon)

### TD-112: Deploy Order Hazard (Vercel antes de Cloud Run)
**Origin**: v1.7.0 Phase 5  
**Issue**: Vercel auto-deploya al hacer `git push`, pero Cloud Run requiere `./scripts/deploy.sh` manual  
**Risk**: Frontend puede llamar a endpoints que aún no existen en producción  
**Impact**: Errores 404/500 para usuarios durante ventana de desincronización  
**Solution**: 
1. Desactivar Vercel auto-deploy
2. Crear GitHub Action que: Cloud Run deploy → success → trigger Vercel deploy
3. O usar `vercel --prod` solo después de confirmar Cloud Run healthy

---

### TD-114: Vercel Auto-Deploy Not Triggering for kura-platform
**Origin**: v1.7.5 debugging  
**Symptom**: kura-platform deploys don't auto-trigger on push (marketing works fine)  
**Impact**: Manual intervention needed to deploy platform changes  
**Action**: Check Vercel Git integration, may need to re-link project  

---

## ✅ Recently Resolved (v1.6.x - v1.7.x)

| ID | Description | Resolved In |
|----|-------------|-------------|
| TD-114 | Vercel auto-deploy not triggering for platform | v1.7.5 |
| TD-115 | MessageLog Lead persistence (identity-anchored) | v1.7.5 |
| TD-116 | Lead→Patient conversion loses identity_id | v1.7.5 |
| TD-117 | MonitoringTab not displaying MessageLog data | v1.7.5 |
| TD-113 | Meta Webhook partial flow | v1.7.5 |

| TD-86 | CI Innate Pipeline Broken | v1.6.9 (123 tests passing) |
| TD-87 | Duplicate Warning Modal Not Triggering | v1.6.9 |
| TD-90 | META_APP_SECRET Typo Hazard | v1.6.8 |
| TD-80 | Health endpoint version hardcoded | v1.6.9 |
| TD-81 | Identity Vault missing composite index | v1.6.9 |
| TD-82 | Contacts 360 no pagination | v1.6.9 |
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
