BEGIN;

CREATE OR REPLACE VIEW one_c_mirror.crm_product_prices AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  btrim(entity_code) AS product_code,
  NULLIF(btrim(entity_name), '') AS product_name,
  NULLIF(btrim(related_code), '') AS price_type_code,
  NULLIF(btrim(related_name), '') AS price_type_name,
  NULLIF(btrim(currency), '') AS currency,
  amount::numeric(18, 2) AS price,
  period_at AS snapshot_at,
  source_file,
  imported_at
FROM one_c_mirror.latest_operational_rows
WHERE
  dataset_name = 'product_prices'
  AND entity_code IS NOT NULL
  AND btrim(entity_code) <> ''
  AND amount IS NOT NULL;

CREATE OR REPLACE VIEW one_c_mirror.crm_product_price_summary AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  product_code,
  max(product_name) AS product_name,
  count(*)::int AS price_count,
  min(price)::numeric(18, 2) AS min_price,
  max(price)::numeric(18, 2) AS max_price,
  string_agg(DISTINCT currency, ', ' ORDER BY currency) FILTER (
    WHERE currency IS NOT NULL AND currency <> ''
  ) AS price_currencies,
  string_agg(DISTINCT price_type_name, ', ' ORDER BY price_type_name) FILTER (
    WHERE price_type_name IS NOT NULL AND price_type_name <> ''
  ) AS price_types,
  max(snapshot_at) AS snapshot_at,
  max(imported_at) AS imported_at,
  string_agg(
    DISTINCT concat_ws(' ', NULLIF(price_type_name, ''), price::text, NULLIF(currency, '')),
    '; '
  ) AS price_summary
FROM one_c_mirror.crm_product_prices
GROUP BY enterprise_code, enterprise_name, enterprise_ref, product_code;

CREATE OR REPLACE VIEW one_c_mirror.crm_products AS
WITH RECURSIVE product_catalog_rows AS (
  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    btrim(code) AS product_code,
    NULLIF(btrim(name), '') AS product_name,
    deletion_mark AS is_deleted,
    source_file,
    imported_at,
    0 AS source_rank,
    NULLIF(btrim(COALESCE(
      raw_data->>'product_group_code',
      raw_data->>'ProductGroupCode',
      raw_data->>'parent_code',
      raw_data->>'ParentCode',
      raw_data->>'РодительКод',
      raw_data->>'КодРодителя',
      raw_data->>'КодГруппы',
      raw_data->>'КодГрупи'
    )), '') AS product_group_code,
    NULLIF(btrim(COALESCE(
      raw_data->>'product_group_name',
      raw_data->>'ProductGroupName',
      raw_data->>'parent_name',
      raw_data->>'ParentName',
      raw_data->>'РодительНаименование',
      raw_data->>'Родитель',
      raw_data->>'Группа',
      raw_data->>'Група',
      raw_data->>'НоменклатурнаяГруппа',
      raw_data->>'НоменклатурнаГрупа'
    )), '') AS product_group_name,
    NULLIF(btrim(COALESCE(
      raw_data->>'product_group_ref',
      raw_data->>'ProductGroupRef',
      raw_data->>'parent_ref',
      raw_data->>'ParentRef',
      raw_data->>'РодительСсылка',
      raw_data->>'ПосиланняРодителя',
      raw_data->>'ГруппаСсылка',
      raw_data->>'ПосиланняГрупи'
    )), '') AS product_group_ref,
    lower(COALESCE(
      raw_data->>'is_group',
      raw_data->>'IsGroup',
      raw_data->>'ЭтоГруппа',
      raw_data->>'ЦеГрупа',
      'false'
    )) IN ('true', 'истина', '1', 'yes') AS is_group
  FROM one_c_mirror.latest_rows
  WHERE
    source_file = '1c_products.csv'
    OR object_type IN ('product', 'products')
    OR catalog_name = 'Номенклатура'

),
product_group_hierarchy AS (
  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    product_code AS group_code,
    product_name AS group_name,
    product_group_code AS parent_group_code,
    product_group_name AS parent_group_name,
    product_code AS group_code_path,
    product_name AS group_name_path,
    1::int AS group_level
  FROM product_catalog_rows child
  WHERE
    child.is_group
    AND (
      child.product_group_code IS NULL
      OR child.product_group_code = ''
      OR NOT EXISTS (
        SELECT 1
        FROM product_catalog_rows parent
        WHERE
          parent.is_group
          AND parent.enterprise_code = child.enterprise_code
          AND parent.product_code = child.product_group_code
      )
    )

  UNION ALL

  SELECT
    child.enterprise_code,
    child.enterprise_name,
    child.enterprise_ref,
    child.product_code AS group_code,
    child.product_name AS group_name,
    child.product_group_code AS parent_group_code,
    child.product_group_name AS parent_group_name,
    concat_ws(' / ', parent.group_code_path, child.product_code) AS group_code_path,
    concat_ws(' / ', parent.group_name_path, child.product_name) AS group_name_path,
    (parent.group_level + 1)::int AS group_level
  FROM product_catalog_rows child
  JOIN product_group_hierarchy parent
    ON parent.enterprise_code = child.enterprise_code
   AND parent.group_code = child.product_group_code
  WHERE
    child.is_group
    AND parent.group_level < 30
),
product_sources AS (
  SELECT
    product_catalog_rows.enterprise_code,
    product_catalog_rows.enterprise_name,
    product_catalog_rows.enterprise_ref,
    product_catalog_rows.product_code,
    product_catalog_rows.product_name,
    product_catalog_rows.is_deleted,
    product_catalog_rows.source_file,
    product_catalog_rows.imported_at,
    product_catalog_rows.source_rank,
    product_catalog_rows.product_group_code,
    product_catalog_rows.product_group_name,
    product_catalog_rows.product_group_ref,
    product_catalog_rows.is_group,
    COALESCE(parent_group.group_code_path, product_catalog_rows.product_group_code) AS product_group_code_path,
    COALESCE(parent_group.group_name_path, product_catalog_rows.product_group_name) AS product_group_path,
    CASE
      WHEN COALESCE(parent_group.group_name_path, product_catalog_rows.product_group_name) IS NULL
        THEN product_catalog_rows.product_name
      ELSE concat_ws(' / ', COALESCE(parent_group.group_name_path, product_catalog_rows.product_group_name), product_catalog_rows.product_name)
    END AS product_full_path,
    COALESCE(
      parent_group.group_level,
      CASE
        WHEN product_catalog_rows.product_group_code IS NOT NULL OR product_catalog_rows.product_group_name IS NOT NULL THEN 1
        ELSE NULL
      END
    ) AS product_group_level
  FROM product_catalog_rows
  LEFT JOIN product_group_hierarchy parent_group
    ON parent_group.enterprise_code = product_catalog_rows.enterprise_code
   AND parent_group.group_code = product_catalog_rows.product_group_code

  UNION ALL

  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    btrim(entity_code) AS product_code,
    NULLIF(btrim(entity_name), '') AS product_name,
    false AS is_deleted,
    source_file,
    imported_at,
    1 AS source_rank,
    NULL::text AS product_group_code,
    NULL::text AS product_group_name,
    NULL::text AS product_group_ref,
    false AS is_group,
    NULL::text AS product_group_code_path,
    NULL::text AS product_group_path,
    NULL::text AS product_full_path,
    NULL::int AS product_group_level
  FROM one_c_mirror.latest_operational_rows
  WHERE dataset_name IN ('stock_balances', 'product_prices')
),
latest_products AS (
  SELECT DISTINCT ON (enterprise_code, product_code)
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    product_code,
    product_name,
    is_deleted,
    source_file,
    imported_at,
    source_rank,
    product_group_code,
    product_group_name,
    product_group_ref,
    is_group,
    product_group_code_path,
    product_group_path,
    product_full_path,
    product_group_level
  FROM product_sources
  WHERE product_code IS NOT NULL AND product_code <> ''
  ORDER BY enterprise_code, product_code, is_deleted ASC, source_rank ASC, imported_at DESC NULLS LAST
)
SELECT
  products.enterprise_code,
  products.enterprise_name,
  products.enterprise_ref,
  products.product_code,
  COALESCE(products.product_name, prices.product_name) AS product_name,
  products.is_deleted,
  products.source_file,
  products.imported_at,
  COALESCE(prices.price_count, 0) AS price_count,
  prices.min_price,
  prices.max_price,
  prices.price_currencies,
  prices.price_types,
  prices.price_summary,
  products.product_group_code,
  products.product_group_name,
  products.product_group_ref,
  products.is_group,
  products.product_group_code_path,
  products.product_group_path,
  products.product_full_path,
  products.product_group_level
FROM latest_products products
LEFT JOIN one_c_mirror.crm_product_price_summary prices
  ON prices.enterprise_code = products.enterprise_code
 AND prices.product_code = products.product_code;

CREATE OR REPLACE VIEW one_c_mirror.crm_warehouses AS
WITH warehouse_sources AS (
  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    btrim(code) AS warehouse_code,
    NULLIF(btrim(name), '') AS warehouse_name,
    deletion_mark AS is_deleted,
    source_file,
    imported_at
  FROM one_c_mirror.latest_rows
  WHERE
    source_file = '1c_warehouses.csv'
    OR object_type IN ('warehouse', 'warehouses')
    OR catalog_name = 'Склады'

  UNION ALL

  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    btrim(warehouse_code) AS warehouse_code,
    NULLIF(btrim(warehouse_name), '') AS warehouse_name,
    false AS is_deleted,
    source_file,
    imported_at
  FROM one_c_mirror.latest_operational_rows
  WHERE dataset_name IN ('stock_balances', 'reserved_stock_balances')
)
SELECT DISTINCT ON (enterprise_code, warehouse_code)
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  warehouse_code,
  warehouse_name,
  is_deleted,
  source_file,
  imported_at
FROM warehouse_sources
WHERE warehouse_code IS NOT NULL AND warehouse_code <> ''
ORDER BY enterprise_code, warehouse_code, is_deleted ASC, imported_at DESC NULLS LAST;

CREATE OR REPLACE VIEW one_c_mirror.crm_counterparties AS
WITH counterparty_sources AS (
  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    btrim(code) AS counterparty_code,
    NULLIF(btrim(name), '') AS counterparty_name,
    deletion_mark AS is_deleted,
    source_file,
    imported_at
  FROM one_c_mirror.latest_rows
  WHERE
    source_file = '1c_counterparties.csv'
    OR object_type IN ('counterparty', 'counterparties')
    OR catalog_name = 'Контрагенты'

  UNION ALL

  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    btrim(entity_code) AS counterparty_code,
    NULLIF(btrim(entity_name), '') AS counterparty_name,
    false AS is_deleted,
    source_file,
    imported_at
  FROM one_c_mirror.latest_operational_rows
  WHERE dataset_name = 'counterparty_settlements'
)
SELECT DISTINCT ON (enterprise_code, counterparty_code)
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  counterparty_code,
  counterparty_name,
  is_deleted,
  source_file,
  imported_at
FROM counterparty_sources
WHERE counterparty_code IS NOT NULL AND counterparty_code <> ''
ORDER BY enterprise_code, counterparty_code, is_deleted ASC, imported_at DESC NULLS LAST;

CREATE OR REPLACE VIEW one_c_mirror.crm_counterparty_contracts AS
WITH contract_sources AS (
  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    NULL::text AS counterparty_code,
    NULL::text AS counterparty_name,
    btrim(code) AS contract_code,
    NULLIF(btrim(name), '') AS contract_name,
    deletion_mark AS is_deleted,
    source_file,
    imported_at
  FROM one_c_mirror.latest_rows
  WHERE
    source_file = '1c_counterparty_contracts.csv'
    OR object_type IN ('counterparty_contract', 'counterparty_contracts')
    OR catalog_name = 'ДоговорыКонтрагентов'

  UNION ALL

  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    btrim(entity_code) AS counterparty_code,
    NULLIF(btrim(entity_name), '') AS counterparty_name,
    btrim(contract_code) AS contract_code,
    NULLIF(btrim(contract_name), '') AS contract_name,
    false AS is_deleted,
    source_file,
    imported_at
  FROM one_c_mirror.latest_operational_rows
  WHERE dataset_name = 'counterparty_settlements'
)
SELECT DISTINCT ON (enterprise_code, COALESCE(counterparty_code, ''), contract_code)
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  counterparty_code,
  counterparty_name,
  contract_code,
  contract_name,
  is_deleted,
  source_file,
  imported_at
FROM contract_sources
WHERE contract_code IS NOT NULL AND contract_code <> ''
ORDER BY enterprise_code, COALESCE(counterparty_code, ''), contract_code, is_deleted ASC, imported_at DESC NULLS LAST;

CREATE OR REPLACE VIEW one_c_mirror.crm_stock_balances AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  btrim(entity_code) AS product_code,
  max(NULLIF(btrim(entity_name), '')) AS product_name,
  btrim(warehouse_code) AS warehouse_code,
  max(NULLIF(btrim(warehouse_name), '')) AS warehouse_name,
  sum(CASE WHEN dataset_name = 'stock_balances' THEN COALESCE(quantity, 0) ELSE 0 END)::numeric(18, 3) AS quantity,
  sum(CASE WHEN dataset_name = 'reserved_stock_balances' THEN COALESCE(reserved_quantity, quantity, 0) ELSE COALESCE(reserved_quantity, 0) END)::numeric(18, 3) AS reserved_quantity,
  max(period_at) AS snapshot_at,
  max(imported_at) AS imported_at
FROM one_c_mirror.latest_operational_rows
WHERE
  dataset_name IN ('stock_balances', 'reserved_stock_balances')
  AND entity_code IS NOT NULL
  AND btrim(entity_code) <> ''
GROUP BY enterprise_code, enterprise_name, enterprise_ref, btrim(entity_code), btrim(warehouse_code);

CREATE OR REPLACE VIEW one_c_mirror.crm_counterparty_settlements AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  btrim(entity_code) AS counterparty_code,
  NULLIF(btrim(entity_name), '') AS counterparty_name,
  btrim(contract_code) AS contract_code,
  NULLIF(btrim(contract_name), '') AS contract_name,
  btrim(organization_code) AS organization_code,
  NULLIF(btrim(organization_name), '') AS organization_name,
  NULLIF(btrim(currency), '') AS currency,
  amount,
  CASE
    WHEN amount > 0 THEN 'positive'
    WHEN amount < 0 THEN 'negative'
    ELSE 'zero'
  END AS balance_sign,
  period_at AS snapshot_at,
  imported_at
FROM one_c_mirror.latest_operational_rows
WHERE dataset_name = 'counterparty_settlements';

CREATE OR REPLACE VIEW one_c_mirror.crm_counterparty_balance_summary AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  counterparty_code,
  max(counterparty_name) AS counterparty_name,
  contract_code,
  max(contract_name) AS contract_name,
  organization_code,
  max(organization_name) AS organization_name,
  currency,
  sum(COALESCE(amount, 0))::numeric(18, 2) AS amount,
  abs(sum(COALESCE(amount, 0)))::numeric(18, 2) AS amount_abs,
  CASE
    WHEN sum(COALESCE(amount, 0)) > 0 THEN 'positive'
    WHEN sum(COALESCE(amount, 0)) < 0 THEN 'negative'
    ELSE 'zero'
  END AS balance_sign,
  max(snapshot_at) AS snapshot_at,
  max(imported_at) AS imported_at
FROM one_c_mirror.crm_counterparty_settlements
GROUP BY enterprise_code, enterprise_name, enterprise_ref, counterparty_code, contract_code, organization_code, currency;

CREATE OR REPLACE VIEW one_c_mirror.crm_reference_items AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  object_type AS reference_type,
  catalog_name,
  source_file,
  btrim(code) AS code,
  NULLIF(btrim(name), '') AS name,
  deletion_mark AS is_deleted,
  raw_data,
  imported_at
FROM one_c_mirror.latest_rows;

CREATE OR REPLACE VIEW one_c_mirror.crm_reference_catalog_summary AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  reference_type,
  catalog_name,
  source_file,
  count(*)::int AS rows,
  count(*) FILTER (WHERE is_deleted)::int AS deleted_rows,
  max(imported_at) AS imported_at
FROM one_c_mirror.crm_reference_items
GROUP BY enterprise_code, enterprise_name, enterprise_ref, reference_type, catalog_name, source_file;

CREATE OR REPLACE VIEW one_c_mirror.crm_units AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS unit_code,
  name AS unit_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_units.csv'
  OR reference_type = 'units'
  OR catalog_name = 'ЕдиницыИзмерения';

CREATE OR REPLACE VIEW one_c_mirror.crm_currencies AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS currency_code,
  name AS currency_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_currencies.csv'
  OR reference_type = 'currencies'
  OR catalog_name = 'Валюты';

CREATE OR REPLACE VIEW one_c_mirror.crm_price_types AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS price_type_code,
  name AS price_type_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_price_types.csv'
  OR reference_type = 'price_types'
  OR catalog_name = 'ТипыЦенНоменклатуры';

CREATE OR REPLACE VIEW one_c_mirror.crm_product_groups AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS product_group_code,
  name AS product_group_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_product_groups.csv'
  OR reference_type = 'product_groups'
  OR catalog_name = 'НоменклатурныеГруппы';

CREATE OR REPLACE VIEW one_c_mirror.crm_product_folders AS
SELECT DISTINCT ON (enterprise_code, product_code)
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  product_code AS product_group_code,
  product_name AS product_group_name,
  product_group_ref,
  product_group_code_path,
  product_group_path,
  product_full_path AS product_group_full_path,
  (COALESCE(product_group_level, 0) + 1)::int AS product_group_level
FROM one_c_mirror.crm_products
WHERE
  is_group = true
  AND product_code IS NOT NULL
  AND product_code <> ''
ORDER BY enterprise_code, product_code, product_full_path NULLS LAST;

CREATE OR REPLACE VIEW one_c_mirror.crm_product_kinds AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS product_kind_code,
  name AS product_kind_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_product_kinds.csv'
  OR reference_type = 'product_kinds'
  OR catalog_name = 'ВидыНоменклатуры';

CREATE OR REPLACE VIEW one_c_mirror.crm_product_series AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS product_series_code,
  name AS product_series_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_product_series.csv'
  OR reference_type = 'product_series'
  OR catalog_name = 'СерииНоменклатуры';

CREATE OR REPLACE VIEW one_c_mirror.crm_product_characteristics AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS product_characteristic_code,
  name AS product_characteristic_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_product_characteristics.csv'
  OR reference_type = 'product_characteristics'
  OR catalog_name = 'ХарактеристикиНоменклатуры';

CREATE OR REPLACE VIEW one_c_mirror.crm_organizations AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS organization_code,
  name AS organization_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_organizations.csv'
  OR reference_type = 'organizations'
  OR catalog_name = 'Организации';

CREATE OR REPLACE VIEW one_c_mirror.crm_organization_units AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS organization_unit_code,
  name AS organization_unit_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_organization_units.csv'
  OR reference_type = 'organization_units'
  OR catalog_name = 'ПодразделенияОрганизаций';

CREATE OR REPLACE VIEW one_c_mirror.crm_persons AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS person_code,
  name AS person_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_persons.csv'
  OR reference_type = 'persons'
  OR catalog_name = 'ФизическиеЛица';

CREATE OR REPLACE VIEW one_c_mirror.crm_contact_info_types AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS contact_info_type_code,
  name AS contact_info_type_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_contact_info_types.csv'
  OR reference_type = 'contact_info_types'
  OR catalog_name = 'ВидыКонтактнойИнформации';

CREATE OR REPLACE VIEW one_c_mirror.crm_bank_accounts AS
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  code AS bank_account_code,
  name AS bank_account_name,
  is_deleted,
  source_file,
  imported_at
FROM one_c_mirror.crm_reference_items
WHERE
  source_file = '1c_bank_accounts.csv'
  OR reference_type = 'bank_accounts'
  OR catalog_name = 'БанковскиеСчета';

COMMIT;
