#!/bin/bash
# deploy.sh - Safe deployment script with migration job pattern
# 
# Pattern: Build -> Migrate Job -> Deploy Service
# This prevents race conditions when Cloud Run scales multiple instances
#
# Usage: ./scripts/deploy.sh (run from repo root)

set -e  # Exit on any error

# Change to repo root (script can be run from anywhere)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

PROJECT_ID="kura-os"
REGION="europe-west1"
SERVICE_NAME="kura-backend"
JOB_NAME="kura-migrator"
# Using Artifact Registry (created by cloud-run-source-deploy)
IMAGE="europe-west1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}"

echo "=========================================="
echo "🚀 KURA OS Safe Deployment"
echo "=========================================="
echo ""

# Step 1: Build and deploy to get new image in Artifact Registry
# Using gcloud run deploy --source which handles build automatically
echo "📦 Step 1: Building new image via Cloud Build..."
gcloud run deploy ${SERVICE_NAME} \
  --source=backend \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --port=8000 \
  --allow-unauthenticated \
  --add-cloudsql-instances=kura-os:europe-southwest1:kura-primary \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,SECRET_KEY=SECRET_KEY:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,STRIPE_PRICE_ID_PRO=STRIPE_PRICE_ID_PRO:latest,STRIPE_PRICE_ID_CENTER=STRIPE_PRICE_ID_CENTER:latest,TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID:latest,TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN:latest,TWILIO_WHATSAPP_NUMBER=TWILIO_WHATSAPP_NUMBER:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,GOOGLE_API_KEY=GOOGLE_API_KEY:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,BREVO_API_KEY=BREVO_API_KEY:latest \
  --env-vars-file=scripts/config/env-vars.yaml \
  --no-traffic  # Deploy without routing traffic yet

echo "✅ Image built and staged (no traffic yet)"
echo ""

# Step 2: Update migration job with new image
echo "🔄 Step 2: Updating migration job..."
gcloud run jobs update ${JOB_NAME} \
  --image=${IMAGE}:latest \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --set-cloudsql-instances=kura-os:europe-southwest1:kura-primary \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,SECRET_KEY=SECRET_KEY:latest \
  --command="alembic" \
  --args="upgrade,heads" \
  2>/dev/null || {
    echo "⚠️ Job doesn't exist, creating..."
    gcloud run jobs create ${JOB_NAME} \
      --image=${IMAGE}:latest \
      --region=${REGION} \
      --project=${PROJECT_ID} \
      --set-cloudsql-instances=kura-os:europe-southwest1:kura-primary \
      --set-secrets=DATABASE_URL=DATABASE_URL:latest,SECRET_KEY=SECRET_KEY:latest \
      --command="alembic" \
      --args="upgrade,heads"
  }
echo "✅ Migration job updated"
echo ""

# Step 3: Execute migration job and wait
echo "🗄️ Step 3: Running database migrations..."
gcloud run jobs execute ${JOB_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --wait

MIGRATION_EXIT_CODE=$?
if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ MIGRATION FAILED! Deployment aborted."
  echo "   Check logs: gcloud run jobs executions logs ${JOB_NAME} --region=${REGION}"
  exit 1
fi
echo "✅ Migrations completed successfully"
echo ""

# Step 4: Route traffic to the new revision (only if migrations succeeded)
echo "🌐 Step 4: Routing traffic to new revision..."
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-latest \
  --region=${REGION} \
  --project=${PROJECT_ID}

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "API URL: https://api.kuraos.ai"
echo "Dashboard: https://app.kuraos.ai"
echo ""
