---
description: Process to publish a new version of KURA OS (docs, git, deploy)
---

# Release Process

> **CRITICAL**: Run this workflow when the user says "Publish version X.Y.Z" or "Release to production".
> **PHILOSOPHY**: "Measure twice, cut once." If the Semantic Audit fails, ABORT the release.

---

## 🐳 Phase 0: Requirements Sync Check (Two-Tier Docker)

Verify that `requirements.txt` matches the concatenation of heavy + light:

// turbo
```bash
# Check if requirements.txt is in sync with heavy + light
cd backend && diff <(cat requirements-heavy.txt requirements-light.txt) <(tail -n +11 requirements.txt) && echo "✅ Requirements in sync" || echo "❌ DRIFT DETECTED: Run 'cat requirements-heavy.txt requirements-light.txt > requirements.txt'"
```

If adding a **new Google Cloud / heavy dependency**, you must:
1. Add it to `requirements-heavy.txt`
2. Rebuild base image: `./scripts/rebuild-base.sh v2`
3. Commit updated `Dockerfile` with new tag

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

## 🚢 Phase 5: Deploy (Sequential - Backend First)

> **CRITICAL**: Deploy order matters. Backend MUST succeed before Frontend.

### Step 1: Backend (Cloud Run)

// turbo
```bash
./scripts/deploy.sh
```

Wait for success message: `🎉 DEPLOYMENT COMPLETE!`

### Step 2: Verify Backend Health

// turbo
```bash
curl -s https://api.kuraos.ai/health | jq .
```

Expected: `{"status": "healthy", "version": "X.Y.Z"}`

### Step 3: Frontend (Vercel) - MANUAL

> **NOTE**: Vercel auto-deploy is DISABLED. Deploy manually after backend is healthy.

```bash
cd apps/platform && vercel --prod
```

This ensures frontend never calls endpoints that don't exist yet.

---

## 🧠 Phase 5.5: Antigravity Loop (Smart Test Generation)

After deploy, analyze if new code needs tests:

// turbo
```bash
cd backend && python scripts/generate_tests.py --release-mode || echo "Warning: Test generation skipped"
```

**Behavior:**
- Compares current tag vs previous tag
- Filters only meaningful `.py` changes in `backend/app/`
- Skips config, migrations, deleted files
- Generates tests in `tests/generated/` if needed
- Always exits 0 (safe for pipelines)

If tests are generated, review in next session before committing.

---

## ✅ Phase 6: Notify User

Report Status:
- 🛡️ Semantic Audit: PASSED
- 📦 Backup: Created
- 🚀 Version: vX.Y.Z Live
- 🧠 Antigravity: Tests generated / No changes detected
- 🔗 URLs: https://app.kuraos.ai / https://api.kuraos.ai

