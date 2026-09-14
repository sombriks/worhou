#!/bin/sh
set -e

# Clear visual anchors
info() { echo "ℹ️ [INFO] $1"; }
success() { echo "✅ [SUCCESS] $1"; }
error() { echo "❌ [ERROR] $1" >&2; exit 1; }

# this script must run from project root folder (where package.json is located).
cd "$(dirname "$0")"
cd ../..

info "Checking for remote Git updates..."
git fetch origin

# Compare current HEAD with remote branch (change 'main' if using another branch)
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    info "Repository is up to date."
    exit 0
fi

info "New changes detected. Pulling latest source code..."
git pull origin main

info "Building new local Podman image..."
# Uses your specific dockerfile location and project tag
podman build -f app/infra/Dockerfile -t sombriks/worhou:latest .

info "Updating production compose stack..."
podman compose -f app/infra/production.yml up -d

success "Deployment completed successfully with latest Git commit."
