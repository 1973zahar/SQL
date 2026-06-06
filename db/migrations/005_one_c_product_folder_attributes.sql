BEGIN;

CREATE TABLE IF NOT EXISTS one_c_mirror.crm_product_folder_attribute_rules (
  rule_code text PRIMARY KEY,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  match_scope text NOT NULL DEFAULT 'path_part'
    CHECK (match_scope IN ('path', 'path_part')),
  match_mode text NOT NULL DEFAULT 'contains'
    CHECK (match_mode IN ('equals', 'contains', 'regex')),
  match_level integer CHECK (match_level IS NULL OR match_level > 0),
  match_pattern text NOT NULL,
  attribute_code text NOT NULL,
  attribute_name text NOT NULL,
  attribute_value text NOT NULL,
  value_type text NOT NULL DEFAULT 'text'
    CHECK (value_type IN ('text', 'boolean', 'number')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO one_c_mirror.crm_product_folder_attribute_rules (
  rule_code,
  priority,
  match_scope,
  match_mode,
  match_level,
  match_pattern,
  attribute_code,
  attribute_name,
  attribute_value,
  value_type,
  notes
)
VALUES
  (
    'category_primary_pneumatics',
    10,
    'path_part',
    'contains',
    1,
    'ПНЕВМАТИКА',
    'category_primary',
    'Основна категорія',
    'Пневматика',
    'text',
    'Top-level product folder category.'
  ),
  (
    'category_primary_optics',
    10,
    'path_part',
    'contains',
    1,
    'ОПТИКА',
    'category_primary',
    'Основна категорія',
    'Оптика',
    'text',
    'Top-level product folder category.'
  ),
  (
    'category_primary_accessories',
    10,
    'path_part',
    'contains',
    1,
    'АКСЕСУАРИ',
    'category_primary',
    'Основна категорія',
    'Аксесуари та інше',
    'text',
    'Top-level product folder category.'
  ),
  (
    'category_secondary_spare_parts',
    30,
    'path_part',
    'contains',
    NULL,
    'ЗАПЧАСТИНИ',
    'category_secondary',
    'Додаткова категорія',
    'Запчастини',
    'text',
    'Any folder level that marks spare parts.'
  ),
  (
    'flag_spare_part',
    30,
    'path_part',
    'contains',
    NULL,
    'ЗАПЧАСТИНИ',
    'is_spare_part',
    'Запчастина',
    'true',
    'boolean',
    'Boolean flag derived from spare-parts folders.'
  ),
  (
    'supply_channel_our_import_ua',
    20,
    'path_part',
    'contains',
    NULL,
    'НАШ ІМПОРТ',
    'supply_channel',
    'Канал постачання',
    'Наш імпорт',
    'text',
    'Ukrainian spelling; normalization also handles common Latin lookalikes.'
  ),
  (
    'supply_channel_our_import_ru',
    21,
    'path_part',
    'contains',
    NULL,
    'НАШ ИМПОРТ',
    'supply_channel',
    'Канал постачання',
    'Наш імпорт',
    'text',
    'Russian spelling fallback.'
  ),
  (
    'importer_fop_szm',
    25,
    'path_part',
    'contains',
    NULL,
    'ФОП СЗМ',
    'importer',
    'Імпортер',
    'ФОП СЗМ',
    'text',
    'Importer marker from folder names such as НАШ ІМПОРТ ФОП СЗМ.'
  )
ON CONFLICT (rule_code) DO UPDATE
SET
  priority = EXCLUDED.priority,
  is_active = EXCLUDED.is_active,
  match_scope = EXCLUDED.match_scope,
  match_mode = EXCLUDED.match_mode,
  match_level = EXCLUDED.match_level,
  match_pattern = EXCLUDED.match_pattern,
  attribute_code = EXCLUDED.attribute_code,
  attribute_name = EXCLUDED.attribute_name,
  attribute_value = EXCLUDED.attribute_value,
  value_type = EXCLUDED.value_type,
  notes = EXCLUDED.notes,
  updated_at = now();

CREATE OR REPLACE VIEW one_c_mirror.crm_product_folder_path_parts AS
WITH product_paths AS (
  SELECT
    enterprise_code,
    enterprise_name,
    enterprise_ref,
    product_code,
    product_name,
    product_group_code,
    product_group_name,
    product_group_code_path,
    product_group_path,
    product_full_path,
    product_group_level,
    regexp_replace(
      translate(upper(COALESCE(product_group_path, '')), 'HAECOPXIMKTBY', 'НАЕСОРХІМКТВУ'),
      '[[:space:]]+',
      ' ',
      'g'
    ) AS product_group_path_normalized
  FROM one_c_mirror.crm_products
  WHERE product_group_path IS NOT NULL AND btrim(product_group_path) <> ''
),
path_parts AS (
  SELECT
    product_paths.*,
    path_part.path_part,
    path_part.path_part_index
  FROM product_paths
  CROSS JOIN LATERAL regexp_split_to_table(product_paths.product_group_path, '[[:space:]]*/[[:space:]]*')
    WITH ORDINALITY AS path_part(path_part, path_part_index)
)
SELECT
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  product_code,
  product_name,
  product_group_code,
  product_group_name,
  product_group_code_path,
  product_group_path,
  product_full_path,
  product_group_level,
  path_part_index::int,
  NULLIF(btrim(path_part), '') AS path_part,
  regexp_replace(
    translate(upper(COALESCE(NULLIF(btrim(path_part), ''), '')), 'HAECOPXIMKTBY', 'НАЕСОРХІМКТВУ'),
    '[[:space:]]+',
    ' ',
    'g'
  ) AS path_part_normalized,
  product_group_path_normalized
FROM path_parts
WHERE NULLIF(btrim(path_part), '') IS NOT NULL;

CREATE OR REPLACE VIEW one_c_mirror.crm_product_folder_attribute_matches AS
SELECT
  parts.enterprise_code,
  parts.enterprise_name,
  parts.enterprise_ref,
  parts.product_code,
  parts.product_name,
  parts.product_group_path,
  parts.product_full_path,
  parts.path_part_index,
  parts.path_part,
  rules.rule_code,
  rules.priority,
  rules.attribute_code,
  rules.attribute_name,
  rules.attribute_value,
  rules.value_type,
  rules.match_scope,
  rules.match_mode,
  rules.match_level,
  rules.match_pattern,
  rules.notes
FROM one_c_mirror.crm_product_folder_path_parts parts
JOIN one_c_mirror.crm_product_folder_attribute_rules rules
  ON rules.is_active
 AND (rules.match_level IS NULL OR rules.match_level = parts.path_part_index)
 AND (
    CASE rules.match_scope
      WHEN 'path' THEN
        CASE rules.match_mode
          WHEN 'equals' THEN parts.product_group_path_normalized = regexp_replace(translate(upper(rules.match_pattern), 'HAECOPXIMKTBY', 'НАЕСОРХІМКТВУ'), '[[:space:]]+', ' ', 'g')
          WHEN 'contains' THEN parts.product_group_path_normalized LIKE '%' || regexp_replace(translate(upper(rules.match_pattern), 'HAECOPXIMKTBY', 'НАЕСОРХІМКТВУ'), '[[:space:]]+', ' ', 'g') || '%'
          WHEN 'regex' THEN parts.product_group_path_normalized ~ regexp_replace(translate(upper(rules.match_pattern), 'HAECOPXIMKTBY', 'НАЕСОРХІМКТВУ'), '[[:space:]]+', ' ', 'g')
        END
      WHEN 'path_part' THEN
        CASE rules.match_mode
          WHEN 'equals' THEN parts.path_part_normalized = regexp_replace(translate(upper(rules.match_pattern), 'HAECOPXIMKTBY', 'НАЕСОРХІМКТВУ'), '[[:space:]]+', ' ', 'g')
          WHEN 'contains' THEN parts.path_part_normalized LIKE '%' || regexp_replace(translate(upper(rules.match_pattern), 'HAECOPXIMKTBY', 'НАЕСОРХІМКТВУ'), '[[:space:]]+', ' ', 'g') || '%'
          WHEN 'regex' THEN parts.path_part_normalized ~ regexp_replace(translate(upper(rules.match_pattern), 'HAECOPXIMKTBY', 'НАЕСОРХІМКТВУ'), '[[:space:]]+', ' ', 'g')
        END
    END
  );

CREATE OR REPLACE VIEW one_c_mirror.crm_product_folder_attributes AS
SELECT DISTINCT ON (
  enterprise_code,
  product_code,
  attribute_code,
  attribute_value
)
  enterprise_code,
  enterprise_name,
  enterprise_ref,
  product_code,
  product_name,
  product_group_path,
  product_full_path,
  attribute_code,
  attribute_name,
  attribute_value,
  value_type,
  rule_code,
  priority,
  path_part_index,
  path_part
FROM one_c_mirror.crm_product_folder_attribute_matches
ORDER BY
  enterprise_code,
  product_code,
  attribute_code,
  attribute_value,
  priority,
  path_part_index,
  rule_code;

CREATE OR REPLACE VIEW one_c_mirror.crm_products_enriched AS
WITH ranked_attributes AS (
  SELECT
    attrs.*,
    row_number() OVER (
      PARTITION BY attrs.enterprise_code, attrs.product_code, attrs.attribute_code
      ORDER BY attrs.priority, attrs.path_part_index, attrs.rule_code
    ) AS attribute_rank
  FROM one_c_mirror.crm_product_folder_attributes attrs
),
attributes_pivot AS (
  SELECT
    enterprise_code,
    product_code,
    max(attribute_value) FILTER (WHERE attribute_code = 'category_primary' AND attribute_rank = 1) AS category_primary,
    max(attribute_value) FILTER (WHERE attribute_code = 'category_secondary' AND attribute_rank = 1) AS category_secondary,
    max(attribute_value) FILTER (WHERE attribute_code = 'supply_channel' AND attribute_rank = 1) AS supply_channel,
    max(attribute_value) FILTER (WHERE attribute_code = 'importer' AND attribute_rank = 1) AS importer,
    COALESCE(
      bool_or(
        CASE
          WHEN attribute_code = 'is_spare_part' THEN attribute_value::boolean
          ELSE NULL
        END
      ),
      false
    ) AS is_spare_part_from_folder,
    jsonb_object_agg(attribute_code, attribute_value ORDER BY priority, path_part_index, rule_code)
      FILTER (WHERE attribute_rank = 1) AS folder_attributes
  FROM ranked_attributes
  GROUP BY enterprise_code, product_code
),
folder_levels AS (
  SELECT
    enterprise_code,
    product_code,
    max(path_part) FILTER (WHERE path_part_index = 1) AS folder_level_1,
    max(path_part) FILTER (WHERE path_part_index = 2) AS folder_level_2,
    max(path_part) FILTER (WHERE path_part_index = 3) AS folder_level_3,
    max(path_part) FILTER (WHERE path_part_index = 4) AS folder_level_4,
    max(path_part) FILTER (WHERE path_part_index = 5) AS folder_level_5,
    max(path_part) FILTER (WHERE path_part_index = 6) AS folder_level_6
  FROM one_c_mirror.crm_product_folder_path_parts
  GROUP BY enterprise_code, product_code
)
SELECT
  products.*,
  folder_levels.folder_level_1,
  folder_levels.folder_level_2,
  folder_levels.folder_level_3,
  folder_levels.folder_level_4,
  folder_levels.folder_level_5,
  folder_levels.folder_level_6,
  attributes_pivot.category_primary,
  attributes_pivot.category_secondary,
  attributes_pivot.supply_channel,
  attributes_pivot.importer,
  COALESCE(attributes_pivot.is_spare_part_from_folder, false) AS is_spare_part_from_folder,
  COALESCE(attributes_pivot.folder_attributes, '{}'::jsonb) AS folder_attributes
FROM one_c_mirror.crm_products products
LEFT JOIN folder_levels
  ON folder_levels.enterprise_code = products.enterprise_code
 AND folder_levels.product_code = products.product_code
LEFT JOIN attributes_pivot
  ON attributes_pivot.enterprise_code = products.enterprise_code
 AND attributes_pivot.product_code = products.product_code;

COMMIT;
