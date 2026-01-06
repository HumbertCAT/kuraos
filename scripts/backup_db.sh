#!/bin/bash

# KURA OS Database Backup Script
# Creates a timestamped backup before any destructive operation

# Configuration from environment (with defaults for LOCAL dev)
# Production uses kura_db/kura_admin via Cloud SQL
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-therapistos}"
DOCKER_SERVICE="${DOCKER_SERVICE:-db}"

BACKUP_DIR="/Users/humbert/Documents/KuraOS/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kuraos_$TIMESTAMP.sql"

echo "💾 KURA OS Database Backup"
echo "================================"
echo "📋 Config: User=$POSTGRES_USER DB=$POSTGRES_DB"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run pg_dump inside Docker container
echo "📦 Creating backup: $BACKUP_FILE"
docker-compose exec -T "$DOCKER_SERVICE" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "✅ Backup created successfully!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $SIZE"
    
    # Keep only last 5 backups
    cd "$BACKUP_DIR"
    ls -t *.sql | tail -n +6 | xargs -r rm
    echo "   Keeping last 5 backups"
else
    echo "❌ Backup failed!"
    exit 1
fi

