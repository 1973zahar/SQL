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
  to_regclass('one_c.exchange_log') AS one_c_exchange_log;
