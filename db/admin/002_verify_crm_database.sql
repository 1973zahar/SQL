\set ON_ERROR_STOP on

SELECT
  current_database() AS database,
  current_user AS user_name,
  inet_server_addr() AS server_addr,
  inet_server_port() AS server_port;

SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN (
  'core',
  'integration',
  'one_c',
  'one_c_mirror',
  'marketplace',
  'website',
  'b2b',
  'retail',
  'audit'
)
ORDER BY schema_name;

SELECT
  to_regclass('core.modules') AS core_modules,
  to_regclass('core.products') AS core_products,
  to_regclass('core.orders') AS core_orders,
  to_regclass('integration.inbox_events') AS inbox_events,
  to_regclass('integration.outbox_events') AS outbox_events,
  to_regclass('one_c.exchange_log') AS one_c_exchange_log,
  to_regclass('one_c_mirror.import_batches') AS one_c_mirror_import_batches,
  to_regclass('one_c_mirror.raw_rows') AS one_c_mirror_raw_rows,
  to_regclass('one_c_mirror.latest_rows') AS one_c_mirror_latest_rows,
  to_regclass('one_c_mirror.operational_batches') AS one_c_mirror_operational_batches,
  to_regclass('one_c_mirror.operational_rows') AS one_c_mirror_operational_rows,
  to_regclass('one_c_mirror.latest_operational_rows') AS one_c_mirror_latest_operational_rows;
