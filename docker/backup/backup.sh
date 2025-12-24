#!/bin/bash
# ============================================================
# THE BLACK BOX - Backup Script (for Docker container)
# ============================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-therapistos}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "🛡️  THE BLACK BOX - Starting backup..."
echo "   Timestamp: ${TIMESTAMP}"
echo "   Target: ${BACKUP_DIR}/${BACKUP_FILE}"

mkdir -p "${BACKUP_DIR}"

PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-acl \
    | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    SIZE=$(ls -lh "${BACKUP_DIR}/${BACKUP_FILE}" | awk '{print $5}')
    echo "✅ Backup created: ${BACKUP_FILE} (${SIZE})"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo "🔄 Rotating old backups (keeping last ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
echo "📦 Total backups retained: ${BACKUP_COUNT}"

if [ -n "${S3_BUCKET}" ]; then
    echo "☁️  Uploading to S3: ${S3_BUCKET}..."
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${S3_BUCKET}/kura-backups/${BACKUP_FILE}" && \
    echo "✅ S3 upload complete" || echo "⚠️  S3 upload failed"
fi

echo "🛡️  THE BLACK BOX - Backup complete!"
