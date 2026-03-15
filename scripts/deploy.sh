#!/bin/bash

# AutoLive Deployment Script
echo "Starting AutoLive Deployment..."

# Configuration
DEPLOY_ENV=${1:-production}
BACKUP_DIR="../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function to log messages
log_message() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a deploy.log
}

# Stop current application if running
if [ -f ../.pid ]; then
    log_message "Stopping current AutoLive instance..."
    kill $(cat ../.pid) 2>/dev/null || true
    rm ../.pid
fi

# Create backup
log_message "Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/autolive_backup_$TIMESTAMP.tar.gz" \
    --exclude="node_modules" \
    --exclude="logs" \
    --exclude=".git" \
    ../

# Pull latest changes (if using git)
if [ -d "../.git" ]; then
    log_message "Pulling latest changes..."
    cd .. && git pull origin main
fi

# Install dependencies
log_message "Installing dependencies..."
cd .. && npm ci --only=production

# Run database migrations (if any)
if [ -f "../migrations" ]; then
    log_message "Running database migrations..."
    npm run migrate
fi

# Run tests
log_message "Running tests..."
npm test

if [ $? -eq 0 ]; then
    log_message "Tests passed successfully!"
    
    # Start application
    log_message "Starting AutoLive in $DEPLOY_ENV mode..."
    NODE_ENV=$DEPLOY_ENV ./start.sh
    
    log_message "Deployment completed successfully!"
else
    log_message "Tests failed! Rolling back..."
    
    # Rollback to previous version
    tar -xzf "$BACKUP_DIR/autolive_backup_$TIMESTAMP.tar.gz" -C ../
    log_message "Rollback completed"
    exit 1
fi
