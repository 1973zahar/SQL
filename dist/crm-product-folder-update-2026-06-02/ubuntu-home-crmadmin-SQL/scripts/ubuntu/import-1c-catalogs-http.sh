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

CURRENT_USER="$(id -un 2>/dev/null || printf 'user')"
DEFAULT_WORK_DIR="${HOME}/crm-imports/1c"
if [[ "${USE_POSTGRES_SUDO}" == "1" ]]; then
  DEFAULT_WORK_DIR="/tmp/crm-1c-import-${CURRENT_USER}/catalogs"
fi
WORK_DIR="${WORK_DIR:-${DEFAULT_WORK_DIR}}"

items=(
  "Номенклатура|products|1c_products.csv"
  "ЕдиницыИзмерения|units|1c_units.csv"
  "Контрагенты|counterparties|1c_counterparties.csv"
  "ДоговорыКонтрагентов|counterparty_contracts|1c_counterparty_contracts.csv"
  "НоменклатурныеГруппы|product_groups|1c_product_groups.csv"
  "Организации|organizations|1c_organizations.csv"
  "Валюты|currencies|1c_currencies.csv"
  "ТипыЦенНоменклатуры|price_types|1c_price_types.csv"
  "СерииНоменклатуры|product_series|1c_product_series.csv"
  "ХарактеристикиНоменклатуры|product_characteristics|1c_product_characteristics.csv"
  "Склады|warehouses|1c_warehouses.csv"
  "ВидыНоменклатуры|product_kinds|1c_product_kinds.csv"
  "КлассификаторЕдиницИзмерения|unit_classifier|1c_unit_classifier.csv"
  "ПодразделенияОрганизаций|organization_units|1c_organization_units.csv"
  "ФизическиеЛица|persons|1c_persons.csv"
  "ВидыКонтактнойИнформации|contact_info_types|1c_contact_info_types.csv"
  "БанковскиеСчета|bank_accounts|1c_bank_accounts.csv"
  "Производители|manufacturers|1c_manufacturers.csv|optional"
  "КлассификаторСтранМира|countries|1c_countries.csv|optional"
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
    echo "Skipping optional missing catalog file: ${source_url}"
    rm -f "${local_file}"
    return 1
  fi

  echo "ERROR: required catalog file is missing: ${source_url}" >&2
  exit 1
}

require_command curl
require_command iconv
require_command psql
require_command python3

normalize_catalog_csv() {
  local source_file="$1"
  local output_file="$2"

  python3 - "${source_file}" "${output_file}" <<'PY'
import csv
import json
import sys

source_path, output_path = sys.argv[1], sys.argv[2]

def normalize_name(value):
    return ''.join(ch for ch in (value or '').strip().lower() if ch.isalnum())

aliases = {
    'row_no': {
        'rowno', 'row', 'n', 'no', 'number', 'номер', 'рядок', 'номеркстроки',
    },
    'external_ref': {
        'externalref', 'ref', 'reference', 'uid', 'id', 'ссылка', 'посилання',
    },
    'code': {
        'code', 'код',
    },
    'name': {
        'name', 'наименование', 'найменування', 'название', 'назва',
    },
    'deletion_mark': {
        'deletionmark', 'deleted', 'ismarkedfordeletion', 'пометкаудаления',
        'поміткавидалення',
    },
}

fallback_indexes = {
    'row_no': 0,
    'external_ref': 1,
    'code': 2,
    'name': 3,
    'deletion_mark': 4,
}

def pick(row, header_map, field):
    for alias in aliases[field]:
        index = header_map.get(alias)
        if index is not None and index < len(row):
            return row[index]
    index = fallback_indexes[field]
    if index < len(row):
        return row[index]
    return ''

with open(source_path, 'r', encoding='utf-8-sig', newline='') as source:
    reader = csv.reader(source, delimiter=';', quotechar='"')
    try:
        headers = next(reader)
    except StopIteration:
        headers = []

    header_map = {}
    for index, header in enumerate(headers):
        normalized = normalize_name(header)
        if normalized and normalized not in header_map:
            header_map[normalized] = index

    with open(output_path, 'w', encoding='utf-8', newline='') as output:
        writer = csv.writer(output, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL, lineterminator='\n')
        writer.writerow(['row_no', 'external_ref', 'code', 'name', 'deletion_mark', 'raw_data_json'])

        for row_index, row in enumerate(reader, start=1):
            padded = row + [''] * max(0, len(headers) - len(row))
            raw_data = {}
            for index, value in enumerate(padded):
                key = headers[index].strip() if index < len(headers) and headers[index].strip() else f'column_{index + 1}'
                raw_data[key] = value

            row_no = pick(padded, header_map, 'row_no') or str(row_index)
            writer.writerow([
                row_no,
                pick(padded, header_map, 'external_ref'),
                pick(padded, header_map, 'code'),
                pick(padded, header_map, 'name'),
                pick(padded, header_map, 'deletion_mark'),
                json.dumps(raw_data, ensure_ascii=False, separators=(',', ':')),
            ])
PY
}

prepare_work_dir

echo "Ensuring one_c_mirror schema exists..."
run_psql < "${REPO_ROOT}/db/migrations/002_one_c_mirror.sql"

for item in "${items[@]}"; do
  IFS="|" read -r catalog_name object_type source_file required <<<"${item}"
  required="${required:-required}"
  source_url="${BASE_URL%/}/${source_file}"
  local_file="${WORK_DIR}/${source_file}"
  utf8_file="${WORK_DIR}/${source_file%.csv}.utf8.csv"

  rm -f "${utf8_file}"
  if ! download_csv "${source_url}" "${local_file}" "${required}"; then
    continue
  fi

  iconv -f UTF-16LE -t UTF-8 "${local_file}" | sed '1s/^\xEF\xBB\xBF//' > "${utf8_file}"
  chmod 644 "${utf8_file}"
  normalized_file="${WORK_DIR}/${source_file%.csv}.normalized.csv"
  rm -f "${normalized_file}"
  normalize_catalog_csv "${utf8_file}" "${normalized_file}"
  chmod 644 "${normalized_file}"

  batch_id="$(
    run_psql -Atqc "
      INSERT INTO one_c_mirror.import_batches (
        object_type,
        catalog_name,
        source_file,
        source_url
      )
      VALUES (
        $(sql_literal "${object_type}"),
        $(sql_literal "${catalog_name}"),
        $(sql_literal "${source_file}"),
        $(sql_literal "${source_url}")
      )
      RETURNING id;
    "
  )"

  sql_file="$(mktemp "${WORK_DIR}/import-${object_type}.XXXXXX.sql")"
  cat >"${sql_file}" <<SQL
CREATE TEMP TABLE import_stage (
  row_no integer,
  external_ref text,
  code text,
  name text,
  deletion_mark_text text,
  raw_data_json text
);

\\copy import_stage (row_no, external_ref, code, name, deletion_mark_text, raw_data_json) FROM '${normalized_file}' WITH (FORMAT csv, HEADER true, DELIMITER ';', QUOTE '"');

INSERT INTO one_c_mirror.raw_rows (
  import_batch_id,
  object_type,
  object_name,
  catalog_name,
  source_file,
  row_no,
  external_ref,
  code,
  name,
  deletion_mark,
  raw_data,
  row_hash
)
SELECT
  '${batch_id}'::uuid,
  $(sql_literal "${object_type}"),
  $(sql_literal "${catalog_name}"),
  $(sql_literal "${catalog_name}"),
  $(sql_literal "${source_file}"),
  row_no,
  NULLIF(external_ref, ''),
  NULLIF(code, ''),
  NULLIF(name, ''),
  lower(coalesce(deletion_mark_text, '')) IN ('true', 'истина', '1', 'yes'),
  coalesce(NULLIF(raw_data_json, '')::jsonb, '{}'::jsonb) || jsonb_build_object(
    'rowNo', row_no,
    'ref', external_ref,
    'code', code,
    'name', name,
    'deletionMark', deletion_mark_text
  ),
  md5(concat_ws('|', row_no::text, external_ref, code, name, deletion_mark_text, raw_data_json))
FROM import_stage
WHERE row_no IS NOT NULL;

UPDATE one_c_mirror.import_batches
SET
  row_count = (
    SELECT count(*)
    FROM one_c_mirror.raw_rows
    WHERE import_batch_id = '${batch_id}'::uuid
  ),
  status = 'processed'::integration.event_status,
  completed_at = now()
WHERE id = '${batch_id}'::uuid;
SQL

  echo "Importing ${source_file} into one_c_mirror.raw_rows..."
  if ! run_psql < "${sql_file}"; then
    run_psql -c "
      UPDATE one_c_mirror.import_batches
      SET status = 'failed'::integration.event_status,
          error_message = 'Import failed in import-1c-catalogs-http.sh',
          completed_at = now()
      WHERE id = '${batch_id}'::uuid;
    " || true
    exit 1
  fi

  rm -f "${sql_file}" "${normalized_file}"
done

run_psql -c "
  SELECT object_type, count(*)::int AS rows
  FROM one_c_mirror.latest_rows
  GROUP BY object_type
  ORDER BY object_type;
"
