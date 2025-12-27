#!/bin/bash
# ============================================================
# THE BLACK BOX - Database Restore Script (Host Version)
# ============================================================
# Run: ./scripts/restore.sh [backup_file]
# Example: ./scripts/restore.sh backup_2024-12-24_09-00.sql.gz
# This script uses Docker to run psql commands.
# ============================================================

set -e

BACKUP_DIR="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🛡️  THE BLACK BOX - Database Restore"
echo "======================================"
echo ""

# List available backups
echo "📦 Available backups:"
echo ""
if [ -d "${BACKUP_DIR}" ]; then
    ls -lht "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | head -20 | awk '{print "   " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}' || echo "   No backups found!"
else
    echo "   Backup directory not found: ${BACKUP_DIR}"
    exit 1
fi
echo ""

# If no argument provided, ask for selection
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter backup filename to restore (or 'latest' for most recent):${NC}"
    read -r BACKUP_CHOICE
    
    if [ "$BACKUP_CHOICE" = "latest" ]; then
        BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | head -1)
    else
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_CHOICE}"
    fi
else
    if [ "$1" = "latest" ]; then
        BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | head -1)
    else
        BACKUP_FILE="${BACKUP_DIR}/$1"
    fi
fi

# Validate backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}❌ Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE the current database!${NC}"
echo "   Backup to restore: ${BACKUP_FILE}"
echo ""
echo -e "${RED}Are you absolutely sure? Type 'YES' to confirm:${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "🔄 Restoring database from: ${BACKUP_FILE}"

# Database config
DB_NAME="kuraos"
DB_USER="postgres"

echo "   Terminating existing connections..."
docker-compose exec -T db psql -U ${DB_USER} -d postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${DB_NAME}'
  AND pid <> pg_backend_pid();
" 2>/dev/null || true

echo "   Dropping and recreating database..."
docker-compose exec -T db psql -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
docker-compose exec -T db psql -U ${DB_USER} -d postgres -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null

echo "   Importing backup data..."
gunzip -c "${BACKUP_FILE}" | docker-compose exec -T db psql -U ${DB_USER} -d ${DB_NAME} --quiet

echo ""
echo -e "${GREEN}✅ Database restored successfully from: ${BACKUP_FILE}${NC}"
echo ""
echo "🔄 Restarting backend to apply changes..."
docker-compose restart backend

echo ""
echo -e "${GREEN}✅ Restore complete! Refresh your browser.${NC}"
echo ""
