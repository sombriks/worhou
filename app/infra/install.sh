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
CADDY_CONF_TARGET="/etc/caddy/Caddyfile.d/worhou.caddyfile"
info "Checking for $CADDY_CONF_TARGET..."

if [ ! -f "$CADDY_CONF_TARGET" ]; then
    CADDY_CONF_SOURCE="worhou.caddy"
    if [ ! -f "$CADDY_CONF_SOURCE" ] && [ -f "app/infra/worhou.caddyfile" ]; then
        CADDY_CONF_SOURCE="app/infra/worhou.caddyfile"
    fi

    info "Caddy configuration for worhou is missing at target destination."
    echo "   👉 Please run the following command to deploy it:"
    echo "      sudo cp $CADDY_CONF_SOURCE $CADDY_CONF_TARGET && sudo systemctl reload caddy"
    echo ""
    error "Missing caddy configuration file."
else
    success "worhou.caddy found and active under /etc/caddy/Caddyfile.d."
fi

info "Checking caddy configuration..."
caddy validate --config /etc/caddy/Caddyfile

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

CRON_RULE="*/15 * * * * $FETCH_SH 2>&1 | logger -t cron-worhou"
EXISTING_CRON=$(crontab -l 2>/dev/null || echo "")

if echo "$EXISTING_CRON" | grep -Fq "$FETCH_SH"; then
    success "A cron automatic update rule already exists for this directory path."
else
    info "Injecting the automated pull/up routine into your crontab..."

    if (echo "$EXISTING_CRON"; echo "$CRON_RULE") | sed '/^$/d' | crontab - 2>/dev/null; then
        success "Automated pull crontab task successfully installed!"
    else
        echo ""
        echo "❌ [ERROR] Could not automatically update your crontab."
        echo "👉 Please follow these steps to configure it manually:"
        echo "   1. Run the command: crontab -e"
        echo "   2. Paste the following line at the very bottom of the file:"
        echo "      $CRON_RULE"
        echo "   3. Save and close the editor."
        echo ""
        error "Manual crontab configuration required."
    fi
fi

# ------------------------------------------------------------------
# 6. Configure Systemd User Service for Autostart
# ------------------------------------------------------------------
info "Configuring systemd rootless user service..."
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_USER_DIR"
CURRENT_ROOT=$(pwd)

cat << EOF > "$SYSTEMD_USER_DIR/worhou.service"
[Unit]
Description=Podman Compose WorHou
After=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$CURRENT_ROOT
Environment=PATH=/usr/bin:/usr/local/bin:/usr/sbin:/sbin

ExecStart=/usr/bin/podman-compose --env-file=.env -f app/infra/production.yml up -d
ExecStop=/usr/bin/podman-compose -f app/infra/production.yml down

[Install]
WantedBy=default.target
EOF

info "Reloading user systemd daemon and enabling service..."
systemctl --user daemon-reload
systemctl --user enable worhou.service

success "Systemd user service 'worhou.service' successfully installed and enabled for startup!"


echo "----------------------------------------------------------------"
success "All pre-flight checks passed! Your production stack is ready."
info "You can now run: podman compose up -d"

