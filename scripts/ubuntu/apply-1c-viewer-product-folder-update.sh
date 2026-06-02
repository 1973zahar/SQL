#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="${REPO_ROOT:-/home/crmadmin/SQL}"
SERVICE_NAME="${SERVICE_NAME:-crm-1c-viewer}"
VIEWER_PORT="${VIEWER_PORT:-8091}"
DB_NAME="${DB_NAME:-crm_hub}"
ENV_FILE="${ENV_FILE:-/etc/crm-1c-viewer.env}"

cd "${REPO_ROOT}"

echo "=== git status before ==="
git status --short --branch

echo "=== update repo ==="
git fetch origin main
git pull --ff-only origin main
git rev-parse --short HEAD

echo "=== verify viewer file markers ==="
grep -n "VIEWER_BUILD\|product_group_name\|product_group_code\|crm_product_folders" scripts/ubuntu/run-1c-crm-viewer.py | head -40

echo "=== service definition before restart ==="
systemctl show "${SERVICE_NAME}.service" -p ExecStart -p WorkingDirectory -p MainPID --no-pager

echo "=== apply crm-ready SQL views ==="
sudo -u postgres psql -X -d "${DB_NAME}" -v ON_ERROR_STOP=1 -f db/migrations/003_one_c_crm_ready_views.sql

echo "=== verify crm_products folder columns ==="
sudo -u postgres psql -X -d "${DB_NAME}" -v ON_ERROR_STOP=1 -c "
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'one_c_mirror'
  AND table_name = 'crm_products'
  AND column_name IN ('product_group_name', 'product_group_code', 'product_group_ref', 'is_group')
ORDER BY column_name;
"

echo "=== restart viewer ==="
sudo systemctl restart "${SERVICE_NAME}.service"
sleep 3
sudo systemctl --no-pager status "${SERVICE_NAME}.service"

echo "=== active viewer process ==="
main_pid="$(systemctl show "${SERVICE_NAME}.service" -p MainPID --value)"
echo "MainPID=${main_pid}"
if [[ "${main_pid}" =~ ^[0-9]+$ && "${main_pid}" != "0" ]]; then
  sudo tr '\0' ' ' <"/proc/${main_pid}/cmdline"
  echo
else
  echo "No active MainPID for ${SERVICE_NAME}.service"
fi

auth_args=()
if [[ -r "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
  if [[ -n "${CRM_VIEWER_USER:-}" && -n "${CRM_VIEWER_PASSWORD:-}" ]]; then
    auth_args=(-u "${CRM_VIEWER_USER}:${CRM_VIEWER_PASSWORD}")
  fi
fi

echo "=== viewer health ==="
curl -fsS --max-time 10 "${auth_args[@]}" "http://127.0.0.1:${VIEWER_PORT}/health"

echo "=== viewer api columns ==="
curl -fsS --max-time 30 "${auth_args[@]}" "http://127.0.0.1:${VIEWER_PORT}/api/data" | python3 -c '
import json
import sys

data = json.load(sys.stdin)
products = data["views"]["products"]
columns = [column[0] for column in products["columns"]]
required = ("product_group_name", "product_group_code")

print("viewerBuild:", data.get("viewerBuild"))
print("product columns:", ", ".join(columns))
print("folder columns ok:", all(column in columns for column in required))
print("products:", len(products["rows"]))
print("product folders:", len(data["views"].get("product_folders", {}).get("rows", [])))
'

echo "=== done ==="
