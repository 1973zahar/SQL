# Імпорт read-only довідників 1C у PostgreSQL

Цей крок продовжує роботу з чату `Виправити PostgreSQL для CRM`: на Windows-хості `MESER` уже були створені CSV-експорти основних довідників 1C, а наступна дія - завантажити їх у окрему схему `one_c_mirror` в базі `crm_hub`.

## Принцип безпеки

- 1C-база `elista` залишається production-джерелом.
- Імпорт нижче тільки читає CSV-файли, які вже експортовані з 1C.
- PostgreSQL отримує сире дзеркало в `one_c_mirror`; цей крок не пише нічого назад у 1C.

## Очікувані CSV-файли

На Windows HTTP-експорті `http://192.168.0.5:8090` мають бути доступні:

- `1c_units.csv`
- `1c_counterparties.csv`
- `1c_counterparty_contracts.csv`
- `1c_product_groups.csv`
- `1c_organizations.csv`
- `1c_currencies.csv`
- `1c_price_types.csv`
- `1c_product_series.csv`
- `1c_product_characteristics.csv`
- `1c_warehouses.csv`
- `1c_product_kinds.csv`
- `1c_unit_classifier.csv`
- `1c_organization_units.csv`
- `1c_persons.csv`
- `1c_contact_info_types.csv`
- `1c_bank_accounts.csv`

Ці файли створювалися VBS-експортом як UTF-16LE CSV. Ubuntu-скрипт автоматично конвертує їх у UTF-8 перед `\copy`.

Свідомо пропущені зараз:

- `1c_manufacturers.csv`
- `1c_countries.csv`

Ці довідники не використовуються в поточній роботі, тому вони не блокують імпорт основного дзеркала.

## Запуск на `CRM-SQL`

Спочатку ці зміни мають бути доступні на VM: або через `git pull` після commit/push у `main`, або через інший контрольований спосіб доставки файлів.

```bash
cd ~/SQL
git pull --ff-only
bash scripts/ubuntu/import-1c-catalogs-http.sh
```

Якщо підключення під `crm_admin` через пароль незручне, можна запустити через локального PostgreSQL-користувача `postgres`:

```bash
cd ~/SQL
git pull --ff-only
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-catalogs-http.sh
```

У sudo-режимі робоча папка за замовчуванням буде `/tmp/crm-imports/1c`, щоб процес `postgres` міг прочитати CSV для `\copy`.

## Що створюється в PostgreSQL

Міграція `db/migrations/002_one_c_mirror.sql` створює:

- `one_c_mirror.import_batches` - журнал запусків імпорту;
- `one_c_mirror.raw_rows` - сирі рядки CSV з `row_no`, `external_ref`, `code`, `name`, `deletion_mark`, `raw_data`;
- `one_c_mirror.latest_rows` - поточний зріз останніх імпортованих рядків за об'єктом і ключем.

Оновлений importer не відкидає додаткові CSV-колонки. Для `1c_products.csv` поля `is_group`, `product_group_ref`, `product_group_code`, `product_group_name` зберігаються в `raw_data`, а `db/migrations/003_one_c_crm_ready_views.sql` виводить їх у:

- `one_c_mirror.crm_products.product_group_code`;
- `one_c_mirror.crm_products.product_group_name`;
- `one_c_mirror.crm_products.product_group_ref`;
- `one_c_mirror.crm_products.is_group`;
- `one_c_mirror.crm_product_folders`.

## Якщо viewer не показує колонки папки товару

Якщо `http://192.168.0.166:8091` відкривається, але у вкладці `Товари` немає колонок `Папка` і `Код папки`, значить systemd-сервіс ще працює зі старим viewer-файлом або SQL view не перестворено. Запустіть на Ubuntu:

```bash
cd ~/SQL
bash scripts/ubuntu/apply-1c-viewer-product-folder-update.sh
```

Успішний результат має показати:

- `viewerBuild: 2026-06-02-product-folder-columns-3`;
- `folder columns ok: True`;
- у `product columns` мають бути `product_group_name` і `product_group_code`;
- у верхній панелі viewer має з'явитися `build: 2026-06-02-product-folder-columns-3`.

Після цього оновіть сторінку браузера через Ctrl+F5.

## Перевірка результату

```bash
psql -h 127.0.0.1 -U crm_admin -d crm_hub -c "
  SELECT object_type, count(*)::int AS rows
  FROM one_c_mirror.latest_rows
  GROUP BY object_type
  ORDER BY object_type;
"

psql -h 127.0.0.1 -U crm_admin -d crm_hub -c "
  SELECT object_type, source_file, row_count, status, completed_at
  FROM one_c_mirror.import_batches
  ORDER BY started_at DESC
  LIMIT 20;
"
```

Очікування: усі основні довідники зі списку вище мають статус `processed`, а `row_count` має відповідати кількості рядків у CSV.

## Наступний крок після імпорту

Після успішного завантаження `one_c_mirror` можна будувати нормалізацію з сирих довідників у робочі таблиці CRM: контрагенти, організації, типи цін, одиниці виміру та групи товарів. Це треба робити окремою міграцією/скриптом, не змінюючи 1C.
