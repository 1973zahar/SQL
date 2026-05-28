BEGIN;

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS marketplace;
CREATE SCHEMA IF NOT EXISTS website;
CREATE SCHEMA IF NOT EXISTS b2b;
CREATE SCHEMA IF NOT EXISTS retail;
CREATE SCHEMA IF NOT EXISTS one_c;
CREATE SCHEMA IF NOT EXISTS integration;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TYPE core.module_code AS ENUM (
  'marketplace',
  'website',
  'b2b',
  'retail',
  'one_c'
);

CREATE TYPE core.order_status AS ENUM (
  'draft',
  'new',
  'confirmed',
  'paid',
  'packed',
  'shipped',
  'completed',
  'cancelled',
  'returned'
);

CREATE TYPE integration.event_status AS ENUM (
  'pending',
  'processing',
  'processed',
  'failed',
  'ignored'
);

CREATE TABLE core.modules (
  code core.module_code PRIMARY KEY,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO core.modules (code, display_name)
VALUES
  ('marketplace', 'Marketplace'),
  ('website', 'Website'),
  ('b2b', 'B2B portal'),
  ('retail', 'Retail store'),
  ('one_c', '1C accounting')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE core.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES core.organizations(id),
  source_module core.module_code NOT NULL,
  external_id text,
  full_name text NOT NULL,
  phone text,
  email text,
  tax_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_module, external_id)
);

CREATE TABLE core.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  barcode text,
  name text NOT NULL,
  description text,
  unit text NOT NULL DEFAULT 'pcs',
  is_active boolean NOT NULL DEFAULT true,
  one_c_ref text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES core.products(id) ON DELETE CASCADE,
  price_type text NOT NULL,
  currency char(3) NOT NULL DEFAULT 'UAH',
  amount numeric(14, 2) NOT NULL CHECK (amount >= 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  source_module core.module_code NOT NULL DEFAULT 'one_c',
  UNIQUE (product_id, price_type, currency, valid_from)
);

CREATE TABLE core.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  module_owner core.module_code NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE core.stock_balances (
  product_id uuid NOT NULL REFERENCES core.products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES core.warehouses(id) ON DELETE CASCADE,
  quantity numeric(14, 3) NOT NULL DEFAULT 0,
  reserved_quantity numeric(14, 3) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, warehouse_id),
  CHECK (quantity >= 0),
  CHECK (reserved_quantity >= 0)
);

CREATE TABLE core.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module core.module_code NOT NULL,
  external_id text,
  customer_id uuid REFERENCES core.customers(id),
  status core.order_status NOT NULL DEFAULT 'new',
  currency char(3) NOT NULL DEFAULT 'UAH',
  total_amount numeric(14, 2) NOT NULL DEFAULT 0,
  shipping_address text,
  payment_method text,
  delivery_method text,
  one_c_document_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_module, external_id)
);

CREATE TABLE core.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES core.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES core.products(id),
  sku_snapshot text NOT NULL,
  name_snapshot text NOT NULL,
  quantity numeric(14, 3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(14, 2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(14, 2) GENERATED ALWAYS AS (round((quantity * unit_price)::numeric, 2)) STORED
);

CREATE TABLE integration.endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code core.module_code NOT NULL REFERENCES core.modules(code),
  name text NOT NULL,
  endpoint_type text NOT NULL,
  connection_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_code, name)
);

CREATE TABLE integration.inbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module core.module_code NOT NULL,
  event_type text NOT NULL,
  external_event_id text,
  aggregate_type text NOT NULL,
  aggregate_external_id text,
  payload jsonb NOT NULL,
  status integration.event_status NOT NULL DEFAULT 'pending',
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (source_module, external_event_id)
);

CREATE TABLE integration.outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_module core.module_code NOT NULL,
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid,
  payload jsonb NOT NULL,
  status integration.event_status NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE TABLE one_c.exchange_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('from_1c', 'to_1c')),
  object_type text NOT NULL,
  object_ref text,
  payload jsonb NOT NULL,
  status integration.event_status NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE TABLE audit.change_log (
  id bigserial PRIMARY KEY,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL,
  row_id text,
  changed_by text DEFAULT current_user,
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_data jsonb,
  new_data jsonb
);

CREATE OR REPLACE FUNCTION core.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_touch
BEFORE UPDATE ON core.organizations
FOR EACH ROW EXECUTE FUNCTION core.touch_updated_at();

CREATE TRIGGER trg_customers_touch
BEFORE UPDATE ON core.customers
FOR EACH ROW EXECUTE FUNCTION core.touch_updated_at();

CREATE TRIGGER trg_products_touch
BEFORE UPDATE ON core.products
FOR EACH ROW EXECUTE FUNCTION core.touch_updated_at();

CREATE TRIGGER trg_orders_touch
BEFORE UPDATE ON core.orders
FOR EACH ROW EXECUTE FUNCTION core.touch_updated_at();

CREATE INDEX idx_customers_phone ON core.customers (phone);
CREATE INDEX idx_customers_email ON core.customers (email);
CREATE INDEX idx_products_one_c_ref ON core.products (one_c_ref);
CREATE INDEX idx_orders_status ON core.orders (status);
CREATE INDEX idx_orders_created_at ON core.orders (created_at);
CREATE INDEX idx_inbox_status_received ON integration.inbox_events (status, received_at);
CREATE INDEX idx_outbox_status_created ON integration.outbox_events (status, created_at);

COMMIT;
