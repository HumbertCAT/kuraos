# Technical Debt Register

> [!NOTE]
> **Status**: Living Document (v1.3.7)  
> **Purpose**: Active technical debt tracking for KURA OS  
> **Last Updated**: 2026-01-06 (v1.3.7 Release)

This document tracks **actionable** technical debt that requires resolution. Resolved items belong in the [CHANGELOG](../../CHANGELOG.md).

---

## 🔴 CRITICAL (Data Integrity)

### 1. Lack of Automated Testing Infrastructure
**Scope**: Entire codebase (Backend + Frontend)

> [!CAUTION]
> **Zero automated tests exist.** Every deployment is a risk of regression discoverable only in production.

- **Impact**: High - Regressions are frequent during structural refactors.
- **Risk Level**: CRITICAL
- **Required Fix**: Initialize **Pytest** for backend core and **Playwright** for critical clinical happy-paths.
- **Estimated Effort**: 16-24 hours

---

## 📋 Debt Tracking Protocol

1. **NEVER** mark items as "Resolved" here. Move them to the [CHANGELOG](../../CHANGELOG.md).
2. **ALWAYS** include file paths and risk assessment.
3. **PRIORITIZE** by clinical and business impact.
4. **REVIEW** quarterly with the engineering team.
