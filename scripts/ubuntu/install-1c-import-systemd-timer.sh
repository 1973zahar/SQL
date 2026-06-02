#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

SERVICE_NAME="${SERVICE_NAME:-crm-1c-import}"
BASE_URL="${BASE_URL:-http://192.168.0.5:8090}"
DB_NAME="${DB_NAME:-crm_hub}"
INTERVAL="${INTERVAL:-1h}"
ON_BOOT="${ON_BOOT:-5min}"
LOG_FILE="${LOG_FILE:-/var/log/crm-1c-import.log}"
CATALOG_IMPORT_REQUIRED="${CATALOG_IMPORT_REQUIRED:-0}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command is missing: $1" >&2
    exit 1
  fi
}

require_command sudo
require_command systemctl

RUN_SCRIPT="${REPO_ROOT}/scripts/ubuntu/run-1c-import-now.sh"
if [[ ! -f "${RUN_SCRIPT}" ]]; then
  echo "ERROR: import runner not found: ${RUN_SCRIPT}" >&2
  exit 1
fi

chmod +x "${RUN_SCRIPT}"

service_file="$(mktemp)"
timer_file="$(mktemp)"

cat >"${service_file}" <<UNIT
[Unit]
Description=CRM 1C CSV import into PostgreSQL
Wants=network-online.target
After=network-online.target postgresql.service

[Service]
Type=oneshot
User=root
WorkingDirectory=${REPO_ROOT}
Environment=DB_NAME=${DB_NAME}
Environment=BASE_URL=${BASE_URL}
Environment=USE_POSTGRES_SUDO=1
Environment=CATALOG_IMPORT_REQUIRED=${CATALOG_IMPORT_REQUIRED}
Environment=LOG_FILE=${LOG_FILE}
ExecStart=${RUN_SCRIPT}
UNIT

cat >"${timer_file}" <<UNIT
[Unit]
Description=Run CRM 1C CSV import every hour

[Timer]
OnBootSec=${ON_BOOT}
OnUnitActiveSec=${INTERVAL}
AccuracySec=1min
Persistent=true
Unit=${SERVICE_NAME}.service

[Install]
WantedBy=timers.target
UNIT

sudo install -m 0644 "${service_file}" "/etc/systemd/system/${SERVICE_NAME}.service"
sudo install -m 0644 "${timer_file}" "/etc/systemd/system/${SERVICE_NAME}.timer"
rm -f "${service_file}" "${timer_file}"

sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}.timer"

echo "Installed ${SERVICE_NAME}.service and ${SERVICE_NAME}.timer"
echo "Manual import now:"
echo "  sudo systemctl start ${SERVICE_NAME}.service"
echo "View last logs:"
echo "  journalctl -u ${SERVICE_NAME}.service -n 100 --no-pager"
echo "Timer status:"
sudo systemctl list-timers "${SERVICE_NAME}.timer" --no-pager
