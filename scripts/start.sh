#!/bin/bash

# AutoLive Start Script
echo "Starting AutoLive Application..."

# Load environment variables
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
    echo "Environment variables loaded"
else
    echo "Warning: .env file not found"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if npm packages are installed
if [ ! -d "../node_modules" ]; then
    echo "Installing dependencies..."
    cd .. && npm install
fi

# Start the application
echo "Starting server on port ${PORT:-3000}..."
cd .. && npm start > logs/access.log 2> logs/error.log &

# Save process ID
echo $! > .pid
echo "AutoLive started with PID: $(cat .pid)"
