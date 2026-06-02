# Експорт та імпорт залишків і взаєморозрахунків 1C

Цей runbook описує окремий потік даних після довідників: залишки товарів по складах, резерви та взаєморозрахунки з контрагентами. Дані читаються з 1C і завантажуються в PostgreSQL як сире read-only дзеркало для майбутньої CRM.

## Що отримуємо

Після успішного експорту на `MESER` мають з'явитися:

```text
D:\CRM\Exports\1c_stock_balances.csv
D:\CRM\Exports\1c_reserved_stock_balances.csv
D:\CRM\Exports\1c_counterparty_settlements.csv
D:\CRM\Exports\export_1c_operational_summary.csv
D:\CRM\Exports\export_1c_operational.log
D:\CRM\Exports\export_1c_operational_runner.log
```

`1c_reserved_stock_balances.csv` може бути відсутній або `failed`, якщо в цій 1C резерви не ведуться окремим регістром.

## Безпека

- Скрипт тільки читає 1C production-базу `elista`.
- Скрипт не змінює документи, довідники або регістри 1C.
- CSV замінюється тільки після успішного запиту.
- Якщо один набір даних не спрацював, це видно в `export_1c_operational_summary.csv`.
- Пароль 1C не записувати в Git, документацію або чат.

## Файли скриптів

У репозиторії:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.ps1
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.vbs
D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-operational-http.sh
```

На `MESER` потрібно покласти Windows-файли сюди:

```text
D:\CRM\Exports\export-1c-operational-data.ps1
D:\CRM\Exports\export-1c-operational-data.vbs
```

## Крок 1. Запуск на MESER

Відкрити PowerShell на `MESER`.

У поточній PowerShell-сесії задати connection string:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";Usr="<1C_USER>";Pwd="<1C_PASSWORD>";'
```

`<1C_USER>` і `<1C_PASSWORD>` замінити на реальні дані. У чат пароль не надсилати.

Запустити експорт:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\export-1c-operational-data.ps1' -Set all -OutputDir 'D:\CRM\Exports'
```

## Крок 2. Перевірка на MESER

Після завершення відкрити summary:

```powershell
Import-Csv 'D:\CRM\Exports\export_1c_operational_summary.csv' -Delimiter ';' | Format-Table
```

Очікувано:

```text
stock_balances              processed
counterparty_settlements    processed
reserved_stock_balances     processed або failed
```

Якщо `stock_balances` або `counterparty_settlements` мають `failed`, не переходити до Ubuntu-імпорту. Спочатку треба подивитися `error` в summary.

## Крок 3. Імпорт на CRM-SQL

Після доставки оновлених файлів на Ubuntu VM:

```bash
cd ~/SQL
git pull --ff-only
bash scripts/ubuntu/import-1c-operational-http.sh
```

Якщо треба запускати через локального користувача `postgres`:

```bash
cd ~/SQL
git pull --ff-only
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh
```

## Що створюється в PostgreSQL

Міграція `db/migrations/002_one_c_mirror.sql` створює:

- `one_c_mirror.operational_batches` - журнал запусків імпорту;
- `one_c_mirror.operational_rows` - сирі рядки залишків і взаєморозрахунків;
- `one_c_mirror.latest_operational_rows` - останній успішний знімок по кожному набору даних.

## Перевірка в PostgreSQL

```bash
psql -h 127.0.0.1 -U crm_admin -d crm_hub -c "
  SELECT
    dataset_name,
    count(*)::int AS rows,
    COALESCE(sum(quantity), 0)::numeric(18, 3) AS quantity,
    COALESCE(sum(reserved_quantity), 0)::numeric(18, 3) AS reserved_quantity,
    COALESCE(sum(amount), 0)::numeric(18, 2) AS amount
  FROM one_c_mirror.latest_operational_rows
  GROUP BY dataset_name
  ORDER BY dataset_name;
"
```

Журнал останніх імпортів:

```bash
psql -h 127.0.0.1 -U crm_admin -d crm_hub -c "
  SELECT dataset_name, source_file, row_count, status, completed_at
  FROM one_c_mirror.operational_batches
  ORDER BY started_at DESC
  LIMIT 20;
"
```

## Важливо про дебіторку і кредиторку

`1c_counterparty_settlements.csv` зберігає суму як `amount`. На першому етапі не треба автоматично вважати плюс дебіторкою, а мінус кредиторкою. Напрямок боргу треба підтвердити на реальних даних 1C разом із бухгалтерською логікою конкретної конфігурації.

## Що не робити

- Не імпортувати ці CSV у `one_c_mirror.raw_rows`, бо це таблиця для довідників.
- Не записувати залишки напряму в `core.stock_balances` до перевірки відповідності товарів і складів.
- Не редагувати CSV вручну перед першим імпортом.
- Не запускати Ubuntu-імпорт, якщо `export_1c_operational_summary.csv` показує `failed` для `stock_balances` або `counterparty_settlements`.
