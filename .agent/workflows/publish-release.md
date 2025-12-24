---
description: Process to publish a new version of KURA OS (docs, git, deploy)
---

# Release Process

> **CRITICAL**: Run this workflow when the user says "Publish version X.Y.Z" or "Release to production".
> **DO NOT SKIP ANY STEP. ALL STEPS ARE MANDATORY.**

---

## Pre-Flight Checklist ✅

Before proceeding with git commands, **complete ALL documentation updates**:

### 1. CHANGELOG.md (MANDATORY)
- [ ] Add header `## [X.Y.Z] - YYYY-MM-DD` at the top
- [ ] List all changes under: Added, Changed, Fixed, Removed, Infrastructure
- [ ] Use bullet points with **bold feature names**

### 2. README.md (MANDATORY)
- [ ] Update version badge: `version-X.Y.Z-purple`
- [ ] Update "Completed" section with new version
- [ ] Update "Recent Features" if major module was released

### 3. ROADMAP.md (MANDATORY)  
- [ ] Add new version section if significant features
- [ ] Mark completed milestones as `[x]`

---

## Git Release

// turbo
1. Stage and commit ALL changes:
```bash
git add -A
git commit -m "chore(release): vX.Y.Z - [Brief description]"
```

// turbo
2. Create and push tag:
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin main --tags
```

---

## Deploy

// turbo
1. **Backend (Cloud Run)**:
```bash
./scripts/deploy.sh
```

2. **Frontend (Vercel)**: Auto-triggers on git push.

---

## Notify User

Confirm with user:
- ✅ Version number
- ✅ Key features
- ✅ Production URLs
- ✅ All 3 docs updated (CHANGELOG, README, ROADMAP)
