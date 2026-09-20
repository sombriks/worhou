#!/bin/sh
set -e

# this script must run from project root folder (where package.json is located).
cd "$(dirname "$0")"
cd ../..

# Clear visual anchors for errors/success
info() { echo "ℹ️ [INFO] $1"; }
success() { echo "✅ [SUCCESS] $1"; }
error() { echo "❌ [ERROR] $1" >&2; exit 1; }

info "Starting deployment environment checks..."
info "Working directory: [$(pwd)]"

# ------------------------------------------------------------------
# 3. Check Git
# ------------------------------------------------------------------
info "Checking Git installation..."
if ! command -v git >/dev/null 2>&1; then
    error "Git is not installed. Please install it to manage the project updates."
else
    success "Git is installed ($(git --version | awk '{print $3}'))."
fi

# ------------------------------------------------------------------
# 1. Check Caddy
# ------------------------------------------------------------------
info "Checking Caddy installation..."
if ! command -v caddy >/dev/null 2>&1; then
    error "Caddy is not installed on bare metal. Please install it first."
fi

# Validate if the Caddyfile or snippet directory exists
if [ ! -d "/etc/caddy/Caddyfile.d" ] && [ ! -f "/etc/caddy/Caddyfile" ]; then
    info "Caddy is installed but generic configuration paths were not detected."
else
    success "Caddy configuration environment looks good."
fi

# Validate if worhou.caddy is present under /etc/caddy/Caddyfile.d
CADDY_CONF_TARGET="/etc/caddy/Caddyfile.d/worhou.caddy"
info "Checking for $CADDY_CONF_TARGET..."

if [ ! -f "$CADDY_CONF_TARGET" ]; then
    CADDY_CONF_SOURCE="worhou.caddy"
    if [ ! -f "$CADDY_CONF_SOURCE" ] && [ -f "app/infra/worhou.caddy" ]; then
        CADDY_CONF_SOURCE="app/infra/worhou.caddy"
    fi

    info "Caddy configuration for worhou is missing at target destination."
    echo "   👉 Please run the following command to deploy it:"
    echo "      sudo cp $CADDY_CONF_SOURCE $CADDY_CONF_TARGET && sudo systemctl reload caddy"
    echo ""
    error "Missing caddy configuration file."
else
    success "worhou.caddy found and active under /etc/caddy/Caddyfile.d."
fi

# ------------------------------------------------------------------
# 2. Check Podman
# ------------------------------------------------------------------
info "Checking Podman installation..."
if ! command -v podman >/dev/null 2>&1; then
    error "Podman is not installed."
fi

# Test if podman compose sub-command is available
if ! podman compose version >/dev/null 2>&1; then
    error "podman compose sub-command is missing. Please install podman-docker or the compose plugin."
fi
success "Podman and compose module are ready."

# Verify user lingering is turned on (Critical for keeping rootless systemd/cron alive)
USER_LINGER_FILE="/var/lib/systemd/linger/$(whoami)"
if [ ! -f "$USER_LINGER_FILE" ]; then
    info "Systemd lingering is not enabled for $(whoami). Enabling it now..."
    loginctl enable-linger
    success "Lingering enabled. Podman sockets will now survive logout."
else
    success "Systemd lingering is already enabled."
fi

# ------------------------------------------------------------------
# 3. Check .env file
# ------------------------------------------------------------------
info "Checking for .env file..."
if [ ! -f ".env" ]; then
    info "No .env file found. Creating a baseline configuration with default values..."
    cat << 'EOF' > .env
VERSION=latest
NODE_ENV=production
DB_USER=worhou
DB_PASSWORD=worhou
DB_PORT=5432
PG_DATA=../../pg-data
PORT=3000
HOST=0.0.0.0
AUTH_KEY=
AUTH_EXPIRES_IN=1d
EMAIL_API_URL=
EMAIL_API_USERNAME=
EMAIL_API_PASSWORD=
EOF
    success ".env file generated successfully."
else
    success ".env file found."
fi

# ------------------------------------------------------------------
# 4. Check Production Compose File
# ------------------------------------------------------------------
info "Checking production compose file..."
COMPOSE_FILE="app/infra/production.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
    error "Could not find your compose configuration file ($COMPOSE_FILE)."
fi

# Ask podman compose to evaluate the file syntax cleanly
info "Validating compose syntax configuration..."
podman compose -f "$COMPOSE_FILE" config > /dev/null
success "Compose file syntax is valid."

# ------------------------------------------------------------------
# 5. Check Cron Rule for Pull-Based Update
# ------------------------------------------------------------------
info "Configuring pull-based automation via User Crontab..."
FETCH_SH=$(pwd)/app/infra/fetch.sh
chmod +x $FETCH_SH
# Define the cron schedule and command explicitly utilizing 'podman compose'
CRON_RULE="*/15 * * * * $FETCH_SH"

# Extract existing crontab contents safely
EXISTING_CRON=$(crontab -l 2>/dev/null || true)

if echo "$EXISTING_CRON" | grep -Fq "$FETCHSH"; then
    success "A cron automatic update rule already exists for this directory path."
else
    info "Injecting the automated pull/up routine into your crontab..."
    (echo "$EXISTING_CRON"; echo "$CRON_RULE") | crontab -
    success "Automated pull crontab task successfully installed!"
fi

echo "----------------------------------------------------------------"
success "All pre-flight checks passed! Your production stack is ready."
info "You can now run: podman compose up -d"
