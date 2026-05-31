\set ON_ERROR_STOP on

\if :{?crm_admin_user}
\else
\set crm_admin_user crm_admin
\endif

\if :{?crm_database}
\else
\set crm_database crm_hub
\endif

\if :{?crm_admin_password}
\else
\echo 'ERROR: pass -v crm_admin_password=... to set the PostgreSQL password.'
\quit 1
\endif

SET password_encryption = 'scram-sha-256';

SELECT format(
  'CREATE ROLE %I LOGIN PASSWORD %L',
  :'crm_admin_user',
  :'crm_admin_password'
)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_roles
  WHERE rolname = :'crm_admin_user'
)
\gexec

ALTER ROLE :"crm_admin_user" WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  PASSWORD :'crm_admin_password';

SELECT format(
  'CREATE DATABASE %I OWNER %I ENCODING %L TEMPLATE template0',
  :'crm_database',
  :'crm_admin_user',
  'UTF8'
)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_database
  WHERE datname = :'crm_database'
)
\gexec

ALTER DATABASE :"crm_database" OWNER TO :"crm_admin_user";
GRANT ALL PRIVILEGES ON DATABASE :"crm_database" TO :"crm_admin_user";
