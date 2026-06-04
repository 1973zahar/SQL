# Експорт довідників 1C у CSV

Цей runbook продовжує експорт довідників із 1C після точки, де попередній generic VBS зупинився на `ХарактеристикиНоменклатуры`, бо цей довідник не має поля `Код`.

## Безпека

- Скрипт працює через COM-з'єднання 1C і тільки читає довідники.
- Скрипт не змінює 1C production-базу `elista`.
- Реальні логіни й паролі 1C не записувати в Git і не вставляти в документацію.

## Де лежать скрипти

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.vbs
```

PowerShell-скрипт є обгорткою. VBS-скрипт робить фактичний COM-експорт. Обгортка перед запуском створює Unicode-копію `export-1c-catalogs.runtime.vbs`, щоб Windows Script Host на Server 2012 R2 коректно прочитав кириличні назви довідників.

Якщо на `MESER` немає папки `D:\Codex\CRM\SQL`, перенести тільки ці два файли в:

```text
D:\CRM\Exports\export-1c-catalogs.ps1
D:\CRM\Exports\export-1c-catalogs.vbs
```

Після цього запускати `-File 'D:\CRM\Exports\export-1c-catalogs.ps1'`.

## Запуск на MESER

Відкрити PowerShell на Windows-хості `MESER` під користувачем, який має доступ до 1C і встановлений 1C COM connector.

Задати connection string тільки в поточній PowerShell-сесії:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";Usr="<1C_USER>";Pwd="<1C_PASSWORD>";'
```

`<1C_USER>` і `<1C_PASSWORD>` треба замінити на реальні дані доступу 1C. Якщо залишити `USER` або `PASSWORD`, скрипт зупиниться до підключення.

Якщо 1C на `MESER` відкривається без окремого логіна і пароля, можна використовувати короткий варіант:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";'
```

Для іншої 1C-бази можна не міняти скрипт і не переписувати `CRM_1C_CONNECTION_STRING`. PowerShell-обгортка підтримує `-Server` і `-Ref`. Для ФОП Служалий З.М. база:

```text
Srvr="192.168.0.5";Ref="pp_hor";
```

Запуск довідників для цієї бази:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\export-1c-catalogs.ps1' -Set all -OutputDir 'D:\CRM\Exports' -Server '192.168.0.5' -Ref 'pp_hor'
```

Це тільки перезаписує CSV-файли в `D:\CRM\Exports` після успішного експорту. Дані `elista` у PostgreSQL не стираються, якщо Ubuntu-імпорт запускати з правильними `CRM_ENTERPRISE_*`.

Запустити продовження експорту з будь-якої поточної папки однією командою, якщо репозиторій є на `MESER`:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1' -Set next -OutputDir 'D:\CRM\Exports'
```

Якщо скрипти перенесені прямо в `D:\CRM\Exports`, запускати так:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\export-1c-catalogs.ps1' -Set next -OutputDir 'D:\CRM\Exports'
```

Альтернатива, якщо вже виконано `Set-ExecutionPolicy -Scope Process Bypass` у поточному PowerShell:

```powershell
& 'D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1' -Set next -OutputDir 'D:\CRM\Exports'
```

## Набори експорту

`base` - довідники, які вже були успішно вивантажені раніше:

```text
ЕдиницыИзмерения -> 1c_units.csv
Контрагенты -> 1c_counterparties.csv
ДоговорыКонтрагентов -> 1c_counterparty_contracts.csv
НоменклатурныеГруппы -> 1c_product_groups.csv
Организации -> 1c_organizations.csv
Валюты -> 1c_currencies.csv
ТипыЦенНоменклатуры -> 1c_price_types.csv
СерииНоменклатуры -> 1c_product_series.csv
```

`next` - наступні довідники для продовження:

```text
ХарактеристикиНоменклатуры -> 1c_product_characteristics.csv
Склады -> 1c_warehouses.csv
ВидыНоменклатуры -> 1c_product_kinds.csv
КлассификаторЕдиницИзмерения -> 1c_unit_classifier.csv
ПодразделенияОрганизаций -> 1c_organization_units.csv
ФизическиеЛица -> 1c_persons.csv
ВидыКонтактнойИнформации -> 1c_contact_info_types.csv
БанковскиеСчета -> 1c_bank_accounts.csv
```

`future` - необов'язкові довідники, відкладені на майбутнє:

```text
Производители -> 1c_manufacturers.csv
КлассификаторСтранМира -> 1c_countries.csv
```

Вони не входять у `next` і `all`, щоб не блокувати основний експорт робочих довідників.

`all` - `base` і `next` разом.

## Формат CSV

Файли створюються як UTF-16LE CSV, сумісно з попереднім експортом.

Колонки:

```text
row_no;external_ref;code;name;deletion_mark
```

Оновлений exporter також додає read-only колонки папки товару:

```text
is_group;product_group_ref;product_group_code;product_group_name
```

Для `Номенклатура -> 1c_products.csv` `product_group_code` і `product_group_name` беруться з `Родитель` товару в 1C. Для інших довідників ці поля лишаються порожніми. Вони потрібні CRM як окремий атрибут товару для фільтрів, форм і подальшої категоризації.

`external_ref` зараз навмисно порожній: у попередній спробі конвертація повної 1C `Ссылка` була нестабільною. Для первинного дзеркала використовуються `code`, `name` і `row_no`.

Для довідників без `Код`, наприклад `ХарактеристикиНоменклатуры`, колонка `code` також буде порожньою.

## Результати запуску

У папці експорту створюються:

```text
D:\CRM\Exports\*.csv
D:\CRM\Exports\export_1c_catalogs.log
D:\CRM\Exports\export_1c_catalogs_runner.log
D:\CRM\Exports\export_1c_catalogs_summary.csv
D:\CRM\Exports\export-1c-catalogs.runtime.vbs
```

CSV-файл довідника замінюється тільки після успішного виконання запиту. Якщо конкретний довідник впав, тимчасовий `.tmp` файл видаляється, а попередній CSV не перезаписується.

Перевірити summary:

```powershell
Import-Csv 'D:\CRM\Exports\export_1c_catalogs_summary.csv' -Delimiter ';' | Format-Table
```

Якщо частина довідників має статус `failed`, це не означає, що вся операція провалена. У конфігурації 1C можуть бути відсутні окремі довідники або окремі поля.

## Що не робити

- Не запускати `-Set all`, якщо потрібно лише продовжити з місця зупинки. Для цього є `-Set next`.
- Не запускати `-Set future` без окремої потреби: ці довідники відкладені й не входять у поточний обов'язковий імпорт.
- Не змінювати production 1C з цього скрипта.
- Не імпортувати нові CSV у PostgreSQL, поки не перевірено `export_1c_catalogs_summary.csv`.
- Не додавати нові CSV в Ubuntu-імпорт як обов'язкові, якщо вони можуть бути відсутні в конкретній конфігурації 1C.

## Наступний крок після експорту

Після успішного `-Set next`:

1. Перевірити `export_1c_catalogs_summary.csv`.
2. Вирішити, які нові CSV потрібно додати в Ubuntu-імпорт `one_c_mirror`.
3. Оновити `scripts/ubuntu/import-1c-catalogs-http.sh` тільки для підтверджених файлів.
