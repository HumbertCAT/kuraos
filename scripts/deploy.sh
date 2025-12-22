#!/bin/bash
# ==============================================================================
# KURA OS - Deployment Script for Cloud Run
# ==============================================================================
# Run this script to build and deploy the backend to Cloud Run.
# Prerequisites: 
#   - setup_infra.sh has been run
#   - Docker is installed and running
#   - gcloud CLI authenticated
# Usage: ./deploy.sh [--tag TAG]
# ==============================================================================

set -e
set -o pipefail

# ==============================================================================
# CONFIGURATION
# ==============================================================================
PROJECT_ID="kura-os"
REGION="europe-southwest1"
SERVICE_NAME="kura-backend"
REPO_NAME="kura-repo"
INSTANCE_NAME="kura-primary"

# Docker image path
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}"

# Parse arguments
TAG="${1:-latest}"
if [[ "$1" == "--tag" ]]; then
    TAG="${2:-latest}"
fi

# Add git commit hash if available
if git rev-parse --short HEAD &> /dev/null; then
    GIT_SHA=$(git rev-parse --short HEAD)
    TAG="${TAG}-${GIT_SHA}"
fi

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

if ! command -v docker &> /dev/null; then
    log_error "Docker not found. Please install Docker."
    exit 1
fi

if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID"
log_info "Project: $PROJECT_ID"
log_info "Image: ${IMAGE_URI}:${TAG}"

# ==============================================================================
# STEP 1: Configure Docker for Artifact Registry
# ==============================================================================
log_step "Configuring Docker Authentication"

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
log_info "✅ Docker configured for Artifact Registry"

# ==============================================================================
# STEP 2: Build Docker Image
# ==============================================================================
log_step "Building Docker Image"

cd "$(dirname "$0")/../backend"

log_info "Building image with Dockerfile.prod..."
docker build \
    --platform linux/amd64 \
    -f Dockerfile.prod \
    -t "${IMAGE_URI}:${TAG}" \
    -t "${IMAGE_URI}:latest" \
    .

log_info "✅ Docker image built successfully"

# ==============================================================================
# STEP 3: Push to Artifact Registry
# ==============================================================================
log_step "Pushing to Artifact Registry"

docker push "${IMAGE_URI}:${TAG}"
docker push "${IMAGE_URI}:latest"

log_info "✅ Image pushed to Artifact Registry"

# ==============================================================================
# STEP 4: Deploy to Cloud Run
# ==============================================================================
log_step "Deploying to Cloud Run"

CLOUD_SQL_CONNECTION="${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"

gcloud run deploy "$SERVICE_NAME" \
    --image="${IMAGE_URI}:${TAG}" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --cpu=1 \
    --memory=512Mi \
    --min-instances=0 \
    --max-instances=10 \
    --concurrency=80 \
    --timeout=300 \
    --add-cloudsql-instances="$CLOUD_SQL_CONNECTION" \
    --set-secrets="DATABASE_URL=DATABASE_URL:latest,SECRET_KEY=SECRET_KEY:latest" \
    --set-env-vars="GOOGLE_PROJECT_ID=${PROJECT_ID},GOOGLE_LOCATION=${REGION}" \
    --quiet

log_info "✅ Deployed to Cloud Run"

# ==============================================================================
# STEP 5: Get Service URL
# ==============================================================================
log_step "Deployment Complete! 🎉"

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  KURA OS Backend - Deployment Summary"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "  Service:   $SERVICE_NAME"
echo "  Region:    $REGION"
echo "  Image:     ${IMAGE_URI}:${TAG}"
echo ""
echo "  🌐 Service URL: $SERVICE_URL"
echo "  📋 API Docs:    ${SERVICE_URL}/docs"
echo "  ❤️  Health:      ${SERVICE_URL}/api/v1/health"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
log_info "Test the deployment:"
echo "  curl ${SERVICE_URL}/api/v1/health"
