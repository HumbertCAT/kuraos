---
description: Refresh demo data with Golden Seed archetypes
---

# Seed Demo Protocol

> **USE CASE:** Preparing for investor demos or refreshing local dev data.
> **GOAL:** Create rich, realistic patient data for demonstrations.

---

## ⚠️ CHOOSE YOUR VERSION

**Ask the user:** "¿Versión FULL (borra todo) o LIGHT (solo demo patients)?"

### Option A: FULL RESET (Investor Demos)
Wipes **ALL** organization data and rebuilds from scratch.

// turbo
```bash
docker compose exec backend python scripts/reboot_local_universe_PREMIUM.py
```

**Deletes:** All patients, bookings, journeys, forms, services, ai_usage_logs
**Use when:** Complete reset needed for investor demo

---

### Option B: LIGHT RESEED (Development)
Only wipes the **4 demo archetypes** (Marcus, Elena, Julian, Sarah).

// turbo
```bash
docker compose exec backend python scripts/reseed_demo_patients.py
```

**Preserves:** Real patients, journeys, forms, services, ai_usage_logs
**Use when:** Want demo data without losing real work

---

## 🧬 Archetypes Created (Both Versions)

| Name | Archetype | Sentinel Score |
|------|-----------|----------------|
| **Marcus** | The Stable Client | +0.80 (Green) |
| **Elena** | The Anxious Seeker | -0.60 (Yellow) |
| **Julian** | The Crisis Case | -0.90 (Red) |
| **Sarah** | The New Lead | N/A (Ghost) |

---

## 📊 Verification

1. Navigate to `localhost:3001/es/patients`
2. Open Marcus → Sentinel Pulse should show **green trend**
3. Open Julian → Sentinel Pulse should show **red flag**

---

## ✅ Output

Confirm to user:
- 🌱 Seed: Executed
- 👥 Archetypes: 4 patients created
- 📊 Sentinel Pulse: Data visible

