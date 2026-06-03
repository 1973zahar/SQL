# CRM SQL Work Log - 2026-06-01

Цей файл є основним журналом продовження роботи після чату `Виправити PostgreSQL для CRM`.

Його потрібно оновлювати після кожної суттєвої дії: зміни коду, документації, міграцій, запуску перевірок, невдалих спроб, деплою, імпорту або ручної операції на `CRM-SQL`.

## Правило ведення журналу

Після кожної дії дописувати:

- дата і час, якщо він важливий;
- що саме зроблено;
- які файли створено або змінено;
- які команди запускались;
- повний код або релевантні фрагменти коду/команд, які були додані, змінені або виконані;
- результат;
- exit code / статус виконання, якщо він доступний;
- що не спрацювало;
- повний текст помилки або релевантний фрагмент помилки, якщо дія невдала;
- що не повторювати;
- що стало наступним правильним кроком.

Правило діє для успішних і невдалих дій. Якщо дія стосується коду, SQL, PowerShell, Bash, VBS, API-запиту або команди деплою, у журнал треба додавати сам код/команду або точний фрагмент, достатній для повторення чи діагностики.

## Поточна ситуація

Робота продовжена з локального чату:

```text
codex://threads/019e7d35-24da-7351-a4e4-6aef22f5ad3e
```

Локальна сесія знайдена в індексі Codex, а її стан звірений із документами:

```text
D:\Codex\CRM\SQL\docs\crm-sql-1c-status-2026-06-01.docx
D:\Codex\CRM\SQL\docs\Виправити PostgreSQL для CRM.docx
D:\Codex\CRM\SQL\docs\current-status-2026-06-01.md
D:\Codex\CRM\SQL\docs\integration-smoke-tests.md
D:\Codex\CRM\SQL\docs\integration-exchange.md
```

Фактична точка зупинки попередньої роботи:

- PostgreSQL `crm_hub` на VM `CRM-SQL` працює.
- API на `192.168.0.166:3000` працює.
- 1C production-база `elista` на Windows-хості `MESER` не змінюється.
- CSV-довідники з 1C вже були експортовані на Windows стороні.
- Наступний технічний крок - імпортувати ці CSV у сире read-only дзеркало PostgreSQL `one_c_mirror`.

## Середовище

### Windows / Hyper-V host

```text
Host: MESER
IP: 192.168.0.5
1C SQL DB: elista / Elista
Windows HTTP export port: 8090
Windows backup folder: D:\CRM\Backups
```

### Ubuntu VM

```text
VM: CRM-SQL
Hostname: crm-sql
IP: 192.168.0.166
User: crmadmin
PostgreSQL database: crm_hub
PostgreSQL user: crm_admin
PostgreSQL port: 5432
CRM API port: 3000
Repo path on VM: ~/SQL
```

### GitHub

```text
Repo: https://github.com/1973zahar/SQL.git
Branch: main
Local path: D:\Codex\CRM\SQL
```

## Що не робити

- Не писати нічого назад у production-базу 1C `elista` без окремого явного рішення.
- Не використовувати CRM PostgreSQL як заміну повного backup 1C.
- Не змішувати CRM `crm_hub` із базою 1C.
- Не виконувати destructive-команди на Git або файловій системі без окремого підтвердження.
- Не повторювати SMB-шлях для backup/обміну як основний спосіб: TCP 445 з Ubuntu до Windows раніше не проходив.
- Не запускати імпорт через `git pull` на VM, поки локальні зміни не закомічені й не запушені або не доставлені іншим способом.
- Не вважати DOCX-файли кодом репозиторію: це джерела контексту, їх не видаляти й не перезаписувати.

## Негативні спроби та обмеження

### SMB backup / exchange

Спроба використовувати Windows SMB share `CRMBackups` була ненадійною: з Ubuntu до Windows порт 445 не проходив. Робочий тимчасовий шлях - HTTP transfer з Windows-хоста.

### Прямий SSH deploy з цього сеансу

Спроба прямого SSH-доступу до `crmadmin@192.168.0.166` без ключа/пароля раніше завершилась помилкою:

```text
Permission denied (publickey,password)
```

Поки немає SSH-ключа або пароля, деплой із цього сеансу напряму не виконувати.

### Локальна збірка API на Windows

У цьому локальному Windows-сеансі:

- `npm` не знайдено в PATH;
- `node_modules` у `D:\Codex\CRM\SQL` відсутній;
- повна NestJS/Prisma збірка локально не запускалась.

Перевірки API треба виконати на VM після доставки змін.

### Bash через WSL

`bash.exe` з `C:\WINDOWS\system32` запускає WSL, але встановлених Linux-дистрибутивів немає. Для синтаксичної перевірки bash-скрипта використовується Git Bash:

```text
C:\Program Files\Git\bin\bash.exe
```

## Позитивні створення та зміни

### PostgreSQL / schema

Створено міграцію:

```text
D:\Codex\CRM\SQL\db\migrations\002_one_c_mirror.sql
```

Вона створює:

- `one_c_mirror.import_batches`;
- `one_c_mirror.raw_rows`;
- `one_c_mirror.latest_rows`.

Призначення: сире read-only дзеркало CSV-довідників 1C для подальшої нормалізації в CRM.

### Ubuntu import script

Створено:

```text
D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-catalogs-http.sh
```

Скрипт:

- завантажує CSV з `http://192.168.0.5:8090`;
- очікує UTF-16LE CSV з Windows/VBS;
- конвертує CSV у UTF-8;
- застосовує `db/migrations/002_one_c_mirror.sql`;
- імпортує рядки в `one_c_mirror.raw_rows`;
- веде batch-журнал в `one_c_mirror.import_batches`;
- підтримує режим `USE_POSTGRES_SUDO=1`.

Для bash-скриптів додано LF-правило:

```text
D:\Codex\CRM\SQL\.gitattributes
```

### API / integration

Оновлено:

```text
D:\Codex\CRM\SQL\apps\api\src\modules\integrations\integrations.service.ts
D:\Codex\CRM\SQL\apps\api\src\modules\integrations\integrations.processor.ts
D:\Codex\CRM\SQL\apps\api\src\modules\products\products.service.ts
```

Позитивні зміни:

- 1C product events можуть створювати/оновлювати товари.
- 1C price events можуть створювати/оновлювати ціни.
- 1C stock events можуть створювати/оновлювати залишки.
- невідомі inbox-події тепер позначаються `ignored`, а не створюють шум у outbox для 1C;
- `GET /products` повертає `latestPrice`, `latestPriceCurrency`, `latestPriceType`, `totalQuantity`, `availableQuantity`;
- активна ціна не береться з майбутнього `valid_from`.

### Prisma

Оновлено:

```text
D:\Codex\CRM\SQL\packages\database\prisma\schema.prisma
```

Додано моделі:

- `ProductPrice`;
- `Warehouse`;
- `StockBalance`.

### Admin SQL

Оновлено:

```text
D:\Codex\CRM\SQL\db\admin\002_verify_crm_database.sql
D:\Codex\CRM\SQL\db\admin\003_reassign_crm_objects.sql
D:\Codex\CRM\SQL\db\manual\002_module_roles.sql
```

Зміни:

- verify-скрипт бачить `one_c_mirror`;
- owner reassignment включає схему `one_c_mirror` і views;
- `crm_1c_sync` отримує права на `one_c_mirror` і sequences.

### Документація

Створено або оновлено:

```text
D:\Codex\CRM\SQL\docs\current-status-2026-06-01.md
D:\Codex\CRM\SQL\docs\integration-smoke-tests.md
D:\Codex\CRM\SQL\docs\integration-exchange.md
D:\Codex\CRM\SQL\docs\one-c-mirror-import.md
D:\Codex\CRM\SQL\README.md
```

Призначення:

- `current-status-2026-06-01.md` - поточний стан і наступні операційні кроки;
- `integration-smoke-tests.md` - швидкі перевірки після деплою;
- `integration-exchange.md` - опис API-обміну;
- `one-c-mirror-import.md` - runbook імпорту CSV-довідників 1C;
- `README.md` - загальна карта репозиторію.

## CSV, які треба імпортувати з Windows HTTP export

Очікувані файли на:

```text
http://192.168.0.5:8090
```

Список:

```text
1c_units.csv
1c_counterparties.csv
1c_counterparty_contracts.csv
1c_product_groups.csv
1c_organizations.csv
1c_currencies.csv
1c_price_types.csv
1c_product_series.csv
```

CSV створені як UTF-16LE. Не імпортувати їх у PostgreSQL напряму без конвертації.

## Як запускати наступний імпорт на CRM-SQL

Після commit/push або іншої доставки файлів на VM:

```bash
cd ~/SQL
git pull --ff-only
bash scripts/ubuntu/import-1c-catalogs-http.sh
```

Якщо парольний доступ `crm_admin` незручний:

```bash
cd ~/SQL
git pull --ff-only
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-catalogs-http.sh
```

Перевірка:

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
  LIMIT 8;
"
```

## Що брати для архіву

Для архіву поточного стану зберігати:

```text
D:\Codex\CRM\SQL
D:\Codex\CRM\SQL\docs
D:\Codex\CRM\SQL\db
D:\Codex\CRM\SQL\scripts
D:\Codex\CRM\SQL\apps
D:\Codex\CRM\SQL\packages
```

Окремо важливі документи контексту:

```text
D:\Codex\CRM\SQL\docs\crm-sql-1c-status-2026-06-01.docx
D:\Codex\CRM\SQL\docs\Виправити PostgreSQL для CRM.docx
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
D:\Codex\CRM\SQL\docs\current-status-2026-06-01.md
D:\Codex\CRM\SQL\docs\one-c-mirror-import.md
```

На Ubuntu/VM важливо архівувати:

```text
~/SQL
/home/crmadmin/SQL/.env
/var/backups/crm-postgres
```

На Windows-хості важливо архівувати:

```text
D:\CRM\Backups
HTTP-export folder з CSV-файлами 1C, якщо він окремий
```

## Що брати для майбутньої роботи CRM

### Для продовження backend/API

```text
apps/api
packages/database
packages/core
packages/integrations
db/migrations
docs/integration-exchange.md
docs/integration-smoke-tests.md
```

### Для продовження PostgreSQL/1C інтеграції

```text
db/migrations/001_core_schema.sql
db/migrations/002_one_c_mirror.sql
db/admin
db/manual
scripts/ubuntu/import-1c-catalogs-http.sh
docs/one-c-mirror-import.md
docs/current-status-2026-06-01.md
```

### Для відновлення контексту

```text
docs/crm-sql-work-log-2026-06-01.md
docs/current-status-2026-06-01.md
docs/crm-sql-1c-status-2026-06-01.docx
docs/Виправити PostgreSQL для CRM.docx
```

## Журнал дій

### 2026-06-01 - створено цей журнал

Дія:

- створено `docs/crm-sql-work-log-2026-06-01.md`;
- зафіксовано поточну ситуацію;
- зафіксовано негативні спроби й обмеження;
- зафіксовано позитивні створення й зміни;
- зафіксовано, де лежать файли для архіву та майбутньої роботи CRM.

Результат:

- є один основний файл, який потрібно оновлювати після кожної наступної суттєвої дії.

### 2026-06-01 - інвентаризація перед продовженням експорту довідників 1C

Дія:

- перевірено `scripts`, `docs`, `db` на наявність Windows/VBS/PowerShell-скриптів експорту 1C;
- перевірено згадки про вже експортовані CSV-файли та довідники.

Команди:

```powershell
rg --files scripts docs db | rg "1c|one-c|export|import|vbs|ps1|cmd|bat|довід|catalog|Каталог"
rg -n "Характеристики|ЕдиницыИзмерения|Контрагенты|ДоговорыКонтрагентов|НоменклатурныеГруппы|СерииНоменклатуры|ТипыЦен|CreateTextFile|Код|Наименование|ПометкаУдаления|1c_" scripts docs db
```

Результат:

- у репозиторії вже є Ubuntu-імпорт `scripts/ubuntu/import-1c-catalogs-http.sh`;
- Windows backup-скрипти є;
- Windows/VBS-скрипта експорту довідників 1C у репозиторії ще немає;
- список успішно експортованих CSV зафіксований у документах;
- попередня проблема: `ХарактеристикиНоменклатуры` не експортувались загальним шаблоном, бо цей довідник не має поля `Код`.

Що не робити:

- не запускати старий generic-export для всіх довідників без перевірки полів;
- не припускати, що кожен довідник 1C має `Код`;
- не імпортувати нові CSV в Ubuntu-скрипт, поки не буде узгоджено формат колонок.

Наступний правильний крок:

- додати керований Windows export script, який підтримує профілі колонок для довідників із `Код` і без `Код`;
- окремо описати запуск експорту на Windows-хості `MESER`.

### 2026-06-01 - створено Windows-експорт довідників 1C

Дія:

- додано PowerShell-обгортку для запуску експорту;
- додано VBS-скрипт, який підключається до 1C через `V83.COMConnector` або `V82.COMConnector`;
- додано runbook для запуску на Windows-хості `MESER`.

Створені файли:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.vbs
D:\Codex\CRM\SQL\docs\one-c-catalog-export.md
```

Позитивне створення:

- `-Set base` експортує вже відомі базові довідники;
- `-Set next` експортує наступні довідники після точки зупинки;
- `-Set all` експортує обидва набори;
- `ХарактеристикиНоменклатуры` експортуються в режимі `no_code`, тобто без вимоги поля `Код`;
- CSV створюються як UTF-16LE, сумісно з попереднім VBS-експортом;
- створюється summary-файл `export_1c_catalogs_summary.csv`;
- реальний 1C connection string береться із `CRM_1C_CONNECTION_STRING`, щоб не записувати пароль у Git.

Наступні CSV у наборі `next`:

```text
1c_product_characteristics.csv
1c_warehouses.csv
1c_product_kinds.csv
1c_manufacturers.csv
1c_countries.csv
1c_unit_classifier.csv
1c_organization_units.csv
1c_persons.csv
1c_contact_info_types.csv
1c_bank_accounts.csv
```

Що не робити:

- не запускати `-Set all`, якщо треба тільки продовжити після попередньої зупинки;
- не зберігати реальний пароль 1C у файлах репозиторію;
- не додавати нові CSV в Ubuntu-імпорт як обов'язкові, поки не перевірено summary після експорту;
- не вважати failed-рядки в summary катастрофою: у конкретній конфігурації 1C деякі довідники можуть бути відсутні.

Наступний правильний крок:

- перевірити синтаксис PowerShell і VBS локально;
- після цього запускати на `MESER` з реальним `CRM_1C_CONNECTION_STRING`.

### 2026-06-01 - перевірено новий Windows-експорт довідників

Дія:

- підсилено VBS-скрипт: рекурсивне створення папок і чіткіша помилка, якщо не створюється 1C COM connector;
- додано посилання на export-runbook у `README.md`;
- оновлено `docs/current-status-2026-06-01.md`;
- виконано доступні локальні перевірки без підключення до 1C.

Змінені файли:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.vbs
D:\Codex\CRM\SQL\README.md
D:\Codex\CRM\SQL\docs\current-status-2026-06-01.md
```

Команди перевірки:

```powershell
$tokens = $null; $errors = $null; [System.Management.Automation.Language.Parser]::ParseFile('D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1', [ref]$tokens, [ref]$errors)
cscript.exe //nologo scripts\windows\export-1c-catalogs.vbs /help
git diff --check
```

Результат:

- PowerShell syntax OK;
- VBS help запускається;
- `git diff --check` без whitespace-помилок;
- фактичний експорт із 1C локально не запускався, бо потрібен `MESER`, встановлений 1C COM connector і реальний connection string.

Команда для запуску на `MESER`:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";Usr="USER";Pwd="PASSWORD";'
Set-ExecutionPolicy -Scope Process Bypass
cd D:\Codex\CRM\SQL
.\scripts\windows\export-1c-catalogs.ps1 -Set next -OutputDir D:\CRM\1CExports
```

Що не робити:

- не вставляти реальні `USER`/`PASSWORD` у файли;
- не запускати `-Set all`, доки не потрібен повний повторний експорт;
- не додавати нові CSV у Ubuntu import script, доки не буде видно `processed` у `D:\CRM\1CExports\export_1c_catalogs_summary.csv`.

Наступний правильний крок:

- запустити `-Set next` на `MESER`;
- показати або передати сюди `export_1c_catalogs_summary.csv`;
- після цього вирішити, які нові CSV додати до імпорту в `one_c_mirror`.

### 2026-06-01 - реакція на скріншот AnyDesk з MESER

Спостереження зі скріншота:

- старий експорт успішно створив базові CSV у `D:\CRM\Exports`;
- старий експорт впав на `ХарактеристикиНоменклатуры`, бо поле `Код` відсутнє;
- після спроби запуску нового сценарію файл `D:\CRM\Exports\export_1c_catalogs_summary.csv` не був знайдений;
- у команді connection string були залишені placeholder-и `USER` і `PASSWORD`;
- prompt залишався в `D:\CRM\Exports`, тому безпечніше запускати новий скрипт повним шляхом, без залежності від `cd`.

Дія:

- стандартну папку експорту змінено на `D:\CRM\Exports`;
- PowerShell-обгортка тепер зупиняється, якщо в connection string залишено `USER` або `PASSWORD`;
- PowerShell-обгортка друкує `OutputDir` і шлях до summary перед запуском;
- PowerShell-обгортка створює `export_1c_catalogs_runner.log`;
- документацію оновлено на запуск повним шляхом.

Змінені файли:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.vbs
D:\Codex\CRM\SQL\docs\one-c-catalog-export.md
D:\Codex\CRM\SQL\docs\current-status-2026-06-01.md
```

Оновлена команда для `MESER`:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";Usr="<1C_USER>";Pwd="<1C_PASSWORD>";'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1' -Set next -OutputDir 'D:\CRM\Exports'
```

Після запуску:

```powershell
Import-Csv 'D:\CRM\Exports\export_1c_catalogs_summary.csv' -Delimiter ';' | Format-Table
```

Що не робити:

- не запускати з placeholder `USER`/`PASSWORD`;
- не покладатися на `cd`, якщо prompt не змінився;
- не шукати summary в `D:\CRM\1CExports`, бо робоча папка на MESER зараз `D:\CRM\Exports`.

### 2026-06-01 - перевірено блокування placeholder credentials і уточнено запуск

Дія:

- локально перевірено PowerShell parse;
- локально перевірено VBS `/help`;
- локально перевірено, що wrapper блокує connection string із `USER`/`PASSWORD`;
- runbook змінено на однорядковий запуск через `powershell.exe -NoProfile -ExecutionPolicy Bypass -File`.

Команди перевірки:

```powershell
[System.Management.Automation.Language.Parser]::ParseFile('D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1', [ref]$tokens, [ref]$errors)
cscript.exe //nologo scripts\windows\export-1c-catalogs.vbs /help
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\export-1c-catalogs.ps1 -Set next -OutputDir 'D:\CRM\Exports'
git diff --check
```

Результат:

- PowerShell syntax OK;
- VBS help показує `D:\CRM\Exports`;
- placeholder `USER/PASSWORD` зупиняється до підключення до 1C;
- `git diff --check` без whitespace-помилок.

Що не робити:

- не використовувати стару команду з `cd`, якщо можна запустити `-File` повним шляхом;
- не трактувати помилку про placeholder як помилку 1C: це локальна перевірка безпеки wrapper-а.

### 2026-06-01 - скріншот показав, що скрипт не доставлений на MESER

Спостереження зі скріншота:

- команда `powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1' ...` падає;
- помилка: файл для параметра `-File` не існує;
- це означає, що на віддаленому 1C SQL server немає локального шляху `D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1`;
- наші файли створені в локальному робочому репозиторії, але ще не перенесені на `MESER`.

Дія:

- оновлено `docs/one-c-catalog-export.md`;
- додано сценарій, коли на `MESER` немає `D:\Codex\CRM\SQL`;
- рекомендований шлях для швидкого запуску на сервері: скопіювати два файли прямо в `D:\CRM\Exports`.

Файли, які треба доставити на MESER:

```text
export-1c-catalogs.ps1
export-1c-catalogs.vbs
```

Куди покласти на MESER:

```text
D:\CRM\Exports\export-1c-catalogs.ps1
D:\CRM\Exports\export-1c-catalogs.vbs
```

Команда після доставки:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";Usr="<1C_USER>";Pwd="<1C_PASSWORD>";'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\export-1c-catalogs.ps1' -Set next -OutputDir 'D:\CRM\Exports'
```

Що не робити:

- не запускати `-File D:\Codex\CRM\SQL\...`, якщо цієї папки немає на `MESER`;
- не створювати summary вручну;
- не вважати відсутність summary помилкою 1C, якщо сам exporter ще не був запущений.

### 2026-06-01 - створено zip для перенесення exporter-а на MESER

Дія:

- створено маленький zip-пакет тільки з файлами, потрібними для Windows-side експорту 1C;
- пакет можна перенести на `MESER` через AnyDesk file transfer або інший безпечний спосіб.

Створений файл:

```text
D:\Codex\CRM\SQL\dist\1c-catalog-exporter-2026-06-01.zip
```

Вміст:

```text
scripts\windows\export-1c-catalogs.ps1
scripts\windows\export-1c-catalogs.vbs
docs\one-c-catalog-export.md
```

Як використовувати на `MESER`:

- розпакувати zip;
- скопіювати `export-1c-catalogs.ps1` і `export-1c-catalogs.vbs` у `D:\CRM\Exports`;
- запустити exporter з реальним `CRM_1C_CONNECTION_STRING`.

Що не робити:

- не розпаковувати zip як заміну всього репозиторію;
- не переносити DOCX або інші робочі файли на production-сервер без потреби.

### 2026-06-01 - перевірено zip і прибрано тимчасову папку перевірки

Дія:

- zip `dist\1c-catalog-exporter-2026-06-01.zip` розпаковано в тимчасову папку для перевірки вмісту;
- підтверджено, що всередині є `export-1c-catalogs.ps1`, `export-1c-catalogs.vbs`, `one-c-catalog-export.md`;
- тимчасову папку `dist\_check_1c_exporter` видалено після перевірки.

Результат:

- залишився тільки zip-пакет для перенесення на `MESER`.

Що не робити:

- не переносити тимчасову `_check_` папку;
- переносити саме `dist\1c-catalog-exporter-2026-06-01.zip` або два скрипти з `scripts\windows`.

### 2026-06-01 - створено діагностику стану експорту на MESER

Дія:

- створено PowerShell-скрипт для перевірки стану `MESER`;
- створено документацію з повною і короткою командами перевірки;
- діагностика перевіряє файли, CSV, logs, summary, connection string, 1C COM connector і blockers.

Створені файли:

```text
D:\Codex\CRM\SQL\scripts\windows\check-meser-1c-export-state.ps1
D:\Codex\CRM\SQL\docs\meser-1c-export-diagnostics.md
```

Що перевіряє `check-meser-1c-export-state.ps1`:

- `D:\CRM`;
- `D:\CRM\Exports`;
- `D:\Codex\CRM\SQL`;
- наявність `export-1c-catalogs.ps1`;
- наявність `export-1c-catalogs.vbs`;
- базові CSV, які вже мають бути;
- наступні CSV, які ще треба експортувати;
- `export_1c_catalogs_summary.csv`;
- `export_1c_catalogs.log`;
- `export_1c_catalogs_runner.log`;
- `CRM_1C_CONNECTION_STRING` без друку пароля;
- `V83.COMConnector` і `V82.COMConnector`;
- порт `8090`;
- список очевидних blockers.

Команда для запуску на `MESER`, якщо checker уже є в `D:\CRM\Exports`:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\check-meser-1c-export-state.ps1' -ExportDir 'D:\CRM\Exports' -RepoDir 'D:\Codex\CRM\SQL'
```

Результат:

```text
D:\CRM\Exports\meser_1c_export_state.txt
```

Що не робити:

- не друкувати реальний connection string у чат або файли;
- не продовжувати експорт, якщо blockers показують відсутність exporter-файлів або placeholder credentials.

### 2026-06-01 - оновлено zip exporter-а з діагностикою MESER

Дія:

- оновлено `dist\1c-catalog-exporter-2026-06-01.zip`;
- додано в zip діагностичний checker і документацію до нього.

Поточний zip:

```text
D:\Codex\CRM\SQL\dist\1c-catalog-exporter-2026-06-01.zip
```

Вміст після оновлення:

```text
export-1c-catalogs.ps1
export-1c-catalogs.vbs
check-meser-1c-export-state.ps1
one-c-catalog-export.md
meser-1c-export-diagnostics.md
```

Рекомендований порядок на `MESER`:

1. Перенести zip.
2. Розпакувати.
3. Скопіювати `*.ps1` і `*.vbs` у `D:\CRM\Exports`.
4. Запустити checker.
5. Якщо blockers немає, запускати exporter.

### 2026-06-01 - checker зроблено read-oriented і додано fallback report path

Дія:

- локальний тест показав, що checker намагався створити `D:\CRM\Exports`, якщо папки немає;
- це виправлено: checker більше не створює export-папку як частину перевірки;
- якщо звіт не можна записати в `D:\CRM\Exports`, він пишеться у `%TEMP%\meser_1c_export_state.txt`;
- оновлено документацію.

Змінені файли:

```text
D:\Codex\CRM\SQL\scripts\windows\check-meser-1c-export-state.ps1
D:\Codex\CRM\SQL\docs\meser-1c-export-diagnostics.md
```

Що не робити:

- не використовувати checker як інструмент створення папок або виправлення стану;
- checker має показати blockers, а не приховувати їх автоматичним ремонтом.

### 2026-06-01 - checker завершується успішно після формування звіту

Дія:

- локальний запуск checker-а сформував звіт, але PowerShell повернув exit code `1`, бо середовище мало очікувані діагностичні помилки;
- додано явне `exit 0` після запису звіту.

Результат:

- blockers у звіті залишаються видимими;
- сам checker не виглядає як failed-команда, якщо він успішно створив звіт.

Що не робити:

- не трактувати наявність blockers у звіті як падіння checker-а;
- exporter запускати тільки після усунення blockers.

### 2026-06-01 - прибрано локальні тимчасові файли тесту checker-а

Дія:

- видалено локальний тестовий звіт `dist\local_meser_check_test.txt`;
- видалено локальну тимчасову папку `dist\_check_1c_exporter`;
- залишено актуальний zip `dist\1c-catalog-exporter-2026-06-01.zip`.

Результат:

- у `dist` лишився тільки переносний zip-пакет.

### 2026-06-01 - коротку ручну команду діагностики зроблено read-only

Дія:

- у `docs/meser-1c-export-diagnostics.md` прибрано створення `D:\CRM\Exports` з короткої ручної команди;
- тепер quick-check пише звіт у `D:\CRM\Exports`, якщо папка існує, або в `%TEMP%`, якщо її немає.

Що не робити:

- не створювати export-папку під час діагностики, якщо задача тільки перевірити стан;
- не змішувати quick-check з exporter-запуском.

### 2026-06-01 - отримано звіт MESER 1C export state від користувача

Джерело:

```text
C:\Users\User\.codex\attachments\076248bf-9efe-48ed-a74d-f76152f7717d\pasted-text.txt
```

Стан за звітом:

- `ComputerName`: `MESER`;
- користувач: `FRESH\zahar`;
- поточна папка: `D:\CRM\Exports`;
- `D:\CRM` існує;
- `D:\CRM\Exports` існує;
- `D:\Codex\CRM\SQL` на `MESER` не існує;
- PowerShell version: `4.0`;
- `cscript.exe` існує;
- `V83.COMConnector` працює;
- `V82.COMConnector` не зареєстрований, але це не blocker, бо `V83` працює;
- `CRM_1C_CONNECTION_STRING` заданий, але має placeholders;
- `export-1c-catalogs.ps1` відсутній у `D:\CRM\Exports`;
- `export-1c-catalogs.vbs` відсутній у `D:\CRM\Exports`;
- базові CSV уже є;
- `1c_warehouses.csv` уже є;
- summary/log нового exporter-а ще немає;
- HTTP port `8090` слухає.

Blockers зі звіту:

```text
Missing D:\CRM\Exports\export-1c-catalogs.ps1
Missing D:\CRM\Exports\export-1c-catalogs.vbs
CRM_1C_CONNECTION_STRING is missing or still has placeholders
```

Висновок:

- 1C COM connector встановлений і доступний;
- головна проблема зараз не в 1C, а в тому, що exporter-файли ще не лежать у `D:\CRM\Exports`;
- другу проблему треба виправити після копіювання файлів: замінити `<1C_USER>` і `<1C_PASSWORD>` на реальні дані.

Наступний правильний крок:

- спочатку скопіювати `export-1c-catalogs.ps1` і `export-1c-catalogs.vbs` у `D:\CRM\Exports`;
- після цього повторити checker або вручну перевірити `Test-Path`;
- тільки потім ставити реальний connection string і запускати exporter.

Що не робити:

- не запускати exporter, поки цих двох файлів немає в `D:\CRM\Exports`;
- не міняти/видаляти вже створені CSV;
- не показувати реальний пароль 1C у чаті.

### 2026-06-01 - користувач показав пошук у 1c_metadata.csv на MESER

Скріншот показує:

- PowerShell відкритий на віддаленому сервері `192.168.0.5`;
- виконується пошук у `D:\CRM\Exports\1c_metadata.csv`;
- файл `1c_metadata.csv` існує і містить метадані 1C;
- у metadata видно потрібні об'єкти, зокрема `ВидыНоменклатуры`, `КлассификаторЕдиницИзмерения`, `Номенклатура`, `НоменклатурныеГруппы`, `СерииНоменклатуры`, `Склады`, `ХарактеристикиНоменклатуры`, регістри цін і залишків.

Висновок:

- metadata-файл є корисним джерелом для вибору наступних довідників;
- перед запуском нового exporter-а все одно треба підтвердити два речі: exporter-файли лежать у `D:\CRM\Exports`, а `CRM_1C_CONNECTION_STRING` не містить placeholders.

Наступний правильний крок:

- виконати коротку команду перевірки `Test-Path` і placeholder-check;
- якщо відповідь буде `OK`, запускати exporter `-Set next`.

Що не робити:

- не запускати ручні запити по всіх об'єктах metadata без плану;
- не змінювати `1c_metadata.csv`;
- не показувати connection string з паролем.

### 2026-06-01 - користувач підтвердив готовність до запуску exporter-а

Стан:

- користувач виконав перевірку готовності;
- результат: `2 OK`;
- це означає:
  - `D:\CRM\Exports\export-1c-catalogs.ps1` існує;
  - `D:\CRM\Exports\export-1c-catalogs.vbs` існує;
  - `CRM_1C_CONNECTION_STRING` заданий без placeholders.

Закриті blockers:

```text
Missing D:\CRM\Exports\export-1c-catalogs.ps1
Missing D:\CRM\Exports\export-1c-catalogs.vbs
CRM_1C_CONNECTION_STRING is missing or still has placeholders
```

Наступний правильний крок:

- запускати read-only exporter з набором `-Set next`;
- після запуску не робити наступних дій, доки не буде перевірено `export_1c_catalogs_summary.csv`.

Що не робити:

- не запускати `-Set all`;
- не видаляти старі CSV;
- не запускати Ubuntu import до перевірки summary.

### 2026-06-01 - користувач запустив exporter `-Set next`

Стан:

- користувач повідомив: "експорт завершився";
- exporter `D:\CRM\Exports\export-1c-catalogs.ps1` був запущений з параметром `-Set next`;
- це означає, що наступним кроком треба перевірити summary-файл, а не одразу імпортувати CSV у PostgreSQL.

Очікуваний summary:

```text
D:\CRM\Exports\export_1c_catalogs_summary.csv
```

Наступний правильний крок:

- відкрити/вивести `export_1c_catalogs_summary.csv`;
- подивитися, які довідники мають `processed`, а які `failed`;
- після цього вирішити, які нові CSV додавати в Ubuntu import.

Що не робити:

- не запускати exporter повторно до перегляду summary;
- не запускати імпорт у `one_c_mirror` до аналізу summary;
- не видаляти CSV, навіть якщо частина довідників має `failed`.

### 2026-06-01 - summary після exporter `-Set next`: всі next довідники failed

Скріншот summary показав:

- exporter запустився;
- `export_1c_catalogs_summary.csv` створений;
- усі довідники набору `next` мають `status = failed`;
- `rows = 0`;
- помилка: `Type is not defined`;
- назви довідників у консолі виглядали пошкодженими, не кирилицею.

Висновок:

- це не схоже на проблему прав доступу до 1C;
- `V83.COMConnector` раніше був `OK`;
- причина найімовірніше у кодуванні VBS: Windows Script Host на Server 2012 R2 прочитав UTF-8 VBS як ANSI і зіпсував кириличні назви типів 1C;
- через це 1C отримала не `Справочник.ХарактеристикиНоменклатуры`, а пошкоджений рядок, і повернула `Type is not defined`.

Негативний наслідок старої версії exporter-а:

- стара версія відкривала цільовий CSV одразу;
- якщо запит падав, файл міг залишитись перезаписаним тільки з header-рядком;
- це могло зачепити `1c_warehouses.csv`, бо він був у `-Set next`.

Дія:

- PowerShell wrapper тепер створює runtime-копію VBS у UTF-16LE:

```text
D:\CRM\Exports\export-1c-catalogs.runtime.vbs
```

- `cscript.exe` запускає саме цю Unicode runtime-копію;
- VBS exporter тепер пише спочатку у `.tmp`;
- основний CSV замінюється тільки після успішного завершення запиту;
- якщо довідник падає, `.tmp` видаляється, старий CSV не перезаписується.

Змінені файли:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.vbs
D:\Codex\CRM\SQL\docs\one-c-catalog-export.md
```

Що не робити:

- не запускати стару версію exporter-а повторно;
- не запускати імпорт у PostgreSQL по failed CSV;
- не видаляти summary, він потрібен як доказ негативної спроби.

Наступний правильний крок:

- оновити zip;
- перенести оновлені `export-1c-catalogs.ps1` і `export-1c-catalogs.vbs` на `MESER`;
- замінити ними старі файли в `D:\CRM\Exports`;
- повторити `-Set next`.

### 2026-06-01 - оновлено zip після виправлення кодування VBS

Дія:

- перевірено синтаксис `export-1c-catalogs.ps1`;
- перевірено `cscript //nologo export-1c-catalogs.vbs /help`;
- оновлено zip `dist\1c-catalog-exporter-2026-06-01.zip`;
- `git diff --check` без whitespace-помилок.

Оновлений файл для перенесення:

```text
D:\Codex\CRM\SQL\dist\1c-catalog-exporter-2026-06-01.zip
```

Що змінилось у пакеті:

- `export-1c-catalogs.ps1` тепер створює Unicode runtime VBS;
- `export-1c-catalogs.vbs` тепер не перезаписує CSV при failed-запиті.

Наступний правильний крок на `MESER`:

- замінити старі `export-1c-catalogs.ps1` і `export-1c-catalogs.vbs` у `D:\CRM\Exports`;
- повторити запуск `-Set next`.

### 2026-06-01 - користувач замінив exporter-файли на MESER

Стан:

- користувач повідомив: "замінив";
- це означає, що оновлені `export-1c-catalogs.ps1` і `export-1c-catalogs.vbs` уже лежать у `D:\CRM\Exports`;
- версія має виправлення Unicode runtime VBS і безпечний `.tmp` запис CSV.

Наступний правильний крок:

- повторити запуск `-Set next`;
- після запуску знову перевірити `export_1c_catalogs_summary.csv`.

Що не робити:

- не запускати `-Set all`;
- не імпортувати CSV у PostgreSQL до нового summary.

### 2026-06-01 - повторний exporter `-Set next` після Unicode fix успішний частково

Скріншот після повторного запуску показав:

- wrapper створив `D:\CRM\Exports\export-1c-catalogs.runtime.vbs`;
- кириличні назви довідників тепер читаються правильно;
- більшість довідників `next` експортувались зі статусом `processed`;
- `export_1c_catalogs_summary.csv` створений.

Успішно processed за скріншотом:

```text
1c_product_characteristics.csv
1c_warehouses.csv
1c_product_kinds.csv
1c_unit_classifier.csv
1c_organization_units.csv
1c_persons.csv
1c_contact_info_types.csv
1c_bank_accounts.csv
```

Failed за скріншотом:

```text
1c_manufacturers.csv
1c_countries.csv
```

Ймовірна причина failed:

- це вже не проблема кодування;
- найімовірніше, у конфігурації 1C ці довідники називаються інакше або відсутні;
- для країн у metadata раніше було видно `КлассификаторСтранМира`, а не `СтраныМира`.

Наступний правильний крок:

- не запускати exporter повторно;
- зберегти summary як джерело правди;
- окремо знайти в `1c_metadata.csv` правильні metadata-назви для failed об'єктів `manufacturers` і `countries`;
- після цього або виправити назви в exporter, або виключити ці failed CSV з обов'язкового імпорту.

Що не робити:

- не імпортувати failed CSV у PostgreSQL;
- не видаляти summary;
- не запускати `-Set all`;
- не перезаписувати вже успішні CSV без потреби.

### 2026-06-01 - прийнято рішення пропустити два failed довідники

Рішення користувача:

- зосередитись на основних довідниках, у яких є корисна інформація;
- не витрачати час на `manufacturers` і `countries`, бо користувач ними не користується.

Не імпортуємо зараз:

```text
1c_manufacturers.csv
1c_countries.csv
```

Імпортуємо як корисні успішні next CSV:

```text
1c_product_characteristics.csv
1c_warehouses.csv
1c_product_kinds.csv
1c_unit_classifier.csv
1c_organization_units.csv
1c_persons.csv
1c_contact_info_types.csv
1c_bank_accounts.csv
```

Наступний правильний крок:

- оновити Ubuntu import script, щоб він завантажував ці processed CSV у `one_c_mirror`;
- не включати failed CSV у обов'язковий імпорт.

Що не робити:

- не блокувати проєкт через довідники, які не використовуються;
- не додавати `1c_manufacturers.csv` і `1c_countries.csv` в основний import list.

### 2026-06-01 - metadata підтвердила альтернативну назву countries, але пропускаємо

Скріншот показав пошук у `1c_metadata.csv` за `Производ|Стран|Изготов|Бренд|Торгов`.

Висновок:

- для країн у metadata є `КлассификаторСтранМира`, тобто exporter-ім'я `СтраныМира` було неправильним;
- для виробників/брендів можливі інші назви або відсутність потрібного довідника;
- за рішенням користувача ці два напрямки зараз не потрібні.

Рішення:

- не виправляти `countries` зараз;
- не шукати виробників/бренди далі;
- переходити до імпорту основних processed CSV у `one_c_mirror`.

### 2026-06-01 - перевірено оновлений Ubuntu import script

Дія:

- перевірено bash-синтаксис `scripts/ubuntu/import-1c-catalogs-http.sh`;
- перевірено `git diff --check`;
- перевірено, що документація містить `LIMIT 20` і згадку про свідомо пропущені `manufacturers`/`countries`.

Команди:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/import-1c-catalogs-http.sh
git diff --check
rg -n "product_characteristics|manufacturers|countries|LIMIT 20|intentionally skipped|свідомо пропущ" scripts docs
```

Результат:

- bash-синтаксис OK;
- `git diff --check` без whitespace-помилок;
- імпорт готовий для основних processed CSV.

Наступний правильний крок:

- доставити оновлені файли репозиторію на `CRM-SQL`;
- запустити імпорт у `one_c_mirror`.

Що не робити:

- не запускати імпорт зі старою версією `import-1c-catalogs-http.sh`, бо вона не містить нові processed CSV;
- не додавати failed CSV вручну.

### 2026-06-01 - Ubuntu import list оновлено під основні processed довідники

Дія:

- оновлено `scripts/ubuntu/import-1c-catalogs-http.sh`;
- до списку імпорту додано тільки успішні processed CSV з другого експорту;
- failed CSV `manufacturers` і `countries` не додані.

Додано в import list:

```text
ХарактеристикиНоменклатуры|product_characteristics|1c_product_characteristics.csv
Склады|warehouses|1c_warehouses.csv
ВидыНоменклатуры|product_kinds|1c_product_kinds.csv
КлассификаторЕдиницИзмерения|unit_classifier|1c_unit_classifier.csv
ПодразделенияОрганизаций|organization_units|1c_organization_units.csv
ФизическиеЛица|persons|1c_persons.csv
ВидыКонтактнойИнформации|contact_info_types|1c_contact_info_types.csv
БанковскиеСчета|bank_accounts|1c_bank_accounts.csv
```

Змінений файл:

```text
D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-catalogs-http.sh
```

Наступний правильний крок:

- оновити документацію, щоб на Ubuntu імпортували тільки підтверджені файли.

### 2026-06-01 - документацію імпорту оновлено під основні довідники

Дія:

- оновлено `docs/one-c-mirror-import.md`;
- оновлено `docs/integration-smoke-tests.md`;
- оновлено `docs/integration-exchange.md`;
- оновлено `docs/current-status-2026-06-01.md`.

Зміни:

- список expected CSV тепер включає базові довідники і processed next-довідники;
- `manufacturers` і `countries` позначені як свідомо пропущені;
- перевірка `import_batches` тепер показує `LIMIT 20`, а не `LIMIT 8`.

Наступний правильний крок:

- перевірити bash-синтаксис Ubuntu import script;
- після цього можна переходити до доставки змін на `CRM-SQL` і запуску імпорту в `one_c_mirror`.

### 2026-06-01 - користувач підтвердив наявність exporter-файлів на MESER

Стан:

- користувач повідомив: "є";
- це означає, що `export-1c-catalogs.ps1` і `export-1c-catalogs.vbs` уже скопійовані в `D:\CRM\Exports`.

Закритий blocker:

```text
Missing D:\CRM\Exports\export-1c-catalogs.ps1
Missing D:\CRM\Exports\export-1c-catalogs.vbs
```

Залишився blocker:

```text
CRM_1C_CONNECTION_STRING is missing or still has placeholders
```

Наступний правильний крок:

- виставити `CRM_1C_CONNECTION_STRING` з реальним логіном і паролем 1C тільки в поточній PowerShell-сесії;
- не показувати пароль у чаті;
- перевірити стан без друку пароля.

### 2026-06-01 - користувач переніс і запустив перевірку на MESER

Стан:

- користувач повідомив: "завантажив запустив";
- припускаємо, що zip або checker вже перенесено на `MESER` і команду діагностики виконано;
- наступна дія має бути повільною і безпечного типу: прочитати звіт, а не запускати новий експорт навмання.

Наступний правильний крок для користувача:

1. Відкрити звіт:

```powershell
notepad 'D:\CRM\Exports\meser_1c_export_state.txt'
```

2. Якщо файл не відкрився, спробувати fallback:

```powershell
notepad "$env:TEMP\meser_1c_export_state.txt"
```

3. Знайти секцію:

```text
==== BLOCKERS ====
```

4. Передати сюди рядки з `BLOCKERS`, а також секції `CONNECTION STRING`, `1C COM CONNECTOR`, `EXPORTER FILES IN EXPORT DIR`.

Що не робити:

- не присилати реальний пароль 1C;
- не запускати exporter, поки не подивимось blockers;
- не видаляти старі CSV у `D:\CRM\Exports`.

### 2026-06-01 - прибрано ризик конвертації 1C Ссылка в новому VBS

Дія:

- змінено VBS-запит так, щоб `ExternalRef` експортувався як порожній рядок;
- оновлено runbook з поясненням, що `external_ref` зараз навмисно порожній.

Причина:

- у попередній роботі конвертація повної 1C `Ссылка` була нестабільною;
- нам зараз потрібен надійний read-only CSV-експорт довідників, а не повна нормалізація 1C reference;
- для первинного дзеркала достатньо `row_no`, `code`, `name`, `deletion_mark`, а для довідників без `Код` - `row_no`, `name`, `deletion_mark`.

Змінені файли:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.vbs
D:\Codex\CRM\SQL\docs\one-c-catalog-export.md
```

Що не робити:

- не повертати `Элемент.Ссылка КАК ExternalRef` без окремого тесту на `MESER`;
- не блокувати експорт довідників через відсутність 1C reference на цьому етапі.

### 2026-06-01 - уточнено ціль: потрібні не тільки довідники, а робочі залишки і взаєморозрахунки

Нове уточнення користувача:

- потрібно синхронізувати всі робочі довідники у SQL для майбутньої CRM;
- окремо потрібні всі взаєморозрахунки, дебіторка, кредиторка;
- окремо потрібні залишки товарів по складах.

Технічний висновок:

- довідники 1C і операційні залишки не можна змішувати в один формат CSV;
- поточне `one_c_mirror.raw_rows` підходить для довідників `code/name`;
- для залишків і взаєморозрахунків потрібне окреме сире SQL-дзеркало з полями `quantity`, `reserved_quantity`, `amount`, `warehouse`, `counterparty`, `contract`, `organization`, `currency`;
- напрямок має бути read-only: 1C залишається джерелом, PostgreSQL тільки приймає знімок даних.

Що перевірено:

```text
D:\Codex\CRM\SQL\db\migrations\001_core_schema.sql
D:\Codex\CRM\SQL\db\migrations\002_one_c_mirror.sql
D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-catalogs-http.sh
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.vbs
D:\Codex\CRM\SQL\apps\api\src\modules\integrations\integrations.service.ts
D:\Codex\CRM\SQL\packages\database\prisma\schema.prisma
```

Поточний стан:

- у core-схемі вже є `core.warehouses` і `core.stock_balances`;
- для дебіторки/кредиторки окремої CRM-таблиці ще немає;
- правильний наступний крок - спочатку зберегти сирий знімок 1C у `one_c_mirror`, а нормалізацію в CRM-таблиці робити після перевірки реальних CSV.

Що не робити:

- не намагатися імпортувати взаєморозрахунки в `raw_rows` довідників;
- не записувати ці дані одразу в `core.stock_balances`, поки не підтверджені поля 1C і відповідність товарів/складів;
- не трактувати знак суми як дебіторку/кредиторку без перевірки бухгалтерської логіки конкретної 1C.

### 2026-06-01 - додано SQL-дзеркало для операційних залишків 1C

Дія:

- оновлено міграцію `db/migrations/002_one_c_mirror.sql`;
- додано таблицю `one_c_mirror.operational_batches`;
- додано таблицю `one_c_mirror.operational_rows`;
- додано view `one_c_mirror.latest_operational_rows`;
- додано індекси для пошуку по dataset, товару/контрагенту і складу.

Призначення:

- `operational_batches` зберігає журнал запусків імпорту операційних CSV;
- `operational_rows` зберігає сирі рядки залишків і взаєморозрахунків;
- `latest_operational_rows` показує останній успішний знімок по кожному dataset.

Поля, які тепер можна зберігати:

```text
dataset_name
object_type
period_at
entity_code / entity_name
warehouse_code / warehouse_name
contract_code / contract_name
organization_code / organization_name
currency
quantity
reserved_quantity
amount
raw_data
```

Чому так:

- залишки і взаєморозрахунки не є довідниками;
- для майбутньої CRM краще спочатку зберегти повний сирий знімок 1C;
- після перевірки реальних CSV можна буде нормалізувати товарні залишки в `core.stock_balances`, а дебіторку/кредиторку - в окремі CRM-таблиці.

Що не робити:

- не видаляти старі `raw_rows`;
- не замінювати цим механізмом backup 1C;
- не вважати `latest_operational_rows` кінцевою CRM-моделлю - це проміжне дзеркало.

### 2026-06-01 - створено Windows-експорт операційних даних 1C

Дія:

- створено PowerShell wrapper:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.ps1
```

- створено VBS COM exporter:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.vbs
```

Що експортується:

```text
1c_stock_balances.csv
1c_reserved_stock_balances.csv
1c_counterparty_settlements.csv
export_1c_operational_summary.csv
export_1c_operational.log
export_1c_operational_runner.log
```

Планові джерела в 1C:

- `РегистрНакопления.ТоварыНаСкладах.Остатки` - залишки товарів по складах;
- `РегистрНакопления.ТоварыВРезервеНаСкладах.Остатки` - резерви товарів по складах;
- `РегистрНакопления.ВзаиморасчетыСКонтрагентами.Остатки` - взаєморозрахунки з контрагентами.

Формат CSV:

```text
row_no;period_at;entity_code;entity_name;related_code;related_name;warehouse_code;warehouse_name;contract_code;contract_name;organization_code;organization_name;currency;quantity;reserved_quantity;amount
```

Важливий захист:

- VBS пробує декілька варіантів назв ресурсів 1C;
- CSV замінюється тільки після успішного запиту;
- якщо один регістр не спрацював, summary покаже `failed`, але інші регістри можна аналізувати;
- скрипт тільки читає 1C і не змінює `elista`.

Що не робити:

- не запускати цей exporter замість довідників - це окремий процес;
- не трактувати `amount > 0` або `amount < 0` як дебіторку/кредиторку без перевірки на реальних даних;
- не імпортувати `1c_counterparty_settlements.csv` у таблицю довідників.

### 2026-06-01 - створено Ubuntu-імпорт операційних CSV у PostgreSQL

Дія:

- створено скрипт:

```text
D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-operational-http.sh
```

Що робить скрипт:

- завантажує CSV з Windows HTTP export `http://192.168.0.5:8090`;
- конвертує UTF-16LE CSV у UTF-8;
- застосовує `db/migrations/002_one_c_mirror.sql`;
- імпортує рядки в `one_c_mirror.operational_rows`;
- веде журнал запусків у `one_c_mirror.operational_batches`;
- в кінці показує підсумок по `latest_operational_rows`.

Файли, які імпортуються:

```text
1c_stock_balances.csv                 required
1c_reserved_stock_balances.csv        optional
1c_counterparty_settlements.csv       required
```

Чому `reserved_stock_balances` optional:

- у різних конфігураціях 1C резерви можуть бути вимкнені або називатися інакше;
- відсутність резервів не повинна блокувати основні залишки і взаєморозрахунки.

Що не робити:

- не запускати цей скрипт до успішного `export_1c_operational_summary.csv`;
- не запускати його замість `import-1c-catalogs-http.sh`, бо довідники і залишки імпортуються окремо;
- не виправляти CSV вручну перед першим імпортом, спочатку треба побачити реальний результат exporter-а.

### 2026-06-01 - оновлено MESER checker під операційні CSV

Дія:

- оновлено:

```text
D:\Codex\CRM\SQL\scripts\windows\check-meser-1c-export-state.ps1
```

Що додано до перевірки:

- наявність `export-1c-operational-data.ps1`;
- наявність `export-1c-operational-data.vbs`;
- очікувані CSV:

```text
1c_stock_balances.csv
1c_reserved_stock_balances.csv
1c_counterparty_settlements.csv
```

- логи:

```text
export_1c_operational_summary.csv
export_1c_operational.log
export_1c_operational_runner.log
```

Результат:

- після перенесення нових файлів на `MESER` той самий checker зможе показати, чи готові експорт довідників і експорт операційних залишків.

Що не робити:

- не вважати відсутність `1c_reserved_stock_balances.csv` критичною, якщо основні залишки і взаєморозрахунки є;
- не запускати імпорт на Ubuntu, поки checker або summary не підтвердить наявність потрібних CSV.

### 2026-06-01 - оновлено документацію під залишки і взаєморозрахунки

Дія:

- створено:

```text
D:\Codex\CRM\SQL\docs\one-c-operational-export-import.md
```

- оновлено:

```text
D:\Codex\CRM\SQL\docs\current-status-2026-06-01.md
D:\Codex\CRM\SQL\docs\integration-exchange.md
D:\Codex\CRM\SQL\docs\integration-smoke-tests.md
D:\Codex\CRM\SQL\README.md
```

Що зафіксовано:

- довідники і операційні залишки запускаються різними скриптами;
- Windows export для залишків створює `1c_stock_balances.csv`, `1c_reserved_stock_balances.csv`, `1c_counterparty_settlements.csv`;
- Ubuntu import для залишків пише в `one_c_mirror.operational_rows`;
- детальний runbook тепер лежить у `docs/one-c-operational-export-import.md`.

Що не робити:

- не шукати інструкцію для залишків у `one-c-mirror-import.md`, бо це runbook тільки для довідників;
- не об'єднувати довідники і залишки в один запуск імпорту;
- не пропускати перевірку `export_1c_operational_summary.csv`.

### 2026-06-01 - manufacturers/countries перенесено в future-набір

Дія:

- оновлено `scripts/windows/export-1c-catalogs.ps1`;
- оновлено `scripts/windows/export-1c-catalogs.vbs`;
- оновлено `scripts/windows/check-meser-1c-export-state.ps1`;
- оновлено `docs/one-c-catalog-export.md`.

Зміна:

- `1c_manufacturers.csv` і `1c_countries.csv` прибрані з основного `next`;
- додано окремий необов'язковий набір `-Set future`;
- для країн використано metadata-назву `КлассификаторСтранМира`;
- `-Set all` залишається `base + next` і не включає `future`.

Чому:

- ці два довідники вже давали `failed`;
- користувач підтвердив, що зараз ними не користується;
- основний експорт робочих довідників не має блокуватися необов'язковими напрямками.

Що не робити:

- не запускати `-Set future`, поки не буде окремої потреби;
- не додавати `1c_manufacturers.csv` і `1c_countries.csv` в обов'язковий Ubuntu import list;
- не вважати їх відсутність проблемою для поточного SQL-дзеркала CRM.

### 2026-06-01 - виправлено синтаксис нового VBS exporter-а

Перевірка:

```powershell
cscript.exe //nologo scripts\windows\export-1c-operational-data.vbs /help
```

Перший результат:

```text
VBScript compile error at line 109: Expected identifier
```

Причина:

- у VBS було використано змінну `variant`;
- `Variant` є службовим словом/типом у VBScript, тому такий ідентифікатор не можна безпечно використовувати.

Виправлення:

- змінну `variant` перейменовано на `queryVariant`.

Змінений файл:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.vbs
```

Що не робити:

- не використовувати `variant` як назву змінної у VBScript;
- не переносити exporter на `MESER` без повторної перевірки `/help`.

### 2026-06-01 - локальна перевірка синтаксису після виправлення

Команди:

```powershell
cscript.exe //nologo scripts\windows\export-1c-operational-data.vbs /help
[System.Management.Automation.Language.Parser]::ParseFile(...)
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/import-1c-catalogs-http.sh
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/import-1c-operational-http.sh
git diff --check
```

Результат:

- `export-1c-operational-data.vbs /help` OK;
- PowerShell parser OK для:

```text
scripts\windows\export-1c-catalogs.ps1
scripts\windows\export-1c-operational-data.ps1
scripts\windows\check-meser-1c-export-state.ps1
```

- bash syntax OK для обох Ubuntu import scripts;
- `git diff --check` без whitespace-помилок;
- були тільки CRLF/LF попередження Git для Windows working copy, це не блокер.

Що не перевірено локально:

- реальне COM-підключення до 1C;
- реальний запит до регістрів `ТоварыНаСкладах`, `ТоварыВРезервеНаСкладах`, `ВзаиморасчетыСКонтрагентами`;
- реальний імпорт у PostgreSQL на VM.

Наступний правильний крок:

- оновити ZIP-пакет для перенесення на `MESER`;
- після цього запускати на `MESER` повільно: спочатку checker, потім operational export.

### 2026-06-01 - verify SQL оновлено під operational mirror

Дія:

- оновлено:

```text
D:\Codex\CRM\SQL\db\admin\002_verify_crm_database.sql
```

Додано перевірку наявності:

```text
one_c_mirror.operational_batches
one_c_mirror.operational_rows
one_c_mirror.latest_operational_rows
```

Результат:

- після застосування міграції `002_one_c_mirror.sql` стандартний verify-скрипт буде бачити не тільки дзеркало довідників, а й дзеркало залишків/взаєморозрахунків.

### 2026-06-01 - оновлено ZIP-пакет для MESER

Дія:

- оновлено папку:

```text
D:\Codex\CRM\SQL\dist\1c-catalog-exporter-2026-06-01
```

- оновлено ZIP:

```text
D:\Codex\CRM\SQL\dist\1c-catalog-exporter-2026-06-01.zip
```

ZIP тепер містить:

```text
scripts/windows/export-1c-catalogs.ps1
scripts/windows/export-1c-catalogs.vbs
scripts/windows/export-1c-operational-data.ps1
scripts/windows/export-1c-operational-data.vbs
scripts/windows/check-meser-1c-export-state.ps1
scripts/ubuntu/import-1c-catalogs-http.sh
scripts/ubuntu/import-1c-operational-http.sh
db/migrations/002_one_c_mirror.sql
docs/one-c-catalog-export.md
docs/one-c-operational-export-import.md
docs/meser-1c-export-diagnostics.md
```

Результат:

- один ZIP можна брати для перенесення скриптів на `MESER`;
- Ubuntu-файли також у ZIP як резервна копія для архіву, але на `MESER` запускати треба тільки Windows `.ps1/.vbs`.

Що не робити:

- не запускати Ubuntu `.sh` скрипти на Windows/MESER;
- не копіювати весь репозиторій на MESER, достатньо Windows-файлів з ZIP у `D:\CRM\Exports`.

### 2026-06-01 - фінальна локальна перевірка після ZIP

Команди:

```powershell
cscript.exe //nologo scripts\windows\export-1c-catalogs.vbs /help
cscript.exe //nologo scripts\windows\export-1c-operational-data.vbs /help
[System.Management.Automation.Language.Parser]::ParseFile(...)
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/import-1c-catalogs-http.sh
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/import-1c-operational-http.sh
git diff --check
```

Результат:

- обидва VBS `/help` відкриваються без compile error;
- PowerShell parser OK для Windows `.ps1`;
- bash syntax OK для Ubuntu `.sh`;
- `git diff --check` без whitespace-помилок;
- ZIP містить 11 файлів, включно з новими operational exporter/importer.

Вміст ZIP:

```text
export-1c-catalogs.ps1
export-1c-catalogs.vbs
export-1c-operational-data.ps1
export-1c-operational-data.vbs
check-meser-1c-export-state.ps1
one-c-catalog-export.md
one-c-operational-export-import.md
meser-1c-export-diagnostics.md
import-1c-catalogs-http.sh
import-1c-operational-http.sh
002_one_c_mirror.sql
```

Залишковий ризик:

- локально не можна перевірити реальні назви ресурсів регістрів 1C;
- якщо 1C має іншу назву поля суми або кількості, це буде видно в `export_1c_operational_summary.csv`, і тоді треба буде точково додати ще один query-variant.

### 2026-06-01 - дрібне SQL-уточнення alias у view

Дія:

- у `db/migrations/002_one_c_mirror.sql` alias `rows` у view `one_c_mirror.latest_operational_rows` замінено на `op_rows`.

Причина:

- `rows` схоже на службове SQL-слово;
- нейтральний alias зменшує ризик проблем при виконанні міграції на PostgreSQL.

### 2026-06-01 - ZIP перепаковано після SQL-уточнення

Дія:

- повторно оновлено:

```text
D:\Codex\CRM\SQL\dist\1c-catalog-exporter-2026-06-01.zip
```

Причина:

- у ZIP входить `db/migrations/002_one_c_mirror.sql`;
- після зміни alias у view потрібно було покласти в ZIP актуальну версію міграції.

### 2026-06-01 - фінальна перевірка після повторного ZIP

Результат:

- `export-1c-catalogs.vbs /help` OK;
- `export-1c-operational-data.vbs /help` OK;
- `import-1c-catalogs-http.sh` bash syntax OK;
- `import-1c-operational-http.sh` bash syntax OK;
- `git diff --check` без whitespace-помилок;
- `git status --short` показує багато вже наявних uncommitted/untracked змін, їх не відкочувати.

Примітка:

- Git знову показав тільки CRLF/LF warning для Windows working copy, це не блокер.

### 2026-06-01 - отримано скрін MESER checker після перенесення operational exporter

Стан зі скрінів користувача:

- checker запущено на `MESER`;
- `D:\CRM` існує;
- `D:\CRM\Exports` існує;
- `D:\Codex\CRM\SQL` на MESER відсутній, це нормально, бо робочі файли лежать у `D:\CRM\Exports`;
- `V83.COMConnector` OK;
- `V82.COMConnector` FAIL, це не блокер, бо V83 працює;
- порт HTTP export `8090` слухає;
- Windows exporter files у `D:\CRM\Exports` присутні:

```text
export-1c-catalogs.ps1
export-1c-catalogs.vbs
export-1c-operational-data.ps1
export-1c-operational-data.vbs
```

- основні CSV довідників присутні;
- future optional CSV `1c_manufacturers.csv` і `1c_countries.csv` присутні як старі короткі файли, але вони не входять у поточний обов'язковий імпорт;
- operational CSV ще відсутні:

```text
1c_stock_balances.csv
1c_reserved_stock_balances.csv
1c_counterparty_settlements.csv
```

Поточний blocker:

```text
CRM_1C_CONNECTION_STRING is missing or still has placeholders
```

Причина:

- checker запущено в новій PowerShell-сесії з `C:\Windows\system32`;
- змінна середовища з логіном/паролем 1C не зберігається між різними PowerShell-вікнами;
- її треба задати ще раз у цьому самому вікні перед запуском operational export.

Що не робити:

- не запускати команду з `<1C_USER>` і `<1C_PASSWORD>` без заміни на реальні дані;
- не надсилати пароль 1C у чат;
- не запускати Ubuntu-імпорт, поки `1c_stock_balances.csv` і `1c_counterparty_settlements.csv` ще відсутні.

### 2026-06-01 - уточнено: 1C на MESER підключається без логіна і пароля

Користувач виправив попередню інструкцію:

- у цій 1C раніше заходили без окремого логіна і пароля;
- не потрібно вимагати `Usr` і `Pwd` для поточного запуску.

Правильний connection string для поточної PowerShell-сесії:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";'
```

Оновлено документацію:

```text
D:\Codex\CRM\SQL\docs\one-c-operational-export-import.md
D:\Codex\CRM\SQL\docs\one-c-catalog-export.md
```

Що не робити:

- не вигадувати логін/пароль 1C, якщо поточний користувач Windows уже має доступ;
- не вставляти placeholder `Usr="<1C_USER>";Pwd="<1C_PASSWORD>";`;
- не надсилати будь-які паролі в чат.

### 2026-06-01 - користувач підтвердив, що connection string без логіна/пароля задано

Стан:

- користувач повідомив: "готово";
- це означає, що в поточному PowerShell-вікні на `MESER` задано:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";'
```

Наступний правильний крок:

- запускати `export-1c-operational-data.ps1` з `-Set all`;
- після завершення дивитися `export_1c_operational_summary.csv`;
- якщо `stock_balances` або `counterparty_settlements` мають `failed`, не запускати Ubuntu-імпорт, а спочатку аналізувати помилку.

### 2026-06-01 - operational export на MESER успішний

Стан зі скріну користувача:

- connection string без логіна і пароля спрацював;
- команда `export-1c-operational-data.ps1 -Set all` запущена;
- команда випадково/повторно виконана двічі, але це не проблема, бо CSV замінюються тільки після успішного запиту.

Результат operational export:

```text
stock_balances              processed / OK, rows=2260
reserved_stock_balances     processed / OK, rows=0
counterparty_settlements    processed / OK, rows=412
```

Використані query variants:

```text
stock_balances:
ТоварыНаСкладах.КоличествоОстаток

reserved_stock_balances:
ТоварыВРезервеНаСкладах.КоличествоОстаток

counterparty_settlements:
ВзаиморасчетыСКонтрагентами.СуммаВзаиморасчетовОстаток.no_currency
```

Створені/оновлені файли на MESER:

```text
D:\CRM\Exports\1c_stock_balances.csv
D:\CRM\Exports\1c_reserved_stock_balances.csv
D:\CRM\Exports\1c_counterparty_settlements.csv
D:\CRM\Exports\export_1c_operational_summary.csv
D:\CRM\Exports\export_1c_operational.log
D:\CRM\Exports\export_1c_operational_runner.log
```

Висновок:

- можна переходити до перевірки summary і доступності CSV через HTTP;
- після цього наступний великий крок - імпорт на Ubuntu `CRM-SQL` у `one_c_mirror.operational_rows`.

Що не робити:

- не запускати operational export ще раз без потреби;
- не видаляти CSV у `D:\CRM\Exports`;
- не запускати Ubuntu import, поки не перевірено, що файли доступні через HTTP export.

### 2026-06-01 - summary operational export підтверджено

Стан зі скріну користувача:

- користувач виконав:

```powershell
Import-Csv 'D:\CRM\Exports\export_1c_operational_summary.csv' -Delimiter ';' | Format-Table
```

- summary показав `processed` для всіх трьох наборів:

```text
stock_balances              stock_balance                  1c_stock_balances.csv                  processed  2260
reserved_stock_balances     reserved_stock_balance         1c_reserved_stock_balances.csv         processed  0
counterparty_settlements    counterparty_settlement        1c_counterparty_settlements.csv        processed  412
```

Висновок:

- експорт залишків товарів і взаєморозрахунків із 1C завершено успішно;
- `reserved_stock_balances` має 0 рядків, але це не помилка;
- наступний крок - перевірити доступність трьох CSV через HTTP `http://127.0.0.1:8090/...` на `MESER`, а потім імпортувати їх на Ubuntu `CRM-SQL`.

Що не робити:

- не запускати експорт ще раз без потреби;
- не редагувати CSV вручну;
- не переходити до нормалізації в CRM-таблиці, поки сирий імпорт у `one_c_mirror.operational_rows` не виконано.

### 2026-06-01 - HTTP-перевірка operational CSV почалась, але PowerShell залишився в multiline prompt

Стан зі скріну користувача:

- користувач почав виконувати PowerShell-блок для перевірки HTTP-доступності CSV;
- у вікні видно prompt `>>`, тобто PowerShell чекає продовження/закриття блоку і команда, ймовірно, ще не завершилась;
- Task Manager перекриває нижню частину PowerShell, тому результат не видно.

Рішення:

- не продовжувати складний багаторядковий блок;
- натиснути `Ctrl+C`, щоб вийти з multiline prompt;
- перевірити три CSV простими окремими командами по одному файлу.

Що не робити:

- не запускати operational export повторно;
- не переходити на Ubuntu-імпорт, поки HTTP-доступність файлів не підтверджена;
- не закривати/перезапускати HTTP server на порту `8090`, бо він уже працює.

### 2026-06-01 - HTTP-доступність operational CSV підтверджена

Стан зі скріну користувача:

- HTTP server на `MESER` через порт `8090` віддає operational CSV;
- перевірка показала:

```text
1c_stock_balances.csv OK 237758 bytes
1c_reserved_stock_balances.csv OK 412 bytes
1c_counterparty_settlements.csv OK 43044 bytes
```

- окрема перевірка `Invoke-WebRequest` для `1c_stock_balances.csv` показала:

```text
StatusCode: 200
RawContentLength: 237758
```

Висновок:

- Windows/MESER частина для залишків і взаєморозрахунків завершена успішно;
- CSV створені і доступні через HTTP;
- наступний етап - доставити оновлений Ubuntu import script і міграцію на `CRM-SQL`, потім виконати імпорт у PostgreSQL.

Що не робити:

- не запускати operational export ще раз;
- не змінювати CSV вручну;
- не закривати HTTP export на `MESER`, поки Ubuntu імпорт не завершиться.

### 2026-06-01 - SSH до Ubuntu розірвався, користувач повернувся у Windows PowerShell

Стан зі скріну користувача:

- раніше був активний Linux/Ubuntu prompt:

```text
crmadmin@crm-sql:~/crm-imports/1c$
```

- потім SSH-сесія обірвалась:

```text
client_loop: send disconnect: Connection reset
```

- після цього користувач опинився у Windows PowerShell:

```text
PS C:\WINDOWS\system32>
```

- команда:

```powershell
cd ~/SQL && ls scripts/ubuntu/import-1c-operational-http.sh db/migrations/002_one_c_mirror.sql
```

дала помилку, бо `&&` не підтримується в цій версії Windows PowerShell і команда взагалі була виконана не в Ubuntu.

Висновок:

- це не помилка PostgreSQL і не помилка імпорту;
- треба спочатку знову підключитися до Ubuntu `CRM-SQL` через SSH;
- тільки після появи prompt `crmadmin@crm-sql` виконувати Linux-команди.

Що не робити:

- не виконувати Linux-команди `cd ~/SQL`, `ls`, `bash ...` у Windows PowerShell;
- не запускати Windows operational export повторно;
- не використовувати `&&` у цьому старому Windows PowerShell.

### 2026-06-01 - SSH до Ubuntu CRM-SQL відновлено

Стан:

- користувач повідомив: "є підключив";
- це означає, що знову є активний Linux/Ubuntu shell на `CRM-SQL`.

Наступний правильний крок:

- у Ubuntu перевірити, чи є в `~/SQL` новий скрипт:

```text
scripts/ubuntu/import-1c-operational-http.sh
```

- і чи є актуальна міграція:

```text
db/migrations/002_one_c_mirror.sql
```

Що не робити:

- не запускати імпорт, поки не перевірено наявність цих двох файлів;
- не повертатися до Windows PowerShell для Linux-команд.

### 2026-06-01 - на Ubuntu CRM-SQL нових operational файлів ще немає

Стан зі скріну користувача:

- SSH до `crmadmin@192.168.0.166` працює;
- користувач виконав:

```bash
cd ~/SQL && ls scripts/ubuntu/import-1c-operational-http.sh db/migrations/002_one_c_mirror.sql
```

- відповідь:

```text
ls: cannot access 'scripts/ubuntu/import-1c-operational-http.sh': No such file or directory
ls: cannot access 'db/migrations/002_one_c_mirror.sql': No such file or directory
```

Висновок:

- репозиторій/папка `~/SQL` на Ubuntu є;
- потрібні нові файли ще не доставлені на VM;
- імпорт запускати рано.

Наступний правильний крок:

- вийти з SSH назад у Windows PowerShell;
- через `scp` скопіювати з `D:\Codex\CRM\SQL` на `crmadmin@192.168.0.166:~/SQL`:

```text
scripts/ubuntu/import-1c-operational-http.sh
db/migrations/002_one_c_mirror.sql
docs/one-c-operational-export-import.md
docs/crm-sql-work-log-2026-06-01.md
```

Що не робити:

- не створювати ці файли вручну через `cat <<...` на Ubuntu;
- не запускати старий `import_more_catalogs.sh` для operational даних;
- не запускати `bash scripts/ubuntu/import-1c-operational-http.sh`, поки файл не буде скопійовано.

### 2026-06-01 - користувач вийшов із SSH назад у Windows PowerShell

Стан:

- користувач повідомив: "вийшов";
- це означає, що активний prompt знову Windows PowerShell на `MESER`.

Важливе уточнення:

- на `MESER` немає `D:\Codex\CRM\SQL`;
- потрібні для доставки на Ubuntu файли треба брати з розпакованого ZIP у `D:\CRM\Exports`;
- ZIP містив `import-1c-operational-http.sh` і `002_one_c_mirror.sql` у корені архіву, тому після розпакування очікувані шляхи:

```text
D:\CRM\Exports\import-1c-operational-http.sh
D:\CRM\Exports\002_one_c_mirror.sql
```

Наступний правильний крок:

- спочатку перевірити, що ці два файли є на `MESER`;
- тільки потім копіювати їх на Ubuntu через `scp`.

### 2026-06-01 - файли для доставки на Ubuntu є на MESER

Стан:

- користувач підтвердив: "є";
- це означає, що на `MESER` у `D:\CRM\Exports` знайдені:

```text
D:\CRM\Exports\import-1c-operational-http.sh
D:\CRM\Exports\002_one_c_mirror.sql
```

Наступний правильний крок:

- створити на Ubuntu потрібні папки:

```text
~/SQL/scripts/ubuntu
~/SQL/db/migrations
```

- після цього скопіювати файли через `scp`.

Що не робити:

- не запускати імпорт до копіювання;
- не копіювати файли в `~/crm-imports/1c`, бо це робоча папка CSV, а не репозиторій;
- не замінювати довідниковий імпорт старим `import_more_catalogs.sh`.

### 2026-06-01 - папки на Ubuntu створено через SSH, але команда виконувалась з Ubuntu-сесії

Стан зі скріну користувача:

- користувач перебуває в Linux shell:

```text
crmadmin@crm-sql:~$
```

- команда була виконана так:

```bash
ssh crmadmin@192.168.0.166 "mkdir -p ~/SQL/scripts/ubuntu ~/SQL/db/migrations"
```

- тобто SSH був запущений із Ubuntu на той самий Ubuntu-хост;
- після підтвердження host key і введення пароля команда завершилась і повернула користувача в `crmadmin@crm-sql:~$`.

Висновок:

- це не критична помилка;
- потрібні папки на Ubuntu, ймовірно, створені;
- але копіювання `scp` треба виконувати з Windows PowerShell, бо вихідні файли лежать на Windows у `D:\CRM\Exports`.

Наступний правильний крок:

- вийти з Ubuntu командою `exit`;
- у Windows PowerShell виконати `scp` з `D:\CRM\Exports` на `crmadmin@192.168.0.166`.

Що не робити:

- не запускати `scp D:\...` всередині Ubuntu shell;
- не створювати файли вручну через `cat`;
- не запускати імпорт, поки `scp` не завершиться і файли не будуть перевірені в `~/SQL`.

### 2026-06-01 - користувач повернувся у Windows PowerShell для scp

Стан:

- користувач повідомив: "є";
- після попереднього кроку це означає повернення з Ubuntu shell у Windows PowerShell;
- тепер можна копіювати файли з `D:\CRM\Exports` на `CRM-SQL`.

Наступний правильний крок:

- спочатку скопіювати:

```text
D:\CRM\Exports\import-1c-operational-http.sh
```

у:

```text
/home/crmadmin/SQL/scripts/ubuntu/import-1c-operational-http.sh
```

Що не робити:

- не запускати імпорт до копіювання міграції;
- не копіювати файл у `~/crm-imports/1c`;
- не змінювати назву файлу на Ubuntu.

### 2026-06-01 - на MESER немає ssh/scp, переходимо на HTTP-download з Ubuntu

Стан зі скріну користувача:

- у Windows PowerShell на `MESER` команда `ssh` не знайдена;
- команда `scp` також не знайдена;
- це Windows Server 2012 R2, де OpenSSH client може бути відсутній.

Помилки:

```text
ssh : ім'я "ssh" не розпізнано...
scp : ім'я "scp" не розпізнано...
```

Важливий факт:

- потрібні файли вже лежать у `D:\CRM\Exports`;
- `MESER` уже віддає цю папку через HTTP port `8090`;
- раніше підтверджено, що HTTP-доступ працює.

Рішення:

- не використовувати `scp` з Windows;
- зайти в Ubuntu `CRM-SQL`;
- скачати файли з `MESER` через HTTP:

```text
http://192.168.0.5:8090/import-1c-operational-http.sh
http://192.168.0.5:8090/002_one_c_mirror.sql
```

Що не робити:

- не встановлювати OpenSSH на Windows Server тільки заради цього кроку;
- не створювати файли вручну через `cat`;
- не запускати імпорт, поки файли не завантажені в правильні папки `~/SQL`.

### 2026-06-01 - operational importer і migration доставлено на Ubuntu через HTTP

Стан зі скріну користувача:

- користувач у Linux shell `crmadmin@crm-sql:~$`;
- виконано завантаження з `MESER` через HTTP:

```bash
curl -fL http://192.168.0.5:8090/import-1c-operational-http.sh -o ~/SQL/scripts/ubuntu/import-1c-operational-http.sh
curl -fL http://192.168.0.5:8090/002_one_c_mirror.sql -o ~/SQL/db/migrations/002_one_c_mirror.sql
chmod +x ~/SQL/scripts/ubuntu/import-1c-operational-http.sh
```

- перевірка `ls -l` показала:

```text
/home/crmadmin/SQL/db/migrations/002_one_c_mirror.sql
/home/crmadmin/SQL/scripts/ubuntu/import-1c-operational-http.sh
```

Результат:

- файли доставлені на `CRM-SQL`;
- скрипт імпорту має право виконання;
- наступний крок - перевірити bash-синтаксис, потім запускати імпорт у PostgreSQL.

Що не робити:

- не завантажувати файли повторно без потреби;
- не редагувати їх вручну на VM;
- не запускати імпорт, якщо `bash -n` покаже помилку.

### 2026-06-01 - bash-синтаксис operational importer на Ubuntu перевірено

Стан:

- користувач виконав перевірку:

```bash
bash -n ~/SQL/scripts/ubuntu/import-1c-operational-http.sh && echo "SCRIPT OK"
```

- користувач повідомив: "ок";
- це означає, що `SCRIPT OK` отримано і bash-синтаксис коректний.

Наступний правильний крок:

- запустити імпорт operational CSV у PostgreSQL `crm_hub`;
- для простоти і доступу до PostgreSQL використати режим `USE_POSTGRES_SUDO=1`.

Що не робити:

- не запускати старий `import_more_catalogs.sh`;
- не запускати Windows exporter ще раз;
- не переривати імпорт, якщо йде завантаження CSV або `COPY`.

### 2026-06-01 - operational import зупинився на старій структурі `raw_rows`

Стан зі скріну користувача:

- користувач запустив:

```bash
cd ~/SQL && USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh
```

- міграція почалась, але зупинилась на індексі:

```text
ERROR: column "external_ref" does not exist
LINE 3: WHERE external_ref IS NOT NULL AND external_ref <> '';
```

Причина:

- на Ubuntu вже була стара таблиця `one_c_mirror.raw_rows`;
- `CREATE TABLE IF NOT EXISTS` не змінює структуру вже наявної таблиці;
- у старій таблиці не було колонки `external_ref`, яку очікує нова міграція.

Локальне виправлення в репозиторії:

- оновлено `db/migrations/002_one_c_mirror.sql`;
- додано idempotent-блок:

```sql
ALTER TABLE one_c_mirror.raw_rows
  ADD COLUMN IF NOT EXISTS ...
```

Призначення:

- нова міграція тепер вміє дооновлювати стару `raw_rows`, а не тільки створювати таблицю з нуля.

Що треба зробити на Ubuntu зараз:

- одноразово додати відсутні колонки в існуючу таблицю `one_c_mirror.raw_rows`;
- після цього повторити operational import.

Що не робити:

- не видаляти `one_c_mirror.raw_rows`;
- не видаляти імпортовані раніше довідники;
- не запускати `DROP SCHEMA`;
- не перезапускати Windows export.

### 2026-06-01 - raw_rows на Ubuntu дооновлено через ALTER TABLE

Стан:

- користувач повідомив: "є";
- це означає, що команда `ALTER TABLE one_c_mirror.raw_rows ADD COLUMN IF NOT EXISTS ...` виконалась успішно.

Результат:

- стара таблиця `one_c_mirror.raw_rows` тепер має колонки, яких бракувало для міграції:

```text
import_batch_id
source_system
object_type
catalog_name
source_file
row_no
external_ref
code
name
deletion_mark
raw_data
row_hash
imported_at
```

Наступний правильний крок:

- повторити operational import:

```bash
cd ~/SQL && USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh
```

Що не робити:

- не видаляти старі дані;
- не запускати Windows export повторно;
- не запускати старий `import_more_catalogs.sh`.

### 2026-06-01 - operational import зупинився на багаторядковому `\copy`

Стан зі скріну користувача:

- повторний запуск міграції пройшов далі;
- створено/перевірено operational tables/views;
- імпорт почав завантажувати `1c_stock_balances.csv`;
- зупинився на рядку:

```text
\copy: parse error at end of line
```

Причина:

- у `scripts/ubuntu/import-1c-operational-http.sh` команда `\copy import_operational_stage (...)` була розбита на багато рядків;
- `psql` meta-command `\copy` має бути одним рядком.

Локальне виправлення в репозиторії:

- оновлено `scripts/ubuntu/import-1c-operational-http.sh`;
- `\copy` тепер записано одним рядком;
- локальна перевірка `bash -n` пройшла успішно.

Що треба зробити на Ubuntu:

- точково замінити багаторядковий `\copy` на один рядок у вже завантаженому скрипті;
- повторити `bash -n`;
- повторити operational import.

Що не робити:

- не видаляти таблиці;
- не видаляти CSV;
- не запускати Windows export повторно.

### 2026-06-01 - `\copy` у Ubuntu importer виправлено на VM

Стан:

- користувач виконав Perl one-liner для заміни багаторядкового `\copy` на однорядковий;
- після цього виконав:

```bash
bash -n ~/SQL/scripts/ubuntu/import-1c-operational-http.sh && echo "SCRIPT OK"
```

- користувач повідомив: "ок";
- це означає, що скрипт на Ubuntu синтаксично коректний після правки.

Наступний правильний крок:

- повторити operational import:

```bash
cd ~/SQL && USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh
```

Що не робити:

- не завантажувати CSV повторно вручну;
- не запускати Windows export;
- не видаляти failed batch вручну, поки не буде потреби.

### 2026-06-01 - operational import зупинився через `ON COMMIT DROP` у temp table

Стан зі скріну користувача:

- міграція `one_c_mirror` пройшла;
- `1c_stock_balances.csv` завантажився з `MESER`;
- імпорт почався і зупинився:

```text
CREATE TABLE
ERROR: relation "import_operational_stage" does not exist
UPDATE 1
```

Причина:

- у скрипті `CREATE TEMP TABLE import_operational_stage (...) ON COMMIT DROP;`;
- `psql` працює з autocommit;
- після `CREATE TEMP TABLE ... ON COMMIT DROP` транзакція завершується, і тимчасова таблиця одразу зникає;
- наступна команда `\copy` вже не бачить `import_operational_stage`.

Локальне виправлення:

- оновлено `scripts/ubuntu/import-1c-operational-http.sh`;
- додатково оновлено `scripts/ubuntu/import-1c-catalogs-http.sh`, бо там був такий самий ризик;
- `ON COMMIT DROP` прибрано, тимчасова таблиця тепер живе до завершення psql-сесії;
- `bash -n` для обох скриптів OK.

Що треба зробити на Ubuntu:

- точково прибрати `ON COMMIT DROP` у вже завантаженому файлі:

```text
~/SQL/scripts/ubuntu/import-1c-operational-http.sh
```

- після цього повторити імпорт.

Що не робити:

- не видаляти `one_c_mirror.operational_rows`;
- не видаляти failed batch вручну;
- не запускати Windows export повторно.

### 2026-06-01 - `ON COMMIT DROP` прибрано на Ubuntu importer

Стан:

- користувач виконав:

```bash
perl -0pi -e 's/\) ON COMMIT DROP;/);/g' ~/SQL/scripts/ubuntu/import-1c-operational-http.sh
bash -n ~/SQL/scripts/ubuntu/import-1c-operational-http.sh && echo "SCRIPT OK"
```

- користувач повідомив: "ок";
- це означає, що `ON COMMIT DROP` прибрано і bash-синтаксис знову коректний.

Наступний правильний крок:

- повторити operational import.

Що не робити:

- не перезапускати Windows export;
- не чистити таблиці вручну;
- не редагувати CSV.

### 2026-06-01 - operational import у PostgreSQL пройшов, але числові підсумки нульові

Стан зі скріну користувача:

- повторний імпорт після виправлень завершився без критичної помилки;
- міграція `one_c_mirror` виконалась;
- CSV завантажені з `MESER`;
- вставка рядків пройшла:

```text
1c_stock_balances.csv: COPY 2260, INSERT 0 2260
1c_reserved_stock_balances.csv: COPY 0, INSERT 0 0
1c_counterparty_settlements.csv: COPY 412, INSERT 0 412
```

Фінальна таблиця показала:

```text
counterparty_settlements    rows=412     quantity=0.000   reserved_quantity=0.000   amount=0.00
stock_balances              rows=2260    quantity=0.000   reserved_quantity=0.000   amount=0.00
```

Висновок:

- сирі рядки operational CSV уже імпортовані в PostgreSQL;
- але нульові агрегати для `stock_balances` підозрілі, бо exporter фільтрував ненульові залишки;
- треба перевірити сам UTF-8 CSV у `/tmp/crm-imports/1c-operational`, щоб зрозуміти, чи числові поля порожні вже у файлі, чи проблема в SQL-імпорті.

Наступний правильний крок:

- подивитися перші рядки:

```text
/tmp/crm-imports/1c-operational/1c_stock_balances.utf8.csv
```

Що не робити:

- не видаляти імпортовані rows;
- не запускати нормалізацію в `core.stock_balances`, поки не перевірено числові поля;
- не запускати Windows export повторно до аналізу CSV.

### 2026-06-01 - перевірка CSV показала порожні поля operational export

Стан зі скріну користувача:

- команда на Ubuntu виконана:

```bash
head -n 5 /tmp/crm-imports/1c-operational/1c_stock_balances.utf8.csv
```

- заголовок CSV є:

```text
row_no;period_at;entity_code;entity_name;related_code;related_name;warehouse_code;warehouse_name;contract_code;contract_name;organization_code;organization_name;currency;quantity;reserved_quantity;amount
```

- рядки мають тільки `row_no`, а всі інші поля порожні:

```text
"1";"";"";"";"";"";"";"";"";"";"";"";"";"";"";""
"2";"";"";"";"";"";"";"";"";"";"";"";"";"";"";""
```

Висновок:

- PostgreSQL importer працює технічно правильно: він імпортує те, що є у CSV;
- проблема на стороні Windows/1C exporter: запит знаходить рядки, але поля вибірки не читаються через поточний спосіб доступу до `Selection`;
- треба виправити `D:\CRM\Exports\export-1c-operational-data.vbs`/локальний `scripts/windows/export-1c-operational-data.vbs`, щоб значення бралися з властивостей вибірки напряму, а не через поточний універсальний читач поля.

Що не робити:

- не чистити PostgreSQL;
- не повторювати Ubuntu import до нового CSV;
- не змінювати 1C пароль/логін, бо підключення без логіна і пароля вже працює.

### 2026-06-01 - локально виправлено читання полів у operational VBS exporter

Зміна:

- оновлено локальний файл:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.vbs
```

- у `SafeField(selection, fieldName)` додано fallback-доступ до полів через властивості `selection.PeriodAt`, `selection.EntityCode`, `selection.WarehouseName`, `selection.Quantity`, `selection.Amount` тощо;
- причина: на MESER CSV показав рядки з порожніми полями після `row_no`, отже `selection.Get(fieldName)` не повернув значення для operational-запитів.

Що потрібно зробити на MESER:

- внести таку саму правку в активний файл:

```text
D:\CRM\Exports\export-1c-operational-data.vbs
```

Після цього:

- повторити Windows export тільки operational data;
- перевірити перші рядки `D:\CRM\Exports\1c_stock_balances.csv` або через Ubuntu HTTP;
- тільки якщо числові поля зʼявляться, повторювати Ubuntu import.

Що не робити:

- не змінювати 1C connection string з логіном/паролем;
- не чистити PostgreSQL;
- не запускати Ubuntu import до перевірки нового CSV.

### 2026-06-01 - питання віддаленого PowerShell до MESER через VPN

Стан:

- користувач перебуває на віддаленому компʼютері, але має VPN;
- потрібно підключитись PowerShell до MESER `192.168.0.5`;
- попередньо встановлено, що `ssh`/`scp` на MESER недоступні, тому для Windows Server правильний варіант - PowerShell Remoting через WinRM.

Рекомендований порядок:

1. На компʼютері користувача перевірити доступність MESER по мережі.
2. Перевірити порт WinRM `5985`.
3. Якщо порт відкритий - додати `192.168.0.5` у TrustedHosts і виконати `Enter-PSSession`.
4. Якщо порт закритий - WinRM треба увімкнути на самому MESER через RDP/AnyDesk/локальну адмін-сесію.

Що не робити:

- не пробувати `ssh` до MESER як основний шлях;
- не відкривати широкі firewall-правила назовні, тільки для VPN/локальної мережі;
- не передавати 1C логін/пароль, бо 1C connection string працює без них.

### 2026-06-01 - WinRM до MESER доступний, треба TrustedHosts і правильний користувач

Стан зі скріну користувача:

- на клієнтському/віддаленому ПК виконано:

```powershell
Test-NetConnection 192.168.0.5 -Port 5985
```

- результат:

```text
TcpTestSucceeded : True
```

- це означає, що MESER `192.168.0.5` доступний через VPN і WinRM-порт 5985 відкритий;
- `Enter-PSSession` впав з помилкою TrustedHosts, бо підключення йде по IP/не доменом;
- спроби `192.168.0.5\fresh\zahar` і `192.168.0.5\zahar\fresh` неправильні як імʼя користувача.

Правильний наступний шлях:

1. На MESER перевірити реальне імʼя поточного користувача командою `whoami`.
2. На клієнтському ПК додати `192.168.0.5` у TrustedHosts.
3. Створити credential через `Get-Credential`, а не передавати складний рядок прямо в `-Credential`.
4. Підключитись через `Enter-PSSession -ComputerName 192.168.0.5 -Credential $cred`.

Що не робити:

- не використовувати формат `192.168.0.5\fresh\zahar`;
- не плутати імʼя компʼютера і імʼя користувача;
- не відкривати WinRM назовні, використовувати тільки VPN/локальну мережу.

### 2026-06-01 - визначено користувача MESER для PowerShell Remoting

Стан зі скріну користувача на MESER `192.168.0.5`:

- виконано `Enable-PSRemoting -Force`;
- WinRM-служба вже була налаштована на прийом запитів;
- команда `whoami` показала:

```text
fresh\zahar
```

Висновок:

- для `Get-Credential` на клієнтському компʼютері потрібно вводити користувача `fresh\zahar`;
- підключення треба робити з компʼютера користувача через VPN, не з вікна AnyDesk на самому MESER.

Наступний правильний крок:

- на клієнтському ПК, у PowerShell від адміністратора, додати MESER у TrustedHosts і виконати `Enter-PSSession` з credential `fresh\zahar`.

Що не робити:

- не використовувати `192.168.0.5\fresh\zahar`;
- не виконувати `Enter-PSSession` до `192.168.0.5` із самого MESER без потреби;
- не змінювати 1C connection string і не передавати 1C пароль.

### 2026-06-01 - TrustedHosts не встановився на клієнтському ПК

Стан зі скріну користувача:

- `Test-NetConnection 192.168.0.5 -Port 5985` раніше показав `TcpTestSucceeded : True`, тобто MESER доступний;
- команда на клієнтському ПК:

```powershell
Set-Item WSMan:\localhost\Client\TrustedHosts -Value 192.168.0.5 -Concatenate -Force
```

повернула помилку WS-Management;
- `$cred = Get-Credential` відпрацював, але `Enter-PSSession` все ще падає через TrustedHosts.

Висновок:

- проблема зараз на клієнтському ПК: локальна WinRM/WSMan-служба або провайдер ще не налаштовані;
- треба спочатку виконати `winrm quickconfig` у PowerShell від адміністратора на клієнтському ПК, потім повторити TrustedHosts.

Що не робити:

- не міняти користувача `fresh\zahar`;
- не повторювати `Enter-PSSession`, поки TrustedHosts не встановився;
- не повертатись до `ssh`, бо це не шлях для MESER.

### 2026-06-01 - на клієнтському ПК виконано `winrm quickconfig`

Стан зі скріну користувача:

- команда виконана у PowerShell від адміністратора:

```powershell
winrm quickconfig
```

- користувач підтвердив зміни `y`;
- WinRM оновлено для прийому запитів;
- WinRM service type змінено успішно;
- WinRM service started;
- наприкінці є помилка firewall/status:

```text
Unable to check the status of the firewall.
Error number: -2147024894 0x80070002
The system cannot find the file specified.
```

Висновок:

- локальна WinRM-служба на клієнтському ПК стартувала;
- помилка firewall може заважати inbound WinRM на цьому ПК, але для підключення до MESER як клієнт наступний тест - повторити запис `TrustedHosts`;
- якщо `Set-Item WSMan:\localhost\Client\TrustedHosts` тепер спрацює, можна повторити `Enter-PSSession`.

Наступний крок:

- виконати `Set-Item WSMan:\localhost\Client\TrustedHosts -Value "192.168.0.5" -Concatenate -Force`;
- потім перевірити `Get-Item WSMan:\localhost\Client\TrustedHosts`.

Що не робити:

- не запускати експорт/імпорт 1C на цьому етапі;
- не міняти користувача `fresh\zahar`;
- не вимикати VPN.

### 2026-06-01 - TrustedHosts на клієнтському ПК налаштований

Стан зі скріну користувача:

- після `winrm quickconfig` повторно виконано:

```powershell
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "192.168.0.5" -Concatenate -Force
Get-Item WSMan:\localhost\Client\TrustedHosts
```

- результат показав:

```text
TrustedHosts    192.168.0.5
```

Висновок:

- клієнтський PowerShell тепер довіряє MESER `192.168.0.5` для WinRM-підключення по IP;
- наступний крок - створити credential для `fresh\zahar` і виконати `Enter-PSSession`.

Що не робити:

- не повторювати `Set-Item TrustedHosts`, він уже спрацював;
- не використовувати неправильний формат `192.168.0.5\fresh\zahar`;
- не переходити до правки exporter, поки не буде рядка віддаленої сесії `[192.168.0.5]: ...`.

### 2026-06-01 - PowerShell Remoting до MESER підключено

Стан:

- користувач повідомив `є` після команди:

```powershell
Enter-PSSession -ComputerName 192.168.0.5 -Credential $cred
```

Висновок:

- віддалена PowerShell-сесія до MESER `192.168.0.5` працює;
- тепер можна правити файл exporter напряму на MESER:

```text
D:\CRM\Exports\export-1c-operational-data.vbs
```

Наступний правильний крок:

- зробити резервну копію VBS-файлу перед правкою.

Що не робити:

- не запускати експорт до внесення правки;
- не редагувати CSV вручну;
- не чистити PostgreSQL.

### 2026-06-01 - створено backup active operational VBS на MESER

Стан зі скріну користувача у віддаленій PowerShell-сесії `[192.168.0.5]`:

- виконано:

```powershell
Copy-Item 'D:\CRM\Exports\export-1c-operational-data.vbs' 'D:\CRM\Exports\export-1c-operational-data.vbs.bak-before-field-fix' -Force
Get-Item 'D:\CRM\Exports\export-1c-operational-data.vbs','D:\CRM\Exports\export-1c-operational-data.vbs.bak-before-field-fix'
```

- обидва файли існують у `D:\CRM\Exports`;
- розмір обох файлів однаковий: `16128` bytes;
- backup:

```text
D:\CRM\Exports\export-1c-operational-data.vbs.bak-before-field-fix
```

Висновок:

- можна безпечно вносити правку в активний файл `export-1c-operational-data.vbs`;
- якщо правка буде невдала, є точка повернення.

Наступний крок:

- замінити функцію `SafeField(selection, fieldName)` у VBS на варіант із fallback-доступом до властивостей `selection.Quantity`, `selection.Amount`, `selection.WarehouseName` тощо.

Що не робити:

- не видаляти backup;
- не запускати export до синтаксичної перевірки/перевірки фрагмента;
- не редагувати CSV вручну.

### 2026-06-01 - правило контролю контексту / памʼяті чату

Запит користувача:

- контролювати заповнення контексту, щоб не повторилась помилка:

```text
Codex ran out of room in the model's context window. Start a new thread or clear earlier history before retrying. stream disconnected before completion: websocket closed by server before response.completed
```

Правило подальшої роботи:

- після кожної суттєвої дії продовжувати оновлювати цей файл як основне джерело правди;
- якщо контекст чату стане надто великим, попередити користувача до ризикового моменту і підготувати короткий пакет для продовження у новому чаті;
- у пакеті для нового чату обовʼязково вказувати:
  - поточний стан;
  - які команди вже виконані;
  - які помилки були і що не повторювати;
  - які файли головні;
  - один наступний крок.

Обмеження:

- точний відсоток заповнення контексту може бути недоступний у самому чаті;
- практичний контроль: коли історія стає довгою або перед великим блоком роботи, зупинятись і переносити стан у файл/короткий підсумок.

Що не робити:

- не продовжувати довгу роботу без оновлення журналу;
- не покладатися тільки на памʼять чату;
- не починати новий великий етап без короткого контрольного стану.

### 2026-06-01 - перша regex-правка SafeField на MESER не спрацювала

Стан зі скріну користувача у віддаленій PowerShell-сесії `[192.168.0.5]`:

- користувач вставив блок для заміни `SafeField(selection, fieldName)`;
- змінна `$newSafeField` була введена;
- regex-пошук повернув незмінений текст;
- команда перевірки вивела помилку:

```text
SafeField was not changed
```

Висновок:

- файл не був коректно змінений цим regex-шаблоном;
- причина ймовірно у відмінності переносів/пробілів навколо `Function SafeText` у файлі MESER;
- backup уже існує, тому наступний безпечний шлях - замінити блок за позиціями: від `Function SafeField` до `Function SafeText`.

Що не робити:

- не запускати export після цієї невдалої правки;
- не видаляти backup;
- не редагувати CSV вручну;
- не повторювати той самий regex-блок.

### 2026-06-01 - друга правка SafeField не знайшла функцію через кодування/пошук

Стан зі скріну користувача у віддаленій PowerShell-сесії `[192.168.0.5]`:

- команда пошуку позицій повернула помилки:

```text
Start of SafeField not found
Start of SafeText not found
Length cannot be less than zero
```

- після цього була виконана команда:

```powershell
[System.IO.File]::WriteAllText($path, $updated, [System.Text.Encoding]::Unicode)
```

Ризик:

- активний файл `D:\CRM\Exports\export-1c-operational-data.vbs` міг бути перезаписаний старим/некоректно прочитаним вмістом;
- backup існує і має правильний розмір, тому найкращий наступний крок - відновити активний файл із backup перед новою спробою.

Ймовірна причина:

- файл MESER не читається коректно через `[System.Text.Encoding]::Unicode`; треба працювати через `Get-Content -Encoding UTF8` / `Set-Content -Encoding UTF8` або через простішу перевірку тексту.

Що не робити:

- не запускати export у поточному стані;
- не продовжувати правку без відновлення з backup;
- не використовувати знову `ReadAllText(... Encoding::Unicode)` для активного VBS.

### 2026-06-01 - active VBS на MESER відновлено з backup

Стан зі скріну користувача у віддаленій PowerShell-сесії `[192.168.0.5]`:

- виконано відновлення:

```powershell
Copy-Item 'D:\CRM\Exports\export-1c-operational-data.vbs.bak-before-field-fix' 'D:\CRM\Exports\export-1c-operational-data.vbs' -Force
```

- перевірка показала:

```text
D:\CRM\Exports\export-1c-operational-data.vbs:353:Function SafeField(selection, fieldName)
D:\CRM\Exports\export-1c-operational-data.vbs:358:  value = selection.Get(fieldName)
D:\CRM\Exports\export-1c-operational-data.vbs:373:Function SafeText(value)
```

Висновок:

- активний файл повернутий у коректний стан;
- наступна правка має бути меншою: не заміна всієї функції, а тільки заміна блока fallback `value = ""` всередині `SafeField`;
- використовувати `Get-Content -Encoding UTF8` / `Set-Content -Encoding UTF8`, бо PS-wrapper читає VBS source як UTF-8.

Що не робити:

- не запускати export до успішної перевірки `selection.Quantity`, `selection.Amount`, `selection.WarehouseName`;
- не використовувати `ReadAllText(... Encoding::Unicode)` для цього файлу;
- не видаляти backup.

### 2026-06-01 - SafeField fallback успішно внесено у VBS на MESER

Стан зі скріну користувача у віддаленій PowerShell-сесії `[192.168.0.5]`:

- мала заміна fallback-блока у `D:\CRM\Exports\export-1c-operational-data.vbs` виконалась;
- перевірка:

```powershell
Select-String -Path $path -Pattern 'selection.Quantity','selection.Amount','selection.WarehouseName'
```

показала:

```text
D:\CRM\Exports\export-1c-operational-data.vbs:376: value = selection.WarehouseName
D:\CRM\Exports\export-1c-operational-data.vbs:388: value = selection.Quantity
D:\CRM\Exports\export-1c-operational-data.vbs:392: value = selection.Amount
```

Висновок:

- активний operational exporter на MESER тепер має fallback-доступ до властивостей selection;
- наступний тест має бути малим: перезапустити тільки `stock` export і перевірити перші рядки `1c_stock_balances.csv`;
- якщо у CSV зʼявляться `entity_name`, `warehouse_name`, `quantity`, тоді запускати `all` і потім повторний Ubuntu import.

Що не робити:

- не запускати Ubuntu import до перевірки нового CSV;
- не видаляти backup `export-1c-operational-data.vbs.bak-before-field-fix`;
- не вводити 1C логін/пароль, використовувати connection string без них.

### 2026-06-01 - test `stock` export після SafeField fix успішний

Стан зі скріну користувача у віддаленій PowerShell-сесії `[192.168.0.5]`:

- виконано connection string без логіна/пароля:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";'
```

- виконано малий export тільки stock:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\export-1c-operational-data.ps1' -Set stock -OutputDir 'D:\CRM\Exports'
```

- export завершився:

```text
OK: stock_balances, rows=2260
OK: reserved_stock_balances, rows=0
Done. Summary: D:\CRM\Exports\export_1c_operational_summary.csv
```

- перевірка перших рядків:

```powershell
Get-Content -Path 'D:\CRM\Exports\1c_stock_balances.csv' -Encoding Unicode -TotalCount 5
```

показала, що CSV більше не порожній після `row_no`; зʼявились:

- `period_at`;
- `entity_code`;
- `entity_name`;
- `warehouse_name`;
- `quantity`;
- `reserved_quantity`;
- `amount`.

Висновок:

- проблема operational exporter була саме у читанні полів selection;
- SafeField fallback fix на MESER працює для `stock_balances`;
- наступний крок - окремо перевірити `counterparty_settlements`, бо для CRM потрібні дебіторка/кредиторка також.

Що не робити:

- не запускати Ubuntu import до перевірки `1c_counterparty_settlements.csv`;
- не турбуватися через garbled `variant` у консолі, це тільки кодування тексту виводу;
- не редагувати CSV вручну.

### 2026-06-01 - test `settlements` export після SafeField fix успішний

Стан зі скріну користувача у віддаленій PowerShell-сесії `[192.168.0.5]`:

- виконано export тільки взаєморозрахунків:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\export-1c-operational-data.ps1' -Set settlements -OutputDir 'D:\CRM\Exports'
```

- export завершився:

```text
OK: counterparty_settlements, rows=412
Done. Summary: D:\CRM\Exports\export_1c_operational_summary.csv
```

- перевірка перших рядків:

```powershell
Get-Content -Path 'D:\CRM\Exports\1c_counterparty_settlements.csv' -Encoding Unicode -TotalCount 5
```

показала реальні дані:

- `period_at`;
- код і назва контрагента;
- код і назва договору;
- організація;
- сума `amount`, включно з відʼємними значеннями.

Висновок:

- SafeField fallback fix працює для `counterparty_settlements`;
- operational CSV тепер містять реальні бізнес-дані, а не тільки `row_no`;
- наступний правильний крок - виконати повний export `-Set all`, щоб оновити всі operational CSV одним проходом перед повторним Ubuntu import.

Що не робити:

- не запускати Ubuntu import до повного `-Set all` або явного рішення імпортувати вже наявні CSV;
- не редагувати CSV вручну;
- не видаляти backup VBS.

### 2026-06-01 - повний operational export на MESER успішний після SafeField fix

Стан зі скріну користувача у віддаленій PowerShell-сесії `[192.168.0.5]`:

- виконано повний export:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\export-1c-operational-data.ps1' -Set all -OutputDir 'D:\CRM\Exports'
```

- exporter завершився без критичних помилок:

```text
OK: stock_balances, rows=2260
OK: reserved_stock_balances, rows=0
OK: counterparty_settlements, rows=412
Done. Summary: D:\CRM\Exports\export_1c_operational_summary.csv
```

- summary через `Import-Csv ... | Format-Table` показав:

```text
stock_balances             processed  2260
reserved_stock_balances    processed  0
counterparty_settlements   processed  412
```

Висновок:

- MESER-етап operational export завершено успішно;
- CSV у `D:\CRM\Exports` оновлені після виправлення `SafeField`;
- можна переходити до повторного Ubuntu import через HTTP `http://192.168.0.5:8090/...`.

Наступний правильний крок:

- вийти з MESER PowerShell Remoting сесії командою `exit`;
- підключитись до Ubuntu `crmadmin@192.168.0.166`;
- запустити `cd ~/SQL && USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh`.

Що не робити:

- не перезапускати Windows export без потреби;
- не чистити PostgreSQL перед import;
- не редагувати CSV вручну;
- не видаляти backup VBS.

### 2026-06-01 - MESER і Ubuntu відкриті паралельно

Стан:

- користувач повідомив, що має паралельно два відкриті вікна:
  - MESER / PowerShell Remoting `[192.168.0.5]`;
  - Ubuntu `crmadmin@crm-sql`.

Висновок:

- виходити з MESER-сесії не обовʼязково;
- MESER можна залишити відкритим для контролю файлів `D:\CRM\Exports`;
- наступна робоча дія виконується в Ubuntu: повторний import оновлених operational CSV у PostgreSQL.

Наступний крок:

```bash
cd ~/SQL && USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh
```

Що не робити:

- не запускати повторно Windows export, бо він уже успішний;
- не закривати MESER примусово;
- не чистити PostgreSQL перед import.

### 2026-06-01 - повторний Ubuntu import operational CSV успішний після виправлення MESER exporter

Стан зі скріну користувача у Ubuntu `crmadmin@crm-sql:~/SQL`:

- виконано повторний import оновлених CSV з MESER HTTP:

```bash
cd ~/SQL && USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh
```

- імпорт пройшов без критичних помилок:

```text
1c_stock_balances.csv: COPY 2260, INSERT 0 2260
1c_reserved_stock_balances.csv: COPY 0, INSERT 0 0
1c_counterparty_settlements.csv: COPY 412, INSERT 0 412
```

- фінальна таблиця вже показує ненульові бізнес-значення:

```text
counterparty_settlements    rows=412     quantity=0.000       reserved_quantity=0.000   amount=-86786089.06
stock_balances              rows=2260    quantity=1605347.027 reserved_quantity=0.000   amount=0.00
```

Висновок:

- виправлення `SafeField` на MESER вирішило проблему порожніх operational CSV;
- PostgreSQL importer тепер отримує реальні числові дані;
- у `one_c_mirror` вже є актуальні залишки товарів і взаєморозрахунки для майбутньої CRM.

Наступний правильний крок:

- виконати контрольний SQL-запит на sample rows із `one_c_mirror.latest_operational_rows`, щоб побачити живі рядки товарів/контрагентів у PostgreSQL.

Що не робити:

- не перезапускати MESER export без потреби;
- не чистити таблиці `one_c_mirror`;
- не запускати нормалізацію в майбутні `core`-таблиці CRM, поки не подивились sample rows.

### 2026-06-01 - sample rows у PostgreSQL для counterparty_settlements підтверджені

Стан зі скріну користувача в Ubuntu `crmadmin@crm-sql:~/SQL`:

- виконано контрольний SQL-запит до:

```text
one_c_mirror.latest_operational_rows
```

- результат відкрився у pager `(END)`;
- у вибірці видно реальні рядки `counterparty_settlements`:
  - `entity_code`;
  - `entity_name`;
  - `contract_name`;
  - `amount` з додатними і відʼємними значеннями.

Висновок:

- PostgreSQL містить не тільки агрегати, а й живі operational rows для взаєморозрахунків;
- попередній `LIMIT 12` показав тільки `counterparty_settlements`, бо сортування почалось із цього dataset;
- треба окремо перевірити sample rows для `stock_balances`.

Наступний крок:

- вийти з pager клавішею `q`;
- виконати окремий запит для `stock_balances` з `-P pager=off`.

Що не робити:

- не натискати `Ctrl+C`, якщо достатньо `q` для виходу з `(END)`;
- не запускати повторний import/export;
- не чистити `one_c_mirror`.

### 2026-06-01 - sample rows у PostgreSQL для stock_balances підтверджені

Стан зі скріну користувача в Ubuntu `crmadmin@crm-sql:~/SQL`:

- після успішного operational import виконано контрольний запит:

```bash
sudo -u postgres psql -d crm_hub -P pager=off -c "SELECT row_no, entity_code, left(entity_name, 55) AS product, warehouse_name, quantity FROM one_c_mirror.latest_operational_rows WHERE dataset_name = 'stock_balances' ORDER BY row_no LIMIT 12;"
```

- результат показав живі рядки товарних залишків:
  - `row_no` 1..12;
  - `entity_code`, наприклад `8607067`, `868609565`;
  - назви товарів, наприклад `Рушниця напівавтоматична CORE Impactor...`, `МЧ-1 р.44...`;
  - `warehouse_name = Склад №1`;
  - `quantity`, наприклад `3.000`, `2.000`, `1.000`, `5.000`, `7.000`.

Висновок:

- operational export/import повністю підтверджено на рівні PostgreSQL для:
  - залишків товарів по складах;
  - взаєморозрахунків з контрагентами;
- проблема порожніх CSV вирішена виправленням `SafeField` у MESER VBS exporter;
- `one_c_mirror.latest_operational_rows` готовий як сирий, але стабільний шар для майбутньої CRM.

Наступний логічний етап:

- створити або перевірити CRM-ready views/таблиці поверх `one_c_mirror`, щоб майбутня CRM брала не сирий mirror, а зрозумілі обʼєкти:
  - товари;
  - склади;
  - залишки товарів по складах;
  - контрагенти;
  - договори;
  - взаєморозрахунки / дебіторка-кредиторка.

Що не робити:

- не видаляти `one_c_mirror`;
- не чистити імпортовані operational rows;
- не запускати повторний MESER export/import без потреби;
- не редагувати CSV вручну.

### 2026-06-01 - створено локальну migration 003 з CRM-ready views

Зміна в локальному репозиторії:

```text
D:\Codex\CRM\SQL\db\migrations\003_one_c_crm_ready_views.sql
```

Що створює migration:

- `one_c_mirror.crm_products` - товари для CRM, беруться з catalog mirror і/або operational stock rows;
- `one_c_mirror.crm_warehouses` - склади для CRM;
- `one_c_mirror.crm_counterparties` - контрагенти;
- `one_c_mirror.crm_counterparty_contracts` - договори контрагентів;
- `one_c_mirror.crm_stock_balances` - залишки товарів по складах;
- `one_c_mirror.crm_counterparty_settlements` - рядки взаєморозрахунків;
- `one_c_mirror.crm_counterparty_balance_summary` - агрегований баланс по контрагенту/договору/організації.

Принцип:

- це read-only SQL views поверх `one_c_mirror`;
- сирі CSV/import rows не змінюються;
- `core.*` таблиці майбутньої CRM не заповнюються напряму, поки не буде остаточної CRM-моделі;
- для сум взаєморозрахунків поки використовується `balance_sign = positive/negative/zero`, без передчасного трактування знака як дебіторка або кредиторка.

Наступний крок:

- передати цю migration на Ubuntu або вставити SQL у файл `~/SQL/db/migrations/003_one_c_crm_ready_views.sql`;
- застосувати через `sudo -u postgres psql -d crm_hub -v ON_ERROR_STOP=1 -f ~/SQL/db/migrations/003_one_c_crm_ready_views.sql`;
- перевірити counts у нових views.

Що не робити:

- не переносити ці дані в `core.stock_balances` напряму;
- не перейменовувати знак боргу в дебіторку/кредиторку без підтвердження бізнес-логіки 1C;
- не видаляти `one_c_mirror` і не чистити імпортовані batch rows.

### 2026-06-01 - локальний Codex не має прямого доступу до MESER `D:\CRM\Exports`

Перевірка в локальному середовищі Codex:

```powershell
Test-Path -LiteralPath D:\CRM\Exports
```

Результат:

```text
False
```

Висновок:

- шлях `D:\CRM\Exports` існує на MESER, але не в локальному workspace Codex;
- Codex не може напряму покласти `003_one_c_crm_ready_views.sql` у MESER HTTP-папку;
- для передачі migration на Ubuntu потрібен один із варіантів:
  - `Copy-Item -ToSession` з локального PowerShell у MESER `D:\CRM\Exports`;
  - або вставка SQL у файл на Ubuntu через heredoc;
  - або інший файловий канал користувача.

Що не робити:

- не вважати, що `D:\CRM\Exports` локальний;
- не пробувати писати туди з Codex без явного віддаленого каналу;
- не застосовувати migration 003 на Ubuntu, доки файл туди не передано.

### 2026-06-01 - локальний файл migration 003 підтверджено

Стан:

- користувач у локальному Windows PowerShell виконав:

```powershell
Test-Path 'D:\Codex\CRM\SQL\db\migrations\003_one_c_crm_ready_views.sql'
```

- результат:

```text
True
```

Висновок:

- migration `003_one_c_crm_ready_views.sql` існує локально;
- наступний крок - передати файл на Ubuntu `192.168.0.166` у:

```text
/home/crmadmin/SQL/db/migrations/003_one_c_crm_ready_views.sql
```

Що не робити:

- ще не виконувати migration у PostgreSQL;
- не копіювати файл на MESER, якщо можна передати напряму на Ubuntu через `scp`;
- не змінювати вже імпортовані `one_c_mirror` дані.

### 2026-06-01 - migration 003 передано на Ubuntu

Стан:

- користувач виконав передачу файлу з локального Windows на Ubuntu:

```powershell
scp "D:\Codex\CRM\SQL\db\migrations\003_one_c_crm_ready_views.sql" crmadmin@192.168.0.166:/home/crmadmin/SQL/db/migrations/003_one_c_crm_ready_views.sql
```

- користувач повідомив: `є`;
- отже файл має бути на Ubuntu за шляхом:

```text
/home/crmadmin/SQL/db/migrations/003_one_c_crm_ready_views.sql
```

Наступний крок:

- у Ubuntu застосувати migration 003 через PostgreSQL;
- migration створює тільки read-only views у `one_c_mirror`, не чистить і не переписує імпортовані дані.

Що не робити:

- не запускати повторний MESER export/import;
- не чистити `one_c_mirror`;
- не переносити дані напряму в `core.*` до перевірки views.

### 2026-06-01 - migration 003 застосовано на Ubuntu

Стан:

- користувач у Ubuntu виконав застосування migration:

```bash
cd ~/SQL && sudo -u postgres psql -d crm_hub -v ON_ERROR_STOP=1 -f db/migrations/003_one_c_crm_ready_views.sql
```

- користувач повідомив: `є`.

Висновок:

- CRM-ready views у `one_c_mirror` імовірно створені;
- треба виконати контрольний запит на кількість рядків у кожному view.

Наступний крок:

- перевірити counts для:
  - `crm_products`;
  - `crm_warehouses`;
  - `crm_counterparties`;
  - `crm_counterparty_contracts`;
  - `crm_stock_balances`;
  - `crm_counterparty_settlements`;
  - `crm_counterparty_balance_summary`.

Що не робити:

- не переносити дані в `core.*` до перевірки цих views;
- не запускати повторний import/export;
- не чистити `one_c_mirror`.

### 2026-06-01 - CRM-ready views створені і counts підтверджені

Стан зі скріну користувача в Ubuntu `crmadmin@crm-sql:~/SQL`:

- застосування migration 003 пройшло успішно:

```text
BEGIN
CREATE VIEW
CREATE VIEW
CREATE VIEW
CREATE VIEW
CREATE VIEW
CREATE VIEW
CREATE VIEW
COMMIT
```

- контрольний запит counts по views показав:

```text
crm_products                       1797
crm_warehouses                     3
crm_counterparties                 244
crm_counterparty_contracts         412
crm_stock_balances                 2260
crm_counterparty_settlements       412
crm_counterparty_balance_summary   412
```

Висновок:

- `one_c_mirror.crm_*` views створені і наповнені даними;
- для майбутньої CRM вже є read-only шар:
  - товари;
  - склади, які присутні в operational залишках;
  - контрагенти;
  - договори;
  - залишки товарів по складах;
  - взаєморозрахунки;
  - агрегований баланс;
- `crm_warehouses = 3` треба пізніше окремо звірити з catalog mirror `1c_warehouses.csv`, бо в operational rows можуть бути тільки склади з ненульовими залишками.

Що не робити:

- не вважати `crm_warehouses = 3` помилкою без додаткової звірки;
- не переносити дані в `core.*` напряму;
- не видаляти `one_c_mirror` і batch history;
- не запускати повторний export/import без потреби.

Наступний правильний крок:

- подивитися sample rows із `crm_stock_balances` і `crm_counterparty_balance_summary`, щоб переконатися, що CRM-ready views читаються зручними полями.

### 2026-06-01 - sample `crm_stock_balances` візуально підтверджено

Стан:

- користувач повідомив: `є добре` після запиту до:

```text
one_c_mirror.crm_stock_balances
```

Висновок:

- CRM-ready view для товарних залишків читається коректно;
- наступний контрольний блок - `one_c_mirror.crm_counterparty_balance_summary`, тобто взаєморозрахунки/баланс контрагентів для майбутньої CRM.

Що не робити:

- не переносити дані в `core.stock_balances` напряму;
- не змінювати знак сум дебіторки/кредиторки без бізнес-підтвердження;
- не запускати повторний export/import без потреби.

### 2026-06-01 - створено read-only web viewer для перевірки всіх mirror/CRM таблиць

Зміна в локальному репозиторії:

```text
D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-crm-viewer.py
```

Призначення:

- маленька web-переглядалка тільки для перевірки даних;
- нічого не редагує і нічого не записує в PostgreSQL;
- при старті завантажує дані з PostgreSQL у вкладки.

Вкладки:

- CRM-ready:
  - `Товари` -> `one_c_mirror.crm_products`;
  - `Склади` -> `one_c_mirror.crm_warehouses`;
  - `Залишки` -> `one_c_mirror.crm_stock_balances`;
  - `Контрагенти` -> `one_c_mirror.crm_counterparties`;
  - `Договори` -> `one_c_mirror.crm_counterparty_contracts`;
  - `Взаєморозрахунки` -> `one_c_mirror.crm_counterparty_settlements`;
  - `Баланс` -> `one_c_mirror.crm_counterparty_balance_summary`.

- Технічні перевірочні:
  - `Довідники latest` -> `one_c_mirror.latest_rows`;
  - `Довідники raw` -> `one_c_mirror.raw_rows`;
  - `Batches довідників` -> `one_c_mirror.import_batches`;
  - `Операційні latest` -> `one_c_mirror.latest_operational_rows`;
  - `Операційні raw` -> `one_c_mirror.operational_rows`;
  - `Batches операційні` -> `one_c_mirror.operational_batches`.

Можливості UI:

- вкладки;
- пошук по всіх колонках активної вкладки;
- сторінки 25/50/100/250 рядків;
- сортування кліком по заголовку;
- підсумки кількості/суми/резерву для поточної вкладки.

Перевірка:

- локальний syntax check виконано bundled Python:

```powershell
C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m py_compile D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-crm-viewer.py
```

- результат: без помилок.

Що не робити:

- не використовувати переглядалку як CRM або редактор;
- не відкривати порт назовні без VPN/локальної мережі;
- не запускати її замість імпорту: вона тільки читає вже імпортовані дані.

### 2026-06-01 - web viewer передано на Ubuntu

Стан:

- користувач виконав передачу файлу:

```powershell
scp "D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-crm-viewer.py" crmadmin@192.168.0.166:/home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py
```

- користувач повідомив: `є`.

Висновок:

- viewer-файл має бути на Ubuntu:

```text
/home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py
```

Наступний крок:

- у Ubuntu надати execute permission і запустити viewer на `0.0.0.0:8091`, щоб його можна було відкрити з Windows/VPN через `http://192.168.0.166:8091/`.

Що не робити:

- не закривати Ubuntu-вікно після запуску viewer у foreground;
- не використовувати viewer для редагування даних, він read-only;
- не відкривати порт поза VPN/локальною мережею.

### 2026-06-01 - web viewer запущено на Ubuntu

Стан:

- користувач у Ubuntu виконав запуск:

```bash
cd ~/SQL
chmod +x scripts/ubuntu/run-1c-crm-viewer.py
USE_POSTGRES_SUDO=1 python3 scripts/ubuntu/run-1c-crm-viewer.py --host 0.0.0.0 --port 8091
```

- користувач повідомив: `є`.

Висновок:

- read-only переглядалка має працювати на Ubuntu `192.168.0.166`, порт `8091`;
- URL для відкриття з Windows/VPN:

```text
http://192.168.0.166:8091/
```

Що перевірити в UI:

- вкладки відкриваються;
- пошук працює;
- `Залишки` містить товари/склади/кількість;
- `Баланс` або `Взаєморозрахунки` містить контрагентів/договори/суми;
- технічні вкладки `raw/latest/batches` доступні для аудиту імпорту.

Що не робити:

- не закривати Ubuntu-вікно з viewer, поки він потрібен;
- не вважати viewer CRM: це тільки перевірочний read-only інструмент;
- не відкривати порт за межі VPN/локальної мережі.

### 2026-06-01 - нові вимоги: віддалена переглядалка і автоматизація синхронізації

Стан:

- web viewer на Ubuntu працює і відкривається;
- користувач підтвердив: `є`;
- користувач поставив два наступні завдання:

1. Створити переглядалку для аналізу даних з різних компʼютерів, навіть не з однієї мережі, щоб бачити які дані заходять у SQL.
2. Автоматизувати заливання даних з 1C у SQL, наприклад раз на годину, і мати кнопку/ручний запуск негайно для контролю змін.

Попередній технічний висновок:

- поточна переглядалка read-only і без авторизації, тому її не можна безпечно відкривати в інтернет напряму;
- для доступу з різних мереж потрібен один із безпечних каналів:
  - VPN/Tailscale/WireGuard/ZeroTier;
  - або HTTPS reverse proxy/tunnel з авторизацією;
- автоматизацію краще робити двома частинами:
  - MESER: Scheduled Task експортує CSV з 1C у `D:\CRM\Exports`;
  - Ubuntu: cron/systemd timer імпортує CSV з `http://192.168.0.5:8090` у PostgreSQL;
- кнопка `Оновити зараз` у viewer може безпечно запускати Ubuntu import, але повний негайний цикл з 1C потребує також запуску export на MESER.

Що не робити:

- не відкривати PostgreSQL назовні;
- не відкривати поточну переглядалку в інтернет без пароля/HTTPS/VPN;
- не давати кнопці без авторизації запускати імпорт;
- не зберігати 1C логін/пароль, бо connection string працює без них.
### 2026-06-01 - старт блоку: віддалена переглядалка і автоматизація 1C -> SQL

Поточний стан перед доробкою:

- MESER / 1C сервер: `192.168.0.5`.
- Ubuntu / PostgreSQL сервер: `192.168.0.166`.
- 1C connection string працює без логіна і пароля:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";'
```

- Операційні дані вже успішно експортувались з 1C і імпортувались у PostgreSQL:
  - `stock_balances`: 2260 рядків;
  - `reserved_stock_balances`: 0 рядків, це не помилка;
  - `counterparty_settlements`: 412 рядків.
- У PostgreSQL створені CRM-ready views:
  - `one_c_mirror.crm_products`;
  - `one_c_mirror.crm_warehouses`;
  - `one_c_mirror.crm_counterparties`;
  - `one_c_mirror.crm_counterparty_contracts`;
  - `one_c_mirror.crm_stock_balances`;
  - `one_c_mirror.crm_counterparty_settlements`;
  - `one_c_mirror.crm_counterparty_balance_summary`.
- Web viewer вже працював на Ubuntu на `http://192.168.0.166:8091/`.

Нові задачі:

1. Зробити переглядалку з доступом з різних комп'ютерів для аналізу всіх даних, що зайшли в SQL.
2. Автоматизувати цикл 1C -> CSV -> PostgreSQL раз на годину і залишити ручний запуск "зараз".

Що не робити:

- не відкривати PostgreSQL напряму в інтернет;
- не відкривати viewer назовні без VPN/пароля/HTTPS;
- не додавати 1C логін/пароль, бо робочий варіант вже без них;
- не вважати viewer CRM: це тільки read-only контрольна переглядалка.

### 2026-06-01 - MESER export: ручний запуск і Windows Scheduled Task

Створено/оновлено:

- `scripts/windows/run-1c-export-now.ps1`
  - один ручний запуск повного експорту з 1C;
  - експортує довідники `base`, довідники `next` і операційні дані `all`;
  - пише лог у `D:\CRM\Exports\run_1c_export_now.log`;
  - якщо connection string не заданий, використовує no-login варіант:

```powershell
Srvr="192.168.0.5";Ref="elista";
```

- `scripts/windows/install-1c-export-scheduled-task.ps1`
  - створює Windows Scheduled Task `CRM 1C Export Hourly`;
  - за замовчуванням запускає `D:\CRM\Exports\run-1c-export-now.ps1` раз на годину;
  - має параметр `-RunNow` для негайного запуску задачі після створення.

Також виправлено:

- `scripts/windows/export-1c-catalogs.ps1`;
- `scripts/windows/export-1c-operational-data.ps1`.

Тепер при порожньому `CRM_1C_CONNECTION_STRING` вони не вимагають логін/пароль, а використовують no-login connection string.

Що не робити:

- не підставляти `Usr=` і `Pwd=` у connection string без потреби;
- не створювати кілька різних Scheduled Task для одного й того самого експорту;
- не запускати експорт кожні кілька хвилин, поки не зрозуміємо навантаження на 1C. Стартовий режим: 1 раз на годину.

### 2026-06-01 - Ubuntu import: ручний запуск і systemd timer

Створено:

- `scripts/ubuntu/run-1c-import-now.sh`
  - ручний запуск повного імпорту CSV у PostgreSQL;
  - виконує імпорт довідників через `import-1c-catalogs-http.sh`;
  - виконує імпорт залишків/взаєморозрахунків через `import-1c-operational-http.sh`;
  - після імпорту оновлює CRM-ready views через `db/migrations/003_one_c_crm_ready_views.sql`;
  - наприкінці показує кількість рядків у контрольних views;
  - лог за замовчуванням: `/tmp/crm-1c-import-now.log`.

- `scripts/ubuntu/install-1c-import-systemd-timer.sh`
  - встановлює `crm-1c-import.service`;
  - встановлює `crm-1c-import.timer`;
  - таймер запускає імпорт раз на годину;
  - ручний негайний запуск після встановлення:

```bash
sudo systemctl start crm-1c-import.service
```

Архітектура автоматизації:

- MESER кожну годину оновлює CSV з 1C у `D:\CRM\Exports`;
- Ubuntu кожну годину забирає CSV з `http://192.168.0.5:8090` і пише у PostgreSQL;
- viewer читає тільки PostgreSQL і не редагує дані.

Що не робити:

- не запускати імпорт напряму від випадкового користувача без розуміння `USE_POSTGRES_SUDO`;
- не відкривати PostgreSQL назовні для viewer;
- не робити кнопку viewer, яка напряму лізе у 1C без окремо захищеного механізму.

### 2026-06-01 - viewer: пароль, всі таблиці, кнопки оновлення

Оновлено:

- `scripts/ubuntu/run-1c-crm-viewer.py`.

Можливості viewer:

- read-only перегляд CRM-ready views;
- технічні вкладки для перевірки `raw/latest/batches`;
- пошук по активній вкладці;
- сортування по колонках;
- пагінація;
- HTTP Basic Auth через:

```bash
CRM_VIEWER_USER=...
CRM_VIEWER_PASSWORD=...
```

- кнопка `Оновити з SQL`: перезчитує дані з PostgreSQL без запуску імпорту;
- кнопка `Імпорт зараз`: вимкнена за замовчуванням і вмикається тільки якщо задано:

```bash
CRM_VIEWER_IMPORT_COMMAND='sudo -n systemctl start crm-1c-import.service'
```

Важливо:

- кнопка `Імпорт зараз` запускає Ubuntu-імпорт CSV у PostgreSQL;
- оновлення CSV з самої 1C на MESER робить Windows Scheduled Task або ручний MESER script;
- повний цикл такий: MESER export -> Ubuntu import -> viewer refresh.

Що не робити:

- не запускати viewer без пароля, якщо доступ буде не тільки локальний/VPN;
- не давати viewer довільну shell-команду з інтернету;
- не вмикати `CRM_VIEWER_IMPORT_COMMAND` без налаштованого `crm-1c-import.service`.

### 2026-06-01 - viewer як Ubuntu systemd service

Створено:

- `scripts/ubuntu/install-1c-viewer-systemd-service.sh`.

Що робить installer:

- встановлює `crm-1c-viewer.service`;
- запускає viewer як постійний сервіс на Ubuntu;
- слухає `0.0.0.0:8091`, тобто доступний з інших комп'ютерів у VPN/локальній мережі;
- вмикає HTTP Basic Auth;
- створює protected env file `/etc/crm-1c-viewer.env` з правами `0600`;
- вмикає кнопку `Імпорт зараз` через команду:

```bash
systemctl start crm-1c-import.service
```

Важливо:

- пароль viewer не записувати в чат;
- пароль задавати тільки у терміналі Ubuntu через `VIEWER_PASSWORD='...'`;
- viewer service поки запускається як `root`, бо йому треба читати PostgreSQL через `sudo -u postgres` і запускати import service. Це прийнятно тільки в закритому VPN/локальному контурі, не для публічного інтернету.

Що не робити:

- не відкривати порт `8091` напряму у публічний інтернет;
- не ставити простий пароль типу `123`;
- не запускати viewer service без `crm-1c-import.service`, якщо потрібна кнопка `Імпорт зараз`.

### 2026-06-01 - перевірки синтаксису і очищення старих підказок

Перевірено локально:

- PowerShell parser OK:
  - `scripts/windows/run-1c-export-now.ps1`;
  - `scripts/windows/install-1c-export-scheduled-task.ps1`;
  - `scripts/windows/export-1c-catalogs.ps1`;
  - `scripts/windows/export-1c-operational-data.ps1`.
- Python compile OK:
  - `scripts/ubuntu/run-1c-crm-viewer.py`.
- `git diff --check` OK для змінених файлів.

Не перевірено локально:

- Bash syntax для Ubuntu scripts, бо на локальному Windows немає встановленого WSL/Linux shell.
- Перевірити вже на Ubuntu:

```bash
cd ~/SQL
bash -n scripts/ubuntu/run-1c-import-now.sh
bash -n scripts/ubuntu/install-1c-import-systemd-timer.sh
bash -n scripts/ubuntu/install-1c-viewer-systemd-service.sh
```

Додатково виправлено:

- `scripts/windows/check-meser-1c-export-state.ps1`;
- стара підказка з `Usr="<1C_USER>";Pwd="<1C_PASSWORD>";` замінена на no-login:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";'
```

Що не робити:

- не повертати старі placeholder-и `USER/PASSWORD`;
- не запускати Bash scripts без `bash -n` на Ubuntu після копіювання;
- не вважати локальну Windows-перевірку достатньою для systemd-скриптів.

Додатково очищено:

- видалено локальний `scripts/ubuntu/__pycache__`, який створився після Python compile-перевірки;
- цей кеш не потрібен для архіву і не потрібен для роботи на Ubuntu.

### 2026-06-01 - створено runbook автоматизації

Створено:

- `docs/one-c-automation.md`.

У документі описано:

- загальну схему MESER -> HTTP CSV -> Ubuntu -> PostgreSQL -> Viewer;
- які файли копіювати на MESER;
- які файли копіювати на Ubuntu;
- як запускати експорт з 1C вручну;
- як встановити MESER Scheduled Task раз на годину;
- як запускати імпорт у PostgreSQL вручну;
- як встановити Ubuntu systemd timer раз на годину;
- як встановити viewer як Ubuntu service з паролем;
- що роблять кнопки `Оновити з SQL` і `Імпорт зараз`;
- що не робити.

Цей файл треба брати в архів разом із `docs/crm-sql-work-log-2026-06-01.md`.

### 2026-06-01 - негативна спроба: Copy-Item всередині MESER PSSession

Ситуація:

- користувач був у PowerShell Remoting сесії MESER:

```text
[192.168.0.5]: PS C:\Users\zahar\Documents>
```

- була спроба виконати:

```powershell
Copy-Item 'D:\Codex\CRM\SQL\scripts\windows\...' 'D:\CRM\Exports\' -Force
```

Результат:

- помилка `Cannot find path 'D:\Codex\CRM\SQL\...' because it does not exist`;
- причина: команда виконувалась вже всередині MESER, а шлях `D:\Codex\CRM\SQL` існує на локальному Codex-комп'ютері, не на MESER.

Що не робити:

- не копіювати з `D:\Codex\CRM\SQL` перебуваючи в prompt `[192.168.0.5]:`;
- не створювати вручну папку `D:\Codex` на MESER для обходу цієї помилки.

Правильний спосіб:

- вийти з PSSession назад у локальний PowerShell;
- створити remote session у змінну `$s`;
- копіювати локальні файли на MESER через `Copy-Item -ToSession $s`.

### 2026-06-01 - користувач відкрив окреме PowerShell-вікно

Стан:

- користувач повідомив: `я зайшов в окреме вікно повершелл`;
- перед копіюванням треба перевірити, де саме це вікно працює:
  - локальний комп'ютер з `D:\Codex\CRM\SQL`;
  - або MESER/інша сесія, де цього шляху може не бути.

Наступна дія:

- перевірити prompt і наявність локального файлу `D:\Codex\CRM\SQL\scripts\windows\run-1c-export-now.ps1`.

Що не робити:

- не продовжувати `Copy-Item 'D:\Codex\CRM\SQL\...'`, якщо `Test-Path` покаже `False`;
- не копіювати з локального шляху, якщо prompt починається з `[192.168.0.5]:`.

Результат перевірки:

```powershell
Test-Path 'D:\Codex\CRM\SQL\scripts\windows\run-1c-export-now.ps1'
```

Повернуло:

```text
True
```

Висновок:

- поточне окреме PowerShell-вікно бачить локальний репозиторій;
- з нього можна копіювати файли на MESER через `Copy-Item -ToSession`.

Наступний крок виконано користувачем:

```powershell
$cred = Get-Credential 'fresh\zahar'
```

Стан:

- користувач повідомив `є`;
- облікові дані для MESER мають бути збережені у змінній `$cred` в цьому PowerShell-вікні;
- пароль у чат не передавався і не має фіксуватися у файлах.

Наступний крок:

- користувач створив PSSession `$s` до MESER і повідомив `є`;
- сесія вважається робочою для `Copy-Item -ToSession`.

Далі треба копіювати Windows scripts:

- `export-1c-catalogs.ps1`;
- `export-1c-catalogs.vbs`;
- `export-1c-operational-data.ps1`;
- `export-1c-operational-data.vbs`;
- `run-1c-export-now.ps1`;
- `install-1c-export-scheduled-task.ps1`.

Результат:

- користувач виконав копіювання через `Copy-Item -ToSession $s`;
- користувач повідомив `є`;
- очікувано на MESER у `D:\CRM\Exports` тепер лежать 6 оновлених Windows scripts.

Перевірка:

- користувач виконав PowerShell parser check для `D:\CRM\Exports\run-1c-export-now.ps1` на MESER;
- користувач повідомив `є`;
- очікуваний результат: `SCRIPT OK`.

Наступна дія:

- ручний запуск `D:\CRM\Exports\run-1c-export-now.ps1` на MESER;
- це реальна дія, яка перечитає 1C і перезапише/оновить CSV у `D:\CRM\Exports`.

Результат:

- користувач виконав ручний запуск MESER export через PSSession;
- користувач повідомив `є`;
- очікувано оновились CSV-файли у `D:\CRM\Exports`.

Наступна перевірка:

- подивитися `export_1c_catalogs_summary.csv`;
- подивитися `export_1c_operational_summary.csv`;
- перевірити розміри і час оновлення ключових CSV.

Результат перевірки MESER export:

- `export_1c_catalogs_summary.csv`: рядки мають `status=processed`;
- `export_1c_operational_summary.csv`:
  - `stock_balances`: `processed`, `rows=2259`;
  - `reserved_stock_balances`: `processed`, `rows=0`;
  - `counterparty_settlements`: `processed`, `rows=413`;
- ключові файли оновлені `01.06.2026 18:55`;
- розміри ключових файлів:
  - `1c_stock_balances.csv`: 647586 bytes;
  - `1c_reserved_stock_balances.csv`: 412 bytes;
  - `1c_counterparty_settlements.csv`: 139878 bytes;
  - `run_1c_export_now.log`: 1042 bytes.

Висновок:

- ручний MESER export працює;
- зміна кількості з попереднього зрізу (`2260 -> 2259`, `412 -> 413`) очікувана, бо це поточний стан 1C;
- наступний крок: встановити Windows Scheduled Task для погодинного експорту.

### 2026-06-01 - уточнення: команди вводяться локально, але виконуються на MESER

Користувач уточнив:

- `але ці всі команди я вводив в павершел не месер а локального компа`.

Пояснення:

- це правильно;
- локальне PowerShell-вікно бачить `D:\Codex\CRM\SQL`;
- MESER-сесія збережена у змінній `$s`;
- команди з `Invoke-Command -Session $s` виконуються на MESER `192.168.0.5`;
- команди з `Copy-Item -ToSession $s` копіюють файли з локального комп'ютера на MESER.

Що не робити:

- не заходити вручну у `[192.168.0.5]:` для копіювання з `D:\Codex\CRM\SQL`;
- не плутати локальний prompt `PS C:\WINDOWS\system32>` з місцем виконання `Invoke-Command`.

### 2026-06-01 - MESER Scheduled Task встановлено

Користувач виконав:

```powershell
Invoke-Command -Session $s -ScriptBlock {
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\install-1c-export-scheduled-task.ps1' -RunNow
}
```

Результат зі скріну:

- `TaskName: CRM 1C Export Hourly`;
- `Action: powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\CRM\Exports\run-1c-export-now.ps1"`;
- `Schedule: every 1 hour(s), start time 00:10`;
- `Run account: current interactive Windows user`;
- повідомлення: `Scheduled Task was created or updated`;
- повідомлення: `Starting task now`;
- в деталях видно `MESER`, `\CRM 1C Export Hourly`, користувача `FRESH\zahar`.

Висновок:

- Windows Scheduled Task для погодинного MESER export створено;
- кракозябри у виводі `schtasks` пов'язані з кодуванням консолі і не є ознакою помилки;
- наступна дія: перевірити, що негайний запуск задачі дописав лог і оновив CSV.

Перевірка після запуску task:

- користувач виконав перевірку `run_1c_export_now.log` і ключових CSV;
- користувач повідомив `є`;
- очікувано у лозі є `1C export now completed.`;
- MESER-частина автоматизації вважається робочою.

Наступний блок:

- скопіювати оновлені Ubuntu scripts у `/home/crmadmin/SQL`;
- перевірити Bash syntax на Ubuntu;
- встановити `crm-1c-import.timer` для погодинного імпорту CSV у PostgreSQL.

Копіювання Ubuntu scripts:

- користувач виконав `scp` з локального PowerShell на `crmadmin@192.168.0.166:/home/crmadmin/SQL/scripts/ubuntu/`;
- користувач повідомив `є`;
- скопійовані файли:
  - `run-1c-import-now.sh`;
  - `install-1c-import-systemd-timer.sh`;
  - `run-1c-crm-viewer.py`;
  - `install-1c-viewer-systemd-service.sh`.

Наступна дія:

- в Ubuntu SSH перевірити наявність файлів і `bash -n`.

Поточна ситуація:

- користувач повідомив: `треба наново в убунту зайти`;
- перед перевіркою scripts треба відкрити нову SSH-сесію до Ubuntu `192.168.0.166`.

Що не робити:

- не вводити Ubuntu-команди у PowerShell без SSH;
- не використовувати `&&` у старому Windows PowerShell поза SSH, бо там це давало помилку.

Результат:

- користувач зайшов у Ubuntu через SSH;
- користувач повідомив `є`;
- наступна дія: перевірка скопійованих scripts на Ubuntu.

Перевірка Ubuntu scripts:

- користувач виконав `bash -n` для:
  - `scripts/ubuntu/run-1c-import-now.sh`;
  - `scripts/ubuntu/install-1c-import-systemd-timer.sh`;
  - `scripts/ubuntu/install-1c-viewer-systemd-service.sh`;
- користувач виконав `python3 -m py_compile scripts/ubuntu/run-1c-crm-viewer.py`;
- результат:

```text
UBUNTU SCRIPTS OK
```

Висновок:

- Ubuntu scripts синтаксично коректні на цільовому сервері;
- наступна дія: встановити systemd timer для імпорту CSV у PostgreSQL.

### 2026-06-01 - Ubuntu import timer встановлено

Користувач виконав:

```bash
cd ~/SQL
chmod +x scripts/ubuntu/run-1c-import-now.sh scripts/ubuntu/install-1c-import-systemd-timer.sh
bash scripts/ubuntu/install-1c-import-systemd-timer.sh
```

Результат зі скріну:

- `Created symlink /etc/systemd/system/timers.target.wants/crm-1c-import.timer -> /etc/systemd/system/crm-1c-import.timer`;
- `Installed crm-1c-import.service and crm-1c-import.timer`;
- installer показав ручну команду:

```bash
sudo systemctl start crm-1c-import.service
```

- timer status показав `crm-1c-import.timer` і `crm-1c-import.service`;
- у колонці `NEXT` видно `-`, тому треба перевірити `systemctl status` і `journalctl`, чи service вже відпрацював і чи timer активний.

Наступна дія:

- перевірити статус timer/service;
- перевірити останні логи імпорту;
- якщо імпорт завершився успішно, перевірити counts у PostgreSQL.

Результат перевірки:

- `crm-1c-import.timer` активний:
  - `Loaded: loaded`;
  - `enabled`;
  - `Active: active (waiting)`;
  - наступний trigger приблизно через 55 хвилин;
- `crm-1c-import.service` запустився, але завершився помилкою.

Помилка:

```text
bash: /home/crmadmin/SQL/scripts/ubuntu/import-1c-catalogs-http.sh: No such file or directory
crm-1c-import.service: Failed with result 'exit-code'
```

Причина:

- на Ubuntu були скопійовані нові wrapper-и:
  - `run-1c-import-now.sh`;
  - `install-1c-import-systemd-timer.sh`;
  - viewer scripts;
- але не були докопійовані два базові імпортні скрипти:
  - `import-1c-catalogs-http.sh`;
  - `import-1c-operational-http.sh`.

Висновок:

- timer встановлений правильно;
- треба докопіювати два missing scripts на Ubuntu і повторно запустити service.

Що не робити:

- не перевстановлювати весь PostgreSQL;
- не видаляти timer;
- не правити service вручну, бо причина проста: бракує файлів.

Виправлення:

- користувач докопіював на Ubuntu:
  - `scripts/ubuntu/import-1c-catalogs-http.sh`;
  - `scripts/ubuntu/import-1c-operational-http.sh`;
- користувач перевірив `ls -l` і повідомив `є`;
- наступна дія: `bash -n` для цих файлів і повторний ручний старт `crm-1c-import.service`.

Результат після докопіювання:

- `ls -l` показав обидва файли:
  - `scripts/ubuntu/import-1c-catalogs-http.sh`;
  - `scripts/ubuntu/import-1c-operational-http.sh`;
- `bash -n` для обох файлів завершився:

```text
BASE IMPORT SCRIPTS OK
```

- повторний ручний старт:

```bash
sudo systemctl start crm-1c-import.service
```

завершився помилкою:

```text
Job for crm-1c-import.service failed because the control process exited with error code.
```

Висновок:

- помилка `No such file or directory` для базових scripts вже виправлена;
- тепер треба дивитися нову фактичну причину падіння у `journalctl` після останнього старту.

Нова причина падіння з `journalctl`:

```text
ERROR: null value in column "object_name" of relation "raw_rows" violates not-null constraint
```

Деталь:

- імпорт уже дійшов до `1c_units.csv`;
- `COPY 11824` спрацював;
- падіння сталося при вставці в `one_c_mirror.raw_rows`;
- стара таблиця на Ubuntu має колонку `object_name NOT NULL`;
- новий імпорт пише `catalog_name`, а `object_name` лишилась старою сумісною колонкою.

Виправлено локально:

- `db/migrations/002_one_c_mirror.sql`;
- додано сумісність зі старою схемою:
  - `ADD COLUMN IF NOT EXISTS object_name text`;
  - заповнення старих `NULL` через `COALESCE(object_name, catalog_name, object_type)`;
  - `ALTER COLUMN object_name DROP NOT NULL`.

Висновок:

- не треба змінювати CSV;
- не треба змінювати 1C export;
- треба докопіювати оновлений `002_one_c_mirror.sql` на Ubuntu і повторно запустити import service.

### 2026-06-01 - import service після копіювання migration ще падає

Стан зі скріну:

- користувач повторно виконав:

```bash
sudo systemctl start crm-1c-import.service
```

- service знову завершився:

```text
Job for crm-1c-import.service failed because the control process exited with error code.
```

На скріні немає нового нижнього `journalctl` після останнього старту, тому точну нову причину ще не видно.

Практичний наступний крок:

- виконати прямий PostgreSQL hotfix для старої сумісної колонки `object_name`;
- це не видаляє дані і не чіпає 1C;
- після цього повторити `sudo systemctl start crm-1c-import.service`.

Що не робити:

- не перевстановлювати service;
- не видаляти таблиці;
- не чистити `one_c_mirror.raw_rows`, поки не переконаємось, що проблема тільки у constraint.

### 2026-06-01 - import пройшов до оновлення CRM views, але впав на permission

Стан з нового лога:

- помилка `object_name NOT NULL` усунута;
- довідники почали імпортуватися;
- операційні дані імпортувалися:
  - `stock_balances`: `2259`;
  - `counterparty_settlements`: `413`;
- агрегований контроль показав:
  - `counterparty_settlements`: `413`, amount `-86783595.06`;
  - `stock_balances`: `2259`, quantity `1605332.027`;
- падіння сталося на кроці:

```text
Refreshing CRM-ready views...
psql: error: /home/crmadmin/SQL/db/migrations/003_one_c_crm_ready_views.sql: Permission denied
```

Причина:

- service працює через `sudo -u postgres`;
- `psql -f /home/crmadmin/SQL/db/migrations/003_one_c_crm_ready_views.sql` змушує процес `postgres` самостійно читати файл у home-каталозі `crmadmin`;
- через права доступу `postgres` не може прочитати цей файл.

Виправлено локально:

- `scripts/ubuntu/run-1c-import-now.sh`;
- функція `run_psql_file` для `USE_POSTGRES_SUDO=1` тепер використовує input redirection:

```bash
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" < "${sql_file}"
```

Це означає:

- файл читає root-shell service;
- SQL передається в `psql`;
- користувачу `postgres` не треба напряму читати файл у `/home/crmadmin/SQL`.

Наступна дія:

- докопіювати оновлений `run-1c-import-now.sh` на Ubuntu;
- повторити `sudo systemctl start crm-1c-import.service`.

Результат:

- користувач докопіював оновлений `scripts/ubuntu/run-1c-import-now.sh` на Ubuntu;
- користувач виконав повторний запуск `crm-1c-import.service`;
- користувач повідомив `є`.

Висновок:

- очікувано помилка `Permission denied` для `003_one_c_crm_ready_views.sql` усунута;
- треба підтвердити фінальний стан контрольним SQL-запитом по CRM-ready views.

### 2026-06-01 - контроль після перезапуску `crm-1c-import.service`

Стан:

- користувач підтвердив виконання попереднього кроку повідомленням `є`;
- через стиснення контексту продовжуємо роботу з цього журналу як з основного джерела стану;
- наступний безпечний крок: не змінювати файли, а перевірити готові CRM-перегляди прямим SQL-запитом.

Що перевіряємо:

- чи існують і читаються CRM-ready views після застосування `003_one_c_crm_ready_views.sql`;
- чи в них є очікувані дані для майбутньої CRM:
  - товари;
  - склади;
  - контрагенти;
  - договори;
  - залишки;
  - взаєморозрахунки;
  - зведений баланс по контрагентах.

Що не робити:

- не перезапускати поки що Windows/MESER export;
- не перевстановлювати systemd timer;
- не чистити таблиці `one_c_mirror`;
- не змінювати пароль або налаштування переглядалки, поки не підтвердимо SQL-дані.

Результат контрольного запиту з Ubuntu:

```text
crm_counterparties                 9105
crm_counterparty_balance_summary    413
crm_counterparty_contracts        10693
crm_counterparty_settlements        413
crm_products                       1796
crm_stock_balances                 2259
crm_warehouses                       45
```

Додатково з journalctl:

- `crm-1c-import.service: Deactivated successfully`;
- `CRM 1C import finished: 2026-06-01 17:15:55`;
- service імпорту відпрацював успішно після виправлення запуску SQL-файлу через stdin.

Висновок:

- автоматичний імпорт на Ubuntu працює;
- дані з MESER HTTP `http://192.168.0.5:8090` заходять у PostgreSQL `crm_hub`;
- готові для майбутньої CRM views у схемі `one_c_mirror` створені та наповнені;
- наступний крок: встановити/запустити веб-переглядалку для перевірки цих даних через браузер.

### 2026-06-01 - встановлення веб-переглядалки

Користувач виконав команду встановлення переглядалки на Ubuntu:

```bash
cd ~/SQL
chmod +x scripts/ubuntu/install-1c-viewer-systemd-service.sh
VIEWER_PASSWORD='...' bash scripts/ubuntu/install-1c-viewer-systemd-service.sh
```

Користувач повідомив `є`.

Поточний очікуваний стан:

- systemd service `crm-1c-viewer.service` має бути створений;
- переглядалка має слухати порт `8091`;
- логін очікувано `admin`;
- пароль той, який користувач ввів у `VIEWER_PASSWORD`;
- у переглядалці має бути кнопка ручного імпорту, якщо service встановив `CRM_VIEWER_IMPORT_COMMAND`.

Наступна дія:

- перевірити статус `crm-1c-viewer.service`;
- перевірити, чи слухає порт `8091`;
- тільки після цього відкривати браузер.

Що не робити:

- не писати пароль у чат;
- не відкривати порт назовні в інтернет без VPN/фільтра;
- не змінювати PostgreSQL-схему, поки не перевіримо переглядалку.

Результат перевірки service:

```text
crm-1c-viewer.service - CRM 1C read-only web viewer
Loaded: loaded (/etc/systemd/system/crm-1c-viewer.service; enabled; preset: enabled)
Active: active (running)
ExecStart: /usr/bin/python3 /home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py --host 0.0.0.0 --port 8091 --use-postgres-sudo
URL: http://192.168.0.166:8091/
User: admin
```

Висновок:

- переглядалка встановлена;
- service увімкнений в автозапуск;
- процес Python працює;
- переглядалка слухає всі мережеві інтерфейси Ubuntu на порту `8091`;
- наступна дія: відкрити `http://192.168.0.166:8091/` у браузері з локального комп'ютера або іншого комп'ютера у VPN.

### 2026-06-01 - пароль переглядалки невідомий

Користувач повідомив, що пароль для входу в переглядалку невідомий.

Важливо:

- старий пароль знати не потрібно;
- логін переглядалки за замовчуванням `admin`;
- пароль зберігається на Ubuntu в env-файлі service;
- безпечний шлях: задати новий пароль через повторний запуск `install-1c-viewer-systemd-service.sh`;
- пароль не треба писати в чат.

Наступна дія:

- на Ubuntu задати новий пароль у змінну `VIEWER_PASSWORD`;
- перевстановити/оновити service переглядалки;
- відкрити `http://192.168.0.166:8091/` і зайти з логіном `admin`.

Що не робити:

- не надсилати пароль у чат;
- не редагувати `/etc/crm-1c-viewer.env` вручну, якщо можна скористатись installer script;
- не вимикати `crm-1c-import.timer`;
- не змінювати PostgreSQL-дані.

Результат:

- користувач задав/спробував задати новий пароль;
- браузер все одно не пускає в переглядалку.

Наступна діагностика:

- перевірити, чи файл `/etc/crm-1c-viewer.env` існує;
- не показувати пароль у чат;
- перевірити тільки логін і факт наявності пароля;
- перезапустити `crm-1c-viewer.service`;
- після перезапуску повторити вхід.

Ймовірна причина:

- `install-1c-viewer-systemd-service.sh` виконує `systemctl enable --now`;
- якщо `crm-1c-viewer.service` уже був активний, ця команда не гарантує перезапуск процесу;
- новий пароль міг записатися в `/etc/crm-1c-viewer.env`, але Python viewer продовжив працювати зі старими env-змінними;
- браузер також може кешувати старі неправильні HTTP Basic Auth credentials.

Виправлення:

- після повторного встановлення пароля треба явно виконати:

```bash
sudo systemctl restart crm-1c-viewer.service
```

- перевіряти вхід краще в приватному/інкогніто-вікні браузера або після повного закриття браузера.

Результат:

- користувач виконав restart;
- після restart браузер все одно не пускає;
- користувач повідомив: `не пускає після restart`.

Наступна діагностика:

- не міняти пароль повторно навмання;
- перевірити env-файл `/etc/crm-1c-viewer.env` без показу пароля;
- перевірити, чи в service є `EnvironmentFile=/etc/crm-1c-viewer.env`;
- перевірити локально через `curl`, який HTTP-код повертає viewer з правильними введеними credentials.

Що не робити:

- не надсилати пароль у чат;
- не видаляти service;
- не вимикати PostgreSQL або import timer.

Результат локального curl-тесту:

```text
HTTP 401
```

Висновок:

- порт `8091` відкритий;
- viewer відповідає;
- Basic Auth увімкнений;
- введений пароль не збігається з тим, що бачить запущений Python-процес.

Наступна діагностика:

- показати тільки `CRM_VIEWER_USER`;
- для `CRM_VIEWER_PASSWORD` показати тільки довжину, не сам пароль;
- порівняти env-файл `/etc/crm-1c-viewer.env` і env живого процесу `crm-1c-viewer.service`;
- якщо env живого процесу не оновився, примусово перезапустити service;
- якщо env-файл містить неправильний пароль, переписати його без ручного редагування через installer script.

Результат перевірки env-файлу:

```text
USER=admin
PASSWORD_LENGTH=5
PID=36571
-bash: /proc/36571/environ: Permission denied
```

Висновок:

- `/etc/crm-1c-viewer.env` існує;
- логін у файлі `admin`;
- пароль у файлі має довжину 5 символів;
- пароль не був показаний у чаті;
- читання живого env процесу не вдалося, бо shell redirection `< /proc/.../environ` виконався від користувача `crmadmin`, а не від root.

Наступна дія:

- виконати перевірку process env через `sudo bash -c`, щоб root виконав і читання `/proc`, і фільтрацію;
- якщо process password length відрізняється від `5`, зробити повний restart;
- якщо process password length теж `5`, тестувати curl із тим самим 5-символьним паролем або задати новий пароль без спецсимволів.

Результат перевірки живого процесу:

```text
PID=36571
PROCESS_USER=admin
PROCESS_PASSWORD_LENGTH=27
```

Висновок:

- env-файл `/etc/crm-1c-viewer.env` має пароль довжиною `5`;
- запущений Python-процес переглядалки досі має старий пароль довжиною `27`;
- саме тому `curl` повертав `HTTP 401`;
- проблема не в браузері й не в PostgreSQL;
- треба примусово зупинити і заново стартувати `crm-1c-viewer.service`, щоб процес перечитав env-файл.

Що не робити:

- не міняти пароль ще раз;
- не видаляти env-файл;
- не перевстановлювати Python viewer;
- не чіпати import timer.

Результат:

- після повної зупинки/старту `crm-1c-viewer.service` користувач повідомив `є`;
- очікувано live process перечитав `/etc/crm-1c-viewer.env`;
- наступний запит користувача: зробити доступ до переглядалки ззовні без VPN.

Безпековий висновок:

- поточна переглядалка слухає HTTP на `192.168.0.166:8091`;
- у ній є Basic Auth, але немає TLS/HTTPS;
- відкривати порт `8091` напряму в інтернет через router port forwarding не можна, бо пароль піде по незашифрованому HTTP і service стане публічно доступним;
- безпечний напрямок: HTTPS-тунель або reverse proxy з TLS та додатковою авторизацією.

Рекомендований варіант для доступу без VPN:

- Cloudflare Tunnel / аналогічний HTTPS-тунель;
- без відкриття inbound-порту на роутері;
- доступ через HTTPS URL;
- бажано з Cloudflare Access або іншим зовнішнім логіном поверх локального `admin`/пароля.

Що не робити:

- не відкривати `8091` напряму в інтернет;
- не вимикати Basic Auth;
- не публікувати пароль у чат;
- не давати доступ без HTTPS.

Результат перевірки Cloudflare Tunnel:

```text
cloudflared --version
cloudflared: command not found
```

Висновок:

- `cloudflared` на Ubuntu ще не встановлений;
- доступ без VPN через Cloudflare Tunnel поки неможливий;
- наступний безпечний крок: встановити `cloudflared` з офіційного Cloudflare apt repository;
- після встановлення запустити тимчасовий Quick Tunnel:

```bash
cloudflared tunnel --url http://127.0.0.1:8091
```

Примітка:

- Quick Tunnel підходить тільки для тесту;
- для постійного доступу краще створити named/remotely-managed tunnel у Cloudflare і додати Cloudflare Access.

Результат встановлення `cloudflared`:

```text
cloudflared version 2026.5.2 (built 2026-05-27-10:38 UTC)
```

Користувач запустив:

```bash
cloudflared tunnel --url http://127.0.0.1:8091
```

Результат:

```text
Requesting new quick Tunnel on trycloudflare.com...
failed to request quick Tunnel: Post "https://api.trycloudflare.com/tunnel": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
```

Висновок:

- `cloudflared` встановлений коректно;
- локальна переглядалка тут не є причиною цієї помилки;
- проблема на етапі звернення Ubuntu до `https://api.trycloudflare.com/tunnel`;
- можливі причини: тимчасова недоступність Quick Tunnel, блокування/фільтрація вихідного HTTPS до Cloudflare, DNS/маршрутизація, IPv6/мережевий шлях.

Наступна дія:

- перевірити локальну переглядалку на `127.0.0.1:8091`;
- перевірити DNS і HTTPS-доступ до Cloudflare;
- спробувати Quick Tunnel ще раз із IPv4.

Що не робити:

- не відкривати порт `8091` напряму в інтернет;
- не змінювати PostgreSQL;
- не перевстановлювати переглядалку;
- не видаляти `cloudflared`.

Результат мережевої діагностики Cloudflare:

```text
curl -I --max-time 5 http://127.0.0.1:8091/
HTTP/1.0 501 Unsupported method ('HEAD')
Server: BaseHTTP/0.6 Python/3.14.4
```

Висновок по локальному viewer:

- переглядалка на `127.0.0.1:8091` відповідає;
- `501 Unsupported method ('HEAD')` не є проблемою авторизації або падінням viewer;
- причина в тому, що простий Python HTTP handler не реалізує метод `HEAD`;
- для viewer треба перевіряти GET-запитом або через браузер.

Результат DNS/Cloudflare:

```text
getent hosts api.trycloudflare.com
2606:4700::6810:e684 api.trycloudflare.com
2606:4700::6810:e784 api.trycloudflare.com

curl -I --max-time 20 https://www.cloudflare.com/cdn-cgi/trace
HTTP/2 404
server: cloudflare

curl -I --max-time 20 https://api.trycloudflare.com/
curl: (28) Connection timed out after 20001 milliseconds
```

Висновок:

- загальний HTTPS до Cloudflare працює;
- саме `api.trycloudflare.com` зависає;
- `getent hosts` показав IPv6-адреси, тому найімовірніша причина: проблемний IPv6-маршрут з Ubuntu до trycloudflare API;
- наступна дія: запустити Quick Tunnel із примусовим IPv4.

Результат примусового IPv4:

```text
cloudflared tunnel --edge-ip-version 4 --url http://127.0.0.1:8091
failed to request quick Tunnel: Post "https://api.trycloudflare.com/tunnel": context deadline exceeded

getent ahostsv4 api.trycloudflare.com
104.16.230.132
104.16.231.132

curl -4 -I --max-time 20 https://api.trycloudflare.com/
curl: (28) Connection timed out after 20001 milliseconds
```

Висновок:

- проблема не тільки в IPv6;
- IPv4 до `api.trycloudflare.com` також не проходить;
- Quick Tunnel `trycloudflare.com` з цієї Ubuntu-мережі зараз заблокований або недоступний;
- локальна переглядалка при цьому працює;
- прямий Cloudflare Quick Tunnel як тимчасовий зовнішній лінк поки заблокований мережею.

Практичні варіанти далі:

1. Cloudflare named tunnel через акаунт/домен Cloudflare, бажано з Cloudflare Access.
2. Інший tunnel-сервіс з токеном, наприклад ngrok, якщо його endpoint не блокується.
3. Власний HTTPS reverse proxy / port forwarding тільки якщо є біла IP-адреса, домен і TLS; напряму `8091` не відкривати.
4. Залишити VPN як безпечний робочий варіант до вибору постійної схеми доступу.

Що не робити:

- не відкривати `8091` напряму через роутер без HTTPS;
- не вимикати Basic Auth;
- не публікувати URL без додаткового захисту, якщо він з'явиться;
- не переносити PostgreSQL назовні.

## 2026-06-01 21:40 - Додаємо ціни товарів у ланцюжок 1C -> CSV -> PostgreSQL -> переглядалка

Запит користувача:

- у переглядалці та SQL немає цін;
- треба підключити ціни у всі процеси;
- треба вивантажувати, завантажувати й оновлювати ціни з прив'язкою до товарів у таблиці.

Рішення по моделі:

- ціни додаємо як операційний набір даних `product_prices`;
- файл на MESER: `D:\CRM\Exports\1c_product_prices.csv`;
- у PostgreSQL це буде `dataset_name = 'product_prices'`, `object_type = 'product_price'`;
- прив'язка до товару:
  - `entity_code` = код товару з 1C;
  - `entity_name` = назва товару з 1C;
- прив'язка до типу ціни:
  - `related_code` = код типу ціни;
  - `related_name` = назва типу ціни;
- валюта: `currency`;
- значення ціни: `amount`;
- у CRM-ready шарі буде окрема view `one_c_mirror.crm_product_prices`;
- у `one_c_mirror.crm_products` додамо підсумкові поля по цінах в кінець view, щоб не ламати старі колонки.

Що вже зроблено перед цим записом:

- у `scripts/windows/export-1c-operational-data.vbs` локально додано набір `product_prices`;
- у `-Set all` тепер має входити `stock + settlements + prices`;
- додано варіанти регістрів 1C для цін:
  - `ЦеныНоменклатуры.Цена.ТипЦен.Валюта`;
  - `ЦеныНоменклатуры.Цена.ТипЦен`;
  - `ЦеныНоменклатурыКонтрагентов.Цена.ТипЦен.Валюта`;
  - `ЦеныНоменклатурыКонтрагентов.Цена.ТипЦен`;
  - `ЦеныНоменклатуры.Цена`;
- додано побудову 1C-запиту через `СрезПоследних(&Period, )`, щоб брати останню актуальну ціну.

Ризик:

- точна назва регістру/полів цін у цій конфігурації 1C може відрізнятися;
- якщо експорт `product_prices` впаде, треба дивитися `D:\CRM\Exports\export_1c_operational_summary.csv` і підібрати правильний варіант по метаданих `1c_metadata.csv`.

Що не робити:

- не створювати ціни вручну в PostgreSQL без прив'язки до `entity_code`;
- не змішувати типи цін із самими значеннями цін: `1c_price_types.csv` - це довідник типів, а `1c_product_prices.csv` - самі ціни;
- не прибирати старі поля з `crm_products`, бо переглядалка й майбутня CRM можуть уже на них спиратися;
- не відкривати зовнішній доступ до переглядалки напряму через порт `8091`.

## 2026-06-01 21:45 - Перевірка файлів перед доробкою цін

Перевірено локально в `D:\Codex\CRM\SQL`:

- `scripts/windows/export-1c-operational-data.vbs` уже має `product_prices` у `OperationalSpecs`;
- `scripts/ubuntu/import-1c-operational-http.sh` ще не завантажує `1c_product_prices.csv`;
- `db/migrations/003_one_c_crm_ready_views.sql` ще не має `crm_product_prices`;
- `scripts/ubuntu/run-1c-import-now.sh` ще не показує лічильники цін;
- `scripts/ubuntu/run-1c-crm-viewer.py` ще не має вкладки `Ціни`;
- `scripts/windows/check-meser-1c-export-state.ps1` ще не перевіряє файл `1c_product_prices.csv`.

Висновок:

- `run-1c-export-now.ps1` на MESER запускає operational export із `-Set all`, тому після копіювання оновленого `export-1c-operational-data.vbs` ціни мають потрапити в ручний запуск і в планувальник;
- окремий новий планувальник для цін не потрібен.

Що не робити:

- не запускати окремий паралельний планувальник тільки для цін;
- не редагувати вручну файли в `D:\CRM\Exports`, окрім копіювання оновлених скриптів;
- не видаляти існуючі CSV, бо вони потрібні для HTTP-імпорту на Ubuntu.

## 2026-06-01 21:50 - Перші зміни для підключення цін

Змінено:

- `scripts/ubuntu/import-1c-operational-http.sh`
  - додано імпорт `product_prices|product_price|1c_product_prices.csv|optional`;
  - файл цін поки `optional`, щоб не ламати імпорт залишків і взаєморозрахунків, якщо на MESER ще не скопійований новий експортер або 1C не віддасть регістр цін з першої спроби.
- `scripts/windows/check-meser-1c-export-state.ps1`
  - у список expected operational CSV додано `1c_product_prices.csv`.
- `db/migrations/002_one_c_mirror.sql`
  - додано індекс `idx_one_c_mirror_operational_rows_related` для швидкого пошуку/зв'язку по `related_code`;
  - для цін `related_code` означає код типу ціни.

Що це дає:

- Ubuntu-імпорт уже буде забирати ціни з `http://192.168.0.5:8090/1c_product_prices.csv`, коли файл з'явиться;
- MESER-діагностика покаже, чи файл цін реально створений;
- PostgreSQL буде готовий швидко зв'язувати ціну з типом ціни.

Що не робити:

- не робити `1c_product_prices.csv` обов'язковим, поки не підтверджено, що 1C стабільно його вивантажує;
- не міняти `1c_price_types.csv`: це тільки довідник типів цін, а не самі ціни;
- не видаляти `latest_operational_rows`, бо ціни будуть проходити через цей самий стабільний шар.

## 2026-06-01 21:55 - SQL views для цін

Змінено `db/migrations/003_one_c_crm_ready_views.sql`.

Додано:

- `one_c_mirror.crm_product_prices`
  - детальні ціни товарів;
  - поля:
    - `product_code`;
    - `product_name`;
    - `price_type_code`;
    - `price_type_name`;
    - `currency`;
    - `price`;
    - `snapshot_at`;
    - `source_file`;
    - `imported_at`.
- `one_c_mirror.crm_product_price_summary`
  - підсумок цін по товару;
  - поля:
    - `product_code`;
    - `price_count`;
    - `min_price`;
    - `max_price`;
    - `price_currencies`;
    - `price_types`.

Оновлено:

- `one_c_mirror.crm_products`
  - як джерело товарів тепер враховує не тільки довідник номенклатури і залишки, а також `product_prices`;
  - у кінець view додано:
    - `price_count`;
    - `min_price`;
    - `max_price`;
    - `price_currencies`;
    - `price_types`.

Що це дає:

- CRM зможе бачити всі ціни окремою таблицею;
- список товарів матиме коротку інформацію: чи є ціни, мінімальна/максимальна ціна, валюти та типи цін.

Що не робити:

- не прив'язувати ціну до назви товару без коду: основний ключ зв'язку - `product_code`;
- не перезаписувати ціну в товарі одним полем, бо у 1C може бути кілька типів цін на один товар;
- не прибирати окрему таблицю `crm_product_prices`, навіть якщо в `crm_products` є короткий підсумок.

## 2026-06-01 22:00 - Автоімпорт і переглядалка для цін

Змінено `scripts/ubuntu/run-1c-import-now.sh`:

- у фінальний звіт імпорту додано лічильники:
  - `crm_product_prices`;
  - `crm_product_price_summary`.

Змінено `scripts/ubuntu/run-1c-crm-viewer.py`:

- у вкладку `Товари` додано колонки:
  - `Цін`;
  - `Мін. ціна`;
  - `Макс. ціна`;
  - `Валюти`;
  - `Типи цін`;
- додано нову вкладку `Ціни`;
- вкладка `Ціни` читає `one_c_mirror.crm_product_prices`;
- числове сортування тепер враховує:
  - `price_count`;
  - `min_price`;
  - `max_price`;
  - `price`.

Що це дає:

- у переглядалці можна швидко побачити, чи має товар ціни;
- окремо можна перевірити кожну ціну з типом ціни, валютою і датою зрізу;
- після погодинного імпорту в логах буде видно, скільки цін потрапило в CRM-ready views.

Що не робити:

- не робити тільки одну колонку `price` у товарах без вкладки цін;
- не сортувати ціни як текст;
- не змінювати логіку авторизації viewer під час додавання цін.

## 2026-06-01 22:05 - Документація по цінах

Змінено `docs/one-c-operational-export-import.md`:

- заголовок і опис тепер включають ціни;
- у список очікуваних CSV додано `D:\CRM\Exports\1c_product_prices.csv`;
- описано, що `1c_product_prices.csv` може бути `failed` або відсутнім на першій спробі, якщо треба підібрати точну назву регістру 1C;
- додано розділ `Важливо про ціни`;
- зафіксовано прив'язку:
  - `entity_code` = код товару;
  - `entity_name` = назва товару;
  - `related_code` = код типу ціни;
  - `related_name` = назва типу ціни;
  - `currency` = валюта;
  - `amount` = ціна;
- додано CRM-ready views:
  - `one_c_mirror.crm_product_prices`;
  - `one_c_mirror.crm_product_price_summary`;
  - додаткові поля цін у `one_c_mirror.crm_products`.

Змінено `docs/one-c-automation.md`:

- у список MESER output files додано `1c_product_prices.csv`;
- додано короткий блок про ціни товарів у автоматизації;
- зафіксовано, що viewer має вкладку `Ціни`.

Що не робити:

- не тримати інформацію про ціни тільки в чаті;
- не вважати `1c_price_types.csv` достатнім для CRM: він не містить значення цін;
- не переносити ціни в `core.product_prices` до перевірки реальних типів цін і валют.

## 2026-06-01 22:10 - Локальна перевірка синтаксису після додавання цін

Перевірено локально:

```text
python -m py_compile scripts/ubuntu/run-1c-crm-viewer.py
python syntax OK

Git Bash:
bash -n scripts/ubuntu/import-1c-operational-http.sh
bash -n scripts/ubuntu/run-1c-import-now.sh
bash -n scripts/ubuntu/import-1c-catalogs-http.sh
git-bash syntax OK

cscript.exe //nologo scripts\windows\export-1c-operational-data.vbs /help
```

Результат VBS help:

```text
Sets:
  stock       - product stock and reserved stock balances
  prices      - product prices by price type
  settlements - counterparty settlements balances
  all         - stock + settlements + prices
```

Додатково перевірено:

- `scripts/windows/check-meser-1c-export-state.ps1` парситься PowerShell;
- `scripts/windows/export-1c-operational-data.ps1` парситься PowerShell;
- `scripts/windows/run-1c-export-now.ps1` парситься PowerShell.

Обмеження перевірки:

- локально не виконувався реальний 1C export, бо 1C і `D:\CRM\Exports` доступні на MESER;
- локально не застосовувались SQL migrations у PostgreSQL, бо робочий PostgreSQL на Ubuntu `192.168.0.166`.

Що не робити:

- не вважати локальну перевірку повним підтвердженням, що 1C точно має потрібний регістр цін;
- не пропускати перевірку `export_1c_operational_summary.csv` після першого запуску на MESER;
- не запускати імпорт на Ubuntu до копіювання оновлених Windows-файлів на MESER.

## 2026-06-01 22:15 - Наступні команди для впровадження цін

### 1. MESER / PowerShell на 192.168.0.5

Скопіювати на MESER оновлені Windows-файли з локального репозиторію в `D:\CRM\Exports`.

Важливо:

- у попередніх спробах `D:\Codex\CRM\SQL\...` на MESER не існував;
- копіювати треба з того комп'ютера, де реально є локальний репозиторій `D:\Codex\CRM\SQL`;
- якщо PowerShell вже всередині remote session `[192.168.0.5]`, то локальний шлях `D:\Codex\CRM\SQL` може бути недоступний.

Після копіювання на MESER запустити:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\run-1c-export-now.ps1'
Import-Csv 'D:\CRM\Exports\export_1c_operational_summary.csv' -Delimiter ';' | Format-Table
```

Очікуємо в operational summary:

```text
stock_balances              processed
reserved_stock_balances     processed або 0 rows
product_prices              processed або failed на першому підборі регістру
counterparty_settlements    processed
```

Якщо `product_prices` буде `failed`, дивитися колонку `error` і файл:

```text
D:\CRM\Exports\export_1c_operational.log
```

### 2. Ubuntu / crmadmin@crm-sql

Після оновлення файлів у `/home/crmadmin/SQL`:

```bash
cd ~/SQL
bash -n scripts/ubuntu/import-1c-operational-http.sh
bash -n scripts/ubuntu/run-1c-import-now.sh
python3 -m py_compile scripts/ubuntu/run-1c-crm-viewer.py
sudo systemctl start crm-1c-import.service
journalctl -u crm-1c-import.service -n 140 --no-pager
```

Після успішного імпорту перевірити лічильники:

```bash
sudo -u postgres psql -d crm_hub -P pager=off -c "
SELECT 'crm_products' AS view_name, count(*) FROM one_c_mirror.crm_products
UNION ALL SELECT 'crm_product_prices', count(*) FROM one_c_mirror.crm_product_prices
UNION ALL SELECT 'crm_product_price_summary', count(*) FROM one_c_mirror.crm_product_price_summary
UNION ALL SELECT 'crm_stock_balances', count(*) FROM one_c_mirror.crm_stock_balances
UNION ALL SELECT 'crm_counterparty_settlements', count(*) FROM one_c_mirror.crm_counterparty_settlements
ORDER BY view_name;"
```

Перезапустити viewer, щоб підтягнулась вкладка `Ціни`:

```bash
sudo systemctl restart crm-1c-viewer.service
systemctl status crm-1c-viewer.service --no-pager
```

Відкрити:

```text
http://192.168.0.166:8091/
```

Що не робити:

- не запускати команди `ssh/scp` всередині MESER PowerShell, якщо `ssh` там не встановлений;
- не вставляти Bash-команди в Windows PowerShell;
- не вставляти PowerShell-команди в Ubuntu;
- не відкривати viewer назовні без VPN/HTTPS.

## 2026-06-02 - Спроба скопіювати оновлені Windows-файли на MESER через Codex

Запит користувача:

- користувач питає, чи можу я сам скопіювати оновлені Windows-файли на MESER у `D:\CRM\Exports`.

Локально перевірено, що файли існують у репозиторії:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.vbs
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.ps1
D:\Codex\CRM\SQL\scripts\windows\run-1c-export-now.ps1
D:\Codex\CRM\SQL\scripts\windows\check-meser-1c-export-state.ps1
```

План спроби:

1. Спробувати безпечно скопіювати файли на `\\192.168.0.5\D$\CRM\Exports`, якщо поточні Windows-права це дозволяють.
2. Якщо admin share недоступний, спробувати PowerShell Remoting через уже налаштований WinRM.
3. Якщо потрібен пароль/інтерактивний credential prompt, зупинитися і дати користувачу точні ручні кроки.

Що не робити:

- не просити і не записувати пароль у чат;
- не видаляти старі файли на MESER;
- не копіювати всю папку `scripts\windows`, тільки потрібні файли;
- не змінювати `D:\CRM\Exports` на MESER, окрім заміни цих чотирьох скриптів.

Результат спроби з Codex:

- локальні файли існують;
- спроба копіювання через `\\192.168.0.5\D$\CRM\Exports` зависла і завершилась timeout після 30 секунд;
- перевірка мережі:
  - порт `445` на `192.168.0.5` не проходить, тому admin share `D$` недоступний;
  - порт `5985` на `192.168.0.5` проходить;
  - `Test-WSMan 192.168.0.5` відповідає;
- спроба `New-PSSession -ComputerName 192.168.0.5` без credential не створила сесію.

Висновок:

- Codex із поточної shell-сесії не може сам скопіювати файли на MESER без інтерактивних облікових даних;
- пароль у чат не просимо і не зберігаємо;
- найкращий безпечний шлях: користувач виконує коротку команду копіювання у своєму PowerShell-вікні, де він уже має доступ до MESER / remote session.

Що не робити:

- не передавати пароль у чат;
- не відкривати SMB/445 тільки заради копіювання, якщо це не потрібно;
- не намагатися копіювати через `D:\Codex\CRM\SQL` всередині remote session на MESER, бо цей шлях може існувати тільки на локальному комп'ютері.

## 2026-06-02 - Користувач підтвердив копіювання Windows-файлів на MESER

Стан:

- користувач відповів `є` після команди копіювання через PowerShell Remoting;
- вважаємо, що оновлені файли вже лежать на MESER у `D:\CRM\Exports`;
- наступний крок: на MESER перевірити, що оновлений `export-1c-operational-data.vbs` вміє експортувати `prices` і створює файл `D:\CRM\Exports\1c_product_prices.csv`.

Файли, які мають бути на MESER:

```text
D:\CRM\Exports\export-1c-operational-data.vbs
D:\CRM\Exports\export-1c-operational-data.ps1
D:\CRM\Exports\run-1c-export-now.ps1
D:\CRM\Exports\check-meser-1c-export-state.ps1
```

Що не робити:

- не запускати поки імпорт в Ubuntu, доки не перевірено, що MESER реально створює `1c_product_prices.csv`;
- не вводити логін/пароль 1С, бо робоче підключення до бази `elista` вже підтверджене без них;
- не змінювати шлях експорту `D:\CRM\Exports`, щоб Ubuntu-імпорт і HTTP-сервер залишились прив'язані до одного місця.

## 2026-06-02 - Додано `prices` у PowerShell-wrapper операційного експорту

Знайдено під час підготовки наступного кроку:

- `export-1c-operational-data.vbs` уже підтримував набір `prices` і файл `1c_product_prices.csv`;
- але `export-1c-operational-data.ps1` ще мав старий список дозволених значень `[ValidateSet("stock", "settlements", "all")]`;
- через це команда `-Set prices` могла б впасти ще до запуску VBS.

Позитивна зміна:

- у файлі `D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.ps1` список змінено на:

```powershell
[ValidateSet("stock", "settlements", "prices", "all")]
```

Що треба зробити на MESER:

- повторно скопіювати саме файл `export-1c-operational-data.ps1` з локального репозиторію:

```text
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.ps1
```

- у папку MESER:

```text
D:\CRM\Exports\export-1c-operational-data.ps1
```

Що не робити:

- не тестувати `-Set prices` на MESER зі старим `export-1c-operational-data.ps1`;
- не змінювати VBS вручну на MESER, доки локальний файл уже містить потрібну логіку;
- не переносити ціни окремою таблицею вручну, бо вони мають проходити через той самий автоматичний експорт/імпорт.

Перевірка після зміни:

- `export-1c-operational-data.ps1` пройшов PowerShell parser без синтаксичних помилок;
- `export-1c-operational-data.vbs /help` показує набір `prices`;
- негативна спроба: перша команда parser-перевірки була написана з неправильним `[ref]$errs` без ініціалізації змінної, тому її не треба повторювати; правильна перевірка використовує попередньо створені `$tokens` і `$parseErrors`.

## 2026-06-02 - Користувач підтвердив повторне копіювання `export-1c-operational-data.ps1` на MESER

Стан:

- користувач відповів `є` після повторного копіювання wrapper-файлу;
- на MESER очікується оновлений файл `D:\CRM\Exports\export-1c-operational-data.ps1`;
- тепер можна тестувати окремий набір `prices`, який має створити/оновити `D:\CRM\Exports\1c_product_prices.csv`.

Наступний безпечний крок:

- запускати тільки `-Set prices`, не `-Set all`, щоб перевірити саме ціни;
- після успішного CSV вже підключати ціни до Ubuntu-імпорту і viewer.

Що не робити:

- не запускати повний погодинний цикл, доки файл цін не підтверджений;
- не змінювати SQL/viewer, якщо на MESER ще немає реального `1c_product_prices.csv`;
- не вводити 1C-логін/пароль, використовувати no-login connection string `Srvr="192.168.0.5";Ref="elista";`.

## 2026-06-02 - MESER успішно експортував ціни з 1С

Стан за скріном користувача:

- запуск `export-1c-operational-data.ps1 -Set prices` на MESER завершився успішно;
- summary показав:

```text
dataset_name   product_prices
object_type    product_price
source_file    1c_product_prices.csv
status         processed
rows           28424
variant        ЦеныНоменклатуры.Цена.ТипЦен.Валюта
```

- створено файл:

```text
D:\CRM\Exports\1c_product_prices.csv
Length: 8944178
LastWriteTime: 02.06.2026 0:43:36
```

- перші рядки містять реальні товари, тип ціни `Роздрібна (EUR)`, валюту `978`, суми цін `2,5`, `2,68`, `2`, `2,41`.

Висновок:

- ціни в 1С знайдені і вивантажуються;
- тепер треба підключити `1c_product_prices.csv` до Ubuntu-імпорту, SQL-в'юшок і переглядалки;
- джерело цін для CRM: `D:\CRM\Exports\1c_product_prices.csv` на MESER через HTTP `http://192.168.0.5:8090/1c_product_prices.csv`.

Що не робити:

- не міняти варіант запиту цін вручну, бо робочий варіант уже знайдений: `ЦеныНоменклатуры.Цена.ТипЦен.Валюта`;
- не імпортувати CSV цін окремо вручну в довільну таблицю, бо він має йти через `one_c_mirror.operational_rows`;
- не запускати зовнішній доступ до viewer без авторизації/VPN або без узгодженого тунелю.

## 2026-06-02 - Початок перенесення оновлених Ubuntu/SQL-файлів для цін

Стан за скріном користувача:

- користувач почав копіювати оновлені файли на Ubuntu `192.168.0.166`;
- перша команда для Ubuntu-скриптів помилково склеїлась як `Remove-PSSession $sscp ...`;
- через це PowerShell сприйняв рядок як `Remove-PSSession`, а не як `scp`, і скрипти не були скопійовані;
- друга команда `scp` для SQL migration-файлів була введена окремо і могла виконуватись/очікувати пароль.

Що не робити:

- не писати `Remove-PSSession $sscp`;
- не вставляти `scp` одразу після `Remove-PSSession $s` в одному рядку;
- не запускати імпорт в Ubuntu, доки не підтверджено, що файли `scripts/ubuntu/*` і `db/migrations/*` реально скопійовані.

Правильний наступний крок:

- дочекатися завершення поточної `scp`-команди для migration-файлів;
- потім окремим рядком запустити `scp`, який починається саме з `scp`, для Ubuntu-скриптів.

## 2026-06-02 - Користувач підтвердив копіювання Ubuntu-скриптів

Стан:

- користувач відповів `є` після повторної правильної команди `scp`;
- очікується, що на Ubuntu `192.168.0.166` оновлені файли вже лежать тут:

```text
/home/crmadmin/SQL/scripts/ubuntu/import-1c-operational-http.sh
/home/crmadmin/SQL/scripts/ubuntu/run-1c-import-now.sh
/home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py
/home/crmadmin/SQL/db/migrations/002_one_c_mirror.sql
/home/crmadmin/SQL/db/migrations/003_one_c_crm_ready_views.sql
```

Наступний безпечний крок:

- перейти у вікно Ubuntu;
- перевірити, що файли на місці і мають правильний синтаксис;
- тільки після цього застосовувати SQL-в'юшки і запускати імпорт.

Що не робити:

- не запускати `sudo systemctl start crm-1c-import.service`, доки не перевірені файли;
- не відкривати viewer як доказ, доки ціни не імпортовані в PostgreSQL;
- не копіювати файли повторно без потреби, щоб не заплутатись у вікнах PowerShell/Ubuntu.

## 2026-06-02 - Користувач підтвердив перевірку оновлених файлів на Ubuntu

Стан:

- користувач відповів `є` після перевірки на Ubuntu;
- вважаємо, що файли на `/home/crmadmin/SQL` присутні і синтаксис пройшов:

```text
scripts/ubuntu/import-1c-operational-http.sh
scripts/ubuntu/run-1c-import-now.sh
scripts/ubuntu/run-1c-crm-viewer.py
db/migrations/002_one_c_mirror.sql
db/migrations/003_one_c_crm_ready_views.sql
```

Наступний крок:

- застосувати SQL-зміни для цін;
- запустити ручний імпорт з MESER HTTP `http://192.168.0.5:8090`;
- перевірити, що в PostgreSQL з'явилися `crm_product_prices` і `crm_product_price_summary`.

Що не робити:

- не чекати погодинний timer для першої перевірки цін, краще запустити імпорт вручну;
- не вважати ціну підключеною до CRM, доки SQL-count не покаже рядки у `crm_product_prices`;
- не запускати viewer-restart до успішного імпорту, бо він ще не матиме нових даних.

## 2026-06-02 - Користувач підтвердив застосування SQL-структури для цін

Стан:

- користувач відповів `є` після виконання SQL-команд на Ubuntu;
- очікується, що застосовано:

```text
db/migrations/002_one_c_mirror.sql
db/migrations/003_one_c_crm_ready_views.sql
```

- очікується наявність views:

```text
one_c_mirror.crm_products
one_c_mirror.crm_product_prices
one_c_mirror.crm_product_price_summary
```

Наступний крок:

- вручну запустити імпорт `crm-1c-import.service` або `scripts/ubuntu/run-1c-import-now.sh`;
- перевірити, що `product_prices` завантажились з `http://192.168.0.5:8090/1c_product_prices.csv`;
- перевірити counts у CRM-ready views.

Що не робити:

- не перезапускати viewer до завершення імпорту;
- не запускати міграції повторно без потреби, але вони idempotent і не повинні ламатись;
- не відкривати зовнішній тунель, поки локальний viewer/SQL ще не підтверджені.

## 2026-06-02 - Повний ручний імпорт зупинився на довідниках до імпорту цін

Стан за скріном користувача:

- команда `USE_POSTGRES_SUDO=1 bash scripts/ubuntu/run-1c-import-now.sh` почала з SQL-структури і далі з довідників;
- зупинилась на:

```text
Downloading http://192.168.0.5:8090/1c_units.csv...
curl: (23) client returned ERROR on write of 5630 bytes
```

- перевірка counts після цього показала:

```text
crm_counterparty_settlements  413
crm_product_prices            0
crm_product_price_summary     0
crm_products                  1796
crm_stock_balances            2259
```

Висновок:

- ціни на MESER є, але до PostgreSQL ще не потрапили;
- повний wrapper `run-1c-import-now.sh` зупинився раніше, на довідниках, тому не дійшов до `import-1c-operational-http.sh`;
- для перевірки цін треба запустити операційний імпорт окремо.

Що не робити:

- не запускати той самий `run-1c-import-now.sh` повторно без виправлення/обходу, бо він знову може впасти на `1c_units.csv`;
- не робити висновок, що ціни не працюють: файл `1c_product_prices.csv` на MESER уже підтверджений;
- не перезапускати viewer, доки `crm_product_prices` не покаже рядки.

## 2026-06-02 - Користувач підтвердив окремий операційний імпорт з цінами

Стан:

- користувач відповів `є` після запуску:

```bash
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/import-1c-operational-http.sh
sudo -u postgres psql -d crm_hub -v ON_ERROR_STOP=1 -f db/migrations/003_one_c_crm_ready_views.sql
```

- це означає, що операційний імпорт обійшов проблему довідника `1c_units.csv` і мав завантажити:

```text
1c_stock_balances.csv
1c_reserved_stock_balances.csv
1c_product_prices.csv
1c_counterparty_settlements.csv
```

- очікуваний результат для цін: `one_c_mirror.crm_product_prices` має містити приблизно `28424` рядки.

Наступний крок:

- перезапустити viewer, щоб він перечитав оновлений Python-файл і показав нову вкладку `Ціни`;
- перевірити у viewer вкладку `Товари` з колонками цін і вкладку `Ціни`.

Що не робити:

- не запускати повний `run-1c-import-now.sh` як основний доказ, доки не виправлена проблема `curl: (23)` на `1c_units.csv`;
- не відкривати viewer зовні без VPN/тунелю;
- не змінювати дані вручну в PostgreSQL: ціни мають оновлюватися з `1c_product_prices.csv`.

## 2026-06-02 - Аналіз, які дані ще потрібні для CRM / B2B / B2C / маркетплейсів / сайту

Поточний робочий мінімум уже є:

- товари / номенклатура;
- склади;
- контрагенти;
- договори контрагентів;
- залишки товарів по складах;
- взаєморозрахунки / дебіторка-кредиторка;
- ціни номенклатури;
- CRM-ready views для перегляду і майбутньої CRM.

Критичні прогалини для повноцінної CRM:

- довідники `manufacturers` і `countries` поки винесені в майбутні/додаткові, але для сайту і маркетплейсів вони важливі;
- потрібні штрихкоди / артикули / vendor SKU, якщо вони є в 1С;
- потрібні описи, характеристики, фото/посилання на фото або хоча б правила їх прив'язки;
- потрібні адреси, телефони, email, контактні особи контрагентів;
- потрібні сегменти контрагентів, менеджер, умови оплати, кредитний ліміт, тип ціни;
- потрібні документи продажів/замовлень для історії, а не тільки поточне сальдо;
- потрібна прив'язка товарів 1С до каналів продажу: сайт, Rozetka/маркетплейси, B2B-прайси.

Пріоритети:

1. Виправити повний автоматичний імпорт, який зараз падає на довіднику `1c_units.csv` з `curl: (23)`.
2. Довести ціни до viewer і перевірити, що `crm_product_prices` має реальні рядки.
3. Додати/підключити штрихкоди, бренди/виробники, країни, повні характеристики товарів.
4. Додати контактні дані та адреси контрагентів.
5. Додати документи продажів: замовлення, реалізації, повернення, оплати.
6. Додати маркетплейс-зв'язки: SKU/offer_id, категорії, статус публікації, ціни і залишки по каналах.

Що не робити:

- не починати CRM-розробку тільки з інтерфейсу без стабільної структури даних;
- не імпортувати маркетплейс-товари окремо без прив'язки до коду товару 1С;
- не змішувати B2B і B2C ціни в одну колонку без типу ціни/каналу;
- не використовувати залишок на складі як доступний до продажу без урахування резерву;
- не відкривати viewer назовні без контрольованої авторизації та безпечного тунелю/VPN.

## 2026-06-01 - Підключення Marketplace CRM до PostgreSQL / 1C mirror у режимі read-only

Запит користувача:

- у PostgreSQL вже створена база та імпорт із 1C;
- CRM потрібно підключити поки тільки на отримання даних із SQL;
- перший набір даних: товари / номенклатура, залишки, клієнти / контрагенти, дебіторка, склади, фірми;
- обов'язково вести детальний лог для перенесення роботи в новий чат без втрати контексту.

Принцип безпеки:

- робочий сервер 1C / MESER не перезавантажувати;
- не зупиняти 1C-служби;
- не виконувати ризикові команди на production 1C-сервері;
- поточне підключення CRM робиться тільки на читання з PostgreSQL / SQL API.

### Додано в SQL API

Створено новий NestJS-модуль:

```text
D:\Codex\CRM\SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.module.ts
D:\Codex\CRM\SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.controller.ts
D:\Codex\CRM\SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.service.ts
```

Оновлено:

```text
D:\Codex\CRM\SQL\apps\api\src\modules\app.module.ts
```

Нові read-only endpoints SQL API:

```text
GET /one-c-mirror/products
GET /one-c-mirror/stock
GET /one-c-mirror/counterparties
GET /one-c-mirror/warehouses
GET /one-c-mirror/firms
GET /one-c-mirror/receivables
```

Джерела даних PostgreSQL:

```text
one_c_mirror.crm_products
one_c_mirror.crm_stock_balances
one_c_mirror.crm_counterparties
one_c_mirror.crm_warehouses
one_c_mirror.crm_counterparty_balance_summary
one_c_mirror.latest_rows
```

Логіка endpoints:

- `products` повертає товарний довідник із 1C-кодом, SKU, назвою та агрегованими цінами (`min_price`, `max_price`, `price_types`, `price_currencies`);
- `stock` повертає залишки по товару і складу, включно з `quantity`, `availableQty`, `reservedQty`;
- `counterparties` повертає клієнтів / контрагентів;
- `warehouses` повертає склади;
- `firms` повертає фірми / організації з `latest_rows` і, як резерв, з балансів контрагентів;
- `receivables` повертає борги / переплати з `crm_counterparty_balance_summary`, де сума не дорівнює нулю.

### Додано в Marketplace CRM

Оновлено:

```text
D:\Codex\CRM\marketplace-crm\mock-api.ps1
D:\Codex\CRM\marketplace-crm\app.js
D:\Codex\CRM\marketplace-crm\.env.example
D:\Codex\CRM\marketplace-crm\index.html
```

CRM mock/proxy тепер має endpoint:

```text
GET /api/crm-sql/latest?limit=1000
```

Він звертається до SQL API за адресою з `.env`:

```env
CRM_SQL_API_BASE_URL=http://192.168.0.166:3000
CRM_SQL_API_TIMEOUT_SEC=15
```

Порядок читання даних:

```text
/one-c-mirror/products       -> fallback /products
/one-c-mirror/counterparties -> fallback /customers
/one-c-mirror/warehouses     -> fallback /warehouses
/one-c-mirror/firms          -> fallback /organizations
/one-c-mirror/stock
/one-c-mirror/receivables    -> fallback /counterparty-balances
```

Додано конвертацію для:

- товарів;
- залишків;
- клієнтів;
- складів;
- фірм;
- дебіторки.

Важлива правка назв:

- прибрано автоматичне додавання префіксів `1C`, `Rozetka`, `Prom`, `Epicentr`, `Allo` до назв товарів;
- імпортована назва має зберігатися як реальна назва номенклатури, без штучного джерела попереду.

У CRM в блоці `Налаштування -> Обмін даними -> 1C JSON-пакет` є кнопка:

```text
Імпорт із SQL
```

Її призначення:

- вручну підтягнути останні дані з SQL API;
- заповнити CRM товарами, залишками, клієнтами, складами, фірмами та дебіторкою;
- не відправляти нічого назад у SQL або 1C.

### Перевірки

Успішно:

```text
mock-api.ps1 PowerShell syntax: OK
app.js node --check: OK
GET http://127.0.0.1:8793/api/crm-sql/latest?limit=5: HTTP 200
```

Результат тестового виклику локального CRM proxy:

```text
products=200
stock=0
clients=1
receivables=0
warehouses=1
firms=1
warnings=9
```

Пояснення warnings:

- поточний запущений SQL API на `http://192.168.0.166:3000` ще не містить нових endpoints `/one-c-mirror/*`;
- CRM proxy коректно падає у fallback для старих `/products` і `/customers`;
- повний набір даних з'явиться після деплою оновленого SQL API на сервер `CRM-SQL`.

Не вдалося перевірити:

```text
npm run build --workspace @crm/api
```

Причина:

- у локальному Codex shell команда `npm` не знайдена;
- у `D:\Codex\CRM\SQL` немає локальної папки `node_modules`;
- bundled Codex runtime має `node.exe`, але не має `npm`, `typescript` або `@nestjs/cli`.

Це означає, що TypeScript/Nest збірку треба перевірити на машині або VM, де встановлені Node.js dependencies для `D:\Codex\CRM\SQL`.

### Що треба зробити далі

На сервері / VM `CRM-SQL`, де працює PostgreSQL і SQL API:

1. Перенести або підтягнути оновлений код `D:\Codex\CRM\SQL`.
2. Встановити залежності, якщо їх ще немає:

```powershell
npm install
```

3. Зібрати API:

```powershell
npm run build --workspace @crm/api
```

4. Перезапустити тільки SQL API сервіс, не production 1C:

```powershell
# конкретна команда залежить від того, як API запущено: node, pm2, systemd, docker або Windows service
```

5. Перевірити endpoints:

```text
http://192.168.0.166:3000/one-c-mirror/products?limit=5
http://192.168.0.166:3000/one-c-mirror/stock?limit=5
http://192.168.0.166:3000/one-c-mirror/counterparties?limit=5
http://192.168.0.166:3000/one-c-mirror/warehouses?limit=5
http://192.168.0.166:3000/one-c-mirror/firms?limit=5
http://192.168.0.166:3000/one-c-mirror/receivables?limit=5
```

6. Після успішної перевірки відкрити CRM і натиснути:

```text
Налаштування -> Обмін даними -> 1C JSON-пакет -> Імпорт із SQL
```

Очікуваний результат:

- товари мають підтягнутися без префікса `1C` у назві;
- ціни мають прийти з агрегованих полів `min_price` / `max_price`;
- залишки мають прийти з `crm_stock_balances`;
- клієнти / контрагенти, склади, фірми і дебіторка мають оновитися в CRM;
- у відповіді CRM proxy warnings по `/one-c-mirror/*` мають зникнути.

### Точка продовження для нового чату

Якщо чат буде перенесено або пам'ять буде втрачена, почати з цього:

1. Відкрити цей лог:

```text
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

## 2026-06-02 - розширення наповнення реальної SQL-бази під CRM/B2B/B2C/маркетплейси

### Ситуація

Користувач уточнив, що `crm_hub` - це робоча база з реальними даними. Тому головний принцип: не чистити існуючі таблиці, не скидати схеми, не видаляти `one_c_mirror.raw_rows` і `one_c_mirror.operational_rows`. Нові дані потрібно додавати через штатний імпорт з 1C і CRM-ready view.

### Що потрібно CRM для B2B/B2C/маркетплейсів/сайту продажу

Критичний мінімум уже є або підключений:

- товари/номенклатура;
- склади;
- залишки товарів по складах;
- резерви товарів;
- ціни товарів з типом ціни та валютою;
- контрагенти;
- договори контрагентів;
- взаєморозрахунки/сальдо контрагентів;
- типи цін;
- валюти;
- одиниці вимірювання.

Додатково бажано мати для повнішої CRM:

- виробники;
- країни походження/країни класифікатора;
- види номенклатури;
- характеристики номенклатури;
- серії номенклатури;
- банківські рахунки;
- контактні типи;
- підрозділи організацій;
- фізичні особи.

### Зміни у файлах

Локально змінено:

- `scripts/windows/run-1c-export-now.ps1`
  - за замовчуванням `CatalogSets` змінено з `base,next` на `base,next,future`;
  - це означає, що годинний або ручний MESER-експорт тепер буде пробувати також майбутні/додаткові довідники.

- `scripts/windows/export-1c-catalogs.vbs`
  - режим `all` тепер включає `base + next + future`, а не тільки `base + next`.

- `scripts/ubuntu/import-1c-catalogs-http.sh`
  - `manufacturers` і `countries` додані як `optional`;
  - якщо 1C або HTTP не віддасть ці CSV, імпорт не має зупиняти робоче оновлення залишків, цін і взаєморозрахунків.

### Що не робити

- Не видаляти робочу SQL-базу і не робити truncate реальних таблиць.
- Не робити `manufacturers` і `countries` обов'язковими, поки 1C стабільно їх не віддає.
- Не вважати `future` критичним для роботи продажів: це розширення для повнішої картки товару і майбутньої CRM.
- Не відкривати web viewer напряму в інтернет без авторизації/VPN/тунелю.

### Перевірка після змін

Локально виконано:

```text
C:\Program Files\Git\bin\bash.exe -n scripts/ubuntu/import-1c-catalogs-http.sh
C:\Program Files\Git\bin\bash.exe -n scripts/ubuntu/import-1c-operational-http.sh
C:\Program Files\Git\bin\bash.exe -n scripts/ubuntu/run-1c-import-now.sh
C:\Program Files\Git\bin\bash.exe -n scripts/ubuntu/install-1c-import-systemd-timer.sh
PowerShell Parser для scripts/windows/run-1c-export-now.ps1
cscript //Nologo scripts/windows/export-1c-catalogs.vbs /?
```

Результат:

- bash-синтаксис Ubuntu-скриптів без помилок;
- `run-1c-export-now.ps1` без помилок парсера;
- `export-1c-catalogs.vbs /?` показує `all = base + next + future`.

### Поточна точка продовження

Потрібно передати оновлені файли на сервери:

- Windows/MESER: `run-1c-export-now.ps1`, `export-1c-catalogs.vbs`;
- Ubuntu: `import-1c-catalogs-http.sh`, `import-1c-operational-http.sh`, `run-1c-import-now.sh`, `install-1c-import-systemd-timer.sh`;

Після копіювання треба запустити ручний імпорт і перевірити, що `crm_product_prices` знову має приблизно 28 тисяч рядків, а операційні дані не падають через необов'язкові довідники.

## 2026-06-02 - додано повний довідник товарів `Номенклатура`

### Навіщо

Для CRM/B2B/B2C/маркетплейсів і сайту продажу недостатньо мати товари тільки з залишків або цін. Залишки і ціни показують активні позиції, але повна CRM має знати весь довідник товарів з 1C.

### Зміни

- `scripts/windows/export-1c-catalogs.vbs`
  - у `baseSpecs` додано:
    `Номенклатура|products|1c_products.csv|code`.

- `scripts/ubuntu/import-1c-catalogs-http.sh`
  - у список імпорту додано:
    `Номенклатура|products|1c_products.csv`.

- `scripts/windows/check-meser-1c-export-state.ps1`
  - у перелік очікуваних base CSV додано:
    `1c_products.csv`.

### Чому це безпечно для робочої SQL-бази

- Дані додаються через звичайний імпорт у `one_c_mirror.raw_rows`.
- Нічого не видаляється.
- `one_c_mirror.crm_products` уже вміє читати `source_file = '1c_products.csv'`.
- Якщо catalog import тимчасово впаде, `run-1c-import-now.sh` за замовчуванням все одно продовжить операційний імпорт цін, залишків і взаєморозрахунків.

### Перевірка

```text
Git Bash: bash -n для Ubuntu-скриптів - OK
PowerShell Parser для Windows ps1 - OK
cscript export-1c-catalogs.vbs /? - OK
rg підтвердив наявність 1c_products.csv у Windows export, Ubuntu import, MESER check і CRM-ready view.
```

### Не робити

- Не наповнювати `crm_products` вручну з CSV.
- Не чистити `crm_products` або `one_c_mirror.raw_rows`.
- Не прибирати товарні рядки, яких немає в залишках: для сайту/маркетплейсів вони можуть знадобитися як неактивні або тимчасово відсутні на складі.

### 2026-06-02 - стабілізація повного завантаження для робочої SQL-бази

Користувач уточнив, що `crm_hub` - це робоча SQL-база з реальними даними, тому її потрібно максимально наповнювати з 1C і не ставитися до неї як до тестової.

Що перевірено локально:
- `scripts/ubuntu/run-1c-import-now.sh` спочатку запускає імпорт довідників, потім операційні дані, потім оновлює CRM-ready views;
- якщо імпорт довідників падає, wrapper зараз не доходить до операційного імпорту, тому ціни/залишки можуть не оновитися;
- у `scripts/ubuntu/import-1c-operational-http.sh` уже є набір `product_prices|product_price|1c_product_prices.csv|optional`;
- `db/migrations/003_one_c_crm_ready_views.sql` уже має `crm_product_prices`, `crm_product_price_summary` і підключення цін до товарів;
- у `db/migrations/002_one_c_mirror.sql` є сумісність зі старою колонкою `object_name`, але catalog importer ще не заповнює її напряму.

Проблеми, які треба виправити:
- повний системний імпорт не має зупиняти оновлення цін/залишків через окрему проблему довідника;
- робочі тимчасові CSV у `/tmp/crm-imports/...` можуть конфліктувати між ручним запуском і systemd/root запуском;
- catalog importer має заповнювати `object_name`, щоб старі таблиці не падали на сумісності.

Що не робити:
- не чистити робочу базу `crm_hub`;
- не видаляти `one_c_mirror.raw_rows` або `one_c_mirror.operational_rows`;
- не запускати автоматизацію як тест, якщо вона може зупинити оновлення цін/залишків;
- не відкривати переглядалку назовні без VPN/тунелю з авторизацією.

Наступна дія:
- змінити Ubuntu import scripts так, щоб повне оновлення було стійким для робочої SQL-бази.

### 2026-06-02 - внесено зміни в Ubuntu import scripts для стабільного наповнення CRM-ready SQL

Змінені файли:

```text
D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-catalogs-http.sh
D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-operational-http.sh
D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-import-now.sh
D:\Codex\CRM\SQL\scripts\ubuntu\install-1c-import-systemd-timer.sh
```

Що змінено позитивно:
- catalog importer тепер заповнює сумісну колонку `object_name` значенням `catalog_name`;
- catalog importer і operational importer більше не використовують спільний `/tmp/crm-imports/...`;
- нові робочі теки:
  - `/tmp/crm-1c-import-<user>/catalogs`;
  - `/tmp/crm-1c-import-<user>/operational`;
- перед скачуванням CSV старий тимчасовий файл у робочій теці прибирається;
- якщо робоча тека недоступна для запису, скрипт зупиняється з явною помилкою, а не псує імпорт;
- `run-1c-import-now.sh` тепер не блокує операційні дані через помилку довідників;
- за замовчуванням `CATALOG_IMPORT_REQUIRED=0`, тобто ціни, залишки і взаєморозрахунки мають оновитись навіть якщо довідник тимчасово впав;
- якщо потрібен строгий режим, можна запускати з `CATALOG_IMPORT_REQUIRED=1`.

Перевірка:

```text
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/import-1c-catalogs-http.sh
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/import-1c-operational-http.sh
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/run-1c-import-now.sh
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/install-1c-import-systemd-timer.sh
```

Результат:
- усі чотири скрипти пройшли Bash syntax check без помилок.

Що не робити:
- не видаляти реальні таблиці `one_c_mirror.raw_rows`, `one_c_mirror.operational_rows`;
- не чистити `crm_hub`;
- не робити `product_prices` обов'язковим файлом, бо ціни можуть бути тимчасово недоступні на першій спробі;
- не запускати годинний імпорт зі старою версією `run-1c-import-now.sh`, бо вона блокує операційні дані при падінні довідників.

Наступна дія на Ubuntu:
- скопіювати оновлені чотири файли в `/home/crmadmin/SQL/scripts/ubuntu/`;
- перевірити syntax check на Ubuntu;
- запустити ручний повний імпорт;
- перевірити counts для `crm_product_prices`, `crm_product_price_summary`, `crm_stock_balances`, `crm_counterparty_settlements`.

2. Перевірити наявність нового SQL API модуля:

```text
D:\Codex\CRM\SQL\apps\api\src\modules\one-c-mirror
```

3. Перевірити CRM proxy:

```text
D:\Codex\CRM\marketplace-crm\mock-api.ps1
```

4. Перевірити CRM кнопку:

```text
D:\Codex\CRM\marketplace-crm\app.js
```

5. Основний блокер на момент запису:

```text
SQL API на 192.168.0.166:3000 ще не задеплоєний з новими /one-c-mirror endpoints.
```

### Видима версія CRM після цієї зміни

Оновлено номер збірки в CRM:

```text
v2026.06.02.1
20260602-crm-sql-readonly-2
вівторок, 2026-06-02
час 00:31
```

Змінені файли версії:

```text
D:\Codex\CRM\marketplace-crm\app.js
D:\Codex\CRM\marketplace-crm\index.html
```

## 2026-06-02 01:43 — Продажі: вкладка клієнтів з SQL / 1C та маркетплейсів

### Запит користувача

Створити вкладку `Клієнти` у меню `Продажі`, завантажувати туди клієнтів / контрагентів із SQL / 1C, а також автоматично додавати клієнтів із замовлень маркетплейсів. У таблиці має бути колонка, звідки додався клієнт / контрагент.

### Змінена видима версія CRM

```text
v2026.06.02.2
20260602-sales-clients-sql-1
вівторок, 2026-06-02
час 01:43
```

### Змінені файли

```text
D:\Codex\CRM\marketplace-crm\app.js
D:\Codex\CRM\marketplace-crm\index.html
D:\Codex\CRM\marketplace-crm\mock-api.ps1
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

### Що реалізовано в CRM

1. Додано підвкладку:

```text
Продажі -> Клієнти
```

Технічно це секція `2.4 Клієнти`, яка відкривається через підменю `Продажі`.

2. Додано окремий список клієнтів:

- список згортається / розгортається стрілкою;
- є пошук по назві, повному імені, телефону, email, ЄДРПОУ / ІПН, коду контрагента, менеджеру, адресі та джерелу;
- є фільтр `Дата від` / `Дата до`;
- якщо введена тільки одна дата, фільтр працює по конкретній даті;
- є фільтр по джерелу клієнта.

3. Додані колонки:

```text
Джерело
Клієнт / контрагент
ЄДРПОУ / ІПН
Контакти
Адреса
Менеджер
Умови
Прайс / податки
```

4. Для клієнтів додана історія джерел:

- `SQL / 1C`;
- `CRM / ручне створення`;
- маркетплейс із номером замовлення, наприклад `Rozetka / RZ-...`.

### Логіка додавання клієнта з маркетплейсу

Функція:

```text
ensureClientFromMarketplaceOrder(order)
```

Тепер при обробці замовлення:

- шукає існуючого клієнта по телефону, email, ЄДРПОУ / ІПН або імені + менеджеру;
- якщо клієнта немає, створює нового;
- переносить реквізити із замовлення: ПІБ, телефон, email, адреса, менеджер, умови оплати, джерело, номер замовлення;
- додає позначку джерела `marketplace_order`;
- у колонці `Джерело` показує маркетплейс і номер замовлення;
- при повторному замовленні оновлює існуючого клієнта і додає новий запис у джерела.

### Логіка додавання клієнта з SQL / 1C

Функція CRM:

```text
upsertOneCClient(row)
```

Тепер приймає та зберігає:

- код контрагента;
- зовнішній ID;
- `oneCRef`;
- повну назву;
- телефон;
- email;
- ЄДРПОУ / ІПН;
- адресу;
- менеджера / відповідального;
- тип ціни;
- валюту;
- умови оплати;
- кредитний ліміт;
- файл / час імпорту;
- джерело `SQL / 1C`.

Функція proxy:

```text
Convert-CrmSqlCustomerRows
```

У `mock-api.ps1` розширена, щоб передавати в CRM не тільки `id`, `name`, `phone`, `email`, а повні реквізити контрагента.

### Поточна важлива умова

CRM поки підключається до SQL / 1C у режимі читання. Запис назад у 1C / SQL для клієнтів не включався.

### Що перевірити після запуску CRM

1. Відкрити:

```text
Продажі -> Клієнти
```

2. Натиснути:

```text
Налаштування -> Обмін даними -> 1C JSON-пакет -> Імпорт із SQL
```

3. Очікуваний результат:

- клієнти з SQL / 1C з'являються у `Продажі -> Клієнти`;
- у колонці `Джерело` видно `SQL / 1C`;
- клієнти з нових замовлень маркетплейсів автоматично додаються у цей самий список;
- у колонці `Джерело` для них видно маркетплейс і номер замовлення.

### Виконана технічна перевірка

```text
app.js: node --check — успішно
mock-api.ps1: PowerShell parser — успішно
```

Повний браузерний сценарій не запускався у цьому кроці, щоб не зупиняти і не перезапускати поточні процеси на робочому сервері 1C.

### Точка продовження для нового чату

Якщо чат закінчиться або пам'ять буде втрачена, продовжити з перевірки цих файлів:

```text
D:\Codex\CRM\marketplace-crm\app.js
D:\Codex\CRM\marketplace-crm\mock-api.ps1
D:\Codex\CRM\marketplace-crm\index.html
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

## 2026-06-02 - CRM prototype: order and publication logic

Build: `20260602-order-publication-logic-1`
Version: `v2026.06.02.3`

### Змінено

- Додано блок контролю обробки замовлень у `Продажі`: активні замовлення, блокери, дії менеджера, прострочені SLA та рядки, які потребують виправлення.
- Додано модель готовності публікацій маркетплейсів.
- Додано блок `Контроль виставлення товарів` у `Товари`: блокери, попередження, готові до обміну та опубліковані публікації.
- У таблицю `3.3 Публікації` додано колонку `Готовність`.
- Рядки публікацій із незаповненими критичними атрибутами підсвічуються як проблемні та відкриваються кліком.
- Форма редагування публікації тепер містить категорію маркетплейсу, ID категорії, параметр групування, 3 обов'язкові фільтри, залишок, статус фото, вагу та габарити.
- Синхронізація публікації тепер блокується, якщо не заповнені критичні поля: маркетплейс, товар CRM, SKU каналу, назва, категорія, мінімум 3 фільтри, ціна, фото.
- Оновлення залишків і цін перераховує готовність публікацій.
- Імпорт публікацій із JSON нормалізує категорії, фільтри, логістику та одразу перераховує готовність.

### Логіка замовлень

- Замовлення з маркетплейсу має пройти воронку від `Нове замовлення` до `Завершено`, `Follow-up` або `Повторний продаж`.
- CRM підсвічує незаповнені атрибути: покупець, телефон/email, товар, SKU, кількість, ціна, доставка, ТТН, оплата, менеджер, дати етапів.
- Прострочені SLA у статусах вважаються блокерами для контролю менеджера.
- Дії `Очікує клієнта`, `Підтверджено`, `Очікує оплату`, `Оплатити`, `Комплектація`, `Зібрано`, `Відправлено`, `Доставлено`, `Завершено`, `Follow-up`, `Повтор` доступні з картки замовлення і з таблиць.
- При створенні або імпорті замовлення CRM створює/оновлює клієнта у `Продажі -> Клієнти` та фіксує джерело додавання.

### Логіка виставлення товарів

- Публікація не повинна синхронізуватись у маркетплейс без критичних полів.
- Критичні поля блокують обмін. Попередження не блокують, але лишаються видимими для менеджера.
- Мінімальна картка для маркетплейсу: товар CRM, SKU, назва, категорія, 3 фільтри/характеристики, ціна, фото, залишок, вага і габарити.
- Поля публікації редагуються напряму в картці публікації.
- Публікації, завантажені з маркетплейсу або імпортовані JSON, проходять через ту саму перевірку готовності.

### Перевірка

- `app.js`: `node --check` — успішно.
- Сервер 1C / SQL не зупинявся і не перезапускався.

### Точка продовження

Наступний крок після відкриття прототипу в браузері:

1. Перевірити `Продажі -> Замовлення`: чи з'явився блок контролю обробки.
2. Перевірити `Товари -> Публікації`: чи з'явився блок контролю виставлення.
3. Відкрити проблемну публікацію кліком і заповнити підсвічені поля.
4. Натиснути `Синхронізувати`: без критичних помилок статус має перейти в `published`, з критичними помилками CRM має показати список блокерів.

### Додаткова перевірка прототипу

- `http://127.0.0.1:8789/index.html` відповів `200`.
- Активний build у HTML: `20260602-order-publication-logic-1`.
- Перезапуск 1C, PostgreSQL, Hyper-V або робочого сервера не виконувався.

## 2026-06-02 - продовження після переповнення контексту

Поточна умова від користувача: PostgreSQL `crm_hub` вже є робочою базою з реальними даними, тому всі подальші зміни мають бути доповнювальними. Не чистити реальні таблиці, не робити truncate/drop для даних 1C, не перезаписувати невідомі ручні зміни.

Перевірено локальний стан у `D:\Codex\CRM\SQL`:

- `scripts\windows\export-1c-catalogs.vbs` вже має набори `base`, `next`, `future`, `all`;
- у `base` вже додано `Номенклатура -> products -> 1c_products.csv`;
- `scripts\ubuntu\import-1c-catalogs-http.sh` вже очікує `1c_products.csv`;
- `db\migrations\003_one_c_crm_ready_views.sql` вже має CRM-ready views для товарів, цін, складів, залишків, контрагентів, договорів і взаєморозрахунків;
- `scripts\ubuntu\run-1c-crm-viewer.py` вже має вкладки для перегляду товарів, цін, складів, залишків, контрагентів, договорів, взаєморозрахунків і балансу.

Негативні спроби/що не робити:

- не запускати імпорт, який робить повне очищення реальних таблиць;
- не змінювати connection string на варіант з логіном/паролем 1C, бо робочий варіант був без них: `Srvr="192.168.0.5";Ref="elista";`;
- не відкривати переглядалку назовні без VPN або захищеного тунелю з авторизацією;
- не покладатися на Cloudflare quick tunnel як стабільний продакшн-доступ, бо quick tunnel уже падав по timeout.

## 2026-06-02 - додано безпечні CRM-ready views для довідників

Файл: `D:\Codex\CRM\SQL\db\migrations\003_one_c_crm_ready_views.sql`.

Додано тільки `CREATE OR REPLACE VIEW`, без зміни даних і без очищення таблиць:

- `one_c_mirror.crm_reference_items` - єдиний список останніх рядків усіх довідників 1C;
- `one_c_mirror.crm_reference_catalog_summary` - підсумок по кожному довіднику;
- `one_c_mirror.crm_units`;
- `one_c_mirror.crm_currencies`;
- `one_c_mirror.crm_price_types`;
- `one_c_mirror.crm_product_groups`;
- `one_c_mirror.crm_product_kinds`;
- `one_c_mirror.crm_product_series`;
- `one_c_mirror.crm_product_characteristics`;
- `one_c_mirror.crm_organizations`;
- `one_c_mirror.crm_organization_units`;
- `one_c_mirror.crm_persons`;
- `one_c_mirror.crm_contact_info_types`;
- `one_c_mirror.crm_bank_accounts`.

Навіщо: для майбутньої CRM B2B/B2C/маркетплейсів потрібні не тільки товари, ціни, залишки й борги, а й службові довідники: валюти, типи цін, одиниці, групи товарів, організації, фізичні особи, банківські рахунки, види контактної інформації. Ці view дають CRM читати їх окремо і не змінюють реальні сирі імпортовані рядки.

Що не робити: не переносити ці довідники напряму в `core.*` таблиці без правил зіставлення, бо там можуть бути дублікати, старі записи і неповні реквізити. Спочатку все тримаємо у `one_c_mirror`.

## 2026-06-02 - розширено підсумок автоматичного Ubuntu-імпорту

Файл: `D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-import-now.sh`.

Після кожного ручного або погодинного імпорту скрипт тепер показує count не тільки для основних view, а й для нових довідникових view:

- `crm_reference_items`;
- `crm_reference_catalog_summary`;
- `crm_units`;
- `crm_currencies`;
- `crm_price_types`;
- `crm_product_groups`;
- `crm_product_kinds`;
- `crm_product_series`;
- `crm_product_characteristics`;
- `crm_organizations`;
- `crm_organization_units`;
- `crm_persons`;
- `crm_contact_info_types`;
- `crm_bank_accounts`.

Навіщо: користувач одразу бачить, чи довідники реально зайшли в SQL після запуску сервісу `crm-1c-import.service`.

## 2026-06-02 - розширено web-переглядалку довідників

Файл: `D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-crm-viewer.py`.

У переглядалку додано нові вкладки:

- `Підсумок довідників`;
- `Одиниці`;
- `Типи цін`;
- `Валюти`;
- `Групи товарів`;
- `Організації`;
- `Фізособи`;
- `Банківські рахунки`.

Це потрібно для контролю, що в SQL реально зайшли службові довідники, які знадобляться майбутній CRM, сайту, B2B/B2C і маркетплейсам. Переглядалка залишається read-only.

## 2026-06-02 - додано read-only API endpoints для цін і довідників

Файли:

- `D:\Codex\CRM\SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.service.ts`;
- `D:\Codex\CRM\SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.controller.ts`.

Додано endpoints:

- `GET /one-c-mirror/product-prices` - рядки цін з 1C;
- `GET /one-c-mirror/reference-summary` - підсумок по довідниках;
- `GET /one-c-mirror/references` - загальний список останніх рядків усіх довідників.

Це не пише у CRM-таблиці і не змінює 1C/SQL дані. Це тільки читальний API-шар для майбутньої CRM.

## 2026-06-02 - локальна перевірка синтаксису після змін

Перевірено:

- `scripts\ubuntu\import-1c-catalogs-http.sh` через `bash -n` - OK;
- `scripts\ubuntu\import-1c-operational-http.sh` через `bash -n` - OK;
- `scripts\ubuntu\run-1c-import-now.sh` через `bash -n` - OK;
- `scripts\ubuntu\install-1c-import-systemd-timer.sh` через `bash -n` - OK;
- `scripts\ubuntu\run-1c-crm-viewer.py` через `python -m py_compile` з Codex runtime - OK;
- Windows PowerShell wrapper-и `run-1c-export-now.ps1`, `check-meser-1c-export-state.ps1`, `export-1c-catalogs.ps1`, `export-1c-operational-data.ps1` через `PSParser` - OK.

Не перевірено:

- TypeScript build API, бо в локальному `D:\Codex\CRM\SQL` немає `node_modules`. Щоб не змінювати робоче середовище і не тягнути залежності з інтернету, `npm install` не запускався.

## 2026-06-02 - аналіз наповнення SQL для майбутньої CRM B2B/B2C/маркетплейси/сайт

Вже є або підключено зараз:

- товари: `1c_products.csv`, `crm_products`;
- ціни: `1c_product_prices.csv`, `crm_product_prices`, `crm_product_price_summary`;
- залишки по складах: `1c_stock_balances.csv`, `crm_stock_balances`;
- резерви: `1c_reserved_stock_balances.csv`, `crm_stock_balances.reserved_quantity`;
- взаєморозрахунки/сальдо: `1c_counterparty_settlements.csv`, `crm_counterparty_settlements`, `crm_counterparty_balance_summary`;
- контрагенти: `1c_counterparties.csv`, `crm_counterparties`;
- договори: `1c_counterparty_contracts.csv`, `crm_counterparty_contracts`;
- склади: `1c_warehouses.csv`, `crm_warehouses`;
- службові довідники: одиниці, валюти, типи цін, групи товарів, організації, підрозділи, фізособи, види контактної інформації, банківські рахунки.

Що критично потрібно для повної CRM, але поки не можна безпечно додати без уточнення полів у metadata 1C:

- артикули, штрихкоди, бренди/виробники, країна, повна назва, опис, фото товару, категорії сайту/маркетплейсів;
- телефони, email, адреси, ЄДРПОУ/ІПН, контактні особи контрагентів;
- документи продажу: замовлення покупців, реалізації, повернення, рахунки, оплати;
- правила цін для B2B/B2C: тип ціни клієнта, валюта, знижки, індивідуальні ціни;
- статуси товарів: активний/архівний, дозволено продавати на сайті/маркетплейсі, мінімальні залишки;
- логістика: склади для продажу, резерви, доступний залишок, строки поставки.

Рекомендований порядок:

1. Закріпити поточний стабільний цикл: експорт MESER -> HTTP 8090 -> імпорт Ubuntu -> `one_c_mirror` -> переглядалка.
2. Запустити оновлений експорт, щоб у SQL зайшов повний довідник `Номенклатура`.
3. Перевірити counts і вкладки переглядалки.
4. Окремим кроком прочитати `D:\CRM\Exports\1c_metadata.csv` на MESER і тільки після цього додавати розширені поля товарів/контрагентів.

Що не робити: не писати напряму в `core.products`, `core.customers`, `core.orders`, поки немає правил дедуплікації та зіставлення з CRM. Реальна база має залишатися захищеною; `one_c_mirror` є буфером і джерелом правди для аналізу.

## 2026-06-02 - підтверджено копіювання оновлених файлів

Користувач підтвердив `є` після блоку копіювання оновлених файлів:

- Windows/MESER export-файли з локального `D:\Codex\CRM\SQL\scripts\windows` у `D:\CRM\Exports`;
- Ubuntu import/viewer/migration-файли з локального `D:\Codex\CRM\SQL` у `/home/crmadmin/SQL`.

Наступний безпечний крок: запустити оновлений експорт на MESER, перевірити CSV-файли, після цього запускати імпорт на Ubuntu.

Що не робити: не запускати `DROP`, `TRUNCATE`, ручне видалення таблиць або очистку реальної PostgreSQL-бази. Усі подальші перевірки мають бути через read-only views та імпортні буферні таблиці `one_c_mirror`.

## 2026-06-02 - негативна спроба перевірки CSV на MESER

Під час блоку `KEY FILES` PowerShell показав, що не знайдено:

- `D:\CRM\Exports\1c_products.csv`;
- `D:\CRM\Exports\1c_product_prices.csv`;
- `D:\CRM\Exports\1c_stock_balances.csv`;
- `D:\CRM\Exports\1c_counterparty_settlements.csv`.

Це не помилка PostgreSQL і не привід чистити базу. Ймовірні причини:

- команда виконана не на MESER `192.168.0.5`, а на іншому Windows-комп'ютері;
- експортний скрипт `D:\CRM\Exports\run-1c-export-now.ps1` ще не запускався або впав раніше;
- папка `D:\CRM\Exports` на цьому комп'ютері порожня або відсутня.

Що не робити: не переходити до Ubuntu-імпорту, поки на MESER не з'являться CSV-файли. Не створювати порожні CSV вручну, бо це затре реальний зміст імпорту нульовими даними.

## 2026-06-02 - повторне підключення до MESER і перевірка папки експорту

Користувач перепідключив PowerShell-сесію до MESER `192.168.0.5`; prompt показує `[192.168.0.5]: PS C:\Users\zahar\Documents>`.

На скріні видно, що `D:\CRM\Exports` існує і містить CSV/лог-файли з датою `02.06.2026 03:10`, зокрема:

- `1c_counterparties.csv`;
- `1c_counterparty_contracts.csv`;
- `1c_product_groups.csv`;
- `1c_currencies.csv`;
- `1c_price_types.csv`;
- `1c_product_series.csv`;
- `1c_product_characteristics.csv`;
- `1c_warehouses.csv`;
- `1c_product_kinds.csv`;
- `1c_unit_classifier.csv`;
- `1c_organization_units.csv`;
- `1c_persons.csv`;
- `1c_contact_info_types.csv`;
- `1c_bank_accounts.csv`;
- `export_1c_catalogs_summary.csv`;
- `export_1c_catalogs_runner.log`;
- `export-1c-operational-data.runtime.vbs`.

Негативна деталь: команда `Get-Item` для перевірки export scripts була вставлена з переносами/backtick і PowerShell залишився у режимі продовження `>>`. Потрібно вийти через `Ctrl+C` і надалі давати коротші однорядкові команди.

## 2026-06-02 - MESER CSV-файли підтверджені

Після повторної перевірки в PowerShell-сесії `[192.168.0.5]` підтверджено наявність ключових файлів у `D:\CRM\Exports`:

- `run-1c-export-now.ps1` - є;
- `export-1c-catalogs.ps1` - є;
- `export-1c-catalogs.vbs` - є;
- `export-1c-operational-data.ps1` - є;
- `export-1c-operational-data.vbs` - є;
- `1c_products.csv` - є, приблизно 33 MB;
- `1c_product_prices.csv` - є, приблизно 8.9 MB;
- `1c_stock_balances.csv` - є, приблизно 647 KB;
- `1c_counterparty_settlements.csv` - є, приблизно 140 KB.

Висновок: MESER-частина для поточного кроку готова. Далі потрібно запускати Ubuntu-імпорт у PostgreSQL через `run-1c-import-now.sh`.

Негативна спроба: користувач намагався ввести `Ctrl+C` текстом (`cCtrl + ...`), PowerShell сприйняв це як команду. Це не шкодить даним, але надалі для скасування режиму `>>` треба саме натискати клавіші `Ctrl` і `C`, а не вводити текст.

## 2026-06-02 - Ubuntu import scripts syntax OK

Користувач підтвердив `є` після виконання на Ubuntu:

- `chmod +x` для import/viewer scripts;
- `bash -n scripts/ubuntu/import-1c-catalogs-http.sh`;
- `bash -n scripts/ubuntu/import-1c-operational-http.sh`;
- `bash -n scripts/ubuntu/run-1c-import-now.sh`;
- контрольний вивід `UBUNTU IMPORT SCRIPTS OK`.

Висновок: можна запускати реальний імпорт CSV з MESER `http://192.168.0.5:8090` у PostgreSQL `crm_hub`.

## 2026-06-02 - запущено реальний Ubuntu-імпорт у PostgreSQL

Користувач підтвердив `є` після команди:

```bash
cd ~/SQL
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/run-1c-import-now.sh
```

Очікуваний результат: CSV-файли з MESER `http://192.168.0.5:8090` завантажені у PostgreSQL `crm_hub`, схема `one_c_mirror`; CRM-ready views оновлені через `003_one_c_crm_ready_views.sql`.

Наступний крок: перевірити counts у view, особливо `crm_product_prices` та `crm_product_price_summary`, бо ціни раніше були окремим незакритим пунктом.

## 2026-06-02 - counts CRM-ready views перевірені користувачем

Користувач підтвердив `є` після SQL-перевірки counts для:

- `crm_products`;
- `crm_product_prices`;
- `crm_product_price_summary`;
- `crm_stock_balances`;
- `crm_counterparty_settlements`;
- `crm_counterparty_balance_summary`;
- `crm_reference_items`;
- `crm_reference_catalog_summary`.

Скрін із числами не наданий, тому точні counts у журнал не внесені. Наступний крок: перевірити якість прив'язки цін до товарів і наявність `price_summary` у `crm_products`.

## 2026-06-02 - негативна спроба Ubuntu-імпорту: MESER HTTP 8090 недоступний

Під час запуску `USE_POSTGRES_SUDO=1 bash scripts/ubuntu/run-1c-import-now.sh` на Ubuntu імпорт впав на читанні файлу з MESER:

- `curl: (28) Failed to connect to 192.168.0.5 port 8090`;
- `ERROR: required file is missing: http://192.168.0.5:8090/1c_stock_balances.csv`.

Висновок: CSV-файли на MESER є, але HTTP-сервер на порту `8090` з боку Ubuntu зараз недоступний. Не проблема PostgreSQL і не проблема самих CSV.

Також SQL-перевірка counts впала на:

- `relation "one_c_mirror.crm_reference_items" does not exist`.

Ймовірна причина: новий `003_one_c_crm_ready_views.sql` ще не застосований на Ubuntu або останній імпорт/refresh views не дійшов до кінця через помилку HTTP.

Що не робити: не чистити таблиці `one_c_mirror`, не запускати DROP/TRUNCATE, не створювати порожні CSV. Спочатку потрібно підняти/перевірити MESER HTTP 8090, потім окремо застосувати CRM-ready views.

## 2026-06-02 - ціни в SQL підтверджені, потрібне оновлення view products

Користувач виконав SQL-перевірку цін. Результат:

- `one_c_mirror.crm_product_prices` працює;
- типи цін, валюти, мінімальні та максимальні ціни показуються;
- приклади типів цін: `Дрібнооптова`, `Закупівельна`, `Знижка`, `Знижка 10%`, `Знижка 15%`, `Знижка 20%`;
- валюти у виводі: `840`, `978`, `980`, `956`;
- значення цін не нульові, отже `1c_product_prices.csv` реально зайшов у PostgreSQL.

Негативна деталь: перший SELECT впав з помилкою:

- `ERROR: column p.price_summary does not exist`.

Причина: у поточній view `one_c_mirror.crm_products` ще немає текстової колонки `price_summary`, хоча `price_count`, `min_price`, `max_price`, `price_currencies`, `price_types` уже передбачені.

Позитивна зміна в локальному репозиторії:

- у `db/migrations/003_one_c_crm_ready_views.sql` додано `price_summary` до `crm_product_price_summary`;
- `crm_products` тепер також повертає `price_summary`;
- це read-only view-зміна, без зміни або видалення реальних таблиць.

Додатково створено локальний Windows-скрипт `scripts/windows/start-crm-export-http-server.ps1`, який може вручну публікувати `D:\CRM\Exports` через HTTP `8090`, якщо MESER HTTP-сервер відвалився. PowerShell syntax check для цього скрипта - OK.

## 2026-06-02 - updated files copied to Ubuntu and MESER staging

Користувач підтвердив копіювання оновлених файлів із локального репозиторію на Ubuntu:

- `D:\Codex\CRM\SQL\db\migrations\003_one_c_crm_ready_views.sql` -> `/home/crmadmin/SQL/db/migrations/003_one_c_crm_ready_views.sql`;
- `D:\Codex\CRM\SQL\db\migrations\002_one_c_mirror.sql` -> `/home/crmadmin/SQL/db/migrations/002_one_c_mirror.sql`;
- `D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-catalogs-http.sh` -> `/home/crmadmin/SQL/scripts/ubuntu/`;
- `D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-operational-http.sh` -> `/home/crmadmin/SQL/scripts/ubuntu/`;
- `D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-import-now.sh` -> `/home/crmadmin/SQL/scripts/ubuntu/`;
- `D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-crm-viewer.py` -> `/home/crmadmin/SQL/scripts/ubuntu/`.

Користувач також відкрив PowerShell remoting session до MESER `192.168.0.5` і підготував Windows export files у `D:\CRM\Exports`.

Наступна безпечна дія: застосувати `003_one_c_crm_ready_views.sql` на Ubuntu. Це оновлення view, без видалення реальних даних. Очікуваний результат: `one_c_mirror.crm_products` отримує `price_summary`, а також створюються reference views, зокрема `one_c_mirror.crm_reference_items`.

## 2026-06-02 - negative verification: Ubuntu views still old

User ran a read-only verification query on Ubuntu after copying files. Result:

- `ERROR: relation "one_c_mirror.crm_reference_items" does not exist`;
- `ERROR: column "price_summary" does not exist`.

Conclusion: PostgreSQL still has the old CRM-ready views. Either `003_one_c_crm_ready_views.sql` was not applied after copying, or the file on Ubuntu is not the updated version. This is not a data-loss issue and not a price export issue. Product prices were already confirmed in `one_c_mirror.crm_product_prices`; the missing part is view refresh only.

What not to do: do not drop/truncate tables, do not rerun full import yet, and do not edit real data. First verify that the Ubuntu file contains `price_summary` and `crm_reference_items`, then apply the migration again with visible output.

## 2026-06-02 - negative migration attempt: PostgreSQL view column order

User verified that Ubuntu file `db/migrations/003_one_c_crm_ready_views.sql` contains `price_summary` and `crm_reference_items`, then applied it. PostgreSQL stopped at:

- `ERROR: cannot change name of view column "snapshot_at" to "price_summary"`;
- hint: `Use ALTER VIEW ... RENAME COLUMN ...`.

Root cause: `CREATE OR REPLACE VIEW` cannot insert a new column in the middle of an existing view. The local migration was corrected by moving `price_summary` to the end of `one_c_mirror.crm_product_price_summary`, preserving the existing column order and adding the new field only at the end.

What not to do: do not drop real tables, do not truncate data, and do not rename `snapshot_at`. This is a view-definition compatibility issue only.

## 2026-06-02 - Marketplace CRM prototype: warehouse and delivery workflow added

User requested separate product/order functions for warehouse picking confirmation, handoff to delivery, logistician confirmation, delivery tracking by TTN for Nova Poshta/Ukrposhta, and delivery API connection settings.

Changed local prototype only:

- `D:\Codex\CRM\marketplace-crm\app.js`
- `D:\Codex\CRM\marketplace-crm\index.html`

Implemented in UI:

- Products now include section `3.4 Склад і доставка замовлень`.
- Sales logistics table now shows warehouse/logistics state, delivery status, delivery API result, communication buttons, and workflow actions.
- Marketplace order card now has separate buttons:
  - `На відбірку` - send order to warehouse;
  - `Відбірка ОК` - warehouse manager confirms picking;
  - `Передати логісту` - warehouse hands order to logistician;
  - `Логіст прийняв` - logistician confirms transfer to delivery;
  - `Статус доставки` - reads/updates TTN tracking state.
- Settings now include `API доставок` for Nova Poshta and Ukrposhta:
  - enabled/disabled;
  - test/production mode;
  - API key;
  - endpoint;
  - last check timestamp.

Workflow logic:

1. Order enters warehouse flow with `sent_to_warehouse`.
2. Warehouse manager confirms picking: `picked`.
3. Warehouse hands order to logistician: `warehouse_handover`.
4. Logistician confirms delivery transfer: `logistics_accepted`.
5. Tracking advances read-only delivery states: `sent_to_delivery`, `in_transit`, `arrived_branch`, `delivered`.
6. If API is enabled but key is absent, tracking sets `delivery_problem` with `API_FAIL_NO_KEY`.

Validation/highlighting:

- Missing warehouse picking, handoff, logistician acceptance, delivery last check, and missing enabled API key are added to the order pending/missing-action logic.
- These issues are used by the existing bright-red incomplete-action highlighting in the dashboard and order card.

Verification:

- `node --check app.js` passed.
- Local server check returned HTTP 200 and served build `20260602-warehouse-delivery-api-1`.

No PostgreSQL, 1C, VM, or production server changes were made in this step.

## 2026-06-02 - price_summary verified in PostgreSQL

User applied the corrected `003_one_c_crm_ready_views.sql` on Ubuntu and reran the read-only verification query. Result:

- `crm_products`: 7013 rows;
- products with prices: 6786;
- `crm_product_prices`: 28424 rows;
- `crm_product_price_summary`: 6786 rows;
- `crm_stock_balances`: 2259 rows;
- `crm_counterparty_settlements`: 413 rows.

Second query showed products with `price_count`, `min_price`, `max_price`, and populated `price_summary`, for example price types such as `Закупівельна`, `Оптова`, `Роздрібна (ГРН)`, `Роздрібна (USD)` with currencies `840`, `978`, `980`.

Conclusion: product prices are now imported into PostgreSQL and linked to products through CRM-ready views. `one_c_mirror.crm_products.price_summary` works.

Next work items:

- restart/update viewer service so the UI can display the latest viewer script and price/reference tabs;
- fix MESER HTTP `8090` availability for automated hourly import;
- verify reference summary after full import path is stable.

## 2026-06-02 - viewer restarted and local auth verified

User restarted `crm-1c-viewer.service` on Ubuntu and confirmed local check returned:

- `HTTP 200` for `http://127.0.0.1:8091/` using credentials from `/etc/crm-1c-viewer.env`.

Conclusion: viewer service is running and Basic Auth works locally after restart. Next blocker is not viewer auth; it is MESER export HTTP availability on `192.168.0.5:8090` for scheduled imports.

## 2026-06-02 - negative check: Ubuntu cannot reach MESER HTTP 8090

User tested MESER export HTTP from Ubuntu:

```bash
curl -fL --max-time 10 http://192.168.0.5:8090/1c_product_prices.csv -o /tmp/1c_product_prices.test.csv
wc -c /tmp/1c_product_prices.test.csv
```

Result:

- `curl: (28) Connection timed out after 10002 milliseconds`;
- `/tmp/1c_product_prices.test.csv: No such file or directory`.

Conclusion: `192.168.0.5:8090` is currently unreachable from Ubuntu. SQL data already imported earlier remains valid, but scheduled import cannot refresh until MESER serves `D:\CRM\Exports` over HTTP again.

Next safe action: on MESER, verify `D:\CRM\Exports\1c_product_prices.csv`, check whether port `8090` is listening, then start `start-crm-export-http-server.ps1` if needed.

## 2026-06-02 - MESER local HTTP 8090 is not running

User ran the MESER PowerShell check inside the remote session `[192.168.0.5]`.

Observed:

- `D:\CRM\Exports\1c_product_prices.csv` exists, length `8944178`, last write `02.06.2026 3:11:21`;
- `D:\CRM\Exports\start-crm-export-http-server.ps1` did not appear in the shown `Get-Item` output;
- `netstat -ano | findstr ":8090"` returned no listener;
- local MESER request to `http://127.0.0.1:8090/1c_product_prices.csv` failed with "Unable to connect to the remote server".

Conclusion: MESER has the CSV exports, but there is no active HTTP server on port `8090`. Ubuntu cannot refresh imports until `D:\CRM\Exports` is published again. Next action: copy `scripts/windows/start-crm-export-http-server.ps1` from the local repo to MESER `D:\CRM\Exports`, then run it on MESER.

## 2026-06-02 - sales submenu and warehouse split in prototype

User clarified the Sales navigation must be:

1. `Замовлення`
2. `Склад`
3. `Логістика`
4. `Клієнти`
5. `Комунікація`

Prototype changes in `D:\Codex\CRM\marketplace-crm`:

- moved the warehouse picking / warehouse manager / logistician confirmation / tracking block out of `Товари`;
- added this block under `Продажі` as section `2.2 Склад і відбірка замовлень`;
- changed logistics section to `2.3 Логістика з рухом замовлень`;
- kept clients as `2.4 Клієнти`;
- changed communications to `2.5 Комунікація з покупцями по замовленнях`;
- updated Sales submenu routing so hover menu shows `Замовлення`, `Склад`, `Логістика`, `Клієнти`, `Комунікація`;
- bumped prototype version to `v2026.06.02.5`, build `20260602-sales-warehouse-submenu-1`.

No PostgreSQL, 1C, Hyper-V, Ubuntu, or production server changes were made in this prototype UI step.

Verification update:

- `app.js` passed Node syntax check;
- `http://127.0.0.1:8789/index.html?b=20260602-sales-warehouse-submenu-1` returns the new `app.js` cache-buster;
- `http://192.168.4.14:8789/index.html?b=20260602-sales-warehouse-submenu-1` returns the new `app.js` cache-buster;
- attempted in-app browser verification failed because the local browser runtime exited unexpectedly with `windows sandbox failed: spawn setup refresh`; no CRM code error was observed from this failure.

## 2026-06-02 - MESER HTTP 8090 started

User confirmed `D:\CRM\Exports\start-crm-export-http-server.ps1` exists on MESER, length `2998`, last write `02.06.2026 10:50:19`.

User launched it with `Start-Process powershell.exe ... -File D:\CRM\Exports\start-crm-export-http-server.ps1`.

`netstat -ano | findstr ":8090"` on MESER now shows:

- `TCP 0.0.0.0:8090 ... LISTENING 4`;
- `TCP [::]:8090 ... LISTENING 4`.

Conclusion: HTTP listener is now started through Windows HTTP.sys. Still need to confirm local MESER request returns `StatusCode 200`, then confirm Ubuntu can fetch `http://192.168.0.5:8090/1c_product_prices.csv`.

## 2026-06-02 - MESER local HTTP 8090 verified

User tested `http://127.0.0.1:8090/1c_product_prices.csv` inside the MESER PowerShell session.

Result:

- local MESER HTTP request returned `StatusCode 200`;
- port `8090` was already listening via HTTP.sys (`PID 4`).

Conclusion: the MESER export HTTP server is working locally. Next required check is network access from Ubuntu to MESER: `http://192.168.0.5:8090/1c_product_prices.csv`. If Ubuntu still times out while MESER local access works, the likely blocker is Windows Firewall or network routing between Ubuntu and MESER.

## 2026-06-02 - Ubuntu import from MESER HTTP completed

User ran `crm-1c-import.service` from Ubuntu after restoring MESER HTTP on `8090`.

Observed final log:

- `CRM 1C import finished: 2026-06-02 09:25:59`;
- systemd service finished/deactivated successfully;
- warning remained: `CRM 1C import finished with catalog warning; operational data was still refreshed`;
- final visible CRM-ready counts:
  - `crm_bank_accounts`: 43
  - `crm_contact_info_types`: 30
  - `crm_counterparties`: 9105
  - `crm_counterparty_balance_summary`: 413
  - `crm_counterparty_contracts`: 10693
  - `crm_counterparty_settlements`: 413
  - `crm_currencies`: 12
  - `crm_organizations`: 1
  - `crm_organization_units`: 3
  - `crm_persons`: 112
  - `crm_price_types`: 18
  - `crm_product_characteristics`: 2
  - `crm_product_groups`: 29
  - `crm_product_kinds`: 10
  - `crm_product_prices`: 28424
  - `crm_product_price_summary`: 6786
  - `crm_products`: 7013
  - `crm_product_series`: 14
  - `crm_reference_catalog_summary`: 18
  - `crm_reference_items`: 50390
  - `crm_stock_balances`: 2259
  - `crm_units`: 11824
  - `crm_warehouses`: 45

Conclusion: the automatic import path can refresh real CRM-ready SQL data from MESER. Next step is to inspect the exact catalog warning so it can be separated into harmless optional warnings versus a real missing catalog/import problem.

## 2026-06-02 - local fix prepared for catalog import `extra data after last expected column`

After inspecting the Ubuntu import log, the remaining catalog warning is not a MESER HTTP problem. MESER `8090` works locally, and Ubuntu was able to refresh operational data. The failing part is catalog import from `1c_products.csv`:

- log symptom: `ERROR: extra data after last expected column`;
- affected script: `scripts/ubuntu/import-1c-catalogs-http.sh`;
- likely cause: the real `1c_products.csv` contains more columns than the old importer expected.

Local repository change prepared:

- `scripts/ubuntu/import-1c-catalogs-http.sh` now normalizes every downloaded catalog CSV before PostgreSQL `COPY`;
- the normalized CSV has exactly these import columns: `row_no`, `external_ref`, `code`, `name`, `deletion_mark`, `raw_data_json`;
- extra source columns are preserved inside `raw_data_json`, so the CRM can still use them later instead of losing them;
- the final `raw_data` stored in PostgreSQL keeps both the standard fields and the full raw source payload.

Local check:

- `rg` confirms the new `normalize_catalog_csv` block is present;
- local Windows `bash -n` could not run because WSL has no installed Linux distribution on this workstation;
- therefore the real syntax check must be done on Ubuntu with `bash -n scripts/ubuntu/import-1c-catalogs-http.sh`.

What not to do:

- do not drop, truncate, or manually edit `one_c_mirror.raw_rows`;
- do not treat this as a price problem: `crm_product_prices` already has about `28424` rows;
- do not treat this as MESER port `8090` problem while MESER local request returns HTTP `200`;
- do not copy older Ubuntu scripts back over the updated importer.

Next safe action:

1. Copy only the updated `scripts/ubuntu/import-1c-catalogs-http.sh` from local Windows repo to Ubuntu.
2. Run `bash -n` on Ubuntu.
3. Start `crm-1c-import.service`.
4. Re-check the journal for `extra data`, `Import failed`, and `catalog warning`.

## 2026-06-02 - updated catalog importer copied to Ubuntu

User confirmed that the updated local file was copied to Ubuntu:

- local source: `D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-catalogs-http.sh`;
- Ubuntu target: `/home/crmadmin/SQL/scripts/ubuntu/import-1c-catalogs-http.sh`.

Purpose of this copy: fix catalog import failures caused by real 1C CSV files having more columns than the old importer expected.

Next safe action: run `bash -n scripts/ubuntu/import-1c-catalogs-http.sh` on Ubuntu before starting the import service.

## 2026-06-02 - Ubuntu syntax check passed for catalog importer

User ran the syntax check on Ubuntu:

```bash
cd ~/SQL
bash -n scripts/ubuntu/import-1c-catalogs-http.sh && echo "CATALOG IMPORT SCRIPT OK"
```

Result:

- `CATALOG IMPORT SCRIPT OK`

Conclusion: the updated catalog importer is syntactically valid on Ubuntu. Next step is a controlled `crm-1c-import.service` run and journal check for the old `extra data after last expected column` failure.

## 2026-06-02 - manual import service started after catalog importer fix

User ran on Ubuntu:

```bash
sudo systemctl start crm-1c-import.service
```

The command returned to the Ubuntu prompt. Import result has not been verified yet.

Next safe action: inspect `crm-1c-import.service` journal for `extra data after last expected column`, `catalog warning`, `Import failed`, and final import status.

## 2026-06-02 - catalog importer fix verified by service log

User checked the `crm-1c-import.service` journal after running the updated importer.

Observed:

- final log line: `CRM 1C import finished: 2026-06-02 11:27:53`;
- systemd line: `Finished crm-1c-import.service - CRM 1C CSV import into PostgreSQL`;
- no visible `extra data after last expected column` in the filtered output;
- red `ON_ERROR_STOP` strings in the screenshot are PostgreSQL command arguments printed by sudo/journal, not import failures.

Conclusion: the previous catalog `COPY` shape problem appears fixed. Next step is to verify final row counts in CRM-ready SQL views.

## 2026-06-02 - CRM-ready SQL counts after fixed catalog import

User ran the CRM-ready view count check on Ubuntu after the fixed catalog import.

Observed counts:

- `crm_counterparty_settlements`: 413
- `crm_product_prices`: 28424
- `crm_product_price_summary`: 6786
- `crm_products`: 11950
- `crm_products.products_with_prices`: 6786
- `crm_reference_items`: 62244
- `crm_stock_balances`: 2259

Conclusion:

- product catalog import is now much fuller than before;
- prices are present and linked into product-ready views;
- reference/catalog mirror is populated;
- stock balances and counterparty settlements are present.

This is the current good checkpoint for future CRM work. The next practical step is to verify the hourly automation and viewer after the fuller import, then expand SQL-ready views for B2B/B2C/marketplace/site needs.

## 2026-06-02 - continuation checkpoint after full SQL counts

Local repo and work log were re-checked after context compaction.

Current reliable checkpoint:

- MESER exports are available over `http://192.168.0.5:8090/` when `start-crm-export-http-server.ps1` is running.
- Ubuntu imports from MESER into PostgreSQL `crm_hub`.
- Latest confirmed CRM-ready counts include products, prices, reference items, stock balances, and counterparty settlements.
- Next safe user-facing step is to restart/verify the read-only viewer service so it displays the newly imported SQL-ready views.

Do not restart from old failing steps unless the same error appears again. In particular, do not treat logged `ON_ERROR_STOP` text as an import error by itself.

## 2026-06-02 - repeated SQL count check confirmed

User repeated the CRM-ready count query on Ubuntu.

Observed counts remained stable:

- `crm_counterparty_settlements`: 413
- `crm_product_prices`: 28424
- `crm_product_price_summary`: 6786
- `crm_products`: 11950
- `crm_products.products_with_prices`: 6786
- `crm_reference_items`: 62244
- `crm_stock_balances`: 2259

Conclusion: PostgreSQL still contains the expected imported data. Next step remains viewer restart/status check, then browser verification.

## 2026-06-02 12:42 - marketplace CRM role coverage audit

Context: after adding the Sales subviews (`Замовлення`, `Склад`, `Логістика`, `Клієнти`, `Комунікація`) and warehouse/logistics order actions, the role model needed to cover those new UI and workflow points.

Updated local prototype:

- `D:\Codex\CRM\marketplace-crm\app.js`
- `D:\Codex\CRM\marketplace-crm\index.html`

Changes:

- Added `ROLE_SUBVIEW_PERMISSIONS`, generated from `SUBVIEWS`, so roles can control access to every submenu separately from the main module.
- Added subview access into `defaultRoleAccess()` and `normalizeRole()`.
- Added `canAccessSubview()` and filtered `subviewsFor()` by current role.
- Added role matrix section `Доступ до підменю` in `Налаштування -> Команда / Ролі`.
- Added document permissions for warehouse/logistics workflow actions:
  - `warehousePicking` - warehouse picking confirmation;
  - `warehouseHandover` - handover from warehouse to logistics;
  - `logisticsAcceptance` - logistics acceptance / transfer to delivery.
- Added field permissions for:
  - `warehouse`;
  - `logistics`.
- Added separate action checks instead of using only generic marketplace status permission:
  - `canSendMarketplaceOrderToWarehouse()`;
  - `canConfirmMarketplacePicking()`;
  - `canHandoverMarketplaceOrderToLogistics()`;
  - `canAcceptMarketplaceOrderLogistics()`.
- Connected these checks to both the order modal action block and the marketplace order table action buttons.
- Connected these checks inside the actual action handlers, so DOM/manual calls are also blocked if the role does not allow the action.
- Updated cache/version marker to `v2026.06.02.6`, build `20260602-role-permissions-1`, time `12:42`.

Important behavior:

- A role can now be allowed to enter `Продажі`, but blocked from specific subviews such as `Склад` or `Логістика`.
- Warehouse lead/logistics roles should be configured through both submenu access and document/field permissions.
- If the current user loses access to the current submenu, the CRM switches to the first allowed submenu for that module.

Verification status:

- JavaScript syntax check passed: `node --check app.js`.
- Local server check passed: `http://127.0.0.1:8789/index.html` returned HTTP `200` and `app.js?v=20260602-role-permissions-1`.
- Browser refresh may still require `Ctrl+F5` or reopening `http://192.168.4.14:8789/index.html` if a tester already has the old bundle cached.

## 2026-06-02 - CRM SQL / 1C viewer restart confirmed

Context: after product prices were added to the 1C export/import flow and SQL views, the user restarted the Ubuntu web viewer service and confirmed the step with `Є`.

Positive state:

- MESER `D:\CRM\Exports` contains the updated export scripts and current CSV files, including `1c_product_prices.csv`.
- Ubuntu PostgreSQL import already has CRM-ready rows for products, prices, price summaries, stock balances, counterparty settlements, and reference items.
- Viewer service restart was requested on Ubuntu:
  `sudo systemctl restart crm-1c-viewer.service`

Next checks:

- Check that `crm-1c-viewer.service` is active.
- Then verify browser access to `http://192.168.0.166:8091/`.

Do not:

- Do not change the viewer password unless the browser returns HTTP `401` again.
- Do not restart import services only to test the viewer.
- Do not run Linux `&&` commands in Windows PowerShell; use SSH/Ubuntu shell for Linux commands.

## 2026-06-02 - CRM SQL / 1C viewer service is active

Context: the user checked `crm-1c-viewer.service` after restart and confirmed the service status is OK with `є`.

Positive state:

- Ubuntu viewer service is running after restart.
- Next step is browser/login verification, not another service restart.

Next:

- Open `http://192.168.0.166:8091/` in a browser.
- Login user is `admin`.
- If password fails or browser shows HTTP `401`, reset viewer credentials deliberately and restart only the viewer service.

Do not:

- Do not restart `crm-1c-import.service` for viewer login problems.
- Do not change import scripts while only testing web access.

## 2026-06-02 - New requirement: product folder as CRM attribute

Context: the user requested an architecture change for product loading from 1C. Products in 1C are stored in folders/groups, and this folder must become a separate unique product attribute in SQL/CRM.

Requirement:

- Export the 1C product folder/group as a separate product field.
- Keep the folder/group value selectable later in CRM filters/forms.
- Preserve uniqueness and make it visible as a product attribute, not only as hidden raw 1C metadata.

Initial assumption:

- The folder should be read from the 1C product hierarchy/parent group, then stored on product rows as fields such as `product_group_code`, `product_group_name`, and/or `product_group_ref`.
- Existing product group catalog remains useful as a dictionary, but product rows must also carry their own group/folder reference.

Do not:

- Do not replace product names with folder names.
- Do not lose existing product code/ref fields.
- Do not treat this as a UI-only change; it must pass through export, import, SQL views, and viewer output.

## 2026-06-02 - product folder/group attribute implemented locally

Context: continued from the new requirement that the 1C product folder/group must be a separate CRM attribute, not hidden raw metadata.

Local changes:

- `scripts/windows/export-1c-catalogs.vbs`
  - `1c_products.csv` export now includes `is_group`, `product_group_ref`, `product_group_code`, `product_group_name`.
  - For `Номенклатура`, these fields are read from `Элемент.Родитель`; for other catalogs they remain blank.
- `db/migrations/003_one_c_crm_ready_views.sql`
  - `one_c_mirror.crm_products` keeps all existing columns in the same order and appends:
    - `product_group_code`
    - `product_group_name`
    - `product_group_ref`
    - `is_group`
  - Added `one_c_mirror.crm_product_folders` for distinct folder values usable by CRM filters/forms.
  - Product rows from `1c_products.csv` now have priority over operational price/stock rows in `crm_products`, so folder fields are not lost when operational data is imported later.
- `scripts/ubuntu/run-1c-crm-viewer.py`
  - Products tab now shows folder name and folder code.
  - Added viewer tab `Папки товарів`.
- `apps/api/src/modules/one-c-mirror/one-c-mirror.service.ts`
  - `/one-c-mirror/products` now returns product group fields and compatible aliases:
    - `category`
    - `categoryName`
    - `group`
    - `categoryId`
    - `productGroupCode`
    - `productGroupName`
    - `productGroupRef`
  - Added `listProductFolders()`.
- `apps/api/src/modules/one-c-mirror/one-c-mirror.controller.ts`
  - Added endpoint `GET /one-c-mirror/product-folders`.
- `D:\Codex\CRM\marketplace-crm\app.js`
  - SQL/1C product import now prefers `productGroupName` / `product_group_name` for product category.
  - Stores `productGroupCode` and `productGroupRef` on imported products.
- `D:\Codex\CRM\marketplace-crm\index.html`
  - Bumped cache marker to `20260602-product-group-1`, prototype version `v2026.06.02.7`.

Documentation updated:

- `docs/one-c-catalog-export.md`
- `docs/one-c-mirror-import.md`
- `docs/one-c-automation.md`
- `docs/integration-exchange.md`

Local checks completed:

- `python -m py_compile SQL\scripts\ubuntu\run-1c-crm-viewer.py` using bundled Codex Python: OK.
- `node --check marketplace-crm\app.js` using bundled Codex Node: OK.
- Git Bash syntax checks:
  - `bash -n SQL\scripts\ubuntu\run-1c-import-now.sh`: OK.
  - `bash -n SQL\scripts\ubuntu\import-1c-catalogs-http.sh`: OK.
- `cscript //nologo SQL\scripts\windows\export-1c-catalogs.vbs /help`: OK.
- Local marketplace mock server check:
  - `http://127.0.0.1:8789/index.html` returned HTTP `200`;
  - page references `app.js?v=20260602-product-group-1`.

Not verified locally:

- TypeScript/NestJS build was not run locally because this Windows workspace still does not have the API dependencies installed.
- Real 1C query was not run from Codex. It must be verified on `MESER` by exporting `1c_products.csv`.
- PostgreSQL view migration was not applied locally. It must be applied on Ubuntu `crm-sql`.

Next safe deployment step:

1. Copy updated files to MESER:
   - `scripts/windows/export-1c-catalogs.ps1`
   - `scripts/windows/export-1c-catalogs.vbs`
2. Run catalog export on MESER, preferably `-Set base` or `-Set all` so `1c_products.csv` is refreshed with the new group columns.
3. Check the first line of `D:\CRM\Exports\1c_products.csv` and confirm it contains:
   - `product_group_ref`
   - `product_group_code`
   - `product_group_name`
4. Copy updated Ubuntu/API files to `crmadmin@crm-sql:/home/crmadmin/SQL` or commit/push and `git pull` there.
5. On Ubuntu:

```bash
cd ~/SQL
bash -n scripts/ubuntu/import-1c-catalogs-http.sh
bash -n scripts/ubuntu/run-1c-import-now.sh
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/run-1c-import-now.sh
```

6. Verify SQL:

```sql
SELECT
  count(*) AS products,
  count(*) FILTER (WHERE product_group_code IS NOT NULL OR product_group_name IS NOT NULL) AS products_with_folder
FROM one_c_mirror.crm_products;

SELECT *
FROM one_c_mirror.crm_product_folders
ORDER BY product_group_name NULLS LAST, product_group_code NULLS LAST
LIMIT 30;
```

7. Restart viewer if needed and verify `http://192.168.0.166:8091/` shows folder columns in `Товари` and a `Папки товарів` tab.

Do not:

- Do not truncate `one_c_mirror.raw_rows`.
- Do not manually edit `1c_products.csv`.
- Do not deploy the API change before applying `003_one_c_crm_ready_views.sql`, because `/one-c-mirror/products` now selects the new columns.

## 2026-06-02 - logging rule strengthened by user request

User instruction:

```text
після кожної дії вдалої чи ні обовязково записуй все у лог файл включно із кодами !
```

Action taken:

- Updated the `Правило ведення журналу` section in this file.
- Added explicit requirements to log:
  - successful and failed actions;
  - commands and code snippets;
  - exit codes/statuses when available;
  - error text or relevant error fragments;
  - next safe step.

Result:

- The work log now requires recording every meaningful action, including code/command details, not only summaries.

Command/code used for this update:

```text
apply_patch updated docs/crm-sql-work-log-2026-06-01.md
```

Status:

```text
apply_patch: Success
```

## 2026-06-02 - action log: checked product-group export/import/viewer state

User request:

```text
обнови експорт із новими правилами для товарів у SQL та імпорт у переглядалку
```

Action:

- Checked whether the local export/import/viewer/API/prototype files already contain the product folder/group fields.
- Checked SQL repo working tree status.
- Checked local marketplace prototype HTTP response and bundle cache marker.

Commands executed:

```powershell
rg -n "product_group_ref|product_group_code|product_group_name|crm_product_folders|product-folders|20260602-product-group-1|source_rank" SQL\scripts\windows\export-1c-catalogs.vbs SQL\scripts\ubuntu\import-1c-catalogs-http.sh SQL\scripts\ubuntu\run-1c-import-now.sh SQL\scripts\ubuntu\run-1c-crm-viewer.py SQL\db\migrations\003_one_c_crm_ready_views.sql SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.service.ts SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.controller.ts marketplace-crm\app.js marketplace-crm\index.html

git status --short

try {
  $response = Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:8789/index.html -TimeoutSec 3
  if ($response.Content -match 'app\.js\?v=([^"'']+)') {
    Write-Output "running $($response.StatusCode) $($matches[1])"
  } else {
    Write-Output "running $($response.StatusCode) no-script-version"
  }
} catch {
  Write-Output "not-running $($_.Exception.Message)"
}
```

Result:

```text
rg: product group markers found in exporter, SQL views, viewer, API, run import script, marketplace app and index.
git status --short: repo has existing modified/untracked files; no destructive action taken.
HTTP check: running 200 20260602-product-group-1
```

Status:

```text
rg exit code: 0
git status exit code: 0
HTTP check exit code: 0
```

Next action:

- Check `SQL\dist` because the prepared MESER transfer package may still contain older exporter files.

## 2026-06-02 - action log: checked existing dist package for product group fields

Action:

- Inspected `SQL\dist` to see whether existing transfer package already contains the new product folder/group export rules.

Commands executed:

```powershell
Get-ChildItem SQL\dist -Recurse | Select-Object FullName,Length,LastWriteTime

rg -n "product_group_ref|product_group_code|product_group_name|crm_product_folders|20260602-product-group-1" SQL\dist
```

Result:

```text
SQL\dist\1c-catalog-exporter-2026-06-01 exists.
SQL\dist\1c-catalog-exporter-2026-06-01.zip exists.
No product_group_* or crm_product_folders markers found in SQL\dist.
```

Status:

```text
Get-ChildItem exit code: 0
rg exit code: 1
```

Conclusion:

- Existing dist package is outdated for the new товарна папка / product folder requirement.

Next action:

- Create a new delivery package with updated MESER export files, Ubuntu import/viewer files, SQL view migration, API one-c mirror files, and updated docs.

## 2026-06-02 - action log: created product folder delivery package

Action:

- Created a new non-destructive delivery package for the product folder update.
- Did not delete or overwrite the old `1c-catalog-exporter-2026-06-01` package.

Package created:

```text
D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02
D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip
```

Files included:

```text
MESER-D-CRM-Exports\export-1c-catalogs.ps1
MESER-D-CRM-Exports\export-1c-catalogs.vbs
MESER-D-CRM-Exports\run-1c-export-now.ps1
MESER-D-CRM-Exports\start-crm-export-http-server.ps1
ubuntu-home-crmadmin-SQL\scripts\ubuntu\import-1c-catalogs-http.sh
ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-import-now.sh
ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
ubuntu-home-crmadmin-SQL\db\migrations\003_one_c_crm_ready_views.sql
ubuntu-home-crmadmin-SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.service.ts
ubuntu-home-crmadmin-SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.controller.ts
ubuntu-home-crmadmin-SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.module.ts
marketplace-crm-local\app.js
marketplace-crm-local\index.html
docs\one-c-catalog-export.md
docs\one-c-mirror-import.md
docs\one-c-automation.md
docs\integration-exchange.md
docs\crm-sql-work-log-2026-06-01.md
```

Command/code executed:

```powershell
$packageRoot = Join-Path (Resolve-Path 'SQL\dist').Path 'crm-product-folder-update-2026-06-02'
$meserDir = Join-Path $packageRoot 'MESER-D-CRM-Exports'
$ubuntuDir = Join-Path $packageRoot 'ubuntu-home-crmadmin-SQL'
$marketplaceDir = Join-Path $packageRoot 'marketplace-crm-local'
$docsDir = Join-Path $packageRoot 'docs'
New-Item -ItemType Directory -Force -Path $meserDir, $ubuntuDir, $marketplaceDir, $docsDir | Out-Null
$copyMap = @(
  @{ Source = 'SQL\scripts\windows\export-1c-catalogs.ps1'; Target = $meserDir },
  @{ Source = 'SQL\scripts\windows\export-1c-catalogs.vbs'; Target = $meserDir },
  @{ Source = 'SQL\scripts\windows\run-1c-export-now.ps1'; Target = $meserDir },
  @{ Source = 'SQL\scripts\windows\start-crm-export-http-server.ps1'; Target = $meserDir },
  @{ Source = 'SQL\scripts\ubuntu\import-1c-catalogs-http.sh'; Target = Join-Path $ubuntuDir 'scripts\ubuntu' },
  @{ Source = 'SQL\scripts\ubuntu\run-1c-import-now.sh'; Target = Join-Path $ubuntuDir 'scripts\ubuntu' },
  @{ Source = 'SQL\scripts\ubuntu\run-1c-crm-viewer.py'; Target = Join-Path $ubuntuDir 'scripts\ubuntu' },
  @{ Source = 'SQL\db\migrations\003_one_c_crm_ready_views.sql'; Target = Join-Path $ubuntuDir 'db\migrations' },
  @{ Source = 'SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.service.ts'; Target = Join-Path $ubuntuDir 'apps\api\src\modules\one-c-mirror' },
  @{ Source = 'SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.controller.ts'; Target = Join-Path $ubuntuDir 'apps\api\src\modules\one-c-mirror' },
  @{ Source = 'SQL\apps\api\src\modules\one-c-mirror\one-c-mirror.module.ts'; Target = Join-Path $ubuntuDir 'apps\api\src\modules\one-c-mirror' },
  @{ Source = 'marketplace-crm\app.js'; Target = $marketplaceDir },
  @{ Source = 'marketplace-crm\index.html'; Target = $marketplaceDir },
  @{ Source = 'SQL\docs\one-c-catalog-export.md'; Target = $docsDir },
  @{ Source = 'SQL\docs\one-c-mirror-import.md'; Target = $docsDir },
  @{ Source = 'SQL\docs\one-c-automation.md'; Target = $docsDir },
  @{ Source = 'SQL\docs\integration-exchange.md'; Target = $docsDir },
  @{ Source = 'SQL\docs\crm-sql-work-log-2026-06-01.md'; Target = $docsDir }
)
foreach ($item in $copyMap) {
  New-Item -ItemType Directory -Force -Path $item.Target | Out-Null
  Copy-Item -LiteralPath $item.Source -Destination $item.Target -Force
}
$zipPath = "$packageRoot.zip"
Compress-Archive -Path (Join-Path $packageRoot '*') -DestinationPath $zipPath -Force
Get-Item $zipPath | Select-Object FullName,Length,LastWriteTime
Get-ChildItem $packageRoot -Recurse | Select-Object FullName,Length | Sort-Object FullName
```

Result:

```text
Zip created: D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip
Zip size: 311829 bytes
Package tree includes MESER-D-CRM-Exports, ubuntu-home-crmadmin-SQL, marketplace-crm-local and docs.
```

Status:

```text
package creation exit code: 0
```

Verification command/code:

```powershell
rg -n "product_group_ref|product_group_code|product_group_name|crm_product_folders|product-folders|20260602-product-group-1" SQL\dist\crm-product-folder-update-2026-06-02

Get-Item SQL\dist\crm-product-folder-update-2026-06-02.zip | Select-Object FullName,Length,LastWriteTime

Get-ChildItem SQL\dist\crm-product-folder-update-2026-06-02 -Recurse -File | Select-Object FullName,Length | Sort-Object FullName
```

Verification result:

```text
rg found product_group_* markers in packaged VBS exporter, docs, SQL view migration, viewer, API service/controller and marketplace files.
Zip exists: D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip
Zip size: 311829 bytes
```

Verification status:

```text
rg exit code: 0
Get-Item exit code: 0
Get-ChildItem exit code: 0
```

Important note:

- The package copy of `docs\crm-sql-work-log-2026-06-01.md` was created before this current log entry. It must be recopied into the package and the zip rebuilt so the package contains the latest work log.

## 2026-06-02 - action log: refreshed work log copy inside delivery package

Action:

- Copied the updated main work log into the new delivery package.
- Rebuilt the zip after copying the updated log.
- Verified the package copy contains the `action log: created product folder delivery package` entry and product folder markers.

Command/code executed:

```powershell
$packageRoot = 'D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02'
$zipPath = 'D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip'
Copy-Item -LiteralPath 'D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md' -Destination (Join-Path $packageRoot 'docs') -Force
Compress-Archive -Path (Join-Path $packageRoot '*') -DestinationPath $zipPath -Force
Get-Item $zipPath | Select-Object FullName,Length,LastWriteTime
rg -n "action log: created product folder delivery package|product_group_ref|crm_product_folders" "$packageRoot\docs\crm-sql-work-log-2026-06-01.md"
```

Result:

```text
Zip rebuilt: D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip
New zip size: 312696 bytes
Package work log contains:
- product_group_code/product_group_name/product_group_ref references;
- one_c_mirror.crm_product_folders references;
- action log: created product folder delivery package.
```

Status:

```text
Copy-Item/Compress-Archive/Get-Item/rg command exit code: 0
```

Note:

- This current entry was written after the package log refresh, so the main log is the authoritative latest log.

## 2026-06-02 - action log: verified delivery package syntax

Action:

- Ran syntax/smoke checks on the files inside `dist\crm-product-folder-update-2026-06-02`, not just on source files.

Command/code executed:

```powershell
cscript //nologo SQL\dist\crm-product-folder-update-2026-06-02\MESER-D-CRM-Exports\export-1c-catalogs.vbs /help

if (Test-Path 'C:\Program Files\Git\bin\bash.exe') {
  & 'C:\Program Files\Git\bin\bash.exe' -n SQL\dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\import-1c-catalogs-http.sh
  & 'C:\Program Files\Git\bin\bash.exe' -n SQL\dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-import-now.sh
} else {
  Write-Output 'Git Bash not found'
}

& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m py_compile SQL\dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py

& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check SQL\dist\crm-product-folder-update-2026-06-02\marketplace-crm-local\app.js
```

Result:

```text
VBS /help printed usage successfully.
Bash syntax checks produced no errors.
Python py_compile produced no errors.
Node --check produced no errors.
```

Status:

```text
VBS cscript exit code: 0
Git Bash syntax check exit code: 0
Python py_compile exit code: 0
Node --check exit code: 0
```

Not verified:

- Real MESER 1C export was not executed from this Codex session.
- Real Ubuntu PostgreSQL import/viewer refresh was not executed from this Codex session.

## 2026-06-02 - action log: checked whether MESER export folder is locally reachable

Action:

- Checked whether this Codex Windows session is directly on the MESER export host or can see `D:\CRM\Exports`.
- Checked whether an existing `D:\CRM\Exports\export-1c-catalogs.vbs` could be inspected for product group markers.

Command/code executed:

```powershell
$env:COMPUTERNAME

if (Test-Path 'D:\CRM\Exports') {
  Get-ChildItem 'D:\CRM\Exports' | Select-Object Name,Length,LastWriteTime | Sort-Object Name
} else {
  Write-Output 'D:\CRM\Exports not found'
}

if (Test-Path 'D:\CRM\Exports') {
  rg -n "product_group_ref|product_group_code|product_group_name" 'D:\CRM\Exports\export-1c-catalogs.vbs'
} else {
  Write-Output 'D:\CRM\Exports not found'
}
```

Result:

```text
COMPUTERNAME: ZAKHP
D:\CRM\Exports not found
D:\CRM\Exports not found
```

Status:

```text
COMPUTERNAME command exit code: 0
Test-Path/Get-ChildItem command exit code: 0
Test-Path/rg command exit code: 0
```

Conclusion:

- This Codex session cannot directly update the MESER `D:\CRM\Exports` folder.
- Use the prepared delivery package:

```text
D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip
```

## 2026-06-02 - user reports viewer update shows no changes

User report:

```text
я обновив 1C CRM Mirror Viewer але змін там немає !!!!
```

Initial diagnosis:

- If the browser still shows the old viewer layout, likely causes are:
  - `run-1c-crm-viewer.py` was copied to the wrong Ubuntu path;
  - `crm-1c-viewer.service` was not restarted after copying the file;
  - browser loaded an old page/cache;
  - service uses a different `WorkingDirectory` or script path than expected.
- If the new viewer script is running but SQL views were not updated, the viewer should usually show an SQL error for missing columns such as `product_group_name` instead of silently showing old columns.

Next action:

- Inspect local viewer install/service script to provide exact Ubuntu diagnostic commands.

## 2026-06-02 - action log: inspected viewer service path and runtime behavior

Action:

- Inspected local viewer installer and viewer runtime code to identify why updating the viewer may show no visible changes.

Command/code executed:

```powershell
Get-Content SQL\scripts\ubuntu\install-1c-viewer-systemd-service.sh -Encoding UTF8

rg -n "run-1c-crm-viewer|crm-1c-viewer|WorkingDirectory|ExecStart|8091|VIEWER" SQL\scripts\ubuntu SQL\docs\one-c-automation.md SQL\docs\crm-sql-work-log-2026-06-01.md

Get-Content SQL\scripts\ubuntu\run-1c-crm-viewer.py -Encoding UTF8 | Select-Object -Skip 1080 -First 170
```

Relevant code found:

```systemd
WorkingDirectory=${REPO_ROOT}
ExecStart=/usr/bin/python3 ${VIEWER_SCRIPT} --host ${VIEWER_HOST} --port ${VIEWER_PORT} --use-postgres-sudo
```

Expected deployed paths:

```text
Service file: /etc/systemd/system/crm-1c-viewer.service
Repo root: /home/crmadmin/SQL
Viewer script: /home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py
Viewer URL: http://192.168.0.166:8091/
```

Diagnosis:

- If browser still shows old layout and no SQL error, the likely problem is that the running service still uses the old `run-1c-crm-viewer.py` or was not restarted.
- If the new viewer script runs but `003_one_c_crm_ready_views.sql` was not applied, the viewer should likely show an SQL error for missing `product_group_name` / `crm_product_folders`.

Status:

```text
Get-Content exit code: 0
rg exit code: 0
```

Next safe diagnostic on Ubuntu:

```bash
cd ~/SQL
grep -n "Папки товарів\|product_group_name\|crm_product_folders" scripts/ubuntu/run-1c-crm-viewer.py | head -30
systemctl cat crm-1c-viewer.service
sudo systemctl restart crm-1c-viewer.service
systemctl status crm-1c-viewer.service --no-pager
sudo -u postgres psql -d crm_hub -c "\d+ one_c_mirror.crm_products"
sudo -u postgres psql -d crm_hub -c "select to_regclass('one_c_mirror.crm_product_folders');"
```

## 2026-06-02 - user screenshot: viewer port 8091 connection refused

User provided browser screenshot for:

```text
http://192.168.0.166:8091/
```

Observed browser error:

```text
Немає зв'язку із сайтом
Хост 192.168.0.166 відхилив запит на з'єднання.
ERR_CONNECTION_REFUSED
```

Diagnosis:

- This is no longer a "viewer has old content" problem.
- `ERR_CONNECTION_REFUSED` means TCP connection reached the host but port `8091` is not accepting connections.
- Likely causes:
  - `crm-1c-viewer.service` is stopped;
  - service crashed during startup, possibly because SQL view columns are missing or Python script failed;
  - service is listening only on `127.0.0.1` instead of `0.0.0.0`;
  - wrong port or old service file.

Action taken in this chat:

- No remote command was run against Ubuntu from Codex.
- Provided a safe diagnostic/restart command block for the user to run on Ubuntu.

Command/code to run on Ubuntu:

```bash
cd ~/SQL

echo "=== viewer service status ==="
systemctl status crm-1c-viewer.service --no-pager -l

echo "=== viewer service unit ==="
systemctl cat crm-1c-viewer.service

echo "=== viewer recent logs ==="
journalctl -u crm-1c-viewer.service -n 80 --no-pager

echo "=== check whether port 8091 is listening ==="
sudo ss -ltnp | grep ':8091' || true

echo "=== verify new viewer file exists ==="
grep -n "Папки товарів\|product_group_name\|crm_product_folders" scripts/ubuntu/run-1c-crm-viewer.py | head -30

echo "=== apply SQL views required by new viewer ==="
sudo -u postgres psql -v ON_ERROR_STOP=1 -d crm_hub -f db/migrations/003_one_c_crm_ready_views.sql

echo "=== restart viewer ==="
sudo systemctl daemon-reload
sudo systemctl restart crm-1c-viewer.service
sleep 2

echo "=== viewer status after restart ==="
systemctl status crm-1c-viewer.service --no-pager -l

echo "=== port after restart ==="
sudo ss -ltnp | grep ':8091' || true

echo "=== local HTTP check ==="
curl -I --max-time 5 http://127.0.0.1:8091/ || true
```

Expected good result:

```text
crm-1c-viewer.service active (running)
0.0.0.0:8091 or *:8091 is LISTENING
curl local check returns HTTP/1.0 401 Unauthorized or HTTP/1.0 200 OK
```

Status:

```text
Log entry added from user screenshot report.
No Ubuntu command exit code available yet.
```

## 2026-06-02 - user screenshot: viewer service active but still loading SQL payload

User provided Ubuntu/Chrome screenshots after running the diagnostic block.

Observed terminal output:

```text
CREATE VIEW
CREATE VIEW
...
COMMIT
=== restart viewer ===
=== status after restart ===
crm-1c-viewer.service - CRM 1C read-only web viewer
Loaded: loaded (/etc/systemd/system/crm-1c-viewer.service; enabled; preset: enabled)
Active: active (running) since Tue 2026-06-02 15:17:20 UTC; 2s ago
Main PID: 52173 (python3)
ExecStart:
/usr/bin/python3 /home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py --host 0.0.0.0 --port 8091 --use-postgres-sudo
Child process:
sudo -n -u postgres psql -X -q -d crm_hub -v ON_ERROR_STOP=1 -c "COPY (... FROM one_c_mirror.crm_products ...) TO STDOUT WITH CSV HEADER"
=== local HTTP check ===
curl: (7) Failed to connect to 127.0.0.1 port 8091 after 0 ms: Could not connect to server
```

Browser still shows:

```text
ERR_CONNECTION_REFUSED
```

Diagnosis:

- The service is not dead; it is `active (running)`.
- The status shows the viewer is still in startup data loading, executing PostgreSQL `COPY` against `one_c_mirror.crm_products`.
- `run-1c-crm-viewer.py` loads SQL payload before opening the HTTP listener. During that startup window port `8091` is not listening yet, so `curl` can return connection refused even though the service is active.
- The immediate next check is to wait and inspect journal/port, not to reinstall the viewer.

Command/code to run on Ubuntu:

```bash
echo "=== wait for viewer startup ==="
sleep 20

echo "=== recent viewer logs ==="
journalctl -u crm-1c-viewer.service -n 120 --no-pager

echo "=== port 8091 ==="
sudo ss -ltnp | grep ':8091' || true

echo "=== local HTTP check ==="
curl -I --max-time 5 http://127.0.0.1:8091/ || true
```

Expected good result:

```text
Loaded ... rows
Serving CRM 1C viewer on http://0.0.0.0:8091
LISTEN 0  ... 0.0.0.0:8091 ...
HTTP/1.0 401 Unauthorized
```

Status:

```text
Log entry added from user screenshot report.
No new Ubuntu command exit code available yet.
```

## 2026-06-02 - action log: inspected GitHub sync state for `1973zahar/SQL`

User request:

```text
обнови всі файли і логи сюди і роби це автоматично постійно [1973zahar/SQL](https://github.com/1973zahar/SQL)
```

Action:

- Checked local git status.
- Checked remote URL.
- Checked `.gitignore`.
- Checked for files larger than 10 MB.
- Scanned text files for obvious secret/password/token patterns, excluding docx/zip/dist/cache paths.

Commands executed:

```powershell
git status -sb

git remote -v

Get-Content .gitignore -Encoding UTF8

Get-ChildItem -Recurse -File |
  Where-Object { $_.Length -gt 10MB } |
  Select-Object FullName,Length,LastWriteTime |
  Sort-Object Length -Descending

rg -n "(PASSWORD|VIEWER_PASSWORD|POSTGRES_PASSWORD|DATABASE_URL|CRM_1C_CONNECTION_STRING|Pwd=|Usr=|token|secret|api[_-]?key)" -g "!*.docx" -g "!*.zip" -g "!dist/**" -g "!**/__pycache__/**" .
```

Result:

```text
git status: local main is based on origin/main and has many modified/untracked project files.
remote: origin https://github.com/1973zahar/SQL.git
large files >10MB: none found
secret scan: found documented placeholders/templates and no-login 1C connection strings; no real password was identified in the scanned text output.
unwanted cache: scripts/ubuntu/__pycache__/ is currently untracked and should not be committed.
```

Important status output:

```text
## main...origin/main
 M .gitignore
 M README.md
 M apps/api/Dockerfile
 M apps/api/src/modules/app.module.ts
 M apps/api/src/modules/integrations/integrations.processor.ts
 M apps/api/src/modules/integrations/integrations.service.ts
 M apps/api/src/modules/products/products.service.ts
 M db/admin/002_verify_crm_database.sql
 M db/admin/003_reassign_crm_objects.sql
 M db/manual/002_module_roles.sql
 M docs/integration-exchange.md
 M packages/database/prisma/schema.prisma
?? .gitattributes
?? apps/api/src/modules/one-c-mirror/
?? db/migrations/002_one_c_mirror.sql
?? db/migrations/003_one_c_crm_ready_views.sql
?? dist/
?? docs/crm-sql-1c-status-2026-06-01.docx
?? docs/crm-sql-architecture-summary-2026-06-02.md
?? docs/crm-sql-work-log-2026-06-01.md
?? docs/current-status-2026-06-01.md
?? docs/integration-smoke-tests.md
?? docs/meser-1c-export-diagnostics.md
?? docs/one-c-automation.md
?? docs/one-c-catalog-export.md
?? docs/one-c-mirror-import.md
?? docs/one-c-operational-export-import.md
?? docs/Виправити PostgreSQL для CRM.docx
?? scripts/ubuntu/__pycache__/
?? scripts/ubuntu/import-1c-catalogs-http.sh
?? scripts/ubuntu/import-1c-operational-http.sh
?? scripts/ubuntu/install-1c-import-systemd-timer.sh
?? scripts/ubuntu/install-1c-viewer-systemd-service.sh
?? scripts/ubuntu/run-1c-crm-viewer.py
?? scripts/ubuntu/run-1c-import-now.sh
?? scripts/windows/check-meser-1c-export-state.ps1
?? scripts/windows/export-1c-catalogs.ps1
?? scripts/windows/export-1c-catalogs.vbs
?? scripts/windows/export-1c-operational-data.ps1
?? scripts/windows/export-1c-operational-data.vbs
?? scripts/windows/install-1c-export-scheduled-task.ps1
?? scripts/windows/run-1c-export-now.ps1
?? scripts/windows/start-crm-export-http-server.ps1
```

Status:

```text
git status exit code: 0
git remote exit code: 0
Get-Content .gitignore exit code: 0
large-file scan exit code: 0
secret-pattern scan exit code: 0
```

Next action:

- Add Python cache ignore rules before staging files for GitHub.

## 2026-06-02 - action log: added Python cache ignore rules

Action:

- Updated `.gitignore` so Python cache files are not committed to GitHub.

Patch/code applied:

```diff
 npm-debug.log*
 .ssh_known_hosts
+__pycache__/
+*.pyc
```

Result:

```text
.gitignore now excludes __pycache__/ and *.pyc.
```

Status:

```text
apply_patch exit code: 0
```

Next action:

- Re-check git status and build a clean staging set for commit.

## 2026-06-02 - action log: re-checked git status after ignore update

Action:

- Re-checked git status after adding Python cache ignore rules.
- Checked ignored cache paths.
- Re-read `.gitignore`.

Commands executed:

```powershell
git status --short

git status --ignored --short | Select-String -Pattern "__pycache__|\.pyc|dist|crm-sql-work-log"

Get-Content .gitignore -Encoding UTF8
```

Result:

```text
scripts/ubuntu/__pycache__/ is no longer listed as a normal untracked file.
scripts/ubuntu/__pycache__/ and dist/.../__pycache__/ are listed as ignored.
dist/ remains untracked and will be included because it contains the delivery package requested for syncing.
New untracked docs file also visible: docs/marketplace-crm-handoff-2026-06-02-novapay.md.
```

Status:

```text
git status exit code: 0
git status --ignored pipeline exit code: 0
Get-Content .gitignore exit code: 0
```

Next action:

- Stage all non-ignored project files and logs for commit.

## 2026-06-02 - action log: staged files and ran cached checks

Action:

- Staged all non-ignored files.
- Re-checked staged status.
- Ran staged diff stat.
- Ran staged whitespace/error check.
- Listed staged filenames.

Commands executed:

```powershell
git add -A

git status --short

git diff --cached --stat

git diff --cached --check

git diff --cached --name-only
```

Result:

```text
git add completed with LF/CRLF warnings only.
staged files include .gitattributes, .gitignore, API changes, SQL migrations, docs, logs, scripts, dist packages, and DOCX context files.
git diff --cached --stat: 73 files changed, 45914 insertions(+), 49 deletions(-).
git diff --cached --check found whitespace issues:
- docs/crm-sql-architecture-summary-2026-06-02.md:211 new blank line at EOF
- docs/marketplace-crm-handoff-2026-06-02-novapay.md:3 trailing whitespace
- docs/marketplace-crm-handoff-2026-06-02-novapay.md:218 new blank line at EOF
- scripts/ubuntu/install-1c-viewer-systemd-service.sh:87 new blank line at EOF
- scripts/windows/install-1c-export-scheduled-task.ps1:56 new blank line at EOF
```

Status:

```text
git add exit code: 0
git status exit code: 0
git diff --cached --stat exit code: 0
git diff --cached --check exit code: 1
git diff --cached --name-only exit code: 0
```

Next action:

- Fix whitespace issues and restage affected files before commit.

## 2026-06-02 - action log: fixed staged whitespace issues

Action:

- Fixed only whitespace issues reported by `git diff --cached --check`.

Patch/code applied:

```diff
docs/marketplace-crm-handoff-2026-06-02-novapay.md
-Дата створення: 2026-06-02
+Дата створення: 2026-06-02

docs/marketplace-crm-handoff-2026-06-02-novapay.md
- removed final extra blank line after closing code fence

docs/crm-sql-architecture-summary-2026-06-02.md
- removed final extra blank line at EOF

scripts/ubuntu/install-1c-viewer-systemd-service.sh
- removed final extra blank line at EOF

scripts/windows/install-1c-export-scheduled-task.ps1
- removed final extra blank line at EOF
```

Status:

```text
apply_patch for handoff doc exit code: 0
apply_patch for architecture summary exit code: 0
apply_patch for Ubuntu viewer installer exit code: 0
apply_patch for Windows scheduled task installer exit code: 0
```

Next action:

- Restage changed files and repeat cached whitespace check.

## 2026-06-02 - action log: restaged files and cached check passed

Action:

- Restaged all files after whitespace fixes.
- Re-ran staged whitespace check.
- Re-checked staged status and staged diff stat.

Commands executed:

```powershell
git add -A

git diff --cached --check

git status --short

git diff --cached --stat
```

Result:

```text
git add completed with LF/CRLF warnings only.
git diff --cached --check produced no output.
staged status includes 73 files.
staged stat: 73 files changed, 46062 insertions(+), 49 deletions(-).
```

Status:

```text
git add exit code: 0
git diff --cached --check exit code: 0
git status exit code: 0
git diff --cached --stat exit code: 0
```

Next action:

- Restage this log update and create a local commit for GitHub sync.
## 2026-06-02 - Підсумок архітектури для нового чату

Створено файл підсумку для перенесення роботи в новий чат:

- `D:\Codex\CRM\SQL\docs\crm-sql-architecture-summary-2026-06-02.md`

У підсумок внесено:

- поточну архітектуру MESER `192.168.0.5` + Ubuntu/PostgreSQL `192.168.0.166`;
- список створених Windows/Ubuntu скриптів;
- схеми, таблиці та CRM-ready views у PostgreSQL;
- останні відомі кількості даних;
- переглядалку `http://192.168.0.166:8091/`;
- погодинну автоматизацію імпорту;
- помилки і негативні спроби, які не повторювати;
- наступну задачу: зробити папку товару з 1C окремим реквізитом товару для CRM.

Що не вдалося зробити автоматично:

- напряму створити новий чат Codex з цього середовища. Доступного інструмента керування чатами у поточній сесії немає.

Що робити далі:

- у новому чаті вставити або прикріпити файл `crm-sql-architecture-summary-2026-06-02.md`;
- продовжити з задачі: додати папку/групу товару у вивантаження `Номенклатура`, SQL views та переглядалку.
## 2026-06-02 - Пауза роботи і handoff для нового чату

Користувач зупинив поточну роботу і попросив створити файл для продовження з цього місця у новому чаті.

Створено файл:

- `D:\Codex\CRM\SQL\docs\marketplace-crm-handoff-2026-06-02-novapay.md`

У файл внесено:

- поточну архітектуру CRM-прототипу, SQL, PostgreSQL і 1C;
- що вже зроблено;
- відкриті задачі;
- помилки;
- наступні кроки;
- окремий блок "Продовження написання та зміни коду";
- стартовий текст для нового чату.

Остання активна задача перед паузою:

- підключити NovaPay API;
- додати рознесення платежів по ТТН;
- фіксувати всі вдалі та провальні дії в цьому лог-файлі.

Успішні дії:

- створено handoff-файл у `SQL/docs`;
- перевірено наявність каталогу `D:\Codex\CRM\SQL\docs`;
- зафіксовано точку продовження для NovaPay.

Провальні / обмежені дії:

- автоматично створити новий Codex-чат із поточного середовища не вдалося: доступного thread tool у цій сесії не було; знайдені тільки multi-agent/sub-agent інструменти, що не є створенням нового чату користувача;
- команда `git status --short` у `D:\Codex\CRM\marketplace-crm` завершилась помилкою:

```text
fatal: detected dubious ownership in repository at 'D:/Codex/CRM/marketplace-crm'
```

Код/тип помилки:

```text
git-dubious-ownership
```

Причина:

```text
repository owner: ZAKHP/CodexSandboxOffline
current user: ZAKHP/User
```

Наступний крок після відкриття нового чату:

```text
Вставити або прикріпити файл:
D:\Codex\CRM\SQL\docs\marketplace-crm-handoff-2026-06-02-novapay.md

Потім продовжити задачу:
підключити NovaPay API через серверний gateway і додати рознесення платежів по ТТН у CRM.
```
## 2026-06-02 - GitHub sync: staged status/check/stat verification

Action: checked staged repository state before GitHub sync to `https://github.com/1973zahar/SQL.git`.

Commands:

```powershell
git status --short
git diff --cached --check
git diff --cached --stat
```

Results:

- `git status --short`: exit code `0`; staged set includes SQL/API/migration/docs/export/viewer/package updates; work log has staged plus unstaged changes (`AM docs/crm-sql-work-log-2026-06-01.md`).
- `git diff --cached --check`: exit code `0`; no whitespace errors.
- `git diff --cached --stat`: exit code `0`; `73 files changed, 46062 insertions(+), 49 deletions(-)`.

Status: successful. Next action: stage the latest work-log entry and create the Git commit for GitHub sync.

## 2026-06-02 - GitHub sync: staged latest work log

Action: staged all current repository changes, including the latest work-log entry.

Command:

```powershell
git add -A
```

Result:

- Exit code: `0`
- Warning:

```text
warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it
```

Status: successful. Next action: stage this appended log entry, re-check staged diff, then commit.

## 2026-06-02 - GitHub sync: final staged verification before commit

Action: re-staged the updated work log and re-checked the staged diff before commit.

Commands:

```powershell
git add -A
git diff --cached --check
git status --short
git diff --cached --stat
```

Results:

- `git add -A`: exit code `0`; Git repeated the LF-to-CRLF warning for `docs/crm-sql-work-log-2026-06-01.md`.
- `git diff --cached --check`: exit code `0`; no whitespace errors.
- `git status --short`: exit code `0`; all listed project updates are staged, including `docs/crm-sql-work-log-2026-06-01.md`.
- `git diff --cached --stat`: exit code `0`; `73 files changed, 46144 insertions(+), 49 deletions(-)`.

Status: successful. Next action: stage this appended verification entry and create commit `Sync CRM SQL integration logs and 1C mirror tooling`.

## 2026-06-02 - GitHub sync: main commit created

Action: created the main Git commit for SQL project files, docs, logs, 1C export/import rules, viewer updates, API mirror module, and delivery packages.

Commands:

```powershell
git add -A
git commit -m "Sync CRM SQL integration logs and 1C mirror tooling"
```

Results:

- `git add -A`: exit code `0`; Git repeated the LF-to-CRLF warning for `docs/crm-sql-work-log-2026-06-01.md`.
- `git commit`: exit code `0`.
- Commit created: `cb338c9`.
- Summary: `73 files changed, 46166 insertions(+), 49 deletions(-)`.

Status: successful. Next action: commit this log entry separately so GitHub receives the record of the main sync commit, then push `main` to `origin`.

## 2026-06-02 - GitHub sync: log-only commit and first push attempt

Action: committed the work-log entry for the main sync commit and attempted to push local `main` to GitHub remote `origin`.

Commands:

```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git commit -m "Log SQL GitHub sync commit"
git status --short --branch
git log --oneline -2
git push origin main
```

Results:

- `git add docs/crm-sql-work-log-2026-06-01.md`: exit code `0`; Git repeated the LF-to-CRLF warning for `docs/crm-sql-work-log-2026-06-01.md`.
- `git commit -m "Log SQL GitHub sync commit"`: exit code `0`; commit created: `bc8d211`; `1 file changed, 20 insertions(+)`.
- `git status --short --branch`: exit code `0`; `main...origin/main [ahead 2]`.
- `git log --oneline -2`: exit code `0`; latest commits are `bc8d211 Log SQL GitHub sync commit` and `cb338c9 Sync CRM SQL integration logs and 1C mirror tooling`.
- `git push origin main`: exit code `1`; failed with:

```text
fatal: unable to access 'https://github.com/1973zahar/SQL.git/': schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030e) - В пакете безопасности отсутствуют учетные данные
```

Status: push failed because the current execution context has no GitHub HTTPS credentials. Next action: commit this push-failure log entry locally, then retry `git push origin main` with elevated/system credential access.

## 2026-06-02 - GitHub sync: elevated push succeeded

Action: committed the push-failure log entry and retried GitHub push with elevated/system credential access.

Commands:

```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git commit -m "Log SQL GitHub push failure"
git push origin main
```

Results:

- `git add docs/crm-sql-work-log-2026-06-01.md`: exit code `0`; Git repeated the LF-to-CRLF warning for `docs/crm-sql-work-log-2026-06-01.md`.
- `git commit -m "Log SQL GitHub push failure"`: exit code `0`; commit created: `113a3d6`; `1 file changed, 28 insertions(+)`.
- Elevated `git push origin main`: exit code `0`; pushed `main` from `6d0fedf` to `113a3d6`.

Status: successful. GitHub remote `https://github.com/1973zahar/SQL.git` now contains commits through `113a3d6`. Next action: commit and push this success-log entry so the remote also contains the successful push record.

## 2026-06-02 - GitHub sync: final log commit pushed and automation created

Action: committed and pushed the success-log entry, checked for existing automations, and created a recurring Codex automation for ongoing SQL GitHub synchronization.

Commands and tool calls:

```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git commit -m "Log SQL GitHub push success"
git push origin main
Get-ChildItem -Path $env:USERPROFILE\.codex\automations -Recurse -Filter automation.toml -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
```

```json
{
  "tool": "codex_app.automation_update",
  "mode": "create",
  "kind": "cron",
  "name": "SQL GitHub Auto Sync",
  "status": "ACTIVE",
  "rrule": "FREQ=HOURLY;INTERVAL=1",
  "executionEnvironment": "local",
  "cwds": ["D:\\Codex\\CRM\\SQL"],
  "model": "gpt-5-codex",
  "reasoningEffort": "medium",
  "automationId": "sql-github-auto-sync"
}
```

Results:

- `git add docs/crm-sql-work-log-2026-06-01.md`: exit code `0`; Git repeated the LF-to-CRLF warning for `docs/crm-sql-work-log-2026-06-01.md`.
- `git commit -m "Log SQL GitHub push success"`: exit code `0`; commit created: `1ff1228`; `1 file changed, 20 insertions(+)`.
- Elevated `git push origin main`: exit code `0`; pushed `main` from `113a3d6` to `1ff1228`.
- Existing automation search: exit code `1`; no existing `automation.toml` entries were returned.
- Automation create: successful; created active hourly automation `sql-github-auto-sync`.

Status: successful. Next action: commit and push this automation-log entry so the remote also records the recurring sync setup.

## 2026-06-02 - Viewer issue: product folder columns missing on live page

Action: investigated user screenshot showing live `1C CRM Mirror Viewer` at `http://192.168.0.166:8091` with slice `2026-06-02 15:19:27 UTC`, where product table does not visibly show the new folder/group columns.

Commands:

```powershell
rg -n "Папка|Код папки|product_group|crm_product_folders|crm_products" scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py db\migrations\003_one_c_crm_ready_views.sql docs\crm-sql-work-log-2026-06-01.md
git status --short --branch
Get-Content docs\crm-sql-work-log-2026-06-01.md -Tail 80
```

Results:

- `rg`: exit code `0`; local repo and packaged Ubuntu viewer both contain product columns `product_group_name` / `Папка`, `product_group_code` / `Код папки`, and view tab `crm_product_folders` / `Папки товарів`.
- `git status --short --branch`: exit code `0`; local branch is clean and aligned with `origin/main`.
- `Get-Content ... -Tail 80`: exit code `0`; confirmed the latest GitHub sync and automation log entries are present locally.

Status: successful investigation. Current diagnosis: the live server is likely running an older `/home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py`, or it loaded an older SQL/view snapshot before the new fields were applied. Next action: inspect the viewer code path and prepare exact Ubuntu verification/redeploy commands.

## 2026-06-02 - Viewer issue: local viewer implementation inspected

Action: inspected the local Ubuntu viewer implementation and service installer to determine why live page columns can be missing.

Commands:

```powershell
Get-Content scripts\ubuntu\run-1c-crm-viewer.py -TotalCount 120
rg -n "renderTable|columns|snapshot|last_updated|http.server|ThreadingHTTPServer|DATA|VIEWS|selectView" scripts\ubuntu\run-1c-crm-viewer.py
Get-Content scripts\ubuntu\install-1c-viewer-systemd-service.sh -TotalCount 140
```

Results:

- `Get-Content scripts\ubuntu\run-1c-crm-viewer.py -TotalCount 120`: exit code `0`; product view defines `product_group_name` and `product_group_code` immediately after `product_name`.
- `rg`: exit code `0`; `renderTable` uses `view.columns`, so a live page without `Папка` / `Код папки` is not hiding these columns dynamically in the current repo version.
- `Get-Content scripts\ubuntu\install-1c-viewer-systemd-service.sh -TotalCount 140`: exit code `0`; service runs `${REPO_ROOT}/scripts/ubuntu/run-1c-crm-viewer.py` from `/home/crmadmin/SQL` when installed there.

Status: successful. Diagnosis tightened: the visible live page is not using the current repo version of `/home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py`, or the service was restarted from a stale working directory/file. Next action: add a visible viewer build marker and runtime schema diagnostics so future mismatches are obvious.

## 2026-06-02 - Viewer issue: render/reload behavior inspected

Action: inspected table render, payload loading, HTTP handlers, and reload/import endpoints in the Ubuntu viewer.

Commands:

```powershell
Get-Content scripts\ubuntu\run-1c-crm-viewer.py | Select-Object -Skip 930 -First 120
Get-Content scripts\ubuntu\run-1c-crm-viewer.py | Select-Object -Skip 1180 -First 90
Get-Content scripts\ubuntu\run-1c-crm-viewer.py | Select-Object -Skip 1270 -First 120
```

Results:

- First command: exit code `0`; `renderTable(rows)` builds the header directly from `view.columns`.
- Second command: exit code `0`; `load_payload(args)` loads rows for each static `VIEW_DEFINITIONS` entry and includes `columns` in `/api/data`.
- Third command: exit code `0`; `/api/reload` and `/api/import-now` only reload SQL payload, while `/` serves the currently running Python file's embedded `INDEX_HTML`.

Status: successful. Finding: clicking `Оновити з SQL` cannot add newly coded columns if the running systemd process still uses an old Python file; it only refreshes row data. Next action: edit viewer to expose a visible build marker/schema check, then package and push the fix.

## 2026-06-02 - Viewer issue: first build-marker patch attempt failed

Action: attempted to patch the Ubuntu viewer and packaged viewer with a visible build marker and `/health` build output, then searched exact context for a corrected patch.

Commands:

```powershell
apply_patch
rg -n -C 4 "<header>|loadedAt|read-only|\.meta|function renderPager|function render\(|state.payload = await response.json|state.payload = result.payload|loadedAt\":|if path == \"/health\"" scripts\ubuntu\run-1c-crm-viewer.py
rg -n -C 4 "<header>|loadedAt|read-only|\.meta|function renderPager|function render\(|state.payload = await response.json|state.payload = result.payload|loadedAt\":|if path == \"/health\"" dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
git diff -- scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
rg -n -C 4 '<header>|loadedAt|read-only|\.meta|function renderPager|function render\(|state\.payload = await response\.json|state\.payload = result\.payload|"loadedAt"|if path == "/health"' scripts\ubuntu\run-1c-crm-viewer.py
rg -n -C 4 '<header>|loadedAt|read-only|\.meta|function renderPager|function render\(|state\.payload = await response\.json|state\.payload = result\.payload|"loadedAt"|if path == "/health"' dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
git diff -- scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
```

Results:

- `apply_patch`: exit code `1`; patch failed because expected HTML context did not include the existing `<span id="reloadStatus"></span>` line.
- First two `rg` commands: exit code `1`; PowerShell parser error from unescaped double quotes in the regex string.
- First `git diff`: exit code `0`; no viewer file changes were made by the failed patch.
- Corrected `rg` commands with single-quoted regex: exit code `0`; found exact header/context lines in both main and packaged viewer files.
- Final `git diff`: exit code `0`; still no viewer file changes before the corrected patch.

Status: failed patch attempt, successful recovery/context lookup. Next action: apply a corrected patch using the actual header context with `reloadStatus`.

## 2026-06-02 - Viewer issue: build marker patch applied

Action: applied corrected patch to the main Ubuntu viewer and packaged copy to expose the running viewer build/version.

Commands:

```powershell
rg -n -C 3 health scripts\ubuntu\run-1c-crm-viewer.py
rg -n -C 3 health dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
apply_patch
python -m py_compile scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
rg -n "VIEWER_BUILD|viewerBuild|product_group_name|product_group_code|build=" scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
git diff --stat
```

Results:

- Simple `rg ... health` commands: exit code `0`; found `/health` handler in both viewer files.
- Corrected `apply_patch`: exit code `0`; modified both viewer files.
- `python -m py_compile ...`: exit code `1`; failed because `python` is not available in the Windows PATH of this shell.
- Marker `rg`: exit code `0`; both viewer files contain `VIEWER_BUILD = "2026-06-02-product-folder-columns-2"`, `viewerBuild`, `/health` build output, and `product_group_name` / `product_group_code` columns.
- `git diff --stat`: exit code `0`; changed main viewer, packaged viewer, and work log.

Status: partial verification. Code patch succeeded; syntax check needs bundled Codex Python because local `python` command is missing. Next action: load workspace dependencies and run py_compile with bundled Python.

## 2026-06-02 - Viewer issue: bundled Python syntax check passed

Action: loaded Codex workspace dependencies and ran Python syntax validation with the bundled Python executable.

Commands and tool calls:

```json
{
  "tool": "codex_app.load_workspace_dependencies"
}
```

```powershell
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m py_compile scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
```

Results:

- `codex_app.load_workspace_dependencies`: successful; bundled Python path is `C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`.
- Bundled `py_compile`: exit code `0`; both main and packaged viewer files are syntactically valid.

Status: successful. Next action: prepare Ubuntu deploy/verification commands so the live `192.168.0.166:8091` service actually runs this new build and shows `Папка` / `Код папки`.

## 2026-06-02 - Viewer issue: Ubuntu apply script added and verified

Action: added an Ubuntu helper script that updates `/home/crmadmin/SQL`, reapplies `003_one_c_crm_ready_views.sql`, restarts `crm-1c-viewer.service`, and verifies `/api/data` exposes `viewerBuild`, `product_group_name`, and `product_group_code`.

Files added:

- `scripts/ubuntu/apply-1c-viewer-product-folder-update.sh`
- `dist/crm-product-folder-update-2026-06-02/ubuntu-home-crmadmin-SQL/scripts/ubuntu/apply-1c-viewer-product-folder-update.sh`

Commands:

```powershell
apply_patch
bash -n scripts\ubuntu\apply-1c-viewer-product-folder-update.sh dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\apply-1c-viewer-product-folder-update.sh
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m py_compile scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
git diff --stat
Get-Command bash -ErrorAction SilentlyContinue | Format-List Source,Name,CommandType
Test-Path 'C:\Program Files\Git\bin\bash.exe'
git status --short --branch
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/apply-1c-viewer-product-folder-update.sh dist/crm-product-folder-update-2026-06-02/ubuntu-home-crmadmin-SQL/scripts/ubuntu/apply-1c-viewer-product-folder-update.sh
```

Results:

- `apply_patch`: exit code `0`; helper script added in both main scripts folder and packaged folder.
- `bash -n ...`: exit code `1`; failed because `bash` in PATH is `C:\WINDOWS\system32\bash.exe` and WSL has no installed Linux distribution.
- Bundled Python `py_compile`: exit code `0`; viewer scripts are syntactically valid.
- `git diff --stat`: exit code `0`; showed viewer/work-log changes; untracked helper scripts are not included in unstaged diff stat.
- `Get-Command bash`: exit code `0`; confirmed PATH `bash.exe` source is `C:\WINDOWS\system32\bash.exe`.
- `Test-Path 'C:\Program Files\Git\bin\bash.exe'`: exit code `0`; returned `True`.
- `git status --short --branch`: exit code `0`; branch aligned with origin, with modified viewer/log files and two untracked helper scripts.
- Git Bash `bash.exe -n ...`: exit code `0`; helper scripts have valid Bash syntax.

Status: successful after switching from WSL bash to Git Bash. Next action: update the delivery zip so it includes the build-marker viewer and helper script, then stage/commit/push.

## 2026-06-02 - Viewer issue: delivery zip refreshed

Action: removed generated Python cache directories, rebuilt the product-folder delivery zip, and verified the archive contents.

Commands:

```powershell
Get-ChildItem -Path scripts\ubuntu,dist\crm-product-folder-update-2026-06-02 -Recurse -Directory -Filter __pycache__ | Select-Object -ExpandProperty FullName

$workspace = (Resolve-Path 'D:\Codex\CRM\SQL').Path
$targets = @(
  'scripts\ubuntu\__pycache__',
  'dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\__pycache__'
) | ForEach-Object { Resolve-Path $_ -ErrorAction SilentlyContinue }
foreach ($target in $targets) {
  if (-not $target.Path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove outside workspace: $($target.Path)"
  }
}
foreach ($target in $targets) {
  Remove-Item -LiteralPath $target.Path -Recurse -Force
  Write-Output "removed $($target.Path)"
}

Compress-Archive -Path 'dist\crm-product-folder-update-2026-06-02\*' -DestinationPath 'dist\crm-product-folder-update-2026-06-02.zip' -Force

Get-ChildItem -Path scripts\ubuntu,dist\crm-product-folder-update-2026-06-02 -Recurse -Directory -Filter __pycache__ | Select-Object -ExpandProperty FullName

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip')
try {
  $zip.Entries |
    Where-Object { $_.FullName -match 'run-1c-crm-viewer.py|apply-1c-viewer-product-folder-update.sh|__pycache__' } |
    Select-Object -ExpandProperty FullName
} finally {
  $zip.Dispose()
}

git status --short --branch
```

Results:

- Initial `Get-ChildItem __pycache__`: exit code `0`; found two generated cache directories.
- Verified both deletion targets are inside `D:\Codex\CRM\SQL`, then removed only those two `__pycache__` directories; exit code `0`.
- `Compress-Archive`: exit code `0`; refreshed `dist/crm-product-folder-update-2026-06-02.zip`.
- Post-cleanup `Get-ChildItem __pycache__`: exit code `0`; returned no cache directories.
- Zip inspection: exit code `0`; archive contains `ubuntu-home-crmadmin-SQL\scripts\ubuntu\apply-1c-viewer-product-folder-update.sh` and `ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py`; no `__pycache__` entries.
- `git status --short --branch`: exit code `0`; modified viewer/package/log files and untracked helper scripts are ready for staging.

Status: successful. Next action: add a short deployment note, run final checks, then commit and push the viewer-fix update.

## 2026-06-02 - Viewer issue: deployment note and final package checks

Action: documented the Ubuntu fix command, rebuilt the delivery zip again after doc changes, verified archive contents, reran syntax checks, and removed generated Python cache directories.

Commands:

```powershell
Get-Content docs\one-c-mirror-import.md -Tail 80
Get-Content dist\crm-product-folder-update-2026-06-02\docs\one-c-mirror-import.md -Tail 80
apply_patch
rg -n -C 2 "Якщо viewer|Перевірка результату|viewerBuild|folder columns ok" docs\one-c-mirror-import.md
rg -n -C 2 "Якщо viewer|Перевірка результату|viewerBuild|folder columns ok" dist\crm-product-folder-update-2026-06-02\docs\one-c-mirror-import.md
apply_patch
rg -n -C 3 "Якщо viewer|Перевірка результату|viewerBuild|folder columns ok" docs\one-c-mirror-import.md dist\crm-product-folder-update-2026-06-02\docs\one-c-mirror-import.md
git diff --stat
Compress-Archive -Path 'dist\crm-product-folder-update-2026-06-02\*' -DestinationPath 'dist\crm-product-folder-update-2026-06-02.zip' -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip')
try {
  $zip.Entries |
    Where-Object { $_.FullName -match 'run-1c-crm-viewer.py|apply-1c-viewer-product-folder-update.sh|one-c-mirror-import.md|__pycache__' } |
    Select-Object -ExpandProperty FullName
} finally {
  $zip.Dispose()
}
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/apply-1c-viewer-product-folder-update.sh dist/crm-product-folder-update-2026-06-02/ubuntu-home-crmadmin-SQL/scripts/ubuntu/apply-1c-viewer-product-folder-update.sh
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m py_compile scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
Get-ChildItem -Path scripts\ubuntu,dist\crm-product-folder-update-2026-06-02 -Recurse -Directory -Filter __pycache__ | Select-Object -ExpandProperty FullName
$workspace = (Resolve-Path 'D:\Codex\CRM\SQL').Path
$targets = @(
  'scripts\ubuntu\__pycache__',
  'dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\__pycache__'
) | ForEach-Object { Resolve-Path $_ -ErrorAction SilentlyContinue }
foreach ($target in $targets) {
  if (-not $target.Path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove outside workspace: $($target.Path)"
  }
}
foreach ($target in $targets) {
  Remove-Item -LiteralPath $target.Path -Recurse -Force
  Write-Output "removed $($target.Path)"
}
```

Results:

- Initial `Get-Content` commands: exit code `0`; inspected current docs before editing, though PowerShell displayed UTF-8 Ukrainian text as mojibake.
- First `apply_patch`: exit code `0`; added viewer troubleshooting section to main and packaged `one-c-mirror-import.md`.
- First `rg`: exit code `0`; found duplicate `## Перевірка результату` heading caused by insertion location.
- Second `apply_patch`: exit code `0`; removed the duplicate heading in both docs.
- Combined `rg`: exit code `0`; confirmed final order is `## Якщо viewer не показує колонки папки товару`, then `## Перевірка результату`.
- `git diff --stat`: exit code `0`; showed updated zip, docs, viewer, and work log.
- `Compress-Archive`: exit code `0`; rebuilt `dist/crm-product-folder-update-2026-06-02.zip`.
- Zip inspection: exit code `0`; archive contains `docs\one-c-mirror-import.md`, helper script, and viewer script; no `__pycache__` entries.
- Git Bash `bash -n`: exit code `0`; helper scripts remain syntactically valid.
- Bundled Python `py_compile`: exit code `0`; viewer scripts remain syntactically valid.
- Post-compile `Get-ChildItem __pycache__`: exit code `0`; found two generated cache directories.
- Verified both cache paths are inside `D:\Codex\CRM\SQL` and removed them; exit code `0`.

Status: successful. Next action: final git checks, stage, commit, push this viewer-fix update, then provide the exact Ubuntu command to run on the live server.

## 2026-06-02 - Viewer issue: final pre-commit checks

Action: ran final repository checks before staging the live viewer fix.

Commands:

```powershell
git status --short --branch
git diff --check
git diff --stat
rg -n "VIEWER_BUILD|viewerBuild|apply-1c-viewer-product-folder-update|folder columns ok|Папка|Код папки" scripts\ubuntu\run-1c-crm-viewer.py scripts\ubuntu\apply-1c-viewer-product-folder-update.sh docs\one-c-mirror-import.md
```

Results:

- `git status --short --branch`: exit code `0`; branch aligned with `origin/main`; modified viewer/package/docs/log files plus two untracked helper scripts.
- `git diff --check`: exit code `0`; no whitespace errors; Git repeated LF-to-CRLF warnings for modified text files.
- `git diff --stat`: exit code `0`; changed zip, packaged doc, packaged viewer, work log, main doc, and main viewer; untracked helper scripts not included in unstaged diff stat.
- `rg`: exit code `0`; confirmed `VIEWER_BUILD`, `viewerBuild`, helper script command, `folder columns ok`, and product folder labels `Папка` / `Код папки` are present.

Status: successful. Next action: stage all viewer-fix files, verify staged diff, commit, and push.

## 2026-06-02 - Viewer issue: staged diff verified

Action: staged all live viewer fix files and verified the staged diff before commit.

Commands:

```powershell
git add -A
git diff --cached --check
git status --short --branch
git diff --cached --stat
```

Results:

- `git add -A`: exit code `0`; Git repeated LF-to-CRLF warnings for modified text files and the new packaged helper script.
- `git diff --cached --check`: exit code `0`; no whitespace errors.
- `git status --short --branch`: exit code `0`; staged changes include updated delivery zip, packaged doc, packaged helper script, packaged viewer, work log, main doc, main helper script, and main viewer.
- `git diff --cached --stat`: exit code `0`; `8 files changed, 522 insertions(+), 8 deletions(-)`.

Status: successful. Next action: stage this log entry, commit `Fix 1C viewer product folder columns`, and push to GitHub.

## 2026-06-02 - Viewer issue: fix commit created

Action: committed the live viewer fix for missing product folder/group columns.

Commands:

```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git commit -m "Fix 1C viewer product folder columns"
```

Results:

- `git add docs/crm-sql-work-log-2026-06-01.md`: exit code `0`; Git repeated the LF-to-CRLF warning for the work log.
- `git commit -m "Fix 1C viewer product folder columns"`: exit code `0`.
- Commit created: `412975e`.
- Summary: `8 files changed, 544 insertions(+), 8 deletions(-)`.
- New files:
  - `scripts/ubuntu/apply-1c-viewer-product-folder-update.sh`
  - `dist/crm-product-folder-update-2026-06-02/ubuntu-home-crmadmin-SQL/scripts/ubuntu/apply-1c-viewer-product-folder-update.sh`

Status: successful. Next action: commit this log entry and push both commits to GitHub.

## 2026-06-02 - Viewer issue: fix pushed to GitHub

Action: pushed the live viewer fix and its log commit to GitHub.

Commands:

```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git commit -m "Log 1C viewer folder-column fix"
git status --short --branch
git log --oneline -3
git push origin main
```

Results:

- `git add docs/crm-sql-work-log-2026-06-01.md`: exit code `0`; Git repeated LF-to-CRLF warning for the work log.
- `git commit -m "Log 1C viewer folder-column fix"`: exit code `0`; commit created: `107035b`; `1 file changed, 23 insertions(+)`.
- `git status --short --branch`: exit code `0`; `main...origin/main [ahead 2]`.
- `git log --oneline -3`: exit code `0`; latest commits were `107035b`, `412975e`, `45898bd`.
- Elevated `git push origin main`: exit code `0`; pushed `main` from `45898bd` to `107035b`.

Status: successful. GitHub now contains the viewer product-folder-column fix through commit `107035b`. Next action: commit and push this final push-result log entry.

## 2026-06-02 - Viewer issue: user reports live page still not updated

Action: user provided a new screenshot of `http://192.168.0.166:8091` showing the product table still without `Папка` / `Код папки` columns and without the expected build marker in the header.

Observed from screenshot:

- Page still shows `1C CRM Mirror Viewer`.
- Header shows `Зріз: 2026-06-02 15:19:27 UTC`, `Імпорт триває...`, `read-only`.
- Header does not show `build: 2026-06-02-product-folder-columns-2`.
- Product table columns are still old: `Код`, `Товар`, `Видалено`, `Цін`, `Мін. ціна`, `Макс. ціна`, `Валюти`, without `Папка` / `Код папки`.

Status: live viewer is still serving an old runtime or an old service process. Next action: probe live `/health`, `/`, and `/api/data` from this machine to confirm whether the active service exposes the new build marker.

## 2026-06-02 - Viewer issue: live HTTP probe from Windows shell blocked by auth

Action: probed the live viewer endpoints from the Windows shell.

Command:

```powershell
$ErrorActionPreference='Continue'
Write-Output '=== health ==='
try {
  (Invoke-WebRequest -UseBasicParsing -Uri 'http://192.168.0.166:8091/health' -TimeoutSec 5).Content
} catch {
  Write-Output "ERROR $($_.Exception.Message)"
}
Write-Output '=== html markers ==='
try {
  $html=(Invoke-WebRequest -UseBasicParsing -Uri 'http://192.168.0.166:8091/' -TimeoutSec 5).Content
  if ($html -match 'viewerBuild|VIEWER_BUILD|product-folder-columns|product_group_name|Код папки|Папка') {
    Write-Output 'markers-found'
    $matches[0]
  } else {
    Write-Output 'markers-missing'
  }
} catch {
  Write-Output "ERROR $($_.Exception.Message)"
}
Write-Output '=== api markers ==='
try {
  $json=(Invoke-WebRequest -UseBasicParsing -Uri 'http://192.168.0.166:8091/api/data' -TimeoutSec 10).Content
  if ($json -match 'viewerBuild|product_group_name|product_group_code|product_folders') {
    Write-Output 'api-markers-found'
    $matches[0]
  } else {
    Write-Output 'api-markers-missing'
  }
  if ($json.Length -gt 500) {
    Write-Output "api-length $($json.Length)"
  } else {
    $json
  }
} catch {
  Write-Output "ERROR $($_.Exception.Message)"
}
```

Result:

- Exit code: `0`.
- `/health`: HTTP `401 Unauthorized`.
- `/`: HTTP `401 Unauthorized`.
- `/api/data`: HTTP `401 Unauthorized`.

Status: probe reached the viewer but could not inspect content because shell requests do not include the browser's saved Basic Auth credentials. Next action: inspect through the in-app browser/session if possible, then prepare server-side verification commands.

## 2026-06-02 - Viewer issue: browser session attempt failed

Action: loaded the Browser plugin instructions and attempted to attach to the in-app browser to inspect the live viewer page with a browser session.

Commands/tool calls:

```powershell
Get-Content 'C:\Users\User\.codex\plugins\cache\openai-bundled\browser\26.527.31326\skills\control-in-app-browser\SKILL.md' | Select-Object -First 120
Get-Content 'C:\Users\User\.codex\plugins\cache\openai-bundled\browser\26.527.31326\skills\control-in-app-browser\SKILL.md'
```

```javascript
if (!globalThis.agent) {
  const { setupBrowserRuntime } = await import('C:/Users/User/.codex/plugins/cache/openai-bundled/browser/26.527.31326/scripts/browser-client.mjs');
  await setupBrowserRuntime({ globals: globalThis });
}
if (!globalThis.browser) {
  globalThis.browser = await agent.browsers.get('iab');
}
await browser.nameSession('CRM viewer check');
if (typeof tab === 'undefined') {
  globalThis.tab = await browser.tabs.selected();
}
const info = { url: await tab.url(), title: await tab.title() };
nodeRepl.write(JSON.stringify(info, null, 2));
```

Results:

- First partial skill read: exit code `0`; read the first 120 lines.
- Full skill read: exit code `0`; read the complete Browser skill file.
- Browser attach attempt: failed; Node-backed browser kernel exited unexpectedly with diagnostics `windows sandbox failed: spawn setup refresh`.

Status: browser inspection failed due local browser automation runtime startup failure. Next action: continue with server-side diagnosis and provide/repo-commit a stronger repair script/commands for the live Ubuntu service.

## 2026-06-02 - Viewer issue: browser session retry failed

Action: reset the browser automation runtime and retried attaching to the in-app browser.

Tool calls:

```json
{
  "tool": "mcp__node_repl.js_reset"
}
```

```javascript
if (!globalThis.agent) {
  const { setupBrowserRuntime } = await import('C:/Users/User/.codex/plugins/cache/openai-bundled/browser/26.527.31326/scripts/browser-client.mjs');
  await setupBrowserRuntime({ globals: globalThis });
}
if (!globalThis.browser) {
  globalThis.browser = await agent.browsers.get('iab');
}
await browser.nameSession('CRM viewer check');
if (typeof tab === 'undefined') {
  globalThis.tab = await browser.tabs.selected();
}
nodeRepl.write(JSON.stringify({ url: await tab.url(), title: await tab.title() }, null, 2));
```

Results:

- `mcp__node_repl.js_reset`: successful; JavaScript kernel reset.
- Second browser attach attempt: failed again; kernel exited unexpectedly with `windows sandbox failed: spawn setup refresh`.

Status: browser-based inspection is blocked by the local browser automation runtime. Next action: check whether SSH access to `192.168.0.166` is available from this machine so the Ubuntu service can be inspected directly.

## 2026-06-02 - Viewer issue: SSH reachability check

Action: checked whether the Ubuntu host is reachable over SSH and whether non-interactive SSH access is already available.

Commands:

```powershell
Test-NetConnection -ComputerName 192.168.0.166 -Port 22 | Format-List ComputerName,RemoteAddress,RemotePort,TcpTestSucceeded
ssh -o BatchMode=yes -o ConnectTimeout=5 crmadmin@192.168.0.166 "hostname && pwd"
```

Results:

- `Test-NetConnection`: exit code `0`; `TcpTestSucceeded : True`.
- `ssh -o BatchMode=yes ...`: exit code `1`; failed with `Host key verification failed.`

Status: host is reachable on SSH port 22, but the current Windows SSH client has not accepted/verifed the host key. Next action: retry using a workspace-local known_hosts file so system/user SSH config is not modified.

## 2026-06-02 - Viewer issue: SSH auth unavailable from Codex shell

Action: retried SSH with a workspace-local known_hosts file to avoid modifying the user's system SSH config.

Command:

```powershell
ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=D:\Codex\CRM\SQL\.codex_known_hosts crmadmin@192.168.0.166 "hostname && pwd"
```

Result:

- Exit code: `1`.
- SSH accepted the host key into `D:\Codex\CRM\SQL\.codex_known_hosts`.
- Authentication failed:

```text
crmadmin@192.168.0.166: Permission denied (publickey,password).
```

Status: direct server update from this Codex shell is blocked because no non-interactive SSH key/password is available. Next action: remove the temporary workspace-local `.codex_known_hosts` file created by this test and provide copy-paste Ubuntu commands for the already open `crmadmin@crm-sql` terminal.

## 2026-06-02 - Viewer issue: temporary SSH known_hosts removed

Action: removed the workspace-local `.codex_known_hosts` file created during the SSH reachability test.

Command:

```powershell
$target = Resolve-Path 'D:\Codex\CRM\SQL\.codex_known_hosts'
$workspace = (Resolve-Path 'D:\Codex\CRM\SQL').Path
if (-not $target.Path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to remove outside workspace: $($target.Path)"
}
Remove-Item -LiteralPath $target.Path -Force
Write-Output "removed $($target.Path)"
```

Result:

- Exit code: `0`.
- Removed `D:\Codex\CRM\SQL\.codex_known_hosts`.

Status: successful. Next action: strengthen the Ubuntu helper script with process/service diagnostics.

## 2026-06-02 - Viewer issue: helper script strengthened with service diagnostics

Action: updated the Ubuntu helper script to print Git `HEAD`, systemd `ExecStart`, `WorkingDirectory`, `MainPID`, and the active viewer process command line before/after restart.

Commands:

```powershell
apply_patch
& 'C:\Program Files\Git\bin\bash.exe' -n scripts/ubuntu/apply-1c-viewer-product-folder-update.sh dist/crm-product-folder-update-2026-06-02/ubuntu-home-crmadmin-SQL/scripts/ubuntu/apply-1c-viewer-product-folder-update.sh
git status --short --branch
Compress-Archive -Path 'dist\crm-product-folder-update-2026-06-02\*' -DestinationPath 'dist\crm-product-folder-update-2026-06-02.zip' -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip')
try {
  $entry = $zip.GetEntry('ubuntu-home-crmadmin-SQL\scripts\ubuntu\apply-1c-viewer-product-folder-update.sh')
  if ($null -eq $entry) {
    Write-Output 'helper-missing'
  } else {
    Write-Output "helper-present size=$($entry.Length)"
  }
} finally {
  $zip.Dispose()
}
git diff --stat
rg -n "service definition before restart|active viewer process|MainPID|rev-parse" scripts\ubuntu\apply-1c-viewer-product-folder-update.sh dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\apply-1c-viewer-product-folder-update.sh
```

Results:

- `apply_patch`: exit code `0`; updated main and packaged helper scripts.
- Git Bash `bash -n`: exit code `0`; helper scripts have valid Bash syntax.
- `git status --short --branch`: exit code `0`; branch aligned with origin and helper/log changes are unstaged.
- `Compress-Archive`: exit code `0`; refreshed delivery zip.
- Zip inspection: exit code `0`; `helper-present size=2766`.
- `git diff --stat`: exit code `0`; changed zip, main helper, packaged helper, and work log.
- `rg`: exit code `0`; confirmed diagnostic markers exist in both helper scripts.

Status: successful. Next action: stage, commit, and push the stronger helper diagnostics and updated log.

## 2026-06-02 - Viewer issue: helper diagnostics staged

Action: staged the stronger helper diagnostics and verified the staged diff.

Commands:

```powershell
git add -A
git diff --cached --check
git status --short --branch
git diff --cached --stat
```

Results:

- `git add -A`: exit code `0`; Git repeated LF-to-CRLF warnings for the packaged helper script and work log.
- `git diff --cached --check`: exit code `0`; no whitespace errors.
- `git status --short --branch`: exit code `0`; staged files are updated zip, packaged helper, work log, and main helper.
- `git diff --cached --stat`: exit code `0`; `4 files changed, 361 insertions(+)`.

Status: successful. Next action: stage this log entry, commit, and push.

## 2026-06-02 - Viewer issue: helper diagnostics pushed

Action: committed and pushed the stronger live-service diagnostics for the Ubuntu helper script.

Commands:

```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git commit -m "Add 1C viewer live service diagnostics"
git push origin main
```

Results:

- `git add docs/crm-sql-work-log-2026-06-01.md`: exit code `0`; Git repeated LF-to-CRLF warning for the work log.
- `git commit -m "Add 1C viewer live service diagnostics"`: exit code `0`; commit created: `eab8418`; `4 files changed, 383 insertions(+)`.
- Elevated `git push origin main`: exit code `0`; pushed `main` from `1149b75` to `eab8418`.

Status: successful. Next action: commit and push this final push-result log entry, then give the user the exact Ubuntu commands to run in the open `crmadmin@crm-sql` terminal.

## 2026-06-02 - Marketplace CRM: NovaPay gateway and TTN payment reconciliation

Action: implemented safe NovaPay integration in the local Marketplace CRM prototype through a server-side gateway, without storing a private NovaPay key in browser code, and added automatic CRM payment creation when NovaPay TTN and amount match CRM data.

Files changed:

- `D:\Codex\CRM\marketplace-crm\app.js`
- `D:\Codex\CRM\marketplace-crm\index.html`
- `D:\Codex\CRM\marketplace-crm\mock-api.ps1`

Implemented:

- Added `settings.novaPay` with gateway URL, mode, public/merchant ID, account ID, auto-create flag, last status, last import, and last error code.
- Added `novaPayTransactions` demo data with one matching payment, one empty-TTN error case, and one amount-mismatch error case.
- Added NovaPay role permissions:
  - document permissions `novaPayApi` and `novaPayReconciliation`;
  - field lock `novaPay`.
- Added `Settings -> Data exchange -> NovaPay API gateway` UI. The UI intentionally has no private-key field.
- Added `Finance -> Payments -> NovaPay: roznesennia oplat po TTN` UI with:
  - gateway import button;
  - manual JSON import;
  - demo JSON fill;
  - re-reconcile button;
  - result table with codes and CRM payment IDs.
- Added reconciliation logic:
  - normalize NovaPay payment rows;
  - find marketplace order by TTN, with invoice-by-TTN fallback;
  - validate amount in CRM currency;
  - create CRM payment automatically;
  - update invoice paid amount/status;
  - update marketplace order payment status to `paid`;
  - prevent re-creating the same NovaPay transaction.
- Added required NovaPay error codes:
  - `NPAY_EMPTY_TTN`
  - `NPAY_NO_ORDER_BY_TTN`
  - `NPAY_AMOUNT_MISMATCH`
  - `NPAY_GATEWAY_ERROR`
  - `NPAY_SIGNATURE_ERROR`
  - `NPAY_IMPORT_PARSE_ERROR`
- Added mock gateway endpoint `GET /api/novapay/payments`.
- Updated app version:
  - `APP_VERSION`: `2026.06.02.8`
  - `APP_BUILD`: `20260602-novapay-gateway-1`
  - build time: `18:39`

Commands and checks:

```powershell
Get-Content D:\Codex\CRM\SQL\docs\marketplace-crm-handoff-2026-06-02-novapay.md
Get-Content D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md -Tail 120
rg --files
rg -n "APP_VERSION|settings|payments|..." app.js
rg -n "api/|orders|payments|..." mock-api.ps1
Get-Date -Format 'yyyy-MM-dd HH:mm zzz'
node --check app.js
& C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --check app.js
[scriptblock]::Create((Get-Content -Raw -Path .\mock-api.ps1)) | Out-Null
Invoke-WebRequest http://127.0.0.1:8789/index.html
Invoke-WebRequest http://127.0.0.1:8789/api/novapay/payments
Invoke-WebRequest http://127.0.0.1:8793/index.html
Invoke-WebRequest http://127.0.0.1:8793/api/novapay/payments
rg -n "privateKey|private_key|secret|x-sign|NovaPay" app.js index.html mock-api.ps1
```

Successful results:

- Handoff, current log, and repository file list were read successfully.
- `app.js` syntax check succeeded with bundled Node runtime.
- `mock-api.ps1` parsed successfully with `[scriptblock]::Create(...)`.
- Updated prototype started successfully on `http://127.0.0.1:8793/index.html`.
- `index.html` on port `8793` returned status `200` and script build `20260602-novapay-gateway-1`.
- `GET http://127.0.0.1:8793/api/novapay/payments` returned status `200` with:
  - `ok = true`;
  - `signedOnServer = true`;
  - `privateKeyInBrowser = false`;
  - three demo NovaPay payments.
- Search confirmed no browser-side private key field/variable was added. The only `x-sign` mention is explanatory text saying the signature stays on the server gateway.
- No 1C production server restart was performed.
- No write-back to 1C was performed.

Errors and blocked checks:

- `CRM_FILE_NOT_FOUND`: attempted to read `D:\Codex\CRM\marketplace-crm\package.json`; file does not exist. Not blocking because this prototype uses `index.html`, `app.js`, `styles.css`, and `mock-api.ps1`.
- `CRM_RG_QUOTE_ERROR`: one exploratory `rg` command failed because PowerShell misparsed embedded quotes in the search pattern. Repeated with safer patterns.
- `CRM_GIT_DIFF_CONTEXT_ERROR`: `git diff -- app.js index.html mock-api.ps1` failed from `marketplace-crm` because the folder did not behave as a normal git checkout/pathspec context. Not blocking for implementation.
- `CRM_NODE_ACCESS_DENIED`: system `node --check app.js` failed with `Access denied`. Repeated successfully with bundled Node runtime.
- `CRM_NOVAPAY_ENDPOINT_404_ON_8789`: existing server on `127.0.0.1:8789` served `index.html` but returned `404` for `/api/novapay/payments`, meaning it was an older local mock process.
- `CRM_LOCAL_SERVER_START_NO_LISTENER`: non-elevated background starts on ports `8791` and `8792` returned without leaving a listening server.
- `CRM_PROCESS_QUERY_ACCESS_DENIED`: `Get-CimInstance Win32_Process -Filter "ProcessId=31636"` failed with access denied while diagnosing an unrelated listener.
- `CRM_FOREGROUND_SERVER_TIMEOUT_DIAGNOSTIC`: foreground diagnostic run on port `8793` timed out after printing normal startup lines because the server stayed running and waited for requests. This confirmed the script itself starts correctly.
- `CRM_ESCALATION_REJECTED_WIDE_BIND`: elevated start on `0.0.0.0:8793` was rejected due network-wide exposure risk. Safer elevated start on `127.0.0.1:8793` succeeded.
- `CRM_BROWSER_RUNTIME_FAILED`: Browser plugin runtime through Node REPL failed twice with sandbox `spawn setup refresh`; visual browser verification was not completed. HTTP, syntax, endpoint, and static UI checks were completed instead.

Status: implementation and non-browser verification succeeded. Updated local prototype is available at `http://127.0.0.1:8793/index.html`. Existing `8789` still appears to be an older local process and was not stopped.

## 2026-06-03 - Marketplace CRM: local prototype server restart after PC reboot

Action: restarted the local Marketplace CRM prototype server after the computer reboot.

Commands:

```powershell
Invoke-WebRequest http://127.0.0.1:8789/index.html
netstat -ano | findstr ":8789"
Start-Process -FilePath powershell -ArgumentList @('-ExecutionPolicy','Bypass','-File','D:\Codex\CRM\marketplace-crm\mock-api.ps1','-Port','8789','-BindAddress','127.0.0.1') -WorkingDirectory 'D:\Codex\CRM\marketplace-crm' -WindowStyle Hidden
Start-Process -FilePath 'C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe' -ArgumentList @('-ExecutionPolicy','Bypass','-File','D:\Codex\CRM\marketplace-crm\mock-api.ps1','-Port','8789','-BindAddress','127.0.0.1') -WorkingDirectory 'D:\Codex\CRM\marketplace-crm' -WindowStyle Hidden
Invoke-WebRequest http://127.0.0.1:8789/index.html
Invoke-WebRequest http://127.0.0.1:8789/api/novapay/payments
```

Results:

- Initial check: `http://127.0.0.1:8789/index.html` was not running after reboot.
- Initial `netstat` check: no listener on `8789`.
- Non-elevated background start returned exit code `0`, but no listener stayed on `8789`.
- Error code recorded: `CRM_LOCAL_SERVER_START_NO_LISTENER_AFTER_REBOOT`.
- Safer elevated local-only start on `127.0.0.1:8789` succeeded.
- `netstat`: `127.0.0.1:8789` is listening, PID `6736`.
- `index.html`: status `200`, build `20260602-novapay-gateway-1`.
- `GET /api/novapay/payments`: successful; `privateKeyInBrowser=false`.

Status: successful. Local CRM prototype is available at `http://127.0.0.1:8789/index.html`. No 1C production restart was performed. No write-back to 1C was performed.

## 2026-06-02 19:53:40 +03:00
- Command: `powershell
 = Join-Path $env:CODEX_HOME 'automations/sql-github-auto-sync/memory.md'; if (Test-Path $mem) { Get-Content -Raw $mem }
` 
- Result: Failed to resolve memory path because $env:CODEX_HOME was null in this shell session.
- Exit code: 1
- Error text: Join-Path : Cannot bind argument to parameter Path because it is null. Test-Path failed for the same reason.
- Status: failed
- Next action: Use explicit automation memory path from the task instructions.


## 2026-06-02 19:53:40 +03:00
- Command: `powershell
Get-Content 'docs/crm-sql-work-log-2026-06-01.md' -Tail 60
` 
- Result: Read the latest existing work-log entries successfully.
- Exit code: 0
- Error text: 
- Status: ok
- Next action: Inspect log structure and append new action entries in the same file.


## 2026-06-02 19:53:40 +03:00
- Command: `powershell
Get-Location
` 
- Result: Confirmed working directory is D:\\Codex\\CRM\\SQL.
- Exit code: 0
- Error text: 
- Status: ok
- Next action: Read the top of the work log and explicit automation memory path.


## 2026-06-02 19:53:40 +03:00
- Command: `powershell
Get-Content 'docs/crm-sql-work-log-2026-06-01.md' -TotalCount 80
` 
- Result: Read the log header and instructions successfully.
- Exit code: 0
- Error text: 
- Status: ok
- Next action: Append all subsequent automation actions using the required fields.


## 2026-06-02 19:53:40 +03:00
- Command: `powershell
 = 'C:\\Users\\User\\.codex\\automations\\sql-github-auto-sync\\memory.md'; if (Test-Path $mem) { Get-Content -Raw $mem } else { '__MISSING__' }
` 
- Result: Confirmed the automation memory file does not exist yet.
- Exit code: 0
- Error text: 
- Status: ok
- Next action: Create the memory file at the end of the run with a concise summary.

## 2026-06-02 - Ubuntu pull blocked by untracked files

Action: user provided a screenshot from `crmadmin@crm-sql:~/SQL` showing `git pull --ff-only origin main` fails before the viewer helper script can be run.

Observed terminal output:

```text
Updating 6d0fedf..ea95f0a
error: The following untracked working tree files would be overwritten by merge:
    db/migrations/002_one_c_mirror.sql
    db/migrations/003_one_c_crm_ready_views.sql
    scripts/ubuntu/import-1c-catalogs-http.sh
    scripts/ubuntu/import-1c-operational-http.sh
    scripts/ubuntu/install-1c-import-systemd-timer.sh
    scripts/ubuntu/install-1c-viewer-systemd-service.sh
    scripts/ubuntu/run-1c-crm-viewer.py
    scripts/ubuntu/run-1c-import-now.sh
Please move or remove them before you merge.
Aborting
bash: scripts/ubuntu/apply-1c-viewer-product-folder-update.sh: No such file or directory
```

Diagnosis:

- The server is still on old commit range `6d0fedf..ea95f0a`.
- Pull is blocked because the server has local untracked copies of files that are now tracked by GitHub.
- The helper script does not exist on the server because the pull did not complete.
- The safe fix is to move only those untracked blockers into a timestamped backup directory, then repeat `git pull --ff-only origin main`.

Status: diagnosis successful. Next action: provide backup-and-pull commands for the Ubuntu terminal, then run the viewer update helper after pull succeeds.

## 2026-06-02 19:59:29 +03:00
- Command:
```powershell
<append inspection results with embedded rg pattern>
```
- Result: Failed to append the inspection summary because PowerShell misparsed the embedded regex text inside the logging command.
- Exit code: 1
- Error text: Unexpected token '(' / incomplete hash literal / missing closing ')' while parsing the logging script.
- Status: failed
- Next action: Retry the log append using safer quoting via here-strings and simpler command text.

## 2026-06-02 19:59:47 +03:00
- Command:
```powershell
git status --short --branch
```
- Result: Git branch is main tracking origin/main. The only modified file is docs/crm-sql-work-log-2026-06-01.md.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Review diffs and safety checks before staging the work log.

## 2026-06-02 19:59:47 +03:00
- Command:
```powershell
git remote -v
```
- Result: Confirmed origin fetch/push URL is https://github.com/1973zahar/SQL.git.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Use origin for any eventual push if repository checks remain clean.

## 2026-06-02 19:59:47 +03:00
- Command:
```powershell
git diff --cached --stat
```
- Result: No staged changes were present at inspection time.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Continue with unstaged diff review and stage only safe changes.

## 2026-06-02 19:59:47 +03:00
- Command:
```powershell
git status --ignored --short
```
- Result: Only the work log is currently modified; no additional ignored/cache noise appeared in the short status output.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Inspect repository diffs and large files next.

## 2026-06-02 19:59:47 +03:00
- Command:
```powershell
Get-ChildItem -Recurse -File | Sort-Object Length -Descending | Select-Object -First 20 FullName,Length
```
- Result: Largest files are expected artifacts such as .docx, dist bundles, and repository documentation/work-log files. No unexpected new oversized file appeared in the current modification set.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Keep commit scope narrow and avoid staging unrelated large artifacts.

## 2026-06-02 19:59:47 +03:00
- Command:
```powershell
rg secret-pattern scan across repository text files excluding common binary extensions and .git/node_modules paths
```
- Result: Secret-pattern scan returned documented placeholders, templates, demo credentials, and prior log references. No obvious live secret stood out in the scanned output.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Run diff-focused checks to confirm only intended log changes will be committed.
## 2026-06-02 20:00:53 +03:00
- Command: `powershell
git diff --stat
`
- Result: Unstaged diff contains only docs/crm-sql-work-log-2026-06-01.md with appended automation entries.
- Exit code: 0
- Error text: Git also warned that LF would be replaced by CRLF on future checkout/update of the file.
- Status: ok
- Next action: Inspect the actual diff content and fix any formatting issues before staging.

## 2026-06-02 20:00:53 +03:00
- Command:
```powershell
git diff -- docs/crm-sql-work-log-2026-06-01.md
```
- Result: Reviewed the actual work-log diff and confirmed the new content is limited to the current automation run notes.
- Exit code: 0
- Error text: Git repeated the LF/CRLF warning for the working copy.
- Status: ok
- Next action: Run git diff --check to catch whitespace or patch hygiene issues.

## 2026-06-02 20:00:53 +03:00
- Command:
```powershell
git diff --check
```
- Result: Whitespace check failed on the newly appended work-log entries because of trailing whitespace and a blank line at EOF.
- Exit code: 1
- Error text: Trailing whitespace reported on several new lines and new blank line at EOF in docs/crm-sql-work-log-2026-06-01.md.
- Status: failed
- Next action: Edit the work-log formatting to remove trailing whitespace and the extra EOF blank line.

## 2026-06-02 20:00:53 +03:00
- Command:
```powershell
$files = git ls-files; $files | ForEach-Object { $item = Get-Item $_ -ErrorAction SilentlyContinue; if ($item) { [PSCustomObject]@{ FullName = $item.FullName; Length = $item.Length } } } | Sort-Object Length -Descending | Select-Object -First 20 FullName,Length
```
- Result: Reviewed the largest tracked files only. They are expected repository assets and archives; none are part of the current unstaged change set.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Keep staging limited to the cleaned work-log file.

## 2026-06-02 20:00:53 +03:00
- Command:
```powershell
apply_patch on docs/crm-sql-work-log-2026-06-01.md to convert malformed inline code blocks into fenced blocks and remove whitespace issues
```
- Result: Patched the latest work-log entries to use fenced PowerShell blocks and removed the whitespace problems introduced by the earlier append.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Re-run diff hygiene checks, then stage and commit if clean.

## 2026-06-02 20:01:36 +03:00
- Command:
```powershell
git diff --check
```
- Result: Whitespace check still failed after the first cleanup pass because two later appended entries still had trailing spaces and there was a blank line at EOF.
- Exit code: 1
- Error text: Trailing whitespace at lines 9276 and 9286, plus new blank line at EOF in docs/crm-sql-work-log-2026-06-01.md.
- Status: failed
- Next action: Patch the specific later entries to remove inline-code formatting issues and blank trailing fields.

## 2026-06-02 20:01:36 +03:00
- Command:
```powershell
apply_patch on docs/crm-sql-work-log-2026-06-01.md to convert the later inline command blocks to fenced code blocks and remove trailing blanks
```
- Result: Cleaned the remaining malformed command blocks and blank Error text field spacing in the latest work-log entries.
- Exit code: 0
- Error text: none
- Status: ok
- Next action: Re-run git diff --check; if clean, stage the work log and validate the staged diff.
## 2026-06-02 20:03:47 +03:00
- Command:
`powershell
git diff --check
`
- Result: Worktree diff hygiene passed except for the LF/CRLF warning; no trailing-whitespace findings remained after cleanup.
- Exit code: 0
- Error text: warning: in the working copy of docs/crm-sql-work-log-2026-06-01.md, LF will be replaced by CRLF the next time Git touches it.
- Status: ok
- Next action: Stage the work-log file and run staged diff checks.

## 2026-06-02 20:03:47 +03:00
- Command:
`powershell
git add docs/crm-sql-work-log-2026-06-01.md
`
- Result: Staging failed. Git could not insert the work-log blob into the repository object database.
- Exit code: 1
- Error text: error: insufficient permission for adding an object to repository database .git/objects; failed to insert into database; unable to index file.
- Status: failed
- Next action: Inspect .git object-store permissions and verify whether object writes fail outside git add as well.

## 2026-06-02 20:03:47 +03:00
- Command:
`powershell
Get-Item .git\\objects; Get-ChildItem .git -Force; git status --short
`
- Result: Confirmed the worktree is writable and only docs/crm-sql-work-log-2026-06-01.md is modified. Git metadata directories are present.
- Exit code: 0
- Error text: none
- Status: ok
- Next action: Check ACLs and direct object writes in .git/objects.

## 2026-06-02 20:03:47 +03:00
- Command:
`powershell
icacls .git\\objects; Write-Output test | git hash-object -w --stdin; Get-ChildItem .git\\objects -Force; Get-ChildItem .git -Filter *.lock -Force
`
- Result: ACLs look writable for the sandbox user. Direct stdin object write succeeded, and no git lock file was present.
- Exit code: 0/1 mixed
- Error text: One exploratory here-string variant for git hash-object failed from PowerShell syntax before the successful retry; no repository lock file was found.
- Status: ok
- Next action: Re-try git add, then isolate whether the problem is specific to the work-log object path.

## 2026-06-02 20:03:47 +03:00
- Command:
`powershell
git add docs/crm-sql-work-log-2026-06-01.md; git hash-object docs/crm-sql-work-log-2026-06-01.md; git hash-object -w docs/crm-sql-work-log-2026-06-01.md
`
- Result: Retry confirmed the problem is file-specific in the object database path for this work-log blob. Non-writing hash succeeded, but writing that file object failed.
- Exit code: 1
- Error text: git add and git hash-object -w both failed with insufficient permission for adding an object to repository database .git/objects.
- Status: failed
- Next action: Inspect the target object-prefix directory and test direct file creation there.

## 2026-06-02 20:03:47 +03:00
- Command:
`powershell
Inspect .git\\objects\\c5, icacls .git\\objects\\c5, and Set-Content .git\\objects\\c5\\codex-write-test.tmp
`
- Result: The target object directory c5 exists, but direct file creation inside it fails with access denied. This blocks staging, commit, and push from the current shell.
- Exit code: 1
- Error text: Set-Content: Access denied for D:\\Codex\\CRM\\SQL\\.git\\objects\\c5\\codex-write-test.tmp.
- Status: failed
- Next action: Stop without forcing repository repair. Report the local .git object-store permission blocker clearly.

## 2026-06-02 - Viewer startup blocks before opening port

Action: user provided screenshot from Ubuntu helper run after pull blocker was resolved.

Observed terminal output:

```text
=== verify crm_products folder columns ===
column_name
is_group
product_group_code
product_group_name
product_group_ref
(4 rows)

=== restart viewer ===
crm-1c-viewer.service - CRM 1C read-only web viewer
Active: active (running)
Main PID: 53349 (python3)
CGroup:
  /usr/bin/python3 /home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py --host 0.0.0.0 --port 8091 --use-postgres-sudo
  sudo -n -u postgres psql ... COPY (... FROM one_c_mirror.crm_products ...)

=== viewer health ===
curl: (7) Failed to connect to 127.0.0.1 port 8091 after 0 ms: Could not connect to server
```

Diagnosis:

- GitHub update and SQL migration now succeeded.
- PostgreSQL view `one_c_mirror.crm_products` has all required folder fields.
- The service process is running the correct script path.
- The viewer still has not opened port `8091` because `main()` currently calls `load_payload(args)` before creating `ThreadingHTTPServer`.
- While `load_payload()` is still running expensive PostgreSQL `COPY` queries, systemd shows the process as active, but `/health` cannot connect yet.

Status: diagnosis successful. Next action: change the viewer to start HTTP immediately with a schema-only/loading payload, then load SQL data in a background thread.

## 2026-06-02 - Viewer startup: async HTTP startup implemented

Action: changed the Ubuntu viewer so HTTP starts immediately while SQL data loads in a background thread. This fixes the state where systemd reports `active (running)` but `/health` cannot connect because startup is still blocked inside PostgreSQL `COPY`.

Files changed:

- `scripts/ubuntu/run-1c-crm-viewer.py`
- `dist/crm-product-folder-update-2026-06-02/ubuntu-home-crmadmin-SQL/scripts/ubuntu/run-1c-crm-viewer.py`
- `docs/one-c-mirror-import.md`
- `dist/crm-product-folder-update-2026-06-02/docs/one-c-mirror-import.md`
- `dist/crm-product-folder-update-2026-06-02.zip`

Commands:

```powershell
Get-Content scripts\ubuntu\run-1c-crm-viewer.py -TotalCount 35
Get-Content scripts\ubuntu\run-1c-crm-viewer.py | Select-Object -Skip 960 -First 140
Get-Content scripts\ubuntu\run-1c-crm-viewer.py | Select-Object -Skip 1210 -First 175
Get-Content scripts\ubuntu\run-1c-crm-viewer.py | Select-Object -Skip 1380 -First 90
apply_patch
rg -n "product-folder-columns-2|product-folder-columns-3|Loading data from SQL|empty_payload|threading|loading=" scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py docs\one-c-mirror-import.md dist\crm-product-folder-update-2026-06-02\docs\one-c-mirror-import.md
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m py_compile scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
git diff --stat
apply_patch
Get-ChildItem -Path scripts\ubuntu,dist\crm-product-folder-update-2026-06-02 -Recurse -Directory -Filter __pycache__ | Select-Object -ExpandProperty FullName
rg -n "product-folder-columns-2|product-folder-columns-3" scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py docs\one-c-mirror-import.md dist\crm-product-folder-update-2026-06-02\docs\one-c-mirror-import.md
$workspace = (Resolve-Path 'D:\Codex\CRM\SQL').Path
$targets = @(
  'scripts\ubuntu\__pycache__',
  'dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\__pycache__'
) | ForEach-Object { Resolve-Path $_ -ErrorAction SilentlyContinue }
foreach ($target in $targets) {
  if (-not $target.Path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove outside workspace: $($target.Path)"
  }
}
foreach ($target in $targets) {
  Remove-Item -LiteralPath $target.Path -Recurse -Force
  Write-Output "removed $($target.Path)"
}
Compress-Archive -Path 'dist\crm-product-folder-update-2026-06-02\*' -DestinationPath 'dist\crm-product-folder-update-2026-06-02.zip' -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('D:\Codex\CRM\SQL\dist\crm-product-folder-update-2026-06-02.zip')
try {
  $zip.Entries |
    Where-Object { $_.FullName -match 'run-1c-crm-viewer.py|one-c-mirror-import.md|__pycache__' } |
    Select-Object -ExpandProperty FullName
} finally {
  $zip.Dispose()
}
& 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m py_compile scripts\ubuntu\run-1c-crm-viewer.py dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\run-1c-crm-viewer.py
git diff --stat
Get-ChildItem -Path scripts\ubuntu,dist\crm-product-folder-update-2026-06-02 -Recurse -Directory -Filter __pycache__ | Select-Object -ExpandProperty FullName
$workspace = (Resolve-Path 'D:\Codex\CRM\SQL').Path
$targets = @(
  'scripts\ubuntu\__pycache__',
  'dist\crm-product-folder-update-2026-06-02\ubuntu-home-crmadmin-SQL\scripts\ubuntu\__pycache__'
) | ForEach-Object { Resolve-Path $_ -ErrorAction SilentlyContinue }
foreach ($target in $targets) {
  if (-not $target.Path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove outside workspace: $($target.Path)"
  }
}
foreach ($target in $targets) {
  Remove-Item -LiteralPath $target.Path -Recurse -Force
  Write-Output "removed $($target.Path)"
}
```

Results:

- File inspections: exit code `0`; confirmed old blocking path in `main()` loaded SQL before creating `ThreadingHTTPServer`.
- Viewer patch `apply_patch`: exit code `0`; added `threading`, build `2026-06-02-product-folder-columns-3`, schema-only `empty_payload`, background `load_initial_payload`, `/health` `loading=true/false`, and frontend loading refresh.
- First marker `rg`: exit code `0`; confirmed async markers and identified docs still referenced `product-folder-columns-2`.
- First bundled `py_compile`: exit code `0`; viewer scripts syntactically valid.
- Docs patch `apply_patch`: exit code `0`; updated docs to expected build `2026-06-02-product-folder-columns-3`.
- `Get-ChildItem __pycache__`: exit code `0`; found two generated cache directories.
- Build marker `rg`: exit code `0`; only `product-folder-columns-3` remains in viewer/docs.
- Cache removal: exit code `0`; removed generated `__pycache__` directories inside the repo.
- `Compress-Archive`: exit code `0`; rebuilt `dist/crm-product-folder-update-2026-06-02.zip`.
- Zip inspection: exit code `0`; archive contains updated doc and viewer; no `__pycache__` entries.
- Final bundled `py_compile`: exit code `0`; viewer scripts remain valid.
- Final `git diff --stat`: exit code `0`; changed zip, packaged doc, packaged viewer, work log, main doc, and main viewer.
- Final cache cleanup: exit code `0`; removed two `__pycache__` directories created by final `py_compile`.

Status: successful. Next action: stage, verify, commit, and push async viewer startup fix.

## 2026-06-02 - Viewer startup: final pre-commit checks

Action: ran final checks before staging async viewer startup fix.

Commands:

```powershell
git status --short --branch
git diff --check
rg -n "VIEWER_BUILD|empty_payload|load_initial_payload|loading=|product-folder-columns-3|product-folder-columns-2" scripts\ubuntu\run-1c-crm-viewer.py docs\one-c-mirror-import.md
```

Results:

- `git status --short --branch`: exit code `0`; branch aligned with `origin/main`, with six modified files.
- `git diff --check`: exit code `0`; no whitespace errors; Git repeated LF-to-CRLF warnings.
- `rg`: exit code `0`; confirmed `VIEWER_BUILD`, `empty_payload`, `load_initial_payload`, `/health loading=...`, and `product-folder-columns-3`; no `product-folder-columns-2` match in checked files.

Status: successful. Next action: stage, verify staged diff, commit, and push.

## 2026-06-02 - Viewer startup: staged diff verified

Action: staged the async viewer startup fix and verified the staged diff.

Commands:

```powershell
git add -A
git diff --cached --check
git status --short --branch
git diff --cached --stat
```

Results:

- `git add -A`: exit code `0`; Git repeated LF-to-CRLF warnings for modified text files.
- `git diff --cached --check`: exit code `0`; no whitespace errors.
- `git status --short --branch`: exit code `0`; staged changes include updated zip, docs, packaged viewer, work log, and main viewer.
- `git diff --cached --stat`: exit code `0`; `6 files changed, 519 insertions(+), 32 deletions(-)`.

Status: successful. Next action: stage this log entry, commit `Start 1C viewer before SQL payload load`, and push.

## 2026-06-02 - Viewer startup: async fix pushed

Action: committed and pushed the async viewer startup fix.

Commands:

```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git commit -m "Start 1C viewer before SQL payload load"
git push origin main
```

Results:

- `git add docs/crm-sql-work-log-2026-06-01.md`: exit code `0`; Git repeated LF-to-CRLF warning for work log.
- `git commit -m "Start 1C viewer before SQL payload load"`: exit code `0`; commit created: `d806046`; `6 files changed, 541 insertions(+), 32 deletions(-)`.
- Elevated `git push origin main`: exit code `0`; pushed `main` from `2eb1030` to `d806046`.

Status: successful. GitHub now contains the viewer startup fix. Next action: commit and push this final push-result log entry, then instruct Ubuntu to pull and restart the viewer.
## 2026-06-02 - Viewer still does not bind port after async startup pull

Action: user provided screenshot after running:

```bash
cd /home/crmadmin/SQL
git pull --ff-only origin main
sudo systemctl restart crm-1c-viewer.service
curl http://127.0.0.1:8091/health
```

Observed terminal output:

```text
Updating 2eb1030..cbbebdd
Fast-forward
...
6 files changed, 561 insertions(+), 32 deletions(-)
curl: (7) Failed to connect to 127.0.0.1 port 8091 after 0 ms: Could not connect to server
```

Diagnosis:

- Pull to async viewer build completed.
- `curl /health` still cannot connect immediately after restart.
- Next required evidence is service status/journal and process/port state after the new code. The likely causes are: Python startup error after restart, systemd running an unexpected file/version, service still not reaching socket bind, or a port/listen failure.

Status: pending server-side evidence. Next action: ask user to run a compact Ubuntu diagnostic block that prints Git head, Python version, viewer build markers, systemd status, journal, listening port, and health response.

## 2026-06-02 22:56:26 +03:00
- Command:
```powershell
$mem = Join-Path $env:CODEX_HOME 'automations/sql-github-auto-sync/memory.md'; if (Test-Path $mem) { Get-Content -Raw $mem }
Get-ChildItem -Force
Get-Content -Raw 'C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md'
Get-Content -Tail 120 'docs\crm-sql-work-log-2026-06-01.md'
```
- Result: The first memory-read attempt failed because `$env:CODEX_HOME` is unset in this shell. Resolved the automation memory path manually at `C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md`, loaded the prior run summary, and reviewed the current work-log tail. The prior run ended with an intermittent `.git\objects` write-permission failure that left the work log staged and unstaged at different revisions.
- Exit code: mixed; initial memory-read command exit code 1, directory listing and manual file reads exit code 0
- Error text: `Join-Path`/`Test-Path` parameter binding failed because `$env:CODEX_HOME` was null
- Status: ok
- Next action: Re-inspect git state from the current worktree and index before attempting any new staging operation.

## 2026-06-02 22:56:26 +03:00
- Command:
```powershell
git status --short --branch
git remote -v
git diff --cached --stat
git status --ignored --short
$files = git ls-files; $files | ForEach-Object { $item = Get-Item $_ -ErrorAction SilentlyContinue; if ($item) { [PSCustomObject]@{ FullName = $item.FullName; Length = $item.Length } } } | Sort-Object Length -Descending | Select-Object -First 20 FullName,Length
rg -n -i --glob '!**/.git/**' --glob '!**/node_modules/**' --glob '!**/*.zip' --glob '!**/*.docx' --glob '!**/*.png' --glob '!**/*.jpg' --glob '!**/*.jpeg' --glob '!**/*.pdf' "(password|passwd|secret|api[_-]?key|token|authorization:|bearer\s+[A-Za-z0-9._-]+|client[_-]?secret|private[_-]?key|BEGIN [A-Z ]+PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})" .
git diff --stat
git diff -- docs/crm-sql-work-log-2026-06-01.md
git diff --check
git hash-object docs/crm-sql-work-log-2026-06-01.md
Get-ChildItem .git -Filter *.lock -Force
git ls-files -s docs/crm-sql-work-log-2026-06-01.md
git status --porcelain=v2
```
- Result: `main` still points at `origin/main` on `https://github.com/1973zahar/SQL.git`. The only path involved is `docs/crm-sql-work-log-2026-06-01.md`, but it is in `MM` state: the index still contains blob `a98ffd5c891483cd09361e12c198033476634491` while the working tree has advanced to blob `13c68604a13e8c38e0c645b29c14fe785ef36d17`. The staged diff currently spans 72 inserted lines, the unstaged delta adds 55 more lines, there are no `.lock` files, large tracked files are existing artifacts, and the secret-pattern scan again surfaced documented placeholders, demo values, and historical log references rather than a newly introduced live credential.
- Exit code: 0
- Error text: warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it
- Status: ok
- Next action: Re-test `git add` for the updated work-log blob and stop if `.git\objects` still rejects the write.

## 2026-06-02 22:57:25 +03:00
- Command:
```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git hash-object docs/crm-sql-work-log-2026-06-01.md
git ls-files -s docs/crm-sql-work-log-2026-06-01.md
git status --porcelain=v2
git diff --cached --stat
git diff --cached --check
```
- Result: The re-test succeeded sequentially. `git add` updated the index to blob `c3fe8820dd96a70e9118fe13ecd2c8fb42f92e78`, matching the current work-tree hash. Repository status moved from `MM` to `M.` for the work log, the cached diff now contains 164 inserted lines, and `git diff --cached --check` passed with no content errors.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Re-stage the final work-log content after this entry, confirm cached checks one more time, then create a concise commit and push `main` to `origin`.

## 2026-06-02 22:57:58 +03:00
- Command:
```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git diff --cached --check
git status --short --branch
git commit -m "docs: update CRM SQL work log"
git push origin main
```
- Result: Re-staging failed again immediately after appending the latest required work-log lines. Because the index could not accept the new work-log blob, repository state reverted to `MM` for the log file. The subsequent commit failed before opening a valid commit message file, and `git push` also failed because this shell does not currently have usable HTTPS credentials for GitHub.
- Exit code: mixed; `git add` exit code 128, `git diff --cached --check` exit code 0 for the older staged blob, `git status` exit code 0, `git commit` exit code 128, `git push` exit code 128
- Error text: warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it; error: insufficient permission for adding an object to repository database .git/objects; error: docs/crm-sql-work-log-2026-06-01.md: failed to insert into database; error: unable to index file 'docs/crm-sql-work-log-2026-06-01.md'; fatal: updating files failed; fatal: could not open '.git/COMMIT_EDITMSG': Permission denied; fatal: unable to access 'https://github.com/1973zahar/SQL.git/': schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030e) - В пакете безопасности отсутствуют учетные данные
- Status: failed
- Next action: Stop without committing or pushing. A future run needs both blockers cleared: stable write access for new objects under `.git\objects` and valid GitHub HTTPS credentials in this shell.

## 2026-06-02 21:55:33 +03:00
- Command:
```powershell
git status --short --branch
git remote -v
git diff --cached --stat
git status --ignored --short
$files = git ls-files; $files | ForEach-Object { $item = Get-Item $_ -ErrorAction SilentlyContinue; if ($item) { [PSCustomObject]@{ FullName = $item.FullName; Length = $item.Length } } } | Sort-Object Length -Descending | Select-Object -First 20 FullName,Length
rg -n -i --glob '!**/.git/**' --glob '!**/node_modules/**' --glob '!**/*.zip' --glob '!**/*.docx' --glob '!**/*.png' --glob '!**/*.jpg' --glob '!**/*.jpeg' --glob '!**/*.pdf' "(password|passwd|secret|api[_-]?key|token|authorization:|bearer\s+[A-Za-z0-9._-]+|client[_-]?secret|private[_-]?key|BEGIN [A-Z ]+PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})" .
git diff --stat
git diff -- docs/crm-sql-work-log-2026-06-01.md
git diff --check
git hash-object docs/crm-sql-work-log-2026-06-01.md
Get-ChildItem .git -Filter *.lock -Force
icacls .git\objects\c5
```
- Result: `main` still tracks `origin/main` at `https://github.com/1973zahar/SQL.git`, with only the work log modified. No staged content or ignored-cache noise was present before staging. The large tracked files are existing artifacts. The secret scan returned documented placeholders, demo values, and prior logs rather than a new live credential. The unstaged diff remained limited to the work log, `git diff --check` only emitted the existing LF-to-CRLF warning, and the current work-log blob initially hashed under `.git\objects\c5` with no `.lock` files present.
- Exit code: 0
- Error text: warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it
- Status: ok
- Next action: Re-test staging against the current blob and inspect the index directly before committing.

## 2026-06-02 21:55:33 +03:00
- Command:
```powershell
git add docs/crm-sql-work-log-2026-06-01.md
Set-Content .git\objects\a9\codex-write-test.tmp 'test'
git status --short --branch
git diff --cached --stat
git diff --cached -- docs/crm-sql-work-log-2026-06-01.md
git ls-files -s docs/crm-sql-work-log-2026-06-01.md
git status --porcelain=v2
```
- Result: The second `git add` succeeded with only the line-ending warning. A direct write probe under `.git\objects\a9` also succeeded, matching the updated work-log blob hash. The index now contains blob `a98ffd5c891483cd09361e12c198033476634491` for `docs/crm-sql-work-log-2026-06-01.md`, and porcelain v2 reports `M.` which confirms the change is staged with no remaining unstaged delta in that file.
- Exit code: 0
- Error text: warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it
- Status: ok
- Next action: Run `git diff --cached --check`, commit the staged work log, and push `main` to `origin` if the staged patch remains clean.

## 2026-06-02 21:56:15 +03:00
- Command:
```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git diff --cached --check
git diff --cached --stat
git status --short --branch
git hash-object docs/crm-sql-work-log-2026-06-01.md
git status --porcelain=v2
```
- Result: After appending the latest run details to the work log, re-staging failed again before commit. `git add` returned an object-database permission error, so the index stayed on the previously staged blob `a98ffd5c891483cd09361e12c198033476634491` while the working tree advanced to blob `689d06e38638b7a860b7f1c7adcd6a96f7f943fc`. `git diff --cached --check` still passed for the older staged blob, but repository status became `MM` for the work log, which blocks a clean commit/push for the fully logged current state.
- Exit code: mixed; `git add` exit code 1, follow-up inspection commands exit code 0
- Error text: warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it; error: insufficient permission for adding an object to repository database .git/objects; error: docs/crm-sql-work-log-2026-06-01.md: failed to insert into database; error: unable to index file 'docs/crm-sql-work-log-2026-06-01.md'; fatal: updating files failed
- Status: failed
- Next action: Stop without committing or pushing. The next run should resolve the intermittent `.git\objects` write-permission issue or an external process that is locking object creation for new work-log blobs.

## 2026-06-02 21:05:32 +03:00
- Command:
```powershell
if (Test-Path $env:CODEX_HOME\automations\sql-github-auto-sync\memory.md) { Get-Content $env:CODEX_HOME\automations\sql-github-auto-sync\memory.md -Raw }
if (Test-Path docs\crm-sql-work-log-2026-06-01.md) { Get-Content docs\crm-sql-work-log-2026-06-01.md -Raw }
```
- Result: No existing automation memory file was present. Loaded the current work log to preserve continuity and avoid duplicating prior sync work.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Inspect git status, remotes, staged state, ignored files, large tracked files, and likely secrets before staging anything.

## 2026-06-02 21:06:14 +03:00
- Command:
```powershell
git status --short --branch
git remote -v
git diff --cached --stat
git status --ignored --short
$files = git ls-files; $files | ForEach-Object { $item = Get-Item $_ -ErrorAction SilentlyContinue; if ($item) { [PSCustomObject]@{ FullName = $item.FullName; Length = $item.Length } } } | Sort-Object Length -Descending | Select-Object -First 20 FullName,Length
rg -n -i --glob '!**/.git/**' --glob '!**/node_modules/**' --glob '!**/*.zip' --glob '!**/*.docx' --glob '!**/*.png' --glob '!**/*.jpg' --glob '!**/*.jpeg' --glob '!**/*.pdf' "(password|passwd|secret|api[_-]?key|token|authorization:|bearer\s+[A-Za-z0-9._-]+|client[_-]?secret|private[_-]?key|BEGIN [A-Z ]+PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})" .
```
- Result: `main` tracks `origin/main` and the only modified file is `docs/crm-sql-work-log-2026-06-01.md`. No staged changes or ignored-cache noise appeared. Largest tracked files are expected artifacts already in the repo. Secret-pattern matches were placeholders, documented examples, viewer auth references, and existing demo/mock data; no new live secret was introduced by the current pending change.
- Exit code: 0
- Error text:
- Status: ok
- Next action: Review the actual unstaged diff and whitespace hygiene before staging only the work log.

## 2026-06-02 21:07:00 +03:00
- Command:
```powershell
git diff --stat
git diff -- docs/crm-sql-work-log-2026-06-01.md
git diff --check
```
- Result: Unstaged diff is limited to the work log with 28 inserted lines. Reviewed the actual patch and confirmed it only adds this automation run context. `git diff --check` passed; Git only emitted the existing LF-to-CRLF working-copy warning.
- Exit code: 0
- Error text: warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it
- Status: ok
- Next action: Stage only the work log, run staged diff checks, and commit if the staged patch remains clean.

## 2026-06-02 21:07:39 +03:00
- Command:
```powershell
git add docs/crm-sql-work-log-2026-06-01.md
git diff --cached --check
git diff --cached --stat
git status --short --branch
```
- Result: Staging failed before any cached diff could be created. Repository status remained unchanged with only the work log modified in the worktree.
- Exit code: mixed; `git add` exit code 1, follow-up cached checks exit code 0 with no staged content, `git status` exit code 0
- Error text: warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it; error: insufficient permission for adding an object to repository database .git/objects; error: docs/crm-sql-work-log-2026-06-01.md: failed to insert into database; error: unable to index file 'docs/crm-sql-work-log-2026-06-01.md'; fatal: updating files failed
- Status: failed
- Next action: Confirm whether the object-database write blocker is still present for the target object path and stop if it is.

## 2026-06-02 21:08:26 +03:00
- Command:
```powershell
git hash-object docs/crm-sql-work-log-2026-06-01.md
icacls .git\objects
Get-ChildItem .git\objects -Force | Select-Object Name,Mode,LastWriteTime
Get-ChildItem .git -Filter *.lock -Force
icacls .git\objects\c5
Write-Output test | git hash-object -w --stdin
Set-Content .git\objects\c5\codex-write-test.tmp 'test'
```
- Result: The pending work-log blob hashes to `c513fdb37364de297c0a06a5d187559eb0fe6ee3`, so Git needs to write under `.git\objects\c5`. ACLs appear permissive on `.git\objects` and `.git\objects\c5`, and a separate stdin object write succeeded, but direct file creation inside `.git\objects\c5` failed with access denied. No `.lock` files were present. This confirms the local object-store path remains blocked for the specific write Git needs for the current log blob.
- Exit code: mixed; hash/ACL/listing commands exit code 0, `Set-Content` exit code 1
- Error text: Set-Content : Отказано в доступе по пути "D:\Codex\CRM\SQL\.git\objects\c5\codex-write-test.tmp".
- Status: failed
- Next action: Stop without forcing repository repair, commit, or push. Report the `.git\objects\c5` permission blocker clearly.
## 2026-06-02 - Ubuntu login clarification

Action: user wrote `вхід в убунту` after showing the `crmadmin@crm-sql:~/SQL` terminal.

Diagnosis:

- The screenshot prompt `crmadmin@crm-sql:~/SQL` means the user is already logged into the Ubuntu host as user `crmadmin`.
- If a fresh login from Windows is needed, the expected command is `ssh crmadmin@192.168.0.166`, followed by the Ubuntu user's password or SSH key authentication.
- From this Codex shell, non-interactive SSH was previously blocked by missing authentication: `Permission denied (publickey,password)`.

Status: informational. Next action: answer with the exact login command and note that the current screenshot already shows an active Ubuntu session.
## 2026-06-02 - Windows PowerShell used for Bash/Linux diagnostic commands

Action: user provided screenshot from `Administrator: Windows PowerShell` showing Linux/Bash diagnostic commands were pasted into Windows PowerShell.

Observed terminal output:

```text
The '<' operator is reserved for future use.
cmdlet Write-Output at command pipeline position 1
Supply values for the following parameters:
InputObject[0]:
fi : The term 'fi' is not recognized as the name of a cmdlet...
curl -v --max-time 10 http://127.0.0.1:8091/health || true
The token '||' is not a valid statement separator in this version.
ssh crmadmin@192.168.0.166
ssh: connect to host 192.168.0.166 port 22: Connection timed out
```

Diagnosis:

- Commands containing `fi`, heredoc/redirect syntax, and `|| true` are Bash/Linux syntax and must be run in the Ubuntu terminal `crmadmin@crm-sql`, not Windows PowerShell.
- In Windows PowerShell, `127.0.0.1:8091` checks the Windows machine, not the Ubuntu server. From Windows, the viewer should be checked at `http://192.168.0.166:8091/health`.
- In Windows PowerShell, `curl` can be an alias for `Invoke-WebRequest`; use `curl.exe` to run real curl.
- SSH from Windows to `192.168.0.166:22` timed out in the screenshot, so either SSH is not reachable/running from Windows now, the IP/network route changed, or Windows firewall/VPN/network state differs. The already open `crmadmin@crm-sql:~/SQL` terminal is the correct place to continue server commands.

Status: diagnosis successful. Next action: provide separate command blocks for Ubuntu terminal and Windows PowerShell.

## 2026-06-02 - SSH timeout question: could another login block access

Action: user asked whether someone else may have logged into Ubuntu and blocked access.

Diagnosis:

- A normal concurrent Ubuntu/SSH login does not block another SSH login.
- `ssh: connect to host 192.168.0.166 port 22: Connection timed out` means the Windows side cannot establish TCP connection to port `22`.
- If SSH were blocked by authentication or too many sessions, the error would usually be different, such as `Permission denied`, `Connection refused`, or a max-startups/session message.
- Timeout points to network reachability, wrong/stale IP, VM/network adapter state, firewall, SSH daemon not listening, or host being down/restarting.

Commands:

```powershell
Test-NetConnection -ComputerName 192.168.0.166 -Port 22 | Format-List ComputerName,RemoteAddress,RemotePort,TcpTestSucceeded
Test-NetConnection -ComputerName 192.168.0.166 -Port 8091 | Format-List ComputerName,RemoteAddress,RemotePort,TcpTestSucceeded
```

Results:

- Port `22`: exit code `0`, `TcpTestSucceeded : False`; warning: TCP connect failed and ping timed out.
- Port `8091`: exit code `0`, `TcpTestSucceeded : False`; warning: TCP connect failed and ping timed out.

Status: current Windows/Codex environment cannot reach host `192.168.0.166` on SSH or viewer port. This is a reachability/network/IP/host issue, not evidence that another user login blocked SSH. Next action: instruct user to use the already open Ubuntu terminal/VM console and check IP, SSH service, firewall, and active logins.
## 2026-06-02 - Ubuntu terminal is no longer open

Action: user reported that there is no open Ubuntu terminal/window anymore.

Current state:

- Earlier Windows-side checks showed `192.168.0.166` is not reachable from Windows/Codex on ports `22` and `8091`.
- User no longer has the already-authenticated `crmadmin@crm-sql:~/SQL` terminal that could run local server diagnostics.
- Therefore the next step is to regain Ubuntu console/SSH access before continuing viewer repair.

Diagnosis:

- If SSH to `192.168.0.166` times out, opening another PowerShell and running the same `ssh crmadmin@192.168.0.166` will not help until the Ubuntu host/IP/network is reachable again.
- Need either a direct VM/server console or the current Ubuntu IP address.

Status: blocked on Ubuntu access. Next action: provide Windows-side steps to reopen/find the Ubuntu host, then reconnect with SSH once reachable.
## 2026-06-02 - Process correction: separate Windows PowerShell and Ubuntu Bash

Action: user complained that they have to teach the assistant repeatedly.

Root cause acknowledged:

- I previously provided Bash/Linux commands while the user was working in Windows PowerShell.
- I also assumed an Ubuntu terminal remained open after the user had already lost that session.
- This caused invalid PowerShell syntax errors and wasted time.

Correction rule for the rest of this project:

- First identify the active shell from the prompt:
  - `PS C:\...>` means Windows PowerShell commands only.
  - `crmadmin@crm-sql:~/SQL$` means Ubuntu Bash commands only.
- Never provide Bash control syntax (`fi`, `for ... do`, `|| true`, heredocs, `/proc/...`) for Windows PowerShell.
- Never use `127.0.0.1` from Windows to check the Ubuntu viewer; from Windows use the Ubuntu LAN IP, for example `http://192.168.0.166:8091`.
- If Ubuntu access is lost, first restore/find the Ubuntu host/IP/console before continuing SQL/viewer repair.

Status: correction logged. Next action: provide a Windows-only recovery path for finding/reconnecting to Ubuntu, then an Ubuntu-only block once access is restored.
## 2026-06-02 - Stop repeating already-run network checks

Action: user replied `це вже було` after another suggestion to run Windows-side network checks.

Correction:

- Do not repeat the same `Test-NetConnection`, `ping`, or `ssh crmadmin@192.168.0.166` checks unless the network/VM state has changed.
- The known state is already: Windows/Codex could not reach `192.168.0.166` on ports `22` or `8091`, and SSH timed out from the user's Windows PowerShell.
- Next meaningful action is not another network probe; it is to regain direct console access to the Ubuntu host/VM or identify where `crm-sql` is running.

Status: repeated-check loop acknowledged and stopped. Next action: ask only for the missing environment fact: where the Ubuntu `crm-sql` machine is hosted/opened from, or have the user open that VM/server console directly.
## 2026-06-02 - How to enter Ubuntu: local host checks

Action: user asked `як зайти в убунту`. Instead of repeating SSH/network checks, inspected whether this Windows machine exposes a local Ubuntu/VM entrypoint.

Commands:

```powershell
Get-Command Get-VM -ErrorAction SilentlyContinue | Format-List Source,Name,CommandType
Get-Command VBoxManage -ErrorAction SilentlyContinue | Format-List Source,Name,CommandType
wsl.exe -l -v
Get-Process | Where-Object { $_.ProcessName -match 'VirtualBox|VBox|vmware|Hyper-V|vmconnect|qemu|multipass|wsl|WindowsTerminal' } | Select-Object ProcessName,Id,MainWindowTitle
```

Results:

- `Get-Command Get-VM`: exit code `1`; no Hyper-V `Get-VM` command exposed in this shell.
- `Get-Command VBoxManage`: exit code `1`; no VirtualBox CLI exposed in this shell.
- `wsl.exe -l -v`: exit code `1`; WSL reports no installed Linux distributions.
- Process check: exit code `0`; found `WindowsTerminal` and `wslservice`, but no obvious running VirtualBox/VMware/Hyper-V console process.

Diagnosis:

- There is no obvious local WSL Ubuntu distribution to enter with `wsl`.
- There is no obvious local VirtualBox/Hyper-V CLI entrypoint exposed from this shell.
- The earlier `crmadmin@crm-sql:~/SQL` window was most likely an SSH session to a separate Ubuntu host/VM, or a VM console opened by another application not visible from these checks.
- Since SSH to `192.168.0.166` was timing out, access must be restored via the actual VM/server console or by finding the current IP/reachability of `crm-sql`.

Status: diagnosis logged. Next action: answer with the shortest correct entry paths: SSH only if reachable; otherwise open the actual VM/server console where `crm-sql` is hosted.
## 2026-06-02 - SQL sync precheck started

Action: read automation memory file and the tail of the SQL work log before inspecting repository state.

Commands / code used:

```powershell
if (Test-Path "$env:CODEX_HOME/automations/sql-github-auto-sync/memory.md") { Get-Content "$env:CODEX_HOME/automations/sql-github-auto-sync/memory.md" }
if (Test-Path "docs/crm-sql-work-log-2026-06-01.md") { Get-Content "docs/crm-sql-work-log-2026-06-01.md" -Tail 80 }
```

Results:

- Memory file read: exit code `0`; no content returned.
- Work log tail read: exit code `0`; previous entries were present and reviewed.

Error text: none.

Status: precheck context loaded. Next action: inspect git status, remotes, staged state, and ignored files.

## 2026-06-02 - Initial git state

Action: inspected current branch status, remotes, staged diff summary, and ignored-file summary.

Commands / code used:

```powershell
git status --short --branch
git remote -v
git diff --cached --stat
git status --ignored --short
```

Results:

- `git status --short --branch`: exit code `0`; output `## main...origin/main`.
- `git remote -v`: exit code `0`; fetch/push remote is `https://github.com/1973zahar/SQL.git`.
- `git diff --cached --stat`: exit code `0`; no staged changes.
- `git status --ignored --short`: exit code `0`; no ignored-file output.

Error text: none.

Status: repository appears clean before logging changes. Next action: run deeper safety checks for diffs, large files, and likely secrets.

## 2026-06-02 - Safety checks: diff, large files, likely secrets

Action: checked current unstaged diff summary, attempted a largest-tracked-files scan, searched the repository for likely secret patterns, and confirmed the working tree state.

Commands / code used:

```powershell
git diff --stat
git ls-files | ForEach-Object { $size=(Get-Item $_).Length; [PSCustomObject]@{Path=$_;Size=$size} } | Sort-Object Size -Descending | Select-Object -First 15 Path,@{Name='SizeMB';Expression={[math]::Round($_.Size/1MB,2)}}
rg -n --hidden --glob '!*.md' --glob '!*.log' --glob '!*.png' --glob '!*.jpg' --glob '!*.jpeg' --glob '!*.gif' --glob '!*.pdf' "(?i)(password\s*[=:]|passwd\s*[=:]|secret\s*[=:]|api[_-]?key\s*[=:]|token\s*[=:]|authorization\s*:\s*bearer|BEGIN (RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]+)" .
git status --short
```

Results:

- `git diff --stat`: exit code `0`; only `docs/crm-sql-work-log-2026-06-01.md` changed, with 43 inserted lines.
- Initial large-file scan: exit code `0`; returned top tracked files, then emitted PowerShell `Get-Item` errors for a path with quotes/non-ASCII characters because the pipeline used non-literal path handling.
- Secret-pattern scan: exit code `0`; matches were placeholder/example passwords in `.env` examples, SQL parameter placeholders, shell-script env vars, and demo/test credentials inside tracked `dist/.../app.js`. No new secret material was identified in the current diff.
- `git status --short`: exit code `0`; output ` M docs/crm-sql-work-log-2026-06-01.md`.

Error text:

- Large-file scan emitted `Get-Item : Путь содержит недопустимые знаки.` and `PathNotFound` for a quoted/non-ASCII path.

Status: no unsafe repo changes found so far; one scan needs a safer retry. Next action: rerun the large-file check with `-LiteralPath` and null-delimited git output, then inspect the current diff for secret-like additions.

## 2026-06-02 - Corrected large-file and diff-secret verification

Action: reran the large-file scan with literal-path handling and checked the current diff names plus secret-like tokens inside the diff.

Commands / code used:

```powershell
$files = git ls-files -z; $items = foreach ($entry in ($files -split "`0")) { if ($entry) { $item = Get-Item -LiteralPath $entry -ErrorAction Stop; [PSCustomObject]@{ Path = $entry; Size = $item.Length } } }; $items | Sort-Object Size -Descending | Select-Object -First 15 Path,@{Name='SizeMB';Expression={[math]::Round($_.Size / 1MB, 2)}}
git diff --unified=0 -- docs/crm-sql-work-log-2026-06-01.md | rg -n "(?i)(password|secret|token|api[_-]?key|authorization|PRIVATE KEY|AKIA|ghp_|github_pat_)"
git diff --name-only
```

Results:

- Corrected large-file scan: exit code `0`; largest tracked file is `docs/Виправити PostgreSQL для CRM.docx` at `2.32 MB`; no oversized files that would block a normal push were identified.
- Diff secret scan: exit code `0`; matches were only the log text describing prior secret-pattern scans and not actual credentials.
- `git diff --name-only`: exit code `0`; only `docs/crm-sql-work-log-2026-06-01.md` is modified.

Error text:

- Git emitted a warning that `LF` in `docs/crm-sql-work-log-2026-06-01.md` will be replaced by `CRLF` next time Git touches the file.

Status: repository is safe to stage with only automation-log changes. Next action: create/update automation memory, stage the automation files, and run `git diff --cached --check`.

## 2026-06-02 - Automation memory path resolution

Action: checked whether `CODEX_HOME` is available in the shell before writing automation memory.

Commands / code used:

```powershell
Write-Output $env:CODEX_HOME
```

Results:

- Exit code `0`; no value was returned, so `CODEX_HOME` is unset in this shell session.

Error text: none.

Status: shell env var missing, but the automation supplied an explicit memory path. Next action: write memory to `C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md`, then stage and validate the repo changes.

## 2026-06-02 - Memory write and initial staging attempt

Action: wrote automation memory outside the repository, then attempted to stage the work log and inspect staged state.

Commands / code used:

```text
apply_patch -> add C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md
git add -- "docs/crm-sql-work-log-2026-06-01.md"
git status --short
git diff --cached --stat
git diff --cached --check
```

Results:

- Memory file write: success; created `C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md`.
- `git add`: exit code `0`; Git warned that `LF` will be replaced by `CRLF` next time it touches the work-log file.
- Parallel post-add checks were inconclusive because they were launched simultaneously:
  - `git status --short`: exit code `0`; still showed ` M docs/crm-sql-work-log-2026-06-01.md`.
  - `git diff --cached --stat`: exit code `0`; no output captured.
  - `git diff --cached --check`: exit code `0`; no output captured.

Error text:

- Git warning: `LF will be replaced by CRLF` for `docs/crm-sql-work-log-2026-06-01.md`.

Status: memory written, but staged-state verification must be rerun sequentially to avoid races. Next action: rerun `git add`, `git status`, and cached diff checks sequentially, then commit if clean.

## 2026-06-02 - Sequential staged-state verification

Action: restaged the work log and reran the staged-state checks sequentially in one shell invocation to avoid race conditions.

Commands / code used:

```powershell
git add -- "docs/crm-sql-work-log-2026-06-01.md"; git status --short; Write-Output "---CACHED-STAT---"; git diff --cached --stat; Write-Output "---CACHED-CHECK---"; git diff --cached --check
```

Results:

- Exit code `0`.
- `git status --short` showed `M  docs/crm-sql-work-log-2026-06-01.md`, confirming the file is staged.
- `git diff --cached --stat` showed one staged file with `140 insertions`.
- `git diff --cached --check` produced no whitespace/error findings.

Error text:

- Git warning: `LF will be replaced by CRLF` for `docs/crm-sql-work-log-2026-06-01.md`.

Status: staged content is valid for commit. Next action: create a concise commit and push `main` to `origin`.

## 2026-06-02 - Commit blocked by `.git` permission error

Action: attempted to restage the updated work log and create a commit, then ran minimal `.git` diagnostics after the commit failed.

Commands / code used:

```powershell
git add -- "docs/crm-sql-work-log-2026-06-01.md"; git commit -m "docs: update SQL sync work log"
Get-Item .git\objects | Select-Object FullName,Attributes,Mode
if (Test-Path .git\COMMIT_EDITMSG) { Get-Item .git\COMMIT_EDITMSG | Select-Object FullName,Attributes,Mode } else { Write-Output "COMMIT_EDITMSG missing" }
git status --short --branch
```

Results:

- Commit attempt: exit code `1`; commit was not created.
- `.git\objects` diagnostic: exit code `0`; path exists as `D:\Codex\CRM\SQL\.git\objects`, attributes `Directory`, mode `d-----`.
- `.git\COMMIT_EDITMSG` diagnostic: exit code `0`; file exists as `D:\Codex\CRM\SQL\.git\COMMIT_EDITMSG`, attributes `Archive`, mode `-a----`.
- `git status --short --branch`: exit code `0`; output `## main...origin/main` and `MM docs/crm-sql-work-log-2026-06-01.md`, showing staged and unstaged changes remain in the work log after the failed commit flow.

Error text:

- `error: insufficient permission for adding an object to repository database .git/objects`
- `error: docs/crm-sql-work-log-2026-06-01.md: failed to insert into database`
- `error: unable to index file 'docs/crm-sql-work-log-2026-06-01.md'`
- `fatal: updating files failed`
- `fatal: could not open '.git/COMMIT_EDITMSG': Permission denied`

Status: sync is blocked by local `.git` filesystem permissions, not by content safety, secrets, auth, or merge conflicts. Next action: stop without forcing changes; user needs to fix repository write permissions/locking inside `.git`, then rerun the automation.

## 2026-06-03 - Final memory update for blocked sync

Action: captured the end-of-run timestamp and updated automation memory with the blocked state and retry guidance.

Commands / code used:

```powershell
Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
apply_patch -> update C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md
```

Results:

- `Get-Date`: exit code `0`; returned `2026-06-03 00:00:00 +03:00`.
- Memory update: success; recorded repo safety findings, the `.git` permission failure, and the required next step to fix `.git` write/lock state before retrying sync.

Error text: none.

Status: automation memory updated and sync intentionally stopped in blocked state. Next action: repair `.git` write permissions or release whatever is locking `.git`, then rerun this automation to restage, commit, and push.

## 2026-06-03 - Reloaded automation memory and current repo baseline

Action: reopened the automation memory from the explicit Codex path, then checked current branch state and configured `origin`.

Commands / code used:

```powershell
if (Test-Path 'C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md') { Get-Content -Raw 'C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md' }
git status --short --branch
git remote -v
```

Results:

- Memory read: exit code `0`; previous run summary confirms the last sync stopped on local `.git` write-permission errors during commit.
- `git status --short --branch`: exit code `0`; output `## main...origin/main` and `MM docs/crm-sql-work-log-2026-06-01.md`, so the work log still has both staged and unstaged changes.
- `git remote -v`: exit code `0`; fetch/push remote is `https://github.com/1973zahar/SQL.git`.

Error text: none.

Status: baseline restored; current repo state matches the earlier blocked pattern. Next action: rerun safety checks on staged/unstaged content, ignored/cache files, large files, and likely secrets before attempting any new Git write.

## 2026-06-03 - Rechecked diff state, ignored files, large files, and likely secrets

Action: reran staged/unstaged diff checks, looked for ignored/cache noise, listed the largest tracked files, and scanned the repository for likely secret patterns.

Commands / code used:

```powershell
git diff --stat
git diff --cached --stat
git diff --cached --check
git status --ignored --short
git ls-files | ForEach-Object { Get-Item -LiteralPath $_ -ErrorAction SilentlyContinue } | Sort-Object Length -Descending | Select-Object -First 10 FullName,@{Name='SizeMB';Expression={[math]::Round($_.Length/1MB,2)}}
rg -n --hidden --glob '!.git/' --glob '!node_modules/' --glob '!*.png' --glob '!*.jpg' --glob '!*.jpeg' --glob '!*.pdf' --glob '!*.docx' --glob '!*.zip' '(?i)(password\s*[:=]|passwd\s*[:=]|secret\s*[:=]|api[_-]?key\s*[:=]|token\s*[:=]|authorization\s*[:=]|BEGIN (RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]+|AIza[0-9A-Za-z\-_]{35}|xox[baprs]-[A-Za-z0-9-]{10,}|sk_(live|test)_[A-Za-z0-9]{16,})'
```

Results:

- `git diff --stat`: exit code `0`; unstaged delta is only `docs/crm-sql-work-log-2026-06-01.md` with `95 insertions`.
- `git diff --cached --stat`: exit code `0`; staged delta is only `docs/crm-sql-work-log-2026-06-01.md` with `140 insertions`.
- `git diff --cached --check`: exit code `0`; no whitespace or patch-apply issues.
- `git status --ignored --short`: exit code `0`; only `MM docs/crm-sql-work-log-2026-06-01.md`, with no ignored/cache files surfaced by status.
- Large-file scan: exit code `0`; largest tracked paths are existing artifacts such as `dist\crm-product-folder-update-2026-06-02\marketplace-crm-local\app.js`, `dist\{6F14BFE1-0CF4-4ED0-8FE3-DE433C7FFCCE}.png`, the work log, packaged ZIPs, and existing DOCX files.
- Secret scan: exit code `0`; matches are limited to `.env` examples, documented placeholder passwords, existing setup scripts, and demo credentials in tracked dist assets. No new live secret material was introduced by this run.

Error text:

- Git warning on `git diff --stat`: `LF will be replaced by CRLF the next time Git touches it` for `docs/crm-sql-work-log-2026-06-01.md`.

Status: content safety checks passed; blocker, if any, is expected to be Git repository write state rather than staged content. Next action: restage the work log, rerun cached diff validation, and test whether commit/push is still blocked by local `.git` permissions.

## 2026-06-03 - Git write path failed again before commit

Action: attempted to restage the updated work log and revalidate the cached diff, then checked minimal `.git` metadata after `git add` failed.

Commands / code used:

```powershell
git add -- "docs/crm-sql-work-log-2026-06-01.md"
git diff --cached --check
Get-Item .git\objects | Select-Object FullName,Attributes,Mode,LastWriteTime
if (Test-Path .git\COMMIT_EDITMSG) { Get-Item .git\COMMIT_EDITMSG | Select-Object FullName,Attributes,Mode,LastWriteTime } else { 'COMMIT_EDITMSG missing' }
git status --short --branch
```

Results:

- `git add -- "docs/crm-sql-work-log-2026-06-01.md"`: exit code `1`; restaging failed before commit because Git could not write into the repository object database.
- `git diff --cached --check`: exit code `0`; previously staged content remains patch-clean.
- `.git\objects` metadata: exit code `0`; path exists as `D:\Codex\CRM\SQL\.git\objects`, attributes `Directory`, mode `d-----`, last write `2026-06-02 23:59:24`.
- `.git\COMMIT_EDITMSG` metadata: exit code `0`; file exists as `D:\Codex\CRM\SQL\.git\COMMIT_EDITMSG`, attributes `Archive`, mode `-a----`, last write `2026-06-02 23:40:43`.
- `git status --short --branch`: exit code `0`; output remains `## main...origin/main` and `MM docs/crm-sql-work-log-2026-06-01.md`.

Error text:

- `warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it`
- `error: insufficient permission for adding an object to repository database .git/objects`
- `error: docs/crm-sql-work-log-2026-06-01.md: failed to insert into database`
- `error: unable to index file 'docs/crm-sql-work-log-2026-06-01.md'`
- `fatal: updating files failed`

Status: sync is blocked by local `.git` write permissions or a lock on `.git\objects`; no commit or push was attempted after the staging failure. Next action: stop without forcing changes; repair repository write access inside `.git`, then rerun the automation.

## 2026-06-03 - Finalized blocked state in automation memory

Action: captured the current completion time and rewrote the automation memory file with the latest blocked-state summary for the next run.

Commands / code used:

```powershell
Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
(Get-Date).ToUniversalTime().ToString('o')
apply_patch -> rewrite C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md
```

Results:

- `Get-Date -Format "yyyy-MM-dd HH:mm:ss K"`: exit code `0`; returned `2026-06-03 07:53:08 +03:00`.
- `(Get-Date).ToUniversalTime().ToString('o')`: exit code `0`; returned `2026-06-03T04:53:08.5001986Z`.
- Memory rewrite: success; stored the current repo safety summary, the repeated `.git\objects` write failure on `git add`, and the instruction to fix `.git` write/lock state before retrying commit/push.

Error text: none.

Status: automation memory now reflects the current blocked sync state. Next action: fix local repository write permissions or release the lock inside `.git`, then rerun the sync automation.

## 2026-06-03 - Re-read automation memory from explicit path

Action: retried the required memory read using the explicit automation memory path after the `$CODEX_HOME` environment variable lookup failed.

Commands / code used:

```powershell
Get-Content -Raw 'C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md'
```

Results:

- Exit code `0`; memory file was read successfully.
- The stored summary confirms the last run was blocked before commit/push by `git add` failing to write into `.git/objects`.
- No new repository mutations were made by this read.

Error text: none.

Status: prior blocked state confirmed from automation memory. Next action: inspect live repository status and remote configuration for the current run.

## 2026-06-03 - Checked current time, git status, and remote

Action: captured the current run timestamp and verified branch state plus `origin` URLs before any new staging attempt.

Commands / code used:

```powershell
Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
git status --short --branch
git remote -v
```

Results:

- `Get-Date -Format "yyyy-MM-dd HH:mm:ss K"`: exit code `0`; returned `2026-06-03 08:52:27 +03:00`.
- `git status --short --branch`: exit code `0`; returned `## main...origin/main` and `MM docs/crm-sql-work-log-2026-06-01.md`.
- `git remote -v`: exit code `0`; `origin` fetch and push both point to `https://github.com/1973zahar/SQL.git`.

Error text: none.

Status: repo remains on `main` with only the work log modified and staged/unstaged. Next action: run safety checks on staged diff health, ignored files, large files, and likely secret patterns.

## 2026-06-03 - Ran safety checks on staged diff, ignored files, large files, and likely secrets

Action: validated the staged patch, checked for ignored/cache noise, scanned for oversized files, reviewed likely-secret pattern hits, and rechecked `.git\objects` metadata before any new staging attempt.

Commands / code used:

```powershell
git diff --cached --check
git status --ignored --short
git diff --cached --stat
Get-ChildItem -Recurse -File | Where-Object { $_.Length -ge 50MB } | Select-Object FullName,@{Name='SizeMB';Expression={[math]::Round($_.Length/1MB,2)}}
rg -n --hidden -S --glob '!/.git' --glob '!**/*.png' --glob '!**/*.jpg' --glob '!**/*.zip' --glob '!**/*.bak' "(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}|xox[baprs]-[A-Za-z0-9-]+|-----BEGIN (RSA|DSA|EC|OPENSSH|PGP|PRIVATE KEY)-----|password\s*[:=]|pwd\s*[:=]|secret\s*[:=]|token\s*[:=]|api[_-]?key\s*[:=]|client[_-]?secret\s*[:=])" .
Get-Item '.git\objects' | Select-Object FullName,Attributes,Mode,LastWriteTime
```

Results:

- `git diff --cached --check`: exit code `0`; no whitespace or patch-format problems detected in the staged content.
- `git status --ignored --short`: exit code `0`; only `MM docs/crm-sql-work-log-2026-06-01.md` is reported, with no ignored/cache-file noise.
- `git diff --cached --stat`: exit code `0`; staged diff contains only `docs/crm-sql-work-log-2026-06-01.md` with `140 insertions`.
- Large-file scan: exit code `0`; no files at or above `50MB` were returned.
- Secret-pattern scan: exit code `0`; matches are limited to documented password placeholders, argument names, and tracked demo credentials already present under `dist`, `docs`, `README`, and scripts.
- `.git\objects` metadata: exit code `0`; path remains `D:\Codex\CRM\SQL\.git\objects` with mode `d-----` and last write `2026-06-03 08:51:47`.

Error text: none.

Status: safety checks found no new sync blockers beyond the existing Git object-database write-path concern. Next action: test whether `git add` can update the work log index in the current run.

## 2026-06-03 - Rechecked automation memory path handling and repo baseline

Action: retried the automation memory read for the current run, recorded the failed `$CODEX_HOME`-based lookup, then verified the live branch and remote state from the repository.

Commands / code used:

```powershell
$mem = Join-Path $env:CODEX_HOME 'automations/sql-github-auto-sync/memory.md'; if (Test-Path $mem) { Get-Content -LiteralPath $mem -Raw }
if (Test-Path 'C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md') { Get-Content -LiteralPath 'C:\Users\User\.codex\automations\sql-github-auto-sync\memory.md' -Raw } else { '' }
git status --short --branch
git remote -v
```

Results:

- `$CODEX_HOME`-based memory lookup: exit code `1`; failed because `$env:CODEX_HOME` is null in this shell session.
- Explicit-path memory read: exit code `0`; confirmed the prior run stopped on `.git\objects` write-permission failure during `git add`.
- `git status --short --branch`: exit code `0`; current state is `## main...origin/main` with `M  docs/crm-sql-work-log-2026-06-01.md`, meaning the work log is staged and there is no unstaged diff yet.
- `git remote -v`: exit code `0`; `origin` fetch and push both still target `https://github.com/1973zahar/SQL.git`.

Error text:

- `Join-Path : Cannot bind argument to parameter 'Path' because it is null.`
- `Test-Path : Cannot bind argument to parameter 'Path' because it is null.`

Status: prior blocked context reconfirmed and live baseline captured. Next action: rerun staged diff, ignored-file, large-file, and secret checks before attempting any Git write.

## 2026-06-03 - Verified current staged diff, ignored files, large files, and likely secrets

Action: inspected the current cached diff, confirmed there is no unstaged patch, checked ignored-file output, rescanned for oversized files and likely secrets, and rechecked `.git\objects` metadata.

Commands / code used:

```powershell
git diff --cached --stat
git diff --stat
git diff --cached --check
git status --ignored --short
Get-ChildItem -Recurse -File | Where-Object { $_.Length -ge 50MB } | Select-Object FullName,@{Name='SizeMB';Expression={[math]::Round($_.Length/1MB,2)}}
Get-Item '.git\objects' | Select-Object FullName,Attributes,Mode,LastWriteTime
rg -n --hidden -S --glob '!/.git' --glob '!**/*.png' --glob '!**/*.jpg' --glob '!**/*.zip' --glob '!**/*.bak' "(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}|xox[baprs]-[A-Za-z0-9-]+|-----BEGIN (RSA|DSA|EC|OPENSSH|PGP|PRIVATE KEY)-----|password\s*[:=]|pwd\s*[:=]|secret\s*[:=]|token\s*[:=]|api[_-]?key\s*[:=]|client[_-]?secret\s*[:=])" .
git diff --cached --name-only
git diff --cached -- docs/crm-sql-work-log-2026-06-01.md
```

Results:

- `git diff --cached --stat`: exit code `0`; staged content is only `docs/crm-sql-work-log-2026-06-01.md` with `389 insertions`.
- `git diff --stat`: exit code `0`; no unstaged diff was returned.
- `git diff --cached --check`: exit code `0`; cached patch is whitespace-clean and has no patch-format issues.
- `git status --ignored --short`: exit code `0`; output is `M  docs/crm-sql-work-log-2026-06-01.md`, with no ignored/cache-file noise.
- Large-file scan: exit code `0`; no files at or above `50MB` were found.
- `.git\objects` metadata: exit code `0`; path is `D:\Codex\CRM\SQL\.git\objects`, mode remains `d-----`, last write time is `2026-06-03 08:53:41`.
- Secret-pattern scan: exit code `0`; matches remain limited to documented placeholders, setup arguments, and existing demo credentials already tracked in the repository.
- `git diff --cached --name-only`: exit code `0`; only `docs/crm-sql-work-log-2026-06-01.md` is staged.
- Cached diff inspection: exit code `0`; staged additions are work-log entries only.

Error text: none.

Status: current content is still safe to commit; the remaining risk is the repository write path inside `.git`. Next action: append these current-run log entries, then retry `git add` on the work log and continue only if Git can write to `.git\objects`.

## 2026-06-03 - Restaging failed again on `.git\objects`

Action: tried to stage the newly appended work-log entries and rechecked branch status immediately after the Git write failed.

Commands / code used:

```powershell
git add -- "docs/crm-sql-work-log-2026-06-01.md"
git status --short --branch
```

Results:

- `git add -- "docs/crm-sql-work-log-2026-06-01.md"`: exit code `1`; Git again failed before commit because it could not add a new object to `.git\objects`.
- `git status --short --branch`: exit code `0`; repository state is now `## main...origin/main` with `MM docs/crm-sql-work-log-2026-06-01.md`, meaning the older staged copy remains while the newly appended log entries are unstaged.

Error text:

- `warning: in the working copy of 'docs/crm-sql-work-log-2026-06-01.md', LF will be replaced by CRLF the next time Git touches it`
- `error: insufficient permission for adding an object to repository database .git/objects`
- `error: docs/crm-sql-work-log-2026-06-01.md: failed to insert into database`
- `error: unable to index file 'docs/crm-sql-work-log-2026-06-01.md'`
- `fatal: updating files failed`

Status: sync is blocked again at the staging step, so no new `git diff --cached --check`, commit, or push was attempted after this failure. Next action: stop without forcing changes; fix repository write permissions or any lock affecting `.git\objects`, then rerun the sync automation.
## 2026-06-03 - Ubuntu and MESER connection restored

Action: user reported that Ubuntu is available again and there is now a connection to MESER.

Current state:

- Previous blocker was loss of Ubuntu access and Windows-side timeout to `192.168.0.166`.
- User now indicates the Ubuntu/MESER access problem is resolved.
- The next meaningful action is to run the latest GitHub code on Ubuntu, restart the viewer, and verify `crm-1c-viewer.service` exposes `/health` with build `2026-06-02-product-folder-columns-3`.

Status: restored access reported by user. Next action: provide Ubuntu-only commands for pull/restart/health/import verification.

## 2026-06-03 - User asks how to connect to MESER from PowerShell

Action: user asked `до месер як підєднатись у повершел ?`.

Commands:

```powershell
rg -n "MESER|MESER-D|WinRM|Enter-PSSession|New-PSSession|\\\\|CRM-Exports|D:\\CRM|Exports|PowerShell Remoting|RDP|mstsc|ssh" docs scripts dist README.md
git status --short --branch
git log --oneline -3
rg -n -C 3 "PowerShell remoting session|\[192\.168\.0\.5\]|Enter-PSSession|New-PSSession|192\.168\.0\.5|MESER `192\.168\.0\.5`" docs\crm-sql-work-log-2026-06-01.md docs\crm-sql-architecture-summary-2026-06-02.md README.md docs\one-c-automation.md
git status --short --branch
```

Results:

- First `rg`: exit code `0`; docs identify MESER as Windows host `192.168.0.5`, export folder `D:\CRM\Exports`, and previous use of PowerShell remoting session prompt `[192.168.0.5]: PS ...`.
- `git status --short --branch`: exit code `0`; local branch was `main...origin/main [ahead 1]` because commit `4939d0b` had not yet been pushed.
- `git log --oneline -3`: exit code `0`; latest local commit is `4939d0b Log restored Ubuntu MESER connection`.
- Second targeted `rg`: exit code `1`; failed due PowerShell parser error from complex quoting/backtick in the regex string.
- Final `git status --short --branch`: exit code `0`; still `main...origin/main [ahead 1]`.

Status: partial success. Next action: rerun a simpler targeted search, then answer with the MESER PowerShell Remoting command and push pending logs.

## 2026-06-03 - MESER PowerShell connection command confirmed

Action: reran a simpler targeted search to confirm MESER PowerShell Remoting details.

Commands:

```powershell
rg -n -C 3 "Enter-PSSession|New-PSSession|192\.168\.0\.5|PowerShell remoting session|\[192\.168\.0\.5\]" docs\crm-sql-work-log-2026-06-01.md docs\crm-sql-architecture-summary-2026-06-02.md README.md docs\one-c-automation.md
git status --short --branch
```

Results:

- `rg`: exit code `0`; confirmed:
  - MESER is Windows host `192.168.0.5`.
  - WinRM port `5985` was the intended path.
  - Prior working prompt looked like `[192.168.0.5]: PS ...`.
  - Correct remoting user from earlier notes is `fresh\zahar`.
  - Correct connection command is `Enter-PSSession -ComputerName 192.168.0.5 -Credential $cred` after TrustedHosts is configured.
- `git status --short --branch`: exit code `0`; local branch is ahead of origin by one commit and work log has unstaged changes.

Status: successful. Next action: commit/push log updates, then provide the PowerShell-only command block to connect to MESER.

## 2026-06-03 - Push blocked by policy and terminal roles clarified

Action: attempted to push pending log commits, then user clarified they are opening three separate PowerShell windows:

1. Ubuntu through VPN.
2. MESER through VPN.
3. This local computer.

Tool/command attempted:

```powershell
git push origin main
```

Result:

- Tool rejected the external GitHub push before command execution.
- Reason: logs/docs contain private infrastructure details about MESER/Ubuntu, and the destination GitHub repository was not verified by policy as a trusted internal destination.
- No workaround attempted.

Operational correction:

- Treat the three windows as separate environments:
  - Ubuntu window: Bash commands only, prompt should look like `crmadmin@crm-sql:~/SQL$`.
  - MESER window: remote Windows PowerShell commands only, prompt should look like `[192.168.0.5]: PS ...`.
  - Local computer window: local Windows PowerShell commands only, prompt should look like `PS C:\...>`.
- Do not paste Ubuntu Bash into MESER/local PowerShell.
- Do not paste MESER PowerShell into Ubuntu Bash.

Status: local log updated. Next action: provide a concise command map for all three windows and ask for explicit approval before any further GitHub push containing private infrastructure logs.
## 2026-06-03 - Work resumed with three prepared terminals

Action: user reported that everything is ready and work can continue.

Current operating model:

- Ubuntu terminal through VPN: run Ubuntu Bash commands only.
- MESER terminal through VPN: run remote Windows PowerShell commands only.
- Local computer terminal: run local Windows PowerShell commands only.

Important GitHub status:

- Local repository has pending log commits ahead of `origin/main`.
- Previous push attempt containing private infrastructure log details was blocked by policy.
- No further GitHub push will be attempted without explicit approval acknowledging that private MESER/Ubuntu infrastructure details may be published to `1973zahar/SQL`.

Status: ready to continue operational verification. Next action: provide command blocks for MESER export HTTP, Ubuntu viewer/import verification, and local browser/API verification.
## 2026-06-03 - MESER step-by-step mode: current confirmed state

Action: user requested slow step-by-step work with confirmation after each step and provided a MESER PowerShell screenshot.

Observed MESER prompt:

```text
[192.168.0.5]: PS C:\Users\zahar\Documents>
```

Confirmed from screenshot:

- The user is connected to MESER through PowerShell Remoting.
- `Get-Location` returned `C:\Users\zahar\Documents`.
- `Test-Path 'D:\CRM\Exports'` returned `True`.
- `Test-Path 'D:\CRM\Exports\start-crm-export-http-server.ps1'` returned `True`.
- `Get-NetTCPConnection -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue` showed no visible listener output.
- `curl.exe` is not available on MESER, so MESER-side HTTP checks should use `Invoke-WebRequest`.

Local commands:

```powershell
Get-Content scripts\windows\start-crm-export-http-server.ps1 -TotalCount 60
git status --short --branch
```

Results:

- `Get-Content`: exit code `0`; confirmed script parameters are `-Root`, `-Port`, and `-BindPrefix`, with default root `D:\CRM\Exports` and port `8090`.
- `git status --short --branch`: exit code `0`; local repo remains ahead of origin by 4 commits because GitHub push with private infrastructure logs is blocked/pending approval.

Status: MESER connection and files confirmed; HTTP export server is not yet confirmed listening. Next action: ask user to run exactly one MESER command block to start the HTTP export server and verify listener.
## 2026-06-03 - MESER export HTTP listener confirmed

Action: user executed the first step-by-step MESER command block in the remote PowerShell session.

MESER commands executed by user:

```powershell
Start-Process powershell.exe -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy','Bypass',
  '-File','D:\CRM\Exports\start-crm-export-http-server.ps1',
  '-Root','D:\CRM\Exports',
  '-Port','8090'
) -WindowStyle Hidden

Start-Sleep -Seconds 3

Get-NetTCPConnection -LocalPort 8090 -State Listen -ErrorAction SilentlyContinue
```

Observed result from screenshot:

```text
LocalAddress LocalPort RemoteAddress RemotePort State  OwningProcess
------------ --------- ------------- ---------- -----  -------------
::           8090      ::            0          Listen 4
```

Result: success. MESER export HTTP server is listening on port `8090`; the listener is bound to `::`, which should accept local MESER HTTP requests and may also accept IPv4/IPv6 depending on Windows listener/network policy.

Local log-support commands:

```powershell
Get-Content docs\crm-sql-work-log-2026-06-01.md -Tail 45
git status --short --branch
```

Local log-support results:

- `Get-Content`: exit code `0`; confirmed the previous MESER step-by-step log entry.
- `git status --short --branch`: exit code `0`; repo was `## main...origin/main [ahead 5]` before this new log entry.

Status: MESER export listener confirmed. Next action: verify the HTTP endpoint from inside MESER using PowerShell-native `Invoke-WebRequest`, because `curl.exe` is not installed on MESER.
## 2026-06-03 - MESER local HTTP export endpoint returned 200

Action: user executed the second step-by-step MESER HTTP check and reported that the status is `200`.

MESER command requested:

```powershell
Invoke-WebRequest -UseBasicParsing -Method Head -Uri 'http://127.0.0.1:8090/1c_products.csv' -TimeoutSec 10 | Select-Object StatusCode,StatusDescription
```

Observed result from user report:

```text
StatusCode: 200
```

Result: success. The MESER export HTTP server is not only listening on port `8090`; it also serves `1c_products.csv` successfully from MESER-local `127.0.0.1`.

Local log-support commands:

```powershell
Get-Content docs\crm-sql-work-log-2026-06-01.md -Tail 55
git status --short --branch
```

Local log-support results:

- `Get-Content`: exit code `0`; confirmed the previous listener log entry.
- `git status --short --branch`: exit code `0`; repo was `## main...origin/main [ahead 6]` before this new log entry.

Status: MESER local export endpoint confirmed. Next action: verify from Ubuntu that the import host can reach `http://192.168.0.5:8090/1c_products.csv` through the VPN/network path.
