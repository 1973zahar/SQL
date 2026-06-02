# Current CRM SQL Status - 2026-06-01

## Live environment

- VM: `crm-sql`
- IP: `192.168.0.166`
- PostgreSQL: port `5432`, database `crm_hub`, user `crm_admin`
- API: port `3000`
- SSH: port `22`

Checks from Windows host:

```text
Test-NetConnection 192.168.0.166 -Port 5432 -> TcpTestSucceeded: True
Test-NetConnection 192.168.0.166 -Port 3000 -> TcpTestSucceeded: True
Test-NetConnection 192.168.0.166 -Port 22   -> TcpTestSucceeded: True
```

API health:

```json
{
  "status": "ok",
  "service": "marketplace-modular-crm-api",
  "database": {
    "database": "crm_hub",
    "userName": "crm_admin",
    "serverAddress": "127.0.0.1/32",
    "serverPort": 5432
  }
}
```

## Data state

- `/products` returns imported products from 1C.
- `/orders` returns an empty list.
- `/customers` returns an empty list.
- `/integrations/outbox/one_c` is empty after marking two previous `test.ping` outbox records as `ignored`.
- `/integrations/status` currently reports processed inbox events and ignored historical test outbox events.
- Rechecked on 2026-06-01: `/health` is `ok`, `/integrations/outbox/one_c` returns `[]`, and `/integrations/status` returns inbox `processed=2`, outbox `one_c ignored=2`.

## Code changes after the check

- Docker API build now runs Prisma Client generation before NestJS build.
- Prisma schema now includes product prices, warehouses, and stock balances.
- 1C inbox processing now supports product, price, and stock events.
- Unknown inbox event types are marked as `ignored` instead of creating pending outbox noise for 1C.
- `GET /products` now includes latest active price and aggregate stock fields.
- Added `one_c_mirror` schema for raw read-only 1C CSV catalog imports.
- Added Ubuntu script `scripts/ubuntu/import-1c-catalogs-http.sh` to download the Windows HTTP CSV exports, convert UTF-16LE to UTF-8, and import them into `one_c_mirror.raw_rows`.
- Added Windows script `scripts/windows/export-1c-catalogs.ps1` and VBS helper `scripts/windows/export-1c-catalogs.vbs` to continue read-only 1C catalog export with `-Set next` into `D:\CRM\Exports`.
- Extended `one_c_mirror` with operational mirror tables for stock balances, reserved stock and counterparty settlements.
- Added Windows script `scripts/windows/export-1c-operational-data.ps1` and VBS helper `scripts/windows/export-1c-operational-data.vbs` for read-only 1C register snapshots.
- Added Ubuntu script `scripts/ubuntu/import-1c-operational-http.sh` to import operational CSV snapshots into `one_c_mirror.operational_rows`.

## Next operational step

The previous chat stopped after successful Windows-side export of these 1C CSV catalogs:

```text
1c_units.csv
1c_counterparties.csv
1c_counterparty_contracts.csv
1c_product_groups.csv
1c_organizations.csv
1c_currencies.csv
1c_price_types.csv
1c_product_series.csv
1c_product_characteristics.csv
1c_warehouses.csv
1c_product_kinds.csv
1c_unit_classifier.csv
1c_organization_units.csv
1c_persons.csv
1c_contact_info_types.csv
1c_bank_accounts.csv
```

`1c_manufacturers.csv` and `1c_countries.csv` are intentionally skipped for now.

Continue from Ubuntu `crmadmin@crm-sql` after these local repository changes are committed and pushed, then run:

```bash
cd ~/SQL
git pull --ff-only
npm install
npm run prisma:generate
npm run build --workspace @crm/api
sudo systemctl restart crm-api.service
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/products
curl http://127.0.0.1:3000/integrations/status
```

Then import the raw 1C catalog mirror:

```bash
cd ~/SQL
bash scripts/ubuntu/import-1c-catalogs-http.sh
```

If password auth for `crm_admin` is not convenient on the VM:

```bash
cd ~/SQL
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-catalogs-http.sh
```

Detailed runbook:

```text
docs/one-c-mirror-import.md
```

Then export and import operational 1C snapshots for stock balances and settlements:

```text
docs/one-c-operational-export-import.md
```

Windows-side expected operational CSV:

```text
1c_stock_balances.csv
1c_reserved_stock_balances.csv
1c_counterparty_settlements.csv
```

Ubuntu import command:

```bash
cd ~/SQL
bash scripts/ubuntu/import-1c-operational-http.sh
```

If password auth for `crm_admin` is not convenient on the VM:

```bash
cd ~/SQL
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh
```

Then run the integration smoke checks from:

```text
docs/integration-smoke-tests.md
```

If continuing the Windows-side catalog export first, use:

```text
docs/one-c-catalog-export.md
```
