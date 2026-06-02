BEGIN;

CREATE ROLE crm_1c_sync LOGIN PASSWORD :'crm_1c_sync_password';
CREATE ROLE crm_marketplace_sync LOGIN PASSWORD :'crm_marketplace_sync_password';
CREATE ROLE crm_website_sync LOGIN PASSWORD :'crm_website_sync_password';
CREATE ROLE crm_b2b_sync LOGIN PASSWORD :'crm_b2b_sync_password';
CREATE ROLE crm_retail_sync LOGIN PASSWORD :'crm_retail_sync_password';

GRANT USAGE ON SCHEMA core, integration, one_c, one_c_mirror TO crm_1c_sync;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA core TO crm_1c_sync;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA integration TO crm_1c_sync;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA one_c TO crm_1c_sync;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA one_c_mirror TO crm_1c_sync;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core, integration, one_c, one_c_mirror TO crm_1c_sync;

GRANT USAGE ON SCHEMA core, integration, marketplace TO crm_marketplace_sync;
GRANT SELECT ON core.products, core.product_prices, core.stock_balances, core.warehouses TO crm_marketplace_sync;
GRANT INSERT, SELECT, UPDATE ON integration.inbox_events TO crm_marketplace_sync;
GRANT SELECT, UPDATE ON integration.outbox_events TO crm_marketplace_sync;

GRANT USAGE ON SCHEMA core, integration, website TO crm_website_sync;
GRANT SELECT ON core.products, core.product_prices, core.stock_balances, core.warehouses TO crm_website_sync;
GRANT INSERT, SELECT, UPDATE ON integration.inbox_events TO crm_website_sync;
GRANT SELECT, UPDATE ON integration.outbox_events TO crm_website_sync;

GRANT USAGE ON SCHEMA core, integration, b2b TO crm_b2b_sync;
GRANT SELECT ON core.products, core.product_prices, core.stock_balances, core.warehouses, core.customers TO crm_b2b_sync;
GRANT INSERT, SELECT, UPDATE ON integration.inbox_events TO crm_b2b_sync;
GRANT SELECT, UPDATE ON integration.outbox_events TO crm_b2b_sync;

GRANT USAGE ON SCHEMA core, integration, retail TO crm_retail_sync;
GRANT SELECT ON core.products, core.product_prices, core.stock_balances, core.warehouses TO crm_retail_sync;
GRANT INSERT, SELECT, UPDATE ON integration.inbox_events TO crm_retail_sync;
GRANT SELECT, UPDATE ON integration.outbox_events TO crm_retail_sync;

COMMIT;
