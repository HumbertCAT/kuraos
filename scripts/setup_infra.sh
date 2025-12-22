#!/bin/bash
# ==============================================================================
# KURA OS - GCP Infrastructure Setup Script
# ==============================================================================
# Run this script ONCE to set up the GCP infrastructure.
# Prerequisites: gcloud CLI installed and authenticated.
# Usage: ./setup_infra.sh
# ==============================================================================

set -e
set -o pipefail

# ==============================================================================
# CONFIGURATION - Modify these values as needed
# ==============================================================================
PROJECT_ID="kura-os"
REGION="europe-southwest1"
INSTANCE_NAME="kura-primary"
DB_NAME="kuraosbd"
DB_USER="kura_app"
REPO_NAME="kura-repo"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"; echo -e "${BLUE}▶ $1${NC}"; echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"; }

# ==============================================================================
# STEP 0: Validate Prerequisites
# ==============================================================================
log_step "Validating Prerequisites"

if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI not found. Install it from https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID"
log_info "Using project: $PROJECT_ID"

# ==============================================================================
# STEP 1: Enable Required APIs
# ==============================================================================
log_step "Enabling GCP APIs"

APIS=(
    "run.googleapis.com"
    "sqladmin.googleapis.com"
    "sql-component.googleapis.com"
    "secretmanager.googleapis.com"
    "artifactregistry.googleapis.com"
    "cloudbuild.googleapis.com"
)

for api in "${APIS[@]}"; do
    log_info "Enabling $api..."
    gcloud services enable "$api" --quiet
done
log_info "✅ All APIs enabled"

# ==============================================================================
# STEP 2: Create Artifact Registry Repository
# ==============================================================================
log_step "Creating Artifact Registry Repository"

if gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &> /dev/null; then
    log_warn "Repository $REPO_NAME already exists, skipping..."
else
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Kura OS Docker images"
    log_info "✅ Artifact Registry repository created"
fi

# ==============================================================================
# STEP 3: Create Cloud SQL Instance
# ==============================================================================
log_step "Creating Cloud SQL Instance"

if gcloud sql instances describe "$INSTANCE_NAME" &> /dev/null; then
    log_warn "Cloud SQL instance $INSTANCE_NAME already exists, skipping..."
else
    log_info "Creating Cloud SQL instance (this takes 5-10 minutes)..."
    gcloud sql instances create "$INSTANCE_NAME" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="$REGION" \
        --storage-type=SSD \
        --storage-size=10GB \
        --availability-type=zonal \
        --backup-start-time=03:00 \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=04 \
        --insights-config-query-insights-enabled
    log_info "✅ Cloud SQL instance created"
fi

# ==============================================================================
# STEP 4: Create Database and User
# ==============================================================================
log_step "Creating Database and User"

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

# Create database
log_info "Creating database $DB_NAME..."
gcloud sql databases create "$DB_NAME" --instance="$INSTANCE_NAME" 2>/dev/null || log_warn "Database may already exist"

# Create user
log_info "Creating user $DB_USER..."
gcloud sql users create "$DB_USER" \
    --instance="$INSTANCE_NAME" \
    --password="$DB_PASSWORD" 2>/dev/null || log_warn "User may already exist, updating password..."

# Update password if user exists
gcloud sql users set-password "$DB_USER" \
    --instance="$INSTANCE_NAME" \
    --password="$DB_PASSWORD"

log_info "✅ Database and user created"

# ==============================================================================
# STEP 5: Create Secrets in Secret Manager
# ==============================================================================
log_step "Creating Secrets in Secret Manager"

# Generate SECRET_KEY
SECRET_KEY=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)

# Cloud SQL connection string (Unix socket for Cloud Run)
# Format: postgresql+asyncpg://USER:PASS@/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE
DATABASE_URL="postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"

create_or_update_secret() {
    local name=$1
    local value=$2
    
    if gcloud secrets describe "$name" &> /dev/null; then
        printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=-
        log_info "Updated secret: $name"
    else
        printf '%s' "$value" | gcloud secrets create "$name" --data-file=- --replication-policy="automatic"
        log_info "Created secret: $name"
    fi
}

create_or_update_secret "DB_PASSWORD" "$DB_PASSWORD"
create_or_update_secret "SECRET_KEY" "$SECRET_KEY"
create_or_update_secret "DATABASE_URL" "$DATABASE_URL"

log_info "✅ All secrets created"

# ==============================================================================
# STEP 6: Configure IAM for Cloud Run
# ==============================================================================
log_step "Configuring IAM Permissions"

# Get the Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUD_RUN_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

# Grant Cloud SQL Client access
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUD_RUN_SA}" \
    --role="roles/cloudsql.client" \
    --quiet

log_info "✅ IAM permissions configured"

# ==============================================================================
# SUMMARY
# ==============================================================================
log_step "Setup Complete! 🎉"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  KURA OS - GCP Infrastructure Summary"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "  Project ID:        $PROJECT_ID"
echo "  Region:            $REGION"
echo "  Cloud SQL:         $INSTANCE_NAME"
echo "  Database:          $DB_NAME"
echo "  DB User:           $DB_USER"
echo "  Artifact Registry: $REPO_NAME"
echo ""
echo "  Secrets Created:"
echo "    - DB_PASSWORD"
echo "    - SECRET_KEY"
echo "    - DATABASE_URL"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
log_warn "IMPORTANT: Save these credentials securely!"
echo ""
echo "  DB_PASSWORD: $DB_PASSWORD"
echo "  SECRET_KEY:  $SECRET_KEY"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
log_info "Next step: Run ./deploy.sh to deploy the application"
