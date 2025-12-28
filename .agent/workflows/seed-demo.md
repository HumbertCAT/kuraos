---
description: Refresh demo data with Golden Seed archetypes
---

# Seed Demo Protocol

> **USE CASE:** Preparing for investor demos or refreshing local dev data.
> **GOAL:** Create rich, realistic patient data for demonstrations.

---

## 🌱 Phase 1: Run Golden Seed

// turbo
```bash
docker compose exec backend python scripts/reboot_local_universe_PREMIUM.py
```

Alternative (if not using Docker):
```bash
cd backend && python scripts/reboot_local_universe_PREMIUM.py
```

---

## 🧬 Phase 2: Verify Archetypes

Confirm the 4 archetypes were created:

| Name | Archetype | Sentinel Score |
|------|-----------|----------------|
| **Marcus** | The Stable Client | +0.80 (Green) |
| **Elena** | The Anxious Seeker | -0.60 (Yellow) |
| **Julian** | The Crisis Case | -0.90 (Red) |
| **Sarah** | The New Lead | N/A (Ghost) |

---

## 📊 Phase 3: Verify Sentinel Pulse

1. Navigate to `localhost:3001/es/patients`
2. Open Marcus → Sentinel Pulse should show **green trend**
3. Open Julian → Sentinel Pulse should show **red flag**

---

## ✅ Output

Confirm to user:
- 🌱 Seed: Executed
- 👥 Archetypes: 4 patients created
- 📊 Sentinel Pulse: Data visible
