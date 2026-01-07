#!/bin/bash
# ==============================================================================
# KURA OS - Production Startup Script
# ==============================================================================
# This script is the entrypoint for the production Docker container.
# It runs database migrations and starts the Gunicorn server.
# ==============================================================================

set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Pipelines fail on first error

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ==============================================================================
# STEP 1: Database Migrations (Optional - controlled by pipeline)
# ==============================================================================
# In production, migrations are handled by the Cloud Run Job (kura-migrator)
# BEFORE the deploy step. This toggle allows skipping redundant checks.
# Default: true (safe for local/manual runs)
# Production: Set RUN_MIGRATIONS_ON_STARTUP=false in Cloud Run env vars
# ==============================================================================
log_info "Starting Kura OS Backend..."

if [ "${RUN_MIGRATIONS_ON_STARTUP:-true}" = "true" ]; then
    log_info "Running database migrations..."
    if alembic upgrade heads; then
        log_info "✅ Database migrations completed successfully"
    else
        log_error "❌ Database migrations FAILED"
        log_error "Container will exit. Please check your DATABASE_URL and migration files."
        exit 1
    fi
else
    log_info "⏭️  Skipping migrations (handled by pipeline)"
fi

# ==============================================================================
# STEP 2: Start Gunicorn with Uvicorn Workers
# ==============================================================================
log_info "Starting Gunicorn server on port ${PORT:-8080}..."

# Configuration
WORKERS=${GUNICORN_WORKERS:-4}
TIMEOUT=${GUNICORN_TIMEOUT:-120}
KEEP_ALIVE=${GUNICORN_KEEP_ALIVE:-5}

log_info "Configuration: Workers=$WORKERS, Timeout=$TIMEOUT, Keep-Alive=$KEEP_ALIVE"

# Use exec to replace shell process with gunicorn (proper signal handling)
exec gunicorn \
    --bind "0.0.0.0:${PORT:-8080}" \
    --workers "$WORKERS" \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout "$TIMEOUT" \
    --keep-alive "$KEEP_ALIVE" \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --enable-stdio-inheritance \
    app.main:app
