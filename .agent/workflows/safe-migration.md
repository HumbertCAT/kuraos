---
description: Create Alembic migration with mandatory backup
---

# Safe Migration Protocol

> **USE CASE:** Any database schema change.
> **PHILOSOPHY:** "The Black Box protects us." Always backup before touching the schema.

---

## 📦 Phase 1: The Safety Net (MANDATORY)

Before generating ANY migration, create a backup.

// turbo
```bash
./scripts/backup_db.sh
```

---

## 🧬 Phase 2: Generate Migration

// turbo
```bash
cd backend && alembic revision --autogenerate -m "descriptive_name_here"
```

---

## 🔍 Phase 3: Review & Harden

**Check the generated migration file for:**

1. **Enum Types:** Must use `checkfirst=True`
   ```python
   from sqlalchemy.dialects.postgresql import ENUM
   enum_type = ENUM('VALUE1', 'VALUE2', name='typename', create_type=False)
   enum_type.create(op.get_bind(), checkfirst=True)
   ```

2. **Downgrade:** Never hard-drop Enums without `IF EXISTS`
   ```python
   op.execute("DROP TYPE IF EXISTS typename")
   ```

3. **organization_id:** New tables MUST have `organization_id` FK

---

## 🧪 Phase 4: Test Locally

// turbo
```bash
cd backend && alembic upgrade head
```

// turbo
```bash
cd backend && alembic downgrade -1 && alembic upgrade head
```

---

## ✅ Output

Confirm to user:
- 📦 Backup: Created
- 🧬 Migration: `versions/xxx_descriptive_name.py`
- ✓ Up/Down: Tested locally
- ⚠️ Reminder: Run `./scripts/deploy.sh` to apply in production
