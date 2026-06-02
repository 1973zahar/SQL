#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DB_NAME="${DB_NAME:-crm_hub}"
DB_USER="${DB_USER:-crm_admin}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
BASE_URL="${BASE_URL:-http://192.168.0.5:8090}"
LOG_FILE="${LOG_FILE:-/tmp/crm-1c-import-now.log}"
CATALOG_IMPORT_REQUIRED="${CATALOG_IMPORT_REQUIRED:-0}"

if [[ "$(id -un)" == "postgres" ]]; then
  USE_POSTGRES_SUDO="${USE_POSTGRES_SUDO:-0}"
  DB_USER="${DB_USER:-postgres}"
  DB_HOST="${DB_HOST:-/var/run/postgresql}"
else
  USE_POSTGRES_SUDO="${USE_POSTGRES_SUDO:-1}"
fi

export DB_NAME DB_USER DB_HOST DB_PORT BASE_URL USE_POSTGRES_SUDO CATALOG_IMPORT_REQUIRED

run_psql_file() {
  local sql_file="$1"
  if [[ "${USE_POSTGRES_SUDO}" == "1" ]]; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" < "${sql_file}"
  else
    psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -v ON_ERROR_STOP=1 \
      -f "${sql_file}"
  fi
}

run_psql_query() {
  local sql="$1"
  if [[ "${USE_POSTGRES_SUDO}" == "1" ]]; then
    sudo -u postgres psql -d "${DB_NAME}" -P pager=off -c "${sql}"
  else
    psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -P pager=off \
      -c "${sql}"
  fi
}

main() {
  echo "==== CRM 1C import started: $(date '+%Y-%m-%d %H:%M:%S') ===="
  echo "RepoRoot: ${REPO_ROOT}"
  echo "BaseUrl: ${BASE_URL}"
  echo "Database: ${DB_NAME}"
  echo "USE_POSTGRES_SUDO: ${USE_POSTGRES_SUDO}"
  echo "CATALOG_IMPORT_REQUIRED: ${CATALOG_IMPORT_REQUIRED}"

  catalog_status=0
  set +e
  bash "${SCRIPT_DIR}/import-1c-catalogs-http.sh"
  catalog_status=$?
  set -e

  if [[ "${catalog_status}" -ne 0 ]]; then
    echo "WARNING: catalog import failed with status ${catalog_status}."
    if [[ "${CATALOG_IMPORT_REQUIRED}" == "1" ]]; then
      echo "ERROR: catalog import is required, stopping before operational import."
      exit "${catalog_status}"
    fi
    echo "Continuing with operational import so prices, stock and settlements stay fresh."
  fi

  bash "${SCRIPT_DIR}/import-1c-operational-http.sh"

  if [[ -f "${REPO_ROOT}/db/migrations/003_one_c_crm_ready_views.sql" ]]; then
    echo "Refreshing CRM-ready views..."
    run_psql_file "${REPO_ROOT}/db/migrations/003_one_c_crm_ready_views.sql"
  fi

  echo "Import counts:"
  run_psql_query "
    SELECT 'crm_products' AS view_name, count(*) FROM one_c_mirror.crm_products
    UNION ALL SELECT 'crm_product_prices', count(*) FROM one_c_mirror.crm_product_prices
    UNION ALL SELECT 'crm_product_price_summary', count(*) FROM one_c_mirror.crm_product_price_summary
    UNION ALL SELECT 'crm_warehouses', count(*) FROM one_c_mirror.crm_warehouses
    UNION ALL SELECT 'crm_counterparties', count(*) FROM one_c_mirror.crm_counterparties
    UNION ALL SELECT 'crm_counterparty_contracts', count(*) FROM one_c_mirror.crm_counterparty_contracts
    UNION ALL SELECT 'crm_stock_balances', count(*) FROM one_c_mirror.crm_stock_balances
    UNION ALL SELECT 'crm_counterparty_settlements', count(*) FROM one_c_mirror.crm_counterparty_settlements
    UNION ALL SELECT 'crm_counterparty_balance_summary', count(*) FROM one_c_mirror.crm_counterparty_balance_summary
    UNION ALL SELECT 'crm_reference_items', count(*) FROM one_c_mirror.crm_reference_items
    UNION ALL SELECT 'crm_reference_catalog_summary', count(*) FROM one_c_mirror.crm_reference_catalog_summary
    UNION ALL SELECT 'crm_units', count(*) FROM one_c_mirror.crm_units
    UNION ALL SELECT 'crm_currencies', count(*) FROM one_c_mirror.crm_currencies
    UNION ALL SELECT 'crm_price_types', count(*) FROM one_c_mirror.crm_price_types
    UNION ALL SELECT 'crm_product_groups', count(*) FROM one_c_mirror.crm_product_groups
    UNION ALL SELECT 'crm_product_folders', count(*) FROM one_c_mirror.crm_product_folders
    UNION ALL SELECT 'crm_product_kinds', count(*) FROM one_c_mirror.crm_product_kinds
    UNION ALL SELECT 'crm_product_series', count(*) FROM one_c_mirror.crm_product_series
    UNION ALL SELECT 'crm_product_characteristics', count(*) FROM one_c_mirror.crm_product_characteristics
    UNION ALL SELECT 'crm_organizations', count(*) FROM one_c_mirror.crm_organizations
    UNION ALL SELECT 'crm_organization_units', count(*) FROM one_c_mirror.crm_organization_units
    UNION ALL SELECT 'crm_persons', count(*) FROM one_c_mirror.crm_persons
    UNION ALL SELECT 'crm_contact_info_types', count(*) FROM one_c_mirror.crm_contact_info_types
    UNION ALL SELECT 'crm_bank_accounts', count(*) FROM one_c_mirror.crm_bank_accounts
    ORDER BY view_name;
  "

  if [[ "${catalog_status}" -ne 0 ]]; then
    echo "WARNING: CRM 1C import finished with catalog warning; operational data was still refreshed."
  fi

  echo "==== CRM 1C import finished: $(date '+%Y-%m-%d %H:%M:%S') ===="
}

mkdir -p "$(dirname "${LOG_FILE}")"
main 2>&1 | tee -a "${LOG_FILE}"
