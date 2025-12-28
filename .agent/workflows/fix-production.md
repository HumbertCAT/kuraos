---
description: Emergency production fix procedure
---

# Emergency Production Fix

> **CRITICAL**: Use when production is down or broken.
> **PHILOSOPHY**: "Stop the bleeding first, then check for infections."

---

## 🚑 Phase 1: Triage & Diagnose

// turbo
```bash
# Backend Logs (Cloud Run)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=kura-backend severity>=ERROR" --limit=20 --project=kura-os
```

// turbo
```bash
# Frontend Logs (Vercel)
cd apps/platform && vercel logs production --limit=20
```

---

## 🛠️ Phase 2: Surgical Fix

1. **Apply fix locally**
2. **Verify locally**: Does `localhost:3001` work?
3. **Semantic Quick-Scan**: Don't let panic introduce bad code.

// turbo
```bash
# Quick check for forbidden pixels/colors
grep -r "\-\[" apps/platform/app --include="*.tsx" | grep -v "node_modules" | head -10
grep -r "bg-\[#" apps/platform/app --include="*.tsx"
```

---

## 📦 Phase 3: The Safety Net (Backup)

If this fix **touches the Database**, backup is MANDATORY. If UI only, optional.

// turbo
```bash
./scripts/backup_db.sh
```

---

## 🚀 Phase 4: Patch Release & Deploy

Treat this as a Patch Release (e.g., v1.1.7 → v1.1.8).

// turbo
```bash
git add .
git commit -m "hotfix: [brief description]"
git tag -a vX.Y.Z -m "Hotfix vX.Y.Z"
git push origin main --tags
```

// turbo
```bash
./scripts/deploy.sh
```

// turbo
```bash
# Verify Frontend deployment
cd apps/platform && vercel inspect --prod
```

---

## ✅ Phase 5: Post-Mortem

Confirm:
- [ ] Is the fire out?
- [ ] Did we break semantic integrity? (Check UI)
- [ ] **MANDATORY**: Update `CHANGELOG.md` after the fire is out with the fix details.
