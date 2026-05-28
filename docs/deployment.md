# Розгортання PostgreSQL на внутрішньому сервері

## 1. Передумови

На сервері потрібні:

- Docker Engine або Docker Desktop;
- Docker Compose v2;
- доступ адміністратора до сервера;
- відкритий порт `5432` тільки для внутрішньої мережі або конкретних IP модулів.

## 2. Підготовка

Скопіюйте проєкт на сервер, наприклад:

```powershell
C:\crm-hub
```

Створіть файл `.env`:

```powershell
Copy-Item .env.example .env
```

Відредагуйте пароль:

```text
POSTGRES_PASSWORD=very_strong_internal_password
```

## 3. Запуск

```powershell
docker compose up -d
```

Перевірка:

```powershell
docker compose ps
docker logs crm-postgres --tail 50
```

## 4. Перевірка підключення

З сервера:

```powershell
docker exec -it crm-postgres psql -U crm_admin -d crm_hub
```

У `psql`:

```sql
\dn
\dt core.*
\dt integration.*
```

## 5. Доступ із модулів

Кожен модуль має підключатися до PostgreSQL через окремого користувача з обмеженими правами. Поточний пакет створює адміністративного користувача `crm_admin`; робочих користувачів краще додати окремою міграцією після затвердження IP-адрес і прав доступу.

Рекомендовані ролі:

- `crm_1c_sync` - читання/запис у `core`, `one_c`, `integration`.
- `crm_marketplace_sync` - запис подій у `integration.inbox_events`, читання залишків/цін.
- `crm_website_sync` - запис замовлень, читання товарів/залишків/цін.
- `crm_b2b_sync` - B2B-замовлення, клієнти, індивідуальні ціни.
- `crm_retail_sync` - роздрібні продажі, залишки магазинів.

Приклад запуску SQL для створення ролей:

```powershell
docker exec -i crm-postgres psql `
  -U crm_admin `
  -d crm_hub `
  -v crm_1c_sync_password="strong_1c_password" `
  -v crm_marketplace_sync_password="strong_marketplace_password" `
  -v crm_website_sync_password="strong_website_password" `
  -v crm_b2b_sync_password="strong_b2b_password" `
  -v crm_retail_sync_password="strong_retail_password" `
  -f /manual/002_module_roles.sql
```

Якщо файл недоступний усередині контейнера, виконайте з хоста:

```powershell
Get-Content .\db\manual\002_module_roles.sql | docker exec -i crm-postgres psql `
  -U crm_admin `
  -d crm_hub `
  -v crm_1c_sync_password="strong_1c_password" `
  -v crm_marketplace_sync_password="strong_marketplace_password" `
  -v crm_website_sync_password="strong_website_password" `
  -v crm_b2b_sync_password="strong_b2b_password" `
  -v crm_retail_sync_password="strong_retail_password"
```

## 6. Резервне копіювання

Мінімальний щоденний backup:

```powershell
docker exec crm-postgres pg_dump -U crm_admin -d crm_hub -F c -f /tmp/crm_hub.backup
docker cp crm-postgres:/tmp/crm_hub.backup .\backups\crm_hub.backup
```

Для production краще налаштувати автоматичний backup із ротацією та копією поза сервером.

## 7. Безпека

- Не відкривайте PostgreSQL у публічний інтернет.
- Дозвольте порт `5432` тільки з IP-адрес 1C, сайту, marketplace, B2B і retail.
- Пароль у `.env` не зберігайте в публічному репозиторії.
- Для production бажано ввімкнути TLS або VPN між серверами.
