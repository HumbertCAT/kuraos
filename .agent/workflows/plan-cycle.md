---
description: Generator Protocol planning phase - from idea to implementation plan
---

# Plan Cycle (The Spark)

> **USE CASE:** Run this when you have a new idea, BEFORE writing code.
> **GOAL:** Generate a solid `implementation_plan.md` authorized by the Director.

---

## 🧠 Step 1: The Brief (Dialectic)

**Ask the user:**
1. **Objective:** What are we building?
2. **Why:** Which Trinity Pillar does this serve? (CONNECT / PRACTICE / GROW)
3. **Risk:** Does it touch HIPAA data or Payments?

---

## 🗺️ Step 2: The Architect's Strategy

**Analyze based on Context:**
1. **Architecture:** Where does this live? (Check Trinity Nav)
2. **Integrity:** What Semantic Tokens and Components will we use?
3. **Data:** Do we need a new Table? → Mark for `/safe-migration`

---

## 📝 Step 3: The Blueprint

**Generate `implementation_plan.md` with:**

1. **User Story:** As a [Role], I want [Feature]
2. **Technical Specs:**
   - Frontend Path
   - Backend Model (if any)
   - New Dependencies (if any)
3. **Execution Steps:**
   - [ ] Step 1: Scaffold → `/create-feature`
   - [ ] Step 2: DB (if needed) → `/safe-migration`
   - [ ] Step 3: Logic implementation
   - [ ] Step 4: UI Polish (Tactile Physics)

---

## 🚦 Step 4: Approval

**Stop and ask:**
> "Director, ¿apruebas este plan de implementación? Si dices SÍ, procederé a la Fase de Ejecución."

---

## ✅ Output

- 📋 `implementation_plan.md` generated
- 🌐 Domain defined (CONNECT/PRACTICE/GROW)
- ⚠️ Risk level identified
- 🚀 Ready for execution phase
