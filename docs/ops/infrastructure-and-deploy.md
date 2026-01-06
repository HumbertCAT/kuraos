# Infrastructure & Deployment Manual

> **Status**: Production (v1.3.7)  
> **Platform**: Google Cloud (europe-southwest1)  
> **Last Updated**: 2026-01-06

---

## 1. Cloud Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          KURA OS on GCP                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐ │
│   │    CLOUDFLARE    │────▶│   CLOUD RUN      │────▶│  CLOUD SQL     │ │
│   │   (DNS/CDN)      │     │   kura-backend   │     │  kura-primary  │ │
│   │   api.kuraos.ai  │     │   Port 8000      │     │  Postgres 15   │ │
│   └──────────────────┘     └──────────────────┘     └────────────────┘ │
│                                   │                        ▲           │
│                                   │ Unix Socket            │           │
│                                   └────────────────────────┘           │
│                                                                         │
│   ┌──────────────────┐     ┌──────────────────┐                        │
│   │ SECRET MANAGER   │     │ ARTIFACT REGISTRY│                        │
│   │ 17 secrets       │     │ cloud-run-source │                        │
│   └──────────────────┘     └──────────────────┘                        │
│                                                                         │
│   ┌──────────────────┐                                                 │
│   │ CLOUD RUN JOB    │                                                 │
│   │ kura-migrator    │ ← Alembic migrations                            │
│   └──────────────────┘                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Summary

| Component | GCP Service | Spec |
|:---|:---|:---|
| API Server | Cloud Run | `kura-backend`, port 8000, unauthenticated |
| Database | Cloud SQL | Postgres 15, `db-f1-micro`, SSD 10GB, europe-southwest1 |
| Container Registry | Artifact Registry | `cloud-run-source-deploy` (auto-created by gcloud run deploy) |
| Secrets | Secret Manager | 17 secrets (see below) |
| Migrations | Cloud Run Job | `kura-migrator` |

---

## 2. The Safe Deployment Pipeline

**File**: `scripts/deploy.sh`

KURA OS uses the **Migration Job Pattern** to prevent race conditions when Cloud Run scales multiple instances.

### The 4-Step Pattern

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 1. BUILD    │───▶│ 2. STAGE    │───▶│ 3. MIGRATE  │───▶│ 4. TRAFFIC  │
│ Cloud Build │    │ --no-traffic │    │ Run Job     │    │ --to-latest │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

| Step | Command | Purpose |
|:---|:---|:---|
| 1. Build | `gcloud run deploy --source --no-traffic` | Build image via Cloud Build, deploy without traffic |
| 2. Update Job | `gcloud run jobs update kura-migrator` | Point migration job to new image |
| 3. Migrate | `gcloud run jobs execute --wait` | Run `alembic upgrade heads` |
| 4. Traffic | `gcloud run services update-traffic --to-latest` | Route traffic only if migrations succeed |

> [!IMPORTANT]
> If Step 3 (migrations) fails, the script **aborts** and traffic stays on the old revision. Zero-downtime safety.

### Usage

```bash
# From repository root
./scripts/deploy.sh
```

---

## 3. Secrets Management

**Service**: Google Secret Manager

### Required Secrets

| Secret Name | Purpose | Source |
|:---|:---|:---|
| `DATABASE_URL` | PostgreSQL connection string (Unix socket) | Auto-generated |
| `SECRET_KEY` | FastAPI session encryption | Auto-generated |
| `DB_PASSWORD` | Database user password | Auto-generated |
| `STRIPE_SECRET_KEY` | Stripe API key | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature validation | Stripe Dashboard |
| `TWILIO_ACCOUNT_SID` | Twilio account | Twilio Console |
| `TWILIO_AUTH_TOKEN` | Twilio auth | Twilio Console |
| `TWILIO_WHATSAPP_NUMBER` | WhatsApp sender | Twilio Console |
| `OPENAI_API_KEY` | TTS for briefings | OpenAI |
| `GOOGLE_API_KEY` | Gemini AI | Google AI Studio |
| `GOOGLE_CLIENT_ID` | OAuth | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth | Google Cloud Console |
| `BREVO_API_KEY` | Email service | Brevo |

### Injection Method

Secrets are injected via `--set-secrets` in the deploy command:

```bash
--set-secrets=DATABASE_URL=DATABASE_URL:latest,SECRET_KEY=SECRET_KEY:latest,...
```

### Updating a Secret

```bash
# Update secret value
echo -n "new_value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Redeploy to pick up new secret
./scripts/deploy.sh
```

---

## 4. Database Operations

### Connection via Cloud SQL Proxy

```bash
# Install proxy
gcloud components install cloud-sql-proxy

# Start proxy (in separate terminal)
cloud-sql-proxy kura-os:europe-southwest1:kura-primary

# Connect via psql
psql "host=127.0.0.1 port=5432 user=kura_app dbname=kuraosbd"
```

### Backup System

**File**: `backend/app/api/v1/admin_backups.py`

KURA OS has an API-driven backup system accessible via the Admin panel (Super Admin only).

| Endpoint | Method | Action |
|:---|:---:|:---|
| `/api/v1/admin/backups` | GET | List all backups |
| `/api/v1/admin/backups/create` | POST | Create new backup |
| `/api/v1/admin/backups/restore` | POST | Restore from backup |
| `/api/v1/admin/backups/{filename}/download` | GET | Download backup file |
| `/api/v1/admin/backups/{filename}` | DELETE | Delete backup |

**Backup Format**: `backup_YYYY-MM-DD_HH-MM.sql.gz`  
**Storage**: `/app/backups/` (Cloud Run ephemeral) + download capability

### Disaster Recovery

> [!CAUTION]
> **DESTRUCTIVE ACTION**: Restore will **DROP** the current database and recreate it from the backup. All data since the backup will be lost.

**Step 1: Create Pre-Restore Backup**
```
POST /api/v1/admin/backups/create
```

**Step 2: Download Critical Backup (Safety)**
```
GET /api/v1/admin/backups/{filename}/download
```

**Step 3: Execute Restore**
```
POST /api/v1/admin/backups/restore
{
  "filename": "backup_2026-01-03_10-37.sql.gz",
  "confirm": true  ← REQUIRED
}
```

**Step 4: Refresh Application**
- All active sessions will be invalidated
- Users must re-login

### Local Backup Script

**File**: `scripts/backup_db.sh`

For local Docker development:

```bash
# From repository root
./scripts/backup_db.sh

# Output: backups/kuraos_YYYYMMDD_HHMMSS.sql
# Retention: Last 5 backups
```

---

## 5. Initial Infrastructure Setup

**File**: `scripts/setup_infra.sh`

Run **ONCE** to provision GCP infrastructure:

```bash
./scripts/setup_infra.sh
```

### What It Creates

1. **Enables APIs**: Cloud Run, Cloud SQL, Secret Manager, Artifact Registry, Cloud Build
2. **Artifact Registry**: `cloud-run-source-deploy` (auto-created by `gcloud run deploy --source`)
3. **Cloud SQL**: `kura-primary` (Postgres 15, db-f1-micro, daily backups at 03:00)
4. **Database**: `kuraosbd` with user `kura_app`
5. **Secrets**: `DB_PASSWORD`, `SECRET_KEY`, `DATABASE_URL`
6. **IAM**: Grants Cloud Run service account access to secrets and SQL

### Configuration

```bash
PROJECT_ID="kura-os"
REGION="europe-southwest1"
INSTANCE_NAME="kura-primary"
DB_NAME="kuraosbd"
DB_USER="kura_app"
```

---

## 6. Monitoring

### Twilio Webhook Flow

**Reference**: `docs/Monitorizacion_Technical_Doc.md`

```
Patient WhatsApp → Twilio → POST /api/v1/webhooks/whatsapp → AletheIA Analysis
```

### Cloud Run Logs

```bash
# View service logs
gcloud run services logs read kura-backend --region=europe-west1 --limit=100

# View migration job logs
gcloud run jobs executions logs kura-migrator --region=europe-west1
```

### Health Check

```bash
curl https://api.kuraos.ai/health
# Expected: {"status": "healthy", "version": "1.1.20"}
```

---

## 7. Key Files Reference

| File | Purpose |
|:---|:---|
| `scripts/setup_infra.sh` | One-time GCP infrastructure provisioning |
| `scripts/deploy.sh` | Safe deployment with migration job pattern |
| `scripts/backup_db.sh` | Local Docker database backup |
| `scripts/config/env-vars.yaml` | Non-sensitive environment variables |
| `backend/app/api/v1/admin_backups.py` | REST API for backup/restore |
| `backend/Dockerfile` | Production container definition |

---

## 8. Post-Deployment Verification (Human Checklist)

After a successful deployment, manually verify these critical flows:

- [ ] **Auth:** Login and Register a new test user
- [ ] **Payments:** Verify Stripe is in LIVE mode (not Test) and allows checkout
- [ ] **AI Engine:** Check that the Daily Briefing generates audio
- [ ] **WhatsApp:** Send a message to the bot and confirm AletheIA replies (check logs)
- [ ] **Monitoring:** Verify Sentry/Cloud Logging is capturing events
