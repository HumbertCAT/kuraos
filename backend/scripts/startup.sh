#!/bin/bash
# Backend startup script with auto-migration
# This script runs alembic upgrade before starting the server

set -e

echo "🔄 Running database migrations..."
alembic upgrade head || echo "⚠️  Migration failed or already up to date"

echo "🚀 Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} "$@"
