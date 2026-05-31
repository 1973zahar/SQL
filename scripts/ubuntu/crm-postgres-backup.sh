#!/usr/bin/env bash
set -Eeuo pipefail

DB_NAME="${DB_NAME:-crm_hub}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/crm-postgres}"
BACKUP_GROUP="${BACKUP_GROUP:-crmbackup}"
KEEP_DAYS="${KEEP_DAYS:-14}"
COPY_TO_DIR="${COPY_TO_DIR:-}"

if [[ "$(id -u)" -ne 0 && "${BACKUP_DIR}" == /var/backups/* ]]; then
  echo "ERROR: run this backup with sudo or set BACKUP_DIR to a writable directory." >&2
  exit 1
fi

timestamp="$(date +%Y%m%d_%H%M%S)"
backup_file="${BACKUP_DIR}/${DB_NAME}_${timestamp}.dump"
checksum_file="${backup_file}.sha256"

run_as_postgres() {
  if [[ "$(id -un)" == "postgres" ]]; then
    "$@"
  elif [[ "$(id -u)" -eq 0 ]]; then
    runuser -u postgres -- "$@"
  else
    sudo -u postgres "$@"
  fi
}

install_backup_dir() {
  if [[ "$(id -u)" -eq 0 ]]; then
    getent group "${BACKUP_GROUP}" >/dev/null 2>&1 || groupadd --system "${BACKUP_GROUP}"
    install -d -o postgres -g "${BACKUP_GROUP}" -m 750 "${BACKUP_DIR}"
  else
    sudo getent group "${BACKUP_GROUP}" >/dev/null 2>&1 || sudo groupadd --system "${BACKUP_GROUP}"
    sudo install -d -o postgres -g "${BACKUP_GROUP}" -m 750 "${BACKUP_DIR}"
  fi
}

install_backup_dir

echo "Creating PostgreSQL backup ${backup_file}..."
run_as_postgres pg_dump -d "${DB_NAME}" -F c -Z 6 -f "${backup_file}"
sha256sum "${backup_file}" > "${checksum_file}"
chgrp "${BACKUP_GROUP}" "${backup_file}" "${checksum_file}"
chmod 640 "${backup_file}" "${checksum_file}"

find "${BACKUP_DIR}" -type f \( -name "${DB_NAME}_*.dump" -o -name "${DB_NAME}_*.dump.sha256" \) -mtime +"${KEEP_DAYS}" -delete

if [[ -n "${COPY_TO_DIR}" ]]; then
  mkdir -p "${COPY_TO_DIR}"
  cp -p "${backup_file}" "${checksum_file}" "${COPY_TO_DIR}/"
  echo "Copied backup to ${COPY_TO_DIR}."
fi

echo "Backup complete: ${backup_file}"
