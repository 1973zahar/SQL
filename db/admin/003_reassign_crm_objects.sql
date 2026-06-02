\set ON_ERROR_STOP on

\if :{?crm_admin_user}
\else
\set crm_admin_user crm_admin
\endif

SELECT format('ALTER SCHEMA %I OWNER TO %I', schema_name, :'crm_admin_user')
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
\gexec

SELECT format(
  'ALTER %s %I.%I OWNER TO %I',
  CASE c.relkind
    WHEN 'v' THEN 'VIEW'
    WHEN 'm' THEN 'MATERIALIZED VIEW'
    ELSE 'TABLE'
  END,
  n.nspname,
  c.relname,
  :'crm_admin_user'
)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN (
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
  AND c.relkind IN ('r', 'p', 'v', 'm')
\gexec

SELECT format('ALTER SEQUENCE %I.%I OWNER TO %I', sequence_schema, sequence_name, :'crm_admin_user')
FROM information_schema.sequences
WHERE sequence_schema IN (
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
\gexec

SELECT format('ALTER TYPE %I.%I OWNER TO %I', n.nspname, t.typname, :'crm_admin_user')
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname IN ('core', 'integration')
  AND t.typtype = 'e'
\gexec

SELECT format('ALTER FUNCTION %s OWNER TO %I', p.oid::regprocedure, :'crm_admin_user')
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN (
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
\gexec
