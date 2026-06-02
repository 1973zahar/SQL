BEGIN;

CREATE SCHEMA IF NOT EXISTS one_c_mirror;

CREATE TABLE IF NOT EXISTS one_c_mirror.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL DEFAULT '1c',
  object_type text NOT NULL,
  catalog_name text NOT NULL,
  source_file text NOT NULL,
  source_url text,
  row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  status integration.event_status NOT NULL DEFAULT 'processing',
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS one_c_mirror.raw_rows (
  id bigserial PRIMARY KEY,
  import_batch_id uuid NOT NULL REFERENCES one_c_mirror.import_batches(id) ON DELETE CASCADE,
  source_system text NOT NULL DEFAULT '1c',
  object_type text NOT NULL,
  catalog_name text NOT NULL,
  source_file text NOT NULL,
  row_no integer NOT NULL CHECK (row_no > 0),
  external_ref text,
  code text,
  name text,
  deletion_mark boolean NOT NULL DEFAULT false,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_hash text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (import_batch_id, row_no)
);

ALTER TABLE one_c_mirror.raw_rows
  ADD COLUMN IF NOT EXISTS import_batch_id uuid,
  ADD COLUMN IF NOT EXISTS source_system text NOT NULL DEFAULT '1c',
  ADD COLUMN IF NOT EXISTS object_type text,
  ADD COLUMN IF NOT EXISTS object_name text,
  ADD COLUMN IF NOT EXISTS catalog_name text,
  ADD COLUMN IF NOT EXISTS source_file text,
  ADD COLUMN IF NOT EXISTS row_no integer,
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS deletion_mark boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS row_hash text,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz NOT NULL DEFAULT now();

UPDATE one_c_mirror.raw_rows
SET object_name = COALESCE(object_name, catalog_name, object_type)
WHERE object_name IS NULL;

ALTER TABLE one_c_mirror.raw_rows
  ALTER COLUMN object_name DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_one_c_mirror_batches_status
  ON one_c_mirror.import_batches (status, started_at);

CREATE INDEX IF NOT EXISTS idx_one_c_mirror_raw_object_type
  ON one_c_mirror.raw_rows (object_type, imported_at DESC);

CREATE INDEX IF NOT EXISTS idx_one_c_mirror_raw_external_ref
  ON one_c_mirror.raw_rows (object_type, external_ref)
  WHERE external_ref IS NOT NULL AND external_ref <> '';

CREATE INDEX IF NOT EXISTS idx_one_c_mirror_raw_code
  ON one_c_mirror.raw_rows (object_type, code)
  WHERE code IS NOT NULL AND code <> '';

CREATE OR REPLACE VIEW one_c_mirror.latest_rows AS
SELECT
  id,
  import_batch_id,
  source_system,
  object_type,
  catalog_name,
  source_file,
  row_no,
  external_ref,
  code,
  name,
  deletion_mark,
  raw_data,
  row_hash,
  imported_at
FROM (
  SELECT
    rr.*,
    row_number() OVER (
      PARTITION BY
        rr.source_system,
        rr.object_type,
        COALESCE(NULLIF(rr.external_ref, ''), NULLIF(rr.code, ''), rr.row_no::text)
      ORDER BY rr.imported_at DESC, rr.id DESC
    ) AS rn
  FROM one_c_mirror.raw_rows rr
) latest
WHERE rn = 1;

CREATE TABLE IF NOT EXISTS one_c_mirror.operational_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL DEFAULT '1c',
  dataset_name text NOT NULL,
  object_type text NOT NULL,
  source_file text NOT NULL,
  source_url text,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  status integration.event_status NOT NULL DEFAULT 'processing',
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS one_c_mirror.operational_rows (
  id bigserial PRIMARY KEY,
  import_batch_id uuid NOT NULL REFERENCES one_c_mirror.operational_batches(id) ON DELETE CASCADE,
  source_system text NOT NULL DEFAULT '1c',
  dataset_name text NOT NULL,
  object_type text NOT NULL,
  source_file text NOT NULL,
  row_no integer NOT NULL CHECK (row_no > 0),
  period_at timestamptz,
  entity_code text,
  entity_name text,
  related_code text,
  related_name text,
  warehouse_code text,
  warehouse_name text,
  contract_code text,
  contract_name text,
  organization_code text,
  organization_name text,
  currency text,
  quantity numeric(18, 3),
  reserved_quantity numeric(18, 3),
  amount numeric(18, 2),
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_hash text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (import_batch_id, row_no)
);

CREATE INDEX IF NOT EXISTS idx_one_c_mirror_operational_batches_status
  ON one_c_mirror.operational_batches (status, started_at);

CREATE INDEX IF NOT EXISTS idx_one_c_mirror_operational_rows_dataset
  ON one_c_mirror.operational_rows (dataset_name, imported_at DESC);

CREATE INDEX IF NOT EXISTS idx_one_c_mirror_operational_rows_entity
  ON one_c_mirror.operational_rows (dataset_name, entity_code)
  WHERE entity_code IS NOT NULL AND entity_code <> '';

CREATE INDEX IF NOT EXISTS idx_one_c_mirror_operational_rows_related
  ON one_c_mirror.operational_rows (dataset_name, related_code)
  WHERE related_code IS NOT NULL AND related_code <> '';

CREATE INDEX IF NOT EXISTS idx_one_c_mirror_operational_rows_warehouse
  ON one_c_mirror.operational_rows (dataset_name, warehouse_code)
  WHERE warehouse_code IS NOT NULL AND warehouse_code <> '';

CREATE OR REPLACE VIEW one_c_mirror.latest_operational_rows AS
WITH latest_batches AS (
  SELECT DISTINCT ON (source_system, dataset_name)
    id,
    source_system,
    dataset_name
  FROM one_c_mirror.operational_batches
  WHERE status = 'processed'::integration.event_status
  ORDER BY source_system, dataset_name, completed_at DESC NULLS LAST, started_at DESC, id DESC
)
SELECT
  op_rows.id,
  op_rows.import_batch_id,
  op_rows.source_system,
  op_rows.dataset_name,
  op_rows.object_type,
  op_rows.source_file,
  op_rows.row_no,
  op_rows.period_at,
  op_rows.entity_code,
  op_rows.entity_name,
  op_rows.related_code,
  op_rows.related_name,
  op_rows.warehouse_code,
  op_rows.warehouse_name,
  op_rows.contract_code,
  op_rows.contract_name,
  op_rows.organization_code,
  op_rows.organization_name,
  op_rows.currency,
  op_rows.quantity,
  op_rows.reserved_quantity,
  op_rows.amount,
  op_rows.raw_data,
  op_rows.row_hash,
  op_rows.imported_at
FROM one_c_mirror.operational_rows op_rows
JOIN latest_batches batches
  ON batches.id = op_rows.import_batch_id;

COMMIT;
