---
description: Emergency production fix procedure
---

# Production Fix

> Use when production is down or broken.

## 1. Diagnose
// turbo
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=kura-backend severity>=ERROR" --limit=10 --project=kura-os
```

## 2. Fix locally
- Apply the fix
- Test on localhost

## 3. Deploy
// turbo
```bash
git add . && git commit -m "fix: [description]" && git push origin main
```

## 4. Verify
// turbo
```bash
cd apps/platform && vercel --prod --yes
```
