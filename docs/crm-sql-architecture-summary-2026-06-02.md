# CRM SQL 1C: підсумок для продовження роботи

Дата підсумку: 2026-06-02

Цей файл треба вставити або прикріпити на початку нового чату. Робота стосується синхронізації даних з 1C у PostgreSQL для майбутньої CRM, B2B/B2C, маркетплейсів і сайту продажів.

## Поточна архітектура

Є два основні сервери:

1. MESER / 1C Windows server: `192.168.0.5`
   - 1C база: `Srvr="192.168.0.5";Ref="elista";`
   - Вхід у 1C для експорту працював без логіна і пароля.
   - Робоча папка експорту: `D:\CRM\Exports`
   - HTTP-сервер експорту CSV: `http://192.168.0.5:8090`
   - Скрипт HTTP-сервера: `D:\CRM\Exports\start-crm-export-http-server.ps1`
   - Основні Windows-скрипти експорту:
     - `D:\CRM\Exports\run-1c-export-now.ps1`
     - `D:\CRM\Exports\export-1c-catalogs.ps1`
     - `D:\CRM\Exports\export-1c-catalogs.vbs`
     - `D:\CRM\Exports\export-1c-operational-data.ps1`
     - `D:\CRM\Exports\export-1c-operational-data.vbs`
     - `D:\CRM\Exports\check-meser-1c-export-state.ps1`
     - `D:\CRM\Exports\install-1c-export-scheduled-task.ps1`

2. Ubuntu / PostgreSQL server: `192.168.0.166`
   - Репозиторій: `/home/crmadmin/SQL`
   - База даних: `crm_hub`
   - Робочий користувач: `crmadmin`
   - PostgreSQL команди виконуються через:
     `sudo -u postgres psql -d crm_hub`
   - Імпорт бере CSV з MESER через:
     `http://192.168.0.5:8090`
   - Основні Ubuntu-скрипти:
     - `/home/crmadmin/SQL/scripts/ubuntu/import-1c-catalogs-http.sh`
     - `/home/crmadmin/SQL/scripts/ubuntu/import-1c-operational-http.sh`
     - `/home/crmadmin/SQL/scripts/ubuntu/run-1c-import-now.sh`
     - `/home/crmadmin/SQL/scripts/ubuntu/run-1c-crm-viewer.py`
     - `/home/crmadmin/SQL/scripts/ubuntu/install-1c-import-systemd-timer.sh`
     - `/home/crmadmin/SQL/scripts/ubuntu/install-1c-viewer-systemd-service.sh`

Локальний репозиторій Codex:

- `D:\Codex\CRM\SQL`
- Windows-скрипти: `D:\Codex\CRM\SQL\scripts\windows`
- Ubuntu-скрипти: `D:\Codex\CRM\SQL\scripts\ubuntu`
- SQL-міграції: `D:\Codex\CRM\SQL\db\migrations`
- Документація і журнали: `D:\Codex\CRM\SQL\docs`

## Що вже зроблено

Створено read-only експорт з 1C у CSV, без запису назад у 1C.

Експортуються і завантажуються в SQL:

- товари: `1c_products.csv`
- ціни товарів: `1c_product_prices.csv`
- залишки товарів по складах: `1c_stock_balances.csv`
- резерви товарів: `1c_reserved_stock_balances.csv`
- взаєморозрахунки / сальдо контрагентів: `1c_counterparty_settlements.csv`
- довідники: одиниці, контрагенти, договори, склади, валюти, типи цін, групи товарів, види номенклатури, серії, організації, фізичні особи, банківські рахунки, види контактної інформації та інші.

У PostgreSQL створено схему `one_c_mirror`:

- `raw_rows` для довідників
- `operational_rows` для залишків, резервів, взаєморозрахунків і цін
- `latest_rows`
- `latest_operational_rows`
- CRM-ready views для майбутньої CRM.

Основні CRM-ready views:

- `one_c_mirror.crm_products`
- `one_c_mirror.crm_product_prices`
- `one_c_mirror.crm_product_price_summary`
- `one_c_mirror.crm_stock_balances`
- `one_c_mirror.crm_counterparty_settlements`
- `one_c_mirror.crm_counterparty_balance_summary`
- `one_c_mirror.crm_reference_items`
- `one_c_mirror.crm_reference_catalog_summary`
- окремі довідникові views для складів, контрагентів, договорів, валют, типів цін, одиниць, груп товарів, банківських рахунків тощо.

Останні відомі контрольні кількості:

- `crm_products`: приблизно `11950-11960`
- товари з цінами: `6786`
- `crm_product_prices`: `28424`
- `crm_product_price_summary`: `6786`
- `crm_reference_items`: `62244`
- `crm_stock_balances`: `2259`
- `crm_counterparty_settlements`: `413`
- `crm_counterparties`: `9105`
- `crm_counterparty_contracts`: `10693`
- `crm_units`: `11824`
- `crm_warehouses`: `45`
- `crm_price_types`: `18`
- `crm_currencies`: `12`

Створено переглядалку:

- сервіс: `crm-1c-viewer.service`
- адреса у мережі/VPN: `http://192.168.0.166:8091/`
- користувач: `admin`
- пароль зберігається у `/etc/crm-1c-viewer.env`
- пароль не друкувати у чат і не вставляти у відкритий текст.

Створено автоматизацію:

- Ubuntu timer: `crm-1c-import.timer`
- Ubuntu service: `crm-1c-import.service`
- ручний запуск імпорту:
  `cd ~/SQL && sudo systemctl start crm-1c-import.service`
- перегляд логів:
  `journalctl -u crm-1c-import.service -n 220 --no-pager`

На MESER створено/налаштовано Windows-скрипти для ручного і погодинного експорту з 1C.

## Відкриті задачі

1. Нова задача архітектури: товари в 1C лежать у папках. Треба зробити папку реквізитом товару.
   - Для кожного товару треба вивантажити окремі поля:
     - `parent_ref`
     - `parent_code`
     - `parent_name`
     - можливо `is_folder`
   - Папка має бути окремим унікальним реквізитом / довідником, щоб у CRM її можна було вибирати.
   - Це треба додати в експорт `Номенклатура`, імпорт SQL, views і переглядалку.

2. Доробити стабільну синхронізацію цін.
   - Ціни вже експортуються у `1c_product_prices.csv`.
   - У SQL є `crm_product_prices` і `crm_product_price_summary`.
   - Треба перевірити, що погодинний імпорт стабільно підтягує ціни разом з товарами.

3. Доробити переглядалку для аналізу з різних комп'ютерів.
   - Має показувати вкладки: товари, ціни, залишки, контрагенти, борги, довідники.
   - Має бути read-only.
   - Доступ ззовні краще робити через VPN або контрольований тунель, не відкривати PostgreSQL напряму в інтернет.

4. Максимально наповнити SQL реальними даними з 1C для майбутньої CRM:
   - товари
   - папки/групи товарів
   - ціни
   - залишки
   - резерви
   - контрагенти
   - договори
   - взаєморозрахунки
   - склади
   - валюти
   - типи цін
   - одиниці виміру
   - банківські рахунки
   - контактні дані
   - організації
   - фізичні особи

## Помилки і що не робити

Не виконувати Linux-команди прямо у Windows PowerShell. Старий PowerShell не приймає `&&` як розділювач команд. Спочатку треба зайти в Ubuntu через SSH, потім виконувати Linux-команди.

Не запускати `scp` або `ssh` всередині віддаленої PowerShell-сесії MESER. Копіювання файлів на Ubuntu треба робити з локального Windows PowerShell.

Не друкувати паролі. Для перевірки достатньо показати користувача або довжину пароля.

Не відкривати PostgreSQL напряму в інтернет. Для доступу ззовні використовувати VPN, SSH tunnel, Cloudflare named tunnel або інший контрольований варіант.

Cloudflare quick tunnel без акаунта вже пробувався і дав timeout до `api.trycloudflare.com`. Для стабільної роботи потрібен нормальний named tunnel або VPN.

Якщо з Ubuntu `curl http://192.168.0.5:8090/...` зависає або timeout, це означає, що на MESER не запущений HTTP-сервер експорту. Треба запустити `D:\CRM\Exports\start-crm-export-http-server.ps1`.

Якщо `crm_reference_items` або `price_summary` не існує, значить SQL-міграція `003_one_c_crm_ready_views.sql` не застосована або стара версія файлу. Треба оновити файл і застосувати міграцію.

Якщо PostgreSQL пише `Permission denied` на SQL-файл міграції, треба виправити права доступу або запускати міграцію з доступного для postgres шляху.

## Наступні кроки

1. Оновити експорт `Номенклатура` на MESER:
   - файл: `D:\CRM\Exports\export-1c-catalogs.vbs`
   - додати для товарів поля папки:
     - `parent_ref`
     - `parent_code`
     - `parent_name`
     - `is_folder`

2. Оновити локальні файли в репозиторії:
   - `D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.vbs`
   - `D:\Codex\CRM\SQL\db\migrations\003_one_c_crm_ready_views.sql`
   - за потреби `D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-crm-viewer.py`

3. Скопіювати оновлені Windows-файли на MESER у `D:\CRM\Exports`.

4. Запустити на MESER ручний експорт:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\CRM\Exports\run-1c-export-now.ps1`

5. Перевірити, що `1c_products.csv` містить поля папки товару.

6. На Ubuntu запустити імпорт:
   `cd ~/SQL && sudo systemctl start crm-1c-import.service`

7. Перевірити SQL:
   - товари
   - папки товарів
   - ціни
   - залишки
   - взаєморозрахунки

8. Оновити переглядалку, щоб папка товару була видима як окрема колонка і фільтр.

9. Оновити робочий журнал:
   `D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md`
