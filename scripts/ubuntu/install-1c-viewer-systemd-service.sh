#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

SERVICE_NAME="${SERVICE_NAME:-crm-1c-viewer}"
VIEWER_USER="${VIEWER_USER:-admin}"
VIEWER_PASSWORD="${VIEWER_PASSWORD:-}"
VIEWER_HOST="${VIEWER_HOST:-0.0.0.0}"
VIEWER_PORT="${VIEWER_PORT:-8091}"
DB_NAME="${DB_NAME:-crm_hub}"
IMPORT_COMMAND="${IMPORT_COMMAND:-systemctl start crm-1c-import.service}"
ENV_FILE="${ENV_FILE:-/etc/crm-1c-viewer.env}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command is missing: $1" >&2
    exit 1
  fi
}

require_command sudo
require_command systemctl
require_command python3

VIEWER_SCRIPT="${REPO_ROOT}/scripts/ubuntu/run-1c-crm-viewer.py"
if [[ ! -f "${VIEWER_SCRIPT}" ]]; then
  echo "ERROR: viewer script not found: ${VIEWER_SCRIPT}" >&2
  exit 1
fi

if [[ -z "${VIEWER_PASSWORD}" ]]; then
  echo "ERROR: VIEWER_PASSWORD is empty." >&2
  echo "Run example:" >&2
  echo "  VIEWER_PASSWORD='your-private-password' bash scripts/ubuntu/install-1c-viewer-systemd-service.sh" >&2
  exit 1
fi

chmod +x "${VIEWER_SCRIPT}"

env_file_tmp="$(mktemp)"
service_file_tmp="$(mktemp)"

cat >"${env_file_tmp}" <<ENV
CRM_VIEWER_USER=${VIEWER_USER}
CRM_VIEWER_PASSWORD=${VIEWER_PASSWORD}
CRM_VIEWER_IMPORT_COMMAND=${IMPORT_COMMAND}
CRM_VIEWER_IMPORT_TIMEOUT=1200
ENV

cat >"${service_file_tmp}" <<UNIT
[Unit]
Description=CRM 1C read-only web viewer
Wants=network-online.target
After=network-online.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=${REPO_ROOT}
Environment=DB_NAME=${DB_NAME}
Environment=USE_POSTGRES_SUDO=1
EnvironmentFile=${ENV_FILE}
ExecStart=/usr/bin/python3 ${VIEWER_SCRIPT} --host ${VIEWER_HOST} --port ${VIEWER_PORT} --use-postgres-sudo
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo install -m 0600 "${env_file_tmp}" "${ENV_FILE}"
sudo install -m 0644 "${service_file_tmp}" "/etc/systemd/system/${SERVICE_NAME}.service"
rm -f "${env_file_tmp}" "${service_file_tmp}"

sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}.service"

echo "Installed ${SERVICE_NAME}.service"
echo "Open inside VPN/local network:"
echo "  http://192.168.0.166:${VIEWER_PORT}/"
echo "User:"
echo "  ${VIEWER_USER}"
echo "Status:"
sudo systemctl --no-pager status "${SERVICE_NAME}.service"
