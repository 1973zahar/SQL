<<<<<<< HEAD
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
- Deployment: Docker Compose.

## Структура

- `apps/web` - React frontend CRM.
- `apps/api` - NestJS backend API.
- `packages/core` - спільні типи, статуси та бізнес-константи.
- `packages/database` - Prisma schema та database client.
- `packages/integrations` - типи інтеграцій 1C, marketplace, сайту, B2B і retail.
- `modules` - документація й майбутній код бізнес-модулів.
- `docker-compose.yml` - запуск PostgreSQL, Redis, API та Web.
- `.env.example` - приклад змінних середовища.
- `db/init` - SQL, який виконується при першому старті контейнера.
- `db/migrations/001_core_schema.sql` - базова схема CRM та інтеграційного обміну.
- `db/manual/002_module_roles.sql` - ручне створення окремих користувачів для модулів.
- `docs/deployment.md` - покрокове розгортання на сервері.
- `docs/architecture.md` - логіка модулів та обміну даними.
- `docs/integration-exchange.md` - API та фоновий worker автоматизованого обміну.

## Швидкий старт

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
- NestJS API має endpoint-и `/integrations/*` і фоновий worker, який автоматично обробляє pending-події.

## Наступний технічний етап

Після розгортання бази потрібно додати сервіси синхронізації:

- імпорт номенклатури, цін і залишків із 1C;
- експорт замовлень у 1C;
- імпорт статусів оплат, доставок і документів;
- API для сайту, marketplace, B2B і retail.

## Публікація на GitHub

Проєкт потрібно опублікувати в репозиторій:

```text
https://github.com/1973zahar/SQL
```

Команди для першої публікації:

```powershell
git init
git add .
git commit -m "Initial modular CRM project"
git branch -M main
git remote add origin https://github.com/1973zahar/SQL.git
git push -u origin main
```
=======
# SQL
>>>>>>> aa278be0a563158b38ae4c0e3bd9caf7f6b6051f
