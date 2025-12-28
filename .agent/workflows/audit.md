---
description: Full semantic and type integrity audit
---

# Audit Protocol

> **USE CASE:** Pre-release check, periodic hygiene, or after major refactors.
> **GOAL:** Detect violations of Design System, Type Safety, and Security.

---

## 🎨 Phase 1: Semantic Audit (Design System Police)

### Forbidden Arbitrary Values
// turbo
```bash
echo "=== Arbitrary Pixels/Sizes ===" 
grep -r "\-\[" apps/platform/app --include="*.tsx" | grep -v "node_modules" | head -20

echo "=== Hardcoded Hex Colors ==="
grep -r "bg-\[#" apps/platform/app --include="*.tsx" | grep -v "node_modules"

echo "=== Forbidden Grays ==="
grep -r "text-gray-" apps/platform/app --include="*.tsx" | grep -v "node_modules"

echo "=== Forbidden Whites/Blacks ==="
grep -r "bg-white\|bg-black" apps/platform/app --include="*.tsx" | grep -v "node_modules"
```

**If any results → STOP and fix before proceeding.**

---

## 🔍 Phase 2: Type Safety Check

// turbo
```bash
cd apps/platform && pnpm run build
```

**If build fails → Fix TypeScript errors before proceeding.**

---

## 🛡️ Phase 3: Security Scan

// turbo
```bash
echo "=== Exposed Secrets ==="
grep -r "sk_live\|sk_test\|password\s*=" . --include="*.ts" --include="*.tsx" --include="*.py" | grep -v "node_modules\|.env"

echo "=== Hardcoded URLs ==="
grep -r "localhost:8001\|127.0.0.1" apps/platform/app --include="*.tsx" | grep -v "node_modules"
```

---

## 📋 Phase 4: Summary Report

| Check | Status |
|-------|--------|
| 🎨 Semantic | PASS / FAIL (X violations) |
| �� TypeScript | PASS / FAIL |
| 🛡️ Security | PASS / FAIL (X warnings) |

---

## ✅ Output

Report to user:
- Total violations found
- Files that need attention
- Recommendation: Fix before release
