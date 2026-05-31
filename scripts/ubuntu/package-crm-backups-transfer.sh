#!/usr/bin/env bash
set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/crm-postgres}"
TRANSFER_FILE="${TRANSFER_FILE:-/tmp/crm_hub_backups_transfer.tar.gz}"

if [[ ! -d "${BACKUP_DIR}" ]]; then
  echo "ERROR: backup directory does not exist: ${BACKUP_DIR}" >&2
  exit 1
fi

tar -czf "${TRANSFER_FILE}" -C "${BACKUP_DIR}" .
chmod 664 "${TRANSFER_FILE}"

echo "Created transfer archive: ${TRANSFER_FILE}"
ls -lh "${TRANSFER_FILE}"
