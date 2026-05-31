#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$(id -u)" -ne 0 ]]; then
  exec sudo "$0" "$@"
fi

DB_NAME="${DB_NAME:-crm_hub}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/crm-postgres}"
BACKUP_GROUP="${BACKUP_GROUP:-crmbackup}"
KEEP_DAYS="${KEEP_DAYS:-14}"
COPY_TO_DIR="${COPY_TO_DIR:-}"
BACKUP_TIME="${BACKUP_TIME:-02:15}"

install -m 0755 "${SCRIPT_DIR}/crm-postgres-backup.sh" /usr/local/sbin/crm-postgres-backup

cat >/etc/default/crm-postgres-backup <<EOF
DB_NAME=${DB_NAME}
BACKUP_DIR=${BACKUP_DIR}
BACKUP_GROUP=${BACKUP_GROUP}
KEEP_DAYS=${KEEP_DAYS}
COPY_TO_DIR=${COPY_TO_DIR}
EOF

cat >/etc/systemd/system/crm-postgres-backup.service <<'EOF'
[Unit]
Description=CRM PostgreSQL backup
After=postgresql.service

[Service]
Type=oneshot
EnvironmentFile=-/etc/default/crm-postgres-backup
ExecStart=/usr/local/sbin/crm-postgres-backup
EOF

cat >/etc/systemd/system/crm-postgres-backup.timer <<EOF
[Unit]
Description=Run CRM PostgreSQL backup daily

[Timer]
OnCalendar=*-*-* ${BACKUP_TIME}:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now crm-postgres-backup.timer
systemctl list-timers --all crm-postgres-backup.timer
