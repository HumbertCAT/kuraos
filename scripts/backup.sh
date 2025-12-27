#!/bin/bash
# ============================================================
# THE BLACK BOX - Automated PostgreSQL Backup (Host Version)
# ============================================================
# Run: ./scripts/backup.sh
# This script runs pg_dump via Docker to avoid requiring
# PostgreSQL client on the host machine.
# ============================================================

set -e

BACKUP_DIR="./backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

echo "🛡️  THE BLACK BOX - Starting backup..."
echo "   Timestamp: ${TIMESTAMP}"
echo "   Target: ${BACKUP_DIR}/${BACKUP_FILE}"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Run pg_dump via Docker container
docker-compose exec -T db pg_dump -U postgres --no-owner --no-acl kuraos | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup was successful
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ] && [ $(stat -f%z "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}") -gt 100 ]; then
    SIZE=$(ls -lh "${BACKUP_DIR}/${BACKUP_FILE}" | awk '{print $5}')
    echo "✅ Backup created: ${BACKUP_FILE} (${SIZE})"
else
    echo "❌ Backup failed or file too small!"
    rm -f "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null
    exit 1
fi

# Rotation: Delete backups older than RETENTION_DAYS
echo "🔄 Rotating old backups (keeping last ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Count remaining backups
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
echo "📦 Total backups retained: ${BACKUP_COUNT}"

echo "🛡️  THE BLACK BOX - Backup complete!"
echo ""
