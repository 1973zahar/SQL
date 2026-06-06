BEGIN;

CREATE OR REPLACE VIEW one_c_mirror.crm_serial_stock_current AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  btrim(entity_code) AS product_code,
  NULLIF(entity_name, '') AS product_name,
  btrim(warehouse_code) AS warehouse_code,
  NULLIF(warehouse_name, '') AS warehouse_name,
  NULLIF(related_name, '') AS serial_name,
  quantity::numeric(18, 3) AS quantity,
  CASE
    WHEN quantity > 0 THEN 'positive'
    WHEN quantity < 0 THEN 'negative'
    ELSE 'zero'
  END AS balance_sign,
  period_at AS snapshot_at,
  imported_at,
  row_no,
  source_file,
  import_batch_id,
  raw_data
FROM one_c_mirror.latest_operational_rows
WHERE dataset_name = 'serial_stock_current'
  AND entity_code IS NOT NULL
  AND btrim(entity_code) <> ''
  AND warehouse_code IS NOT NULL
  AND btrim(warehouse_code) <> ''
  AND related_name IS NOT NULL
  AND btrim(related_name) <> '';

CREATE OR REPLACE VIEW one_c_mirror.crm_serial_stock_by_serial AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  product_code,
  max(product_name) AS product_name,
  warehouse_code,
  max(warehouse_name) AS warehouse_name,
  serial_name,
  sum(quantity)::numeric(18, 3) AS serial_quantity,
  max(snapshot_at) AS snapshot_at,
  max(imported_at) AS imported_at
FROM one_c_mirror.crm_serial_stock_current
GROUP BY
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  product_code,
  warehouse_code,
  serial_name;

CREATE OR REPLACE VIEW one_c_mirror.crm_serial_stock_summary AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  product_code,
  max(product_name) AS product_name,
  warehouse_code,
  max(warehouse_name) AS warehouse_name,
  count(*)::int AS serial_rows,
  count(DISTINCT serial_name)::int AS serials_total,
  count(*) FILTER (WHERE serial_quantity > 0)::int AS serials_positive,
  count(*) FILTER (WHERE serial_quantity < 0)::int AS serials_negative,
  sum(serial_quantity)::numeric(18, 3) AS serial_quantity,
  max(snapshot_at) AS snapshot_at,
  max(imported_at) AS imported_at
FROM one_c_mirror.crm_serial_stock_by_serial
GROUP BY
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  product_code,
  warehouse_code;

COMMIT;
