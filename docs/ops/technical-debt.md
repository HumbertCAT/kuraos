# Technical Debt Register

> [!NOTE]
> **Status**: Living Document (v1.3.9.5)  
> **Purpose**: Active technical debt tracking for KURA OS  
> **Last Updated**: 2026-01-06 (v1.3.9.5 The Immune System)

This document tracks **actionable** technical debt that requires resolution. Resolved items belong in the [CHANGELOG](../../CHANGELOG.md).

---

## ✅ RESOLVED (v1.3.9.5)

### 1. ~~Lack of Automated Testing Infrastructure~~ → The Immune System
**Scope**: Entire codebase (Backend + Frontend)  
**Resolved**: v1.3.9.x series (Phases 1-5)

> [!TIP]
> **Comprehensive QA infrastructure deployed.** 5 layers of automated testing with 24+ tests.

- **Resolution**: Implemented The Immune System (5 phases)
  - Phase 1: Backend unit tests (Pytest + testcontainers) - 10+ tests
  - Phase 2: Frontend E2E (Playwright + auth bypass) - 7 tests
  - Phase 3: AI semantic evaluation (Vertex AI) - 3 golden cases
  - Phase 4: CI/CD automation (GitHub Actions + Cloud Build)
  - Phase 5: Email testing (Mailpit) - 4 tests
- **Documentation**: `docs/TESTING.md`, `scripts/test.sh`
- **Total Effort**: ~40 hours (5 phases)

---

## 🔴 CRITICAL (Active Debt)

---

## 📋 Debt Tracking Protocol

1. **NEVER** mark items as "Resolved" here. Move them to the [CHANGELOG](../../CHANGELOG.md).
2. **ALWAYS** include file paths and risk assessment.
3. **PRIORITIZE** by clinical and business impact.
4. **REVIEW** quarterly with the engineering team.
