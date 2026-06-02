# 1C -> PostgreSQL Automation Runbook

Date: 2026-06-01

## Purpose

This setup keeps a read-only mirror of important 1C data in PostgreSQL for future CRM import and analysis.

Data flow:

1. MESER `192.168.0.5` exports CSV files from 1C into `D:\CRM\Exports`.
2. MESER serves those files through HTTP on `http://192.168.0.5:8090`.
3. Ubuntu `192.168.0.166` imports CSV files into PostgreSQL database `crm_hub`.
4. Viewer shows imported data from PostgreSQL at `http://192.168.0.166:8091/`.

Do not expose PostgreSQL directly to the internet.

## Important Paths

Local repository:

```text
D:\Codex\CRM\SQL
```

MESER export folder:

```text
D:\CRM\Exports
```

Ubuntu repository:

```text
/home/crmadmin/SQL
```

PostgreSQL schema:

```text
one_c_mirror
```

## MESER Files

Copy these files from local repo to `D:\CRM\Exports` on MESER:

```text
scripts\windows\export-1c-catalogs.ps1
scripts\windows\export-1c-catalogs.vbs
scripts\windows\export-1c-operational-data.ps1
scripts\windows\export-1c-operational-data.vbs
scripts\windows\run-1c-export-now.ps1
scripts\windows\install-1c-export-scheduled-task.ps1
```

MESER uses no-login 1C connection string:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";'
```

Manual export now on MESER:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\run-1c-export-now.ps1'
```

Install hourly MESER export task:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\install-1c-export-scheduled-task.ps1' -RunNow
```

Expected MESER output files include:

```text
D:\CRM\Exports\1c_stock_balances.csv
D:\CRM\Exports\1c_reserved_stock_balances.csv
D:\CRM\Exports\1c_product_prices.csv
D:\CRM\Exports\1c_counterparty_settlements.csv
D:\CRM\Exports\1c_counterparties.csv
D:\CRM\Exports\1c_counterparty_contracts.csv
D:\CRM\Exports\1c_warehouses.csv
D:\CRM\Exports\1c_products.csv
```

## Ubuntu Files

Copy these files to `/home/crmadmin/SQL` on Ubuntu:

```text
scripts/ubuntu/import-1c-catalogs-http.sh
scripts/ubuntu/import-1c-operational-http.sh
scripts/ubuntu/run-1c-import-now.sh
scripts/ubuntu/install-1c-import-systemd-timer.sh
scripts/ubuntu/run-1c-crm-viewer.py
scripts/ubuntu/install-1c-viewer-systemd-service.sh
db/migrations/002_one_c_mirror.sql
db/migrations/003_one_c_crm_ready_views.sql
```

Check Bash syntax on Ubuntu:

```bash
cd ~/SQL
bash -n scripts/ubuntu/run-1c-import-now.sh
bash -n scripts/ubuntu/install-1c-import-systemd-timer.sh
bash -n scripts/ubuntu/install-1c-viewer-systemd-service.sh
```

Manual import now on Ubuntu:

```bash
cd ~/SQL
chmod +x scripts/ubuntu/run-1c-import-now.sh
USE_POSTGRES_SUDO=1 bash scripts/ubuntu/run-1c-import-now.sh
```

Install hourly Ubuntu import timer:

```bash
cd ~/SQL
chmod +x scripts/ubuntu/install-1c-import-systemd-timer.sh
bash scripts/ubuntu/install-1c-import-systemd-timer.sh
```

Manual import after timer installation:

```bash
sudo systemctl start crm-1c-import.service
journalctl -u crm-1c-import.service -n 100 --no-pager
```

Timer status:

```bash
systemctl list-timers crm-1c-import.timer --no-pager
```

## Viewer

Install viewer as a service on Ubuntu.

Choose a private password locally in the terminal. Do not paste the real password into chat.

```bash
cd ~/SQL
chmod +x scripts/ubuntu/install-1c-viewer-systemd-service.sh
VIEWER_PASSWORD='your-private-password' bash scripts/ubuntu/install-1c-viewer-systemd-service.sh
```

Open inside VPN/local network:

```text
http://192.168.0.166:8091/
```

Default user:

```text
admin
```

Viewer service status:

```bash
systemctl status crm-1c-viewer.service --no-pager
```

Viewer logs:

```bash
journalctl -u crm-1c-viewer.service -n 100 --no-pager
```

## Viewer Buttons

`Оновити з SQL`:

- reloads viewer data from PostgreSQL only;
- does not import new CSV files.

`Імпорт зараз`:

- starts `crm-1c-import.service`;
- imports current CSV files from MESER HTTP into PostgreSQL;
- reloads viewer data after import finishes.

Ціни товарів:

- MESER має створити `D:\CRM\Exports\1c_product_prices.csv`;
- Ubuntu імпортує його як `dataset_name = product_prices`;
- PostgreSQL view для перевірки: `one_c_mirror.crm_product_prices`;
- у viewer є окрема вкладка `Ціни` і короткі поля цін у вкладці `Товари`.

Папки товарів:

- MESER exporter додає до `1c_products.csv` поля `product_group_code`, `product_group_name`, `product_group_ref`;
- Ubuntu importer зберігає ці поля в `one_c_mirror.raw_rows.raw_data`;
- PostgreSQL view для товарів: `one_c_mirror.crm_products`;
- список значень для фільтрів/форм: `one_c_mirror.crm_product_folders`;
- у viewer вкладка `Товари` показує папку й код папки, а окрема вкладка `Папки товарів` показує унікальні папки з товарних рядків.

Full immediate refresh from 1C requires:

1. MESER export now.
2. Ubuntu import now.
3. Viewer refresh.

## Do Not Do

- Do not expose PostgreSQL to the internet.
- Do not expose viewer port `8091` publicly without VPN/HTTPS/auth.
- Do not store real passwords in Git.
- Do not add `Usr=` or `Pwd=` to 1C connection string unless there is a verified need.
- Do not treat `reserved_stock_balances = 0` as an error by itself.
- Do not edit imported rows in PostgreSQL manually; import should be reproducible from 1C CSV.
