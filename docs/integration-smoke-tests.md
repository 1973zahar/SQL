# Integration Smoke Tests

Use these checks after deploying the API to `crm-sql`.

## Raw 1C catalog mirror

Run this only after the Windows HTTP export on `MESER` exposes the CSV files on port `8090`.

```bash
cd ~/SQL
bash scripts/ubuntu/import-1c-catalogs-http.sh
```

If PostgreSQL password auth is not available in the shell:

```bash
cd ~/SQL
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-catalogs-http.sh
```

Expected checks:

```bash
psql -h 127.0.0.1 -U crm_admin -d crm_hub -c "
  SELECT object_type, count(*)::int AS rows
  FROM one_c_mirror.latest_rows
  GROUP BY object_type
  ORDER BY object_type;
"

psql -h 127.0.0.1 -U crm_admin -d crm_hub -c "
  SELECT object_type, source_file, row_count, status
  FROM one_c_mirror.import_batches
  ORDER BY started_at DESC
  LIMIT 20;
"
```

Expected result:

- all main catalog files are imported;
- every new batch has status `processed`;
- `one_c_mirror.latest_rows` has non-zero counts for catalogs that had rows in 1C.
- `manufacturers` and `countries` are intentionally skipped for now.

## Raw 1C operational mirror

Run this only after `MESER` has created:

```text
1c_stock_balances.csv
1c_counterparty_settlements.csv
```

`1c_reserved_stock_balances.csv` is optional.

```bash
cd ~/SQL
bash scripts/ubuntu/import-1c-operational-http.sh
```

If PostgreSQL password auth is not available in the shell:

```bash
cd ~/SQL
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh
```

Expected checks:

```bash
psql -h 127.0.0.1 -U crm_admin -d crm_hub -c "
  SELECT
    dataset_name,
    count(*)::int AS rows,
    COALESCE(sum(quantity), 0)::numeric(18, 3) AS quantity,
    COALESCE(sum(reserved_quantity), 0)::numeric(18, 3) AS reserved_quantity,
    COALESCE(sum(amount), 0)::numeric(18, 2) AS amount
  FROM one_c_mirror.latest_operational_rows
  GROUP BY dataset_name
  ORDER BY dataset_name;
"

psql -h 127.0.0.1 -U crm_admin -d crm_hub -c "
  SELECT dataset_name, source_file, row_count, status
  FROM one_c_mirror.operational_batches
  ORDER BY started_at DESC
  LIMIT 20;
"
```

Expected result:

- `stock_balances` and `counterparty_settlements` have status `processed`;
- row counts are non-zero when 1C has stock or settlement balances;
- `reserved_stock_balances` may be absent if the 1C register is not used.

## 1C product with price and stock

```bash
curl -sS -X POST http://127.0.0.1:3000/integrations/inbox \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceModule": "one_c",
    "eventType": "product.upserted",
    "externalEventId": "smoke-product-001",
    "aggregateType": "product",
    "aggregateExternalId": "smoke-ref-001",
    "payload": {
      "ref": "smoke-ref-001",
      "sku": "SMOKE-001",
      "name": "Smoke test product",
      "barcode": "482000000001",
      "unit": "pcs",
      "price": {
        "priceType": "base",
        "currency": "UAH",
        "amount": "123.45"
      },
      "stock": {
        "warehouseCode": "main",
        "warehouseName": "Main warehouse",
        "quantity": "10",
        "reservedQuantity": "2"
      }
    }
  }'
```

The worker is enabled by default. If you need to force processing:

```bash
curl -sS -X POST 'http://127.0.0.1:3000/integrations/process?limit=10'
```

Expected checks:

```bash
curl -sS 'http://127.0.0.1:3000/products?limit=200' | grep -F 'SMOKE-001'
curl -sS http://127.0.0.1:3000/integrations/status
curl -sS http://127.0.0.1:3000/integrations/outbox/one_c
```

Expected result:

- product `SMOKE-001` exists;
- product row includes `latestPrice`, `latestPriceCurrency`, `totalQuantity`, and `availableQuantity`;
- inbox has no failed smoke-test event;
- outbox for `one_c` remains empty for 1C product import events.

## Separate 1C price update

```bash
curl -sS -X POST http://127.0.0.1:3000/integrations/inbox \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceModule": "one_c",
    "eventType": "product.price.updated",
    "externalEventId": "smoke-price-001",
    "aggregateType": "product_price",
    "aggregateExternalId": "smoke-ref-001",
    "payload": {
      "priceType": "base",
      "currency": "UAH",
      "amount": "150.00"
    }
  }'
```

## Separate 1C stock update

```bash
curl -sS -X POST http://127.0.0.1:3000/integrations/inbox \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceModule": "one_c",
    "eventType": "stock.updated",
    "externalEventId": "smoke-stock-001",
    "aggregateType": "stock_balance",
    "aggregateExternalId": "smoke-ref-001",
    "payload": {
      "warehouseCode": "main",
      "warehouseName": "Main warehouse",
      "quantity": "8",
      "reservedQuantity": "1"
    }
  }'
```
