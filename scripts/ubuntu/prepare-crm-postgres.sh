#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DB_NAME="${DB_NAME:-crm_hub}"
DB_USER="${DB_USER:-crm_admin}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
SKIP_SCHEMA="${SKIP_SCHEMA:-0}"

run_as_postgres() {
  if [[ "$(id -un)" == "postgres" ]]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo -u postgres "$@"
  else
    runuser -u postgres -- "$@"
  fi
}

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is not installed. Install postgresql-client first." >&2
  exit 1
fi

if [[ -z "${CRM_ADMIN_PASSWORD:-}" ]]; then
  read -rsp "New PostgreSQL password for ${DB_USER}: " CRM_ADMIN_PASSWORD
  echo
fi

if [[ -z "${CRM_ADMIN_PASSWORD}" ]]; then
  echo "ERROR: empty password is not allowed." >&2
  exit 1
fi

echo "Preparing PostgreSQL role ${DB_USER} and database ${DB_NAME}..."
run_as_postgres psql \
  -v ON_ERROR_STOP=1 \
  -v crm_admin_user="${DB_USER}" \
  -v crm_database="${DB_NAME}" \
  -v crm_admin_password="${CRM_ADMIN_PASSWORD}" \
  -d postgres \
  -f "${REPO_ROOT}/db/admin/001_prepare_crm_database.sql"

echo "Checking password login through ${DB_HOST}:${DB_PORT}/${DB_NAME}..."
PGPASSWORD="${CRM_ADMIN_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -v ON_ERROR_STOP=1 \
  -c "select current_database() as database, current_user as user_name;"

if [[ "${SKIP_SCHEMA}" != "1" ]]; then
  schema_loaded="$(
    PGPASSWORD="${CRM_ADMIN_PASSWORD}" psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -Atqc "select coalesce(to_regclass('core.modules') is not null, false);"
  )"

  if [[ "${schema_loaded}" == "t" ]]; then
    echo "CRM schema already exists. Skipping schema import."
  else
    echo "Loading CRM extensions and schema..."
    PGPASSWORD="${CRM_ADMIN_PASSWORD}" psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -v ON_ERROR_STOP=1 \
      -f "${REPO_ROOT}/db/init/00_extensions.sql"

    PGPASSWORD="${CRM_ADMIN_PASSWORD}" psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -v ON_ERROR_STOP=1 \
      -f "${REPO_ROOT}/db/migrations/001_core_schema.sql"
  fi
fi

echo "Ensuring CRM database objects are owned by ${DB_USER}..."
run_as_postgres psql \
  -v ON_ERROR_STOP=1 \
  -v crm_admin_user="${DB_USER}" \
  -d "${DB_NAME}" \
  -f "${REPO_ROOT}/db/admin/003_reassign_crm_objects.sql"

echo "Verifying CRM database objects..."
PGPASSWORD="${CRM_ADMIN_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -v ON_ERROR_STOP=1 \
  -f "${REPO_ROOT}/db/admin/002_verify_crm_database.sql"

echo "Done. Manual login check:"
echo "psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}"
