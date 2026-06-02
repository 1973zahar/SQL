# Marketplace Modular CRM

Цей репозиторій містить стартовий проєкт модульної CRM для бізнесу з marketplace, сайтом, B2B, роздрібним магазином і 1C як основною обліковою системою.

Архітектура розрахована на бізнес із такими модулями:

- Marketplace
- Сайт
- B2B
- Роздрібний магазин
- 1C як основна облікова система

PostgreSQL використовується як центральний інтеграційний шар. Кожен модуль має власну зону відповідальності, а спільні довідники, залишки, ціни, клієнти та замовлення зберігаються в `core`.

## Стек

- Frontend: React + TypeScript + Vite.
- Backend: NestJS + Node.js + TypeScript.
- Database: PostgreSQL.
- ORM/migrations: Prisma.
- Cache/jobs: Redis.
- Deployment: Docker Compose або окремий PostgreSQL на Ubuntu Server.

## Структура

- `apps/web` - React frontend CRM.
- `apps/api` - NestJS backend API.
- `packages/core` - спільні типи, статуси та бізнес-константи.
- `packages/database` - Prisma schema та database client.
- `packages/integrations` - типи інтеграцій 1C, marketplace, сайту, B2B і retail.
- `modules` - документація й майбутній код бізнес-модулів.
- `docker-compose.yml` - запуск PostgreSQL, Redis, API та Web.
- `.env.example` - приклад змінних середовища.
- `.env.crm-sql.example` - приклад підключення API до окремої робочої SQL-бази на `crm-sql`.
- `db/init` - SQL, який виконується при першому старті контейнера.
- `db/migrations/001_core_schema.sql` - базова схема CRM та інтеграційного обміну.
- `db/migrations/002_one_c_mirror.sql` - сире read-only дзеркало CSV-довідників, залишків і взаєморозрахунків 1C у `one_c_mirror`.
- `db/manual/002_module_roles.sql` - ручне створення окремих користувачів для модулів.
- `db/admin` - адміністративні SQL-скрипти для підготовки PostgreSQL.
- `scripts/ubuntu` - скрипти для Ubuntu VM `crm-sql`.
- `scripts/windows` - скрипти для Windows-хоста `MESER`.
- `docs/deployment.md` - покрокове розгортання через Docker.
- `docs/ubuntu-postgresql-runbook.md` - поточний runbook для VM `CRM-SQL` / Ubuntu `crm-sql`.
- `docs/api-runbook.md` - запуск NestJS API проти робочої бази `crm_hub`.
- `docs/architecture.md` - логіка модулів та обміну даними.
- `docs/integration-exchange.md` - API та фоновий worker автоматизованого обміну.
- `docs/integration-smoke-tests.md` - швидка перевірка імпорту товару, ціни й залишку з 1C.
- `docs/one-c-catalog-export.md` - Windows-експорт read-only довідників 1C у CSV.
- `docs/one-c-mirror-import.md` - імпорт read-only CSV-довідників 1C у схему `one_c_mirror`.
- `docs/one-c-operational-export-import.md` - експорт та імпорт залишків товарів, резервів і взаєморозрахунків 1C.
- `docs/server-environment-check.md` - перевірка Windows Server і план ізоляції CRM SQL від 1C.

## Швидкий старт через Docker

1. Скопіюйте `.env.example` у `.env`.
2. Змініть `POSTGRES_PASSWORD` на сильний пароль.
3. Запустіть інфраструктуру:

```powershell
docker compose up -d
```

4. Перевірте стан:

```powershell
docker compose ps
```

5. Підключення до PostgreSQL з внутрішньої мережі:

```text
host: <IP внутрішнього сервера>
port: 5432
database: crm_hub
user: crm_admin
password: значення з .env
```

6. Веб-інтерфейс після запуску Docker:

```text
http://localhost:8080
```

7. API healthcheck:

```text
http://localhost:3000/health
```

## Окрема робоча SQL-база

Поточний робочий напрям - не база всередині 1C і не локальний Docker-контейнер, а окрема PostgreSQL-база у виділеній VM:

- Windows Server/Hyper-V host: `MESER`, `192.168.0.5`
- Hyper-V VM: `CRM-SQL`
- Ubuntu Server: `crm-sql`, `192.168.0.166`
- Ubuntu user: `crmadmin`
- PostgreSQL database: `crm_hub`
- PostgreSQL user: `crm_admin`

використовуйте runbook:

```text
docs/ubuntu-postgresql-runbook.md
```

Він покриває:

- виправлення пароля PostgreSQL для `crm_admin`;
- перевірку входу через `psql -h 127.0.0.1 -U crm_admin -d crm_hub`;
- завантаження CRM-схеми в PostgreSQL;
- щоденні backups у `/var/backups/crm-postgres`;
- копіювання backups на Windows-хост у `D:\CRM\Backups`.

Для майбутнього підключення API до цієї бази використовуйте шаблон:

```text
.env.crm-sql.example
```

## Локальна розробка

Після встановлення Node.js і npm:

```powershell
npm install
npm run dev:api
npm run dev:web
```

Prisma:

```powershell
npm run prisma:generate
npm run prisma:migrate
```

## Принцип обміну

- 1C залишається головною системою для бухгалтерії, товарів, цін і залишків.
- Сайт, marketplace, B2B і retail передають замовлення та клієнтські події в `integration.inbox_events`.
- Дані, які треба передати назовні, потрапляють у `integration.outbox_events`.
- Таблиця `one_c.exchange_log` фіксує окремий журнал обміну з 1C.
- Схема `one_c_mirror` зберігає сирі read-only CSV-експорти довідників, залишків і взаєморозрахунків 1C для подальшої нормалізації в CRM.
- NestJS API має endpoint-и `/integrations/*` і фоновий worker, який автоматично обробляє pending-події.
- Імпорт із 1C уже підтримує номенклатуру, базові ціни та складські залишки через inbox-події.

## Наступний технічний етап

Після розгортання бази й API потрібно додати сервіси синхронізації:

- нормалізацію довідників з `one_c_mirror` у робочі CRM-таблиці;
- нормалізацію залишків товарів і взаєморозрахунків з `one_c_mirror.latest_operational_rows`;
- експорт замовлень у 1C;
- імпорт статусів оплат, доставок і документів;
- API для сайту, marketplace, B2B і retail.
