#!/bin/bash

# AutoLive Log Cleanup Script
# This script cleans up old log files based on retention policy

LOG_DIR="../logs"
RETENTION_DAYS=30
ERROR_RETENTION_DAYS=90
ACCESS_RETENTION_DAYS=60
ARCHIVE_DIR="../logs/archive"
LOG_FILE="../logs/cleanup.log"

# Create archive directory if it doesn't exist
mkdir -p $ARCHIVE_DIR

# Logging function
log_message() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a $LOG_FILE
}

log_message "Starting log cleanup process..."

# Check disk usage before cleanup
DISK_USAGE_BEFORE=$(du -sh $LOG_DIR | cut -f1)
log_message "Disk usage before cleanup: $DISK_USAGE_BEFORE"

# Archive old logs
log_message "Archiving logs older than $RETENTION_DAYS days..."
find $LOG_DIR -name "*.log" -type f -mtime +$RETENTION_DAYS \
    -not -path "$ARCHIVE_DIR/*" \
    -exec tar -rvf "$ARCHIVE_DIR/logs_$(date +%Y%m%d).tar" {} \;

# Compress archive
if [ -f "$ARCHIVE_DIR/logs_$(date +%Y%m%d).tar" ]; then
    gzip "$ARCHIVE_DIR/logs_$(date +%Y%m%d).tar"
    log_message "Archive created: logs_$(date +%Y%m%d).tar.gz"
fi

# Remove old logs (after archiving)
log_message "Removing logs older than $RETENTION_DAYS days..."
find $LOG_DIR -name "*.log" -type f -mtime +$RETENTION_DAYS -delete

# Keep error logs longer
log_message "Preserving error logs for $ERROR_RETENTION_DAYS days..."
find $LOG_DIR -name "error-*.log" -type f -mtime +$ERROR_RETENTION_DAYS -delete

# Keep access logs for medium term
log_message "Preserving access logs for $ACCESS_RETENTION_DAYS days..."
find $LOG_DIR -name "access-*.log" -type f -mtime +$ACCESS_RETENTION_DAYS -delete

# Remove archives older than 1 year
log_message "Removing archives older than 365 days..."
find $ARCHIVE_DIR -name "*.gz" -type f -mtime +365 -delete

# Check disk usage after cleanup
DISK_USAGE_AFTER=$(du -sh $LOG_DIR | cut -f1)
log_message "Disk usage after cleanup: $DISK_USAGE_AFTER"

# Calculate space saved
log_message "Space saved: $(echo "$DISK_USAGE_BEFORE $DISK_USAGE_AFTER" | awk '{print $1 - $2}')"

# Generate summary report
cat > $ARCHIVE_DIR/cleanup_report_$(date +%Y%m%d).txt << EOF
Log Cleanup Report
==================
Date: $(date)
Retention Days: $RETENTION_DAYS
Error Log Retention: $ERROR_RETENTION_DAYS
Access Log Retention: $ACCESS_RETENTION_DAYS

Disk Usage Before: $DISK_USAGE_BEFORE
Disk Usage After: $DISK_USAGE_AFTER
Space Saved: $(echo "$DISK_USAGE_BEFORE $DISK_USAGE_AFTER" | awk '{print $1 - $2}')

Files Archived: $(find $ARCHIVE_DIR -name "*.gz" -type f -mtime -1 | wc -l)
Total Archives: $(find $ARCHIVE_DIR -name "*.gz" -type f | wc -l)
EOF

log_message "Cleanup completed successfully!"
log_message "Report generated: cleanup_report_$(date +%Y%m%d).txt"
