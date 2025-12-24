#!/bin/bash
# ============================================================
# THE BLACK BOX - Entrypoint (Scheduled Backup Loop)
# ============================================================

set -e

INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-6}"
INTERVAL_SECONDS=$((INTERVAL_HOURS * 3600))

echo "🛡️  THE BLACK BOX - Backup Service Started"
echo "   Interval: Every ${INTERVAL_HOURS} hours"
echo "   Retention: ${BACKUP_RETENTION_DAYS:-7} days"
echo ""

# Run initial backup on startup
echo "📸 Running initial backup..."
/scripts/backup.sh

# Loop forever, sleeping between backups
while true; do
    echo "💤 Sleeping for ${INTERVAL_HOURS} hours until next backup..."
    sleep ${INTERVAL_SECONDS}
    echo ""
    echo "⏰ Scheduled backup triggered"
    /scripts/backup.sh
done
