#!/bin/bash

# AutoLive Backup Script
echo "Starting AutoLive Backup..."

# Configuration
BACKUP_ROOT="../backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="autolive_full_$TIMESTAMP"
LOG_FILE="../logs/backup.log"

# Create backup directories
mkdir -p "$BACKUP_ROOT"/{database,application,config}

# Logging function
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

log "Starting backup process..."

# Backup application files
log "Backing up application files..."
tar -czf "$BACKUP_ROOT/application/$BACKUP_NAME-app.tar.gz" \
    --exclude="node_modules" \
    --exclude="logs" \
    --exclude="backups" \
    --exclude=".git" \
    ../

# Backup configuration files
log "Backing up configuration files..."
tar -czf "$BACKUP_ROOT/config/$BACKUP_NAME-config.tar.gz" \
    ../.env \
    ../config/* 2>/dev/null || true

# Backup database (if using MongoDB)
if [ -f "../.env" ] && grep -q "MONGODB_URI" "../.env"; then
    log "Backing up MongoDB database..."
    source "../.env"
    mongodump --uri="$MONGODB_URI" \
        --out="$BACKUP_ROOT/database/$BACKUP_NAME-db"
    
    # Compress database backup
    tar -czf "$BACKUP_ROOT/database/$BACKUP_NAME-db.tar.gz" \
        -C "$BACKUP_ROOT/database" "$BACKUP_NAME-db"
    rm -rf "$BACKUP_ROOT/database/$BACKUP_NAME-db"
fi

# Create manifest file
cat > "$BACKUP_ROOT/$BACKUP_NAME-manifest.json" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "backup_name": "$BACKUP_NAME",
    "files_included": [
        "application/$BACKUP_NAME-app.tar.gz",
        "config/$BACKUP_NAME-config.tar.gz"
    ],
    "database_included": $(if [ -f "$BACKUP_ROOT/database/$BACKUP_NAME-db.tar.gz" ]; then echo "true"; else echo "false"; fi),
    "backup_type": "full"
}
EOF

# Remove old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_ROOT" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_ROOT/database" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_ROOT" | cut -f1)
log "Backup completed successfully!"
log "Total backup size: $BACKUP_SIZE"
log "Backup location: $BACKUP_ROOT"
