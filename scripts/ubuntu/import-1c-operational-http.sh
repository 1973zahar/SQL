#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DB_NAME="${DB_NAME:-crm_hub}"
DB_USER="${DB_USER:-crm_admin}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
BASE_URL="${BASE_URL:-http://192.168.0.5:8090}"
USE_POSTGRES_SUDO="${USE_POSTGRES_SUDO:-0}"
CRM_ENTERPRISE_CODE="${CRM_ENTERPRISE_CODE:-elista}"
CRM_ENTERPRISE_NAME="${CRM_ENTERPRISE_NAME:-ЕЛІСТА}"
CRM_ENTERPRISE_REF="${CRM_ENTERPRISE_REF:-${CRM_ENTERPRISE_CODE}}"

CURRENT_USER="$(id -un 2>/dev/null || printf 'user')"
DEFAULT_WORK_DIR="${HOME}/crm-imports/1c-operational"
if [[ "${USE_POSTGRES_SUDO}" == "1" ]]; then
  DEFAULT_WORK_DIR="/tmp/crm-1c-import-${CURRENT_USER}/operational"
fi
WORK_DIR="${WORK_DIR:-${DEFAULT_WORK_DIR}}"

items=(
  "stock_balances|stock_balance|1c_stock_balances.csv|required"
  "reserved_stock_balances|reserved_stock_balance|1c_reserved_stock_balances.csv|optional"
  "product_prices|product_price|1c_product_prices.csv|optional"
  "counterparty_settlements|counterparty_settlement|1c_counterparty_settlements.csv|required"
)

run_psql() {
  if [[ "${USE_POSTGRES_SUDO}" == "1" ]]; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" "$@"
  else
    psql \
      -h "${DB_HOST}" \
      -p "${DB_PORT}" \
      -U "${DB_USER}" \
      -d "${DB_NAME}" \
      -v ON_ERROR_STOP=1 \
      "$@"
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command is missing: $1" >&2
    exit 1
  fi
}

prepare_work_dir() {
  mkdir -p "${WORK_DIR}"
  chmod 755 "${WORK_DIR}"
  if [[ ! -w "${WORK_DIR}" ]]; then
    echo "ERROR: work dir is not writable: ${WORK_DIR}" >&2
    echo "Hint: fix ownership/permissions for this directory before import." >&2
    exit 1
  fi
}

sql_literal() {
  local value="$1"
  printf '$crm_import$%s$crm_import$' "${value}"
}

download_csv() {
  local source_url="$1"
  local local_file="$2"
  local required="$3"

  echo "Downloading ${source_url}..."
  rm -f "${local_file}"
  if curl --fail --silent --show-error --location "${source_url}" --output "${local_file}"; then
    chmod 644 "${local_file}"
    if [[ ! -s "${local_file}" ]]; then
      echo "ERROR: downloaded file is empty: ${local_file}" >&2
      exit 1
    fi
    return 0
  fi

  if [[ "${required}" == "optional" ]]; then
    echo "Skipping optional missing file: ${source_url}"
    rm -f "${local_file}"
    return 1
  fi

  echo "ERROR: required file is missing: ${source_url}" >&2
  exit 1
}

require_command curl
require_command iconv
require_command psql

prepare_work_dir

echo "Ensuring one_c_mirror schema exists..."
run_psql < "${REPO_ROOT}/db/migrations/002_one_c_mirror.sql"
echo "Enterprise: ${CRM_ENTERPRISE_NAME} (${CRM_ENTERPRISE_CODE}, ref=${CRM_ENTERPRISE_REF})"

for item in "${items[@]}"; do
  IFS="|" read -r dataset_name object_type source_file required <<<"${item}"
  source_url="${BASE_URL%/}/${source_file}"
  local_file="${WORK_DIR}/${source_file}"
  utf8_file="${WORK_DIR}/${source_file%.csv}.utf8.csv"

  rm -f "${utf8_file}"
  if ! download_csv "${source_url}" "${local_file}" "${required}"; then
    continue
  fi

  iconv -f UTF-16LE -t UTF-8 "${local_file}" | sed '1s/^\xEF\xBB\xBF//' > "${utf8_file}"
  chmod 644 "${utf8_file}"

  batch_id="$(
    run_psql -Atqc "
      INSERT INTO one_c_mirror.operational_batches (
        enterprise_code,
        enterprise_name,
        enterprise_ref,
        dataset_name,
        object_type,
        source_file,
        source_url
      )
      VALUES (
        $(sql_literal "${CRM_ENTERPRISE_CODE}"),
        $(sql_literal "${CRM_ENTERPRISE_NAME}"),
        $(sql_literal "${CRM_ENTERPRISE_REF}"),
        $(sql_literal "${dataset_name}"),
        $(sql_literal "${object_type}"),
        $(sql_literal "${source_file}"),
        $(sql_literal "${source_url}")
      )
      RETURNING id;
    "
  )"

  sql_file="$(mktemp "${WORK_DIR}/import-${dataset_name}.XXXXXX.sql")"
  cat >"${sql_file}" <<SQL
CREATE TEMP TABLE import_operational_stage (
  row_no integer,
  period_at text,
  entity_code text,
  entity_name text,
  related_code text,
  related_name text,
  warehouse_code text,
  warehouse_name text,
  contract_code text,
  contract_name text,
  organization_code text,
  organization_name text,
  currency text,
  quantity text,
  reserved_quantity text,
  amount text
);

\\copy import_operational_stage (row_no, period_at, entity_code, entity_name, related_code, related_name, warehouse_code, warehouse_name, contract_code, contract_name, organization_code, organization_name, currency, quantity, reserved_quantity, amount) FROM '${utf8_file}' WITH (FORMAT csv, HEADER true, DELIMITER ';', QUOTE '"');

INSERT INTO one_c_mirror.operational_rows (
  import_batch_id,
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  dataset_name,
  object_type,
  source_file,
  row_no,
  period_at,
  entity_code,
  entity_name,
  related_code,
  related_name,
  warehouse_code,
  warehouse_name,
  contract_code,
  contract_name,
  organization_code,
  organization_name,
  currency,
  quantity,
  reserved_quantity,
  amount,
  raw_data,
  row_hash
)
SELECT
  '${batch_id}'::uuid,
  $(sql_literal "${CRM_ENTERPRISE_CODE}"),
  $(sql_literal "${CRM_ENTERPRISE_NAME}"),
  $(sql_literal "${CRM_ENTERPRISE_REF}"),
  $(sql_literal "${dataset_name}"),
  $(sql_literal "${object_type}"),
  $(sql_literal "${source_file}"),
  row_no,
  NULLIF(period_at, '')::timestamptz,
  NULLIF(entity_code, ''),
  NULLIF(entity_name, ''),
  NULLIF(related_code, ''),
  NULLIF(related_name, ''),
  NULLIF(warehouse_code, ''),
  NULLIF(warehouse_name, ''),
  NULLIF(contract_code, ''),
  NULLIF(contract_name, ''),
  NULLIF(organization_code, ''),
  NULLIF(organization_name, ''),
  NULLIF(currency, ''),
  NULLIF(replace(quantity, ',', '.'), '')::numeric,
  NULLIF(replace(reserved_quantity, ',', '.'), '')::numeric,
  NULLIF(replace(amount, ',', '.'), '')::numeric,
  jsonb_build_object(
    'enterpriseCode', $(sql_literal "${CRM_ENTERPRISE_CODE}"),
    'enterpriseName', $(sql_literal "${CRM_ENTERPRISE_NAME}"),
    'enterpriseRef', $(sql_literal "${CRM_ENTERPRISE_REF}"),
    'rowNo', row_no,
    'periodAt', period_at,
    'entityCode', entity_code,
    'entityName', entity_name,
    'relatedCode', related_code,
    'relatedName', related_name,
    'warehouseCode', warehouse_code,
    'warehouseName', warehouse_name,
    'contractCode', contract_code,
    'contractName', contract_name,
    'organizationCode', organization_code,
    'organizationName', organization_name,
    'currency', currency,
    'quantity', quantity,
    'reservedQuantity', reserved_quantity,
    'amount', amount
  ),
  md5(concat_ws(
    '|',
    row_no::text,
    period_at,
    entity_code,
    entity_name,
    related_code,
    related_name,
    warehouse_code,
    warehouse_name,
    contract_code,
    contract_name,
    organization_code,
    organization_name,
    currency,
    quantity,
    reserved_quantity,
    amount
  ))
FROM import_operational_stage
WHERE row_no IS NOT NULL;

UPDATE one_c_mirror.operational_batches
SET
  row_count = (
    SELECT count(*)
    FROM one_c_mirror.operational_rows
    WHERE import_batch_id = '${batch_id}'::uuid
  ),
  status = 'processed'::integration.event_status,
  completed_at = now()
WHERE id = '${batch_id}'::uuid;
SQL

  echo "Importing ${source_file} into one_c_mirror.operational_rows..."
  if ! run_psql < "${sql_file}"; then
    run_psql -c "
      UPDATE one_c_mirror.operational_batches
      SET status = 'failed'::integration.event_status,
          error_message = 'Import failed in import-1c-operational-http.sh',
          completed_at = now()
      WHERE id = '${batch_id}'::uuid;
    " || true
    exit 1
  fi

  rm -f "${sql_file}"
done

run_psql -c "
  SELECT
    enterprise_code,
    enterprise_name,
    dataset_name,
    count(*)::int AS rows,
    COALESCE(sum(quantity), 0)::numeric(18, 3) AS quantity,
    COALESCE(sum(reserved_quantity), 0)::numeric(18, 3) AS reserved_quantity,
    COALESCE(sum(amount), 0)::numeric(18, 2) AS amount
  FROM one_c_mirror.latest_operational_rows
  GROUP BY enterprise_code, enterprise_name, dataset_name
  ORDER BY enterprise_code, dataset_name;
"
