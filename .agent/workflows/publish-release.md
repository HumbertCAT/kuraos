---
description: Process to publish a new version of KURA OS (docs, git, deploy)
---

# Release Process

> **CRITICAL**: Run this workflow when the user says "Publish version X.Y.Z" or "Release to production".
> **PHILOSOPHY**: "Measure twice, cut once." If the Semantic Audit fails, ABORT the release.

---

## 🛡️ Phase 1: The Gatekeeper (Semantic & Type Audit)

Before touching docs or git, verify System Integrity:

### Semantic Audit (Design System Police)
Scan for forbidden hardcoded values. If any grep returns results, **STOP and ask user to fix**.

// turbo
```bash
# Check for forbidden arbitrary pixels (e.g., w-[30px])
grep -r "\-\[" apps/platform/app --include="*.tsx" | grep -v "node_modules" | head -20

# Check for forbidden hex colors (e.g., bg-[#])
grep -r "bg-\[#" apps/platform/app --include="*.tsx" | grep -v "node_modules"

# Check for forbidden generic grays
grep -r "text-gray-" apps/platform/app --include="*.tsx" | grep -v "node_modules"
```

### Type Safety Check
Ensure we aren't tagging broken code.

// turbo
```bash
cd apps/platform && pnpm run build
```

---

## 📝 Phase 2: Documentation (The Paper Trail)

Only proceed if Phase 1 passed.

### 1. CHANGELOG.md (MANDATORY)
- [ ] Add header `## [X.Y.Z] - YYYY-MM-DD` at the top
- [ ] List changes under: Added, Changed, Fixed, Infrastructure

### 2. README.md (MANDATORY)
- [ ] Update version badge: `version-X.Y.Z-purple`
- [ ] Update "Last Updates" section

### 3. ROADMAP.md (MANDATORY)
- [ ] Reference CHANGELOG for completed items
- [ ] Update "Coming Soon" if applicable

---

## 📦 Phase 3: The Black Box (Safety Backup)

Trigger pre-deploy backup to ensure we have a restore point.

// turbo
```bash
./scripts/backup_db.sh
```

---

## 🚀 Phase 4: Git Release

// turbo
```bash
git add -A
git commit -m "chore(release): vX.Y.Z"
```

// turbo
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin main --tags
```

---

## 🚢 Phase 5: Deploy

// turbo
```bash
./scripts/deploy.sh
```

Frontend (Vercel): Auto-triggers on git push. Monitor Vercel dashboard.

---

## ✅ Phase 6: Notify User

Report Status:
- 🛡️ Semantic Audit: PASSED
- 📦 Backup: Created
- 🚀 Version: vX.Y.Z Live
- 🔗 URLs: https://app.kuraos.ai / https://api.kuraos.ai
