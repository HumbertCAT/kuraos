#!/bin/bash

# TherapistOS Database Backup Script
# Creates a timestamped backup before any destructive operation

BACKUP_DIR="/Users/humbert/Documents/TherapistOS/TherapistOS-Claude/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/therapistos_$TIMESTAMP.sql"

echo "💾 TherapistOS Database Backup"
echo "================================"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run pg_dump inside Docker container
echo "📦 Creating backup: $BACKUP_FILE"
docker-compose exec -T db pg_dump -U postgres therapistos > "$BACKUP_FILE"

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
