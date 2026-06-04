# CRM SQL new chat handoff - 2026-06-04

This file is the start point for continuing the CRM SQL / 1C mirror work in a new chat.

## First message for the new chat

Use this text to start the new chat:

```text
Прочитай файл D:\Codex\CRM\SQL\docs\crm-sql-new-chat-handoff-2026-06-04.md і продовжуй з того самого місця. Працюй повільно, покроково, завжди пиши в якому вікні виконувати команду: Вікно 1 - убунту, Вікно 2 - месер, Вікно 3 - локальний. Після кожної дії записуй команду і результат у D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md. Нічого не стирай, тільки додавай і перевіряй.
```

## Critical rules

- Work slowly, step by step, with confirmation after each step.
- Always say which window is used:
  - `Вікно 1 - убунту`: SSH server `crmadmin@192.168.0.166`, project path `~/SQL`.
  - `Вікно 2 - месер`: PowerShell Remoting to Windows Server `192.168.0.5`, prompt starts with `[192.168.0.5]:`.
  - `Вікно 3 - локальний`: local Windows PC, hostname `ZakHP`.
- After every successful or failed action, append the command/code and result to:
  `D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md`
- Use append-only logging:

```powershell
$log = 'D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md'
$entry = @'
...command, result, next step...
'@
Add-Content -Path $log -Value $entry -Encoding UTF8
```

## Current task

We added a second 1C company to the same CRM mirror without deleting the first company:

- `elista` / `ЕЛІСТА`
- `pp_hor` / `ФОП Служалий З.М.`

The viewer and SQL must work as one system and identify which company each row came from.

## Current confirmed state

### MESER export server

Window: `Вікно 2 - месер`

The 1C base for the second company is:

```text
Srvr="192.168.0.5";Ref="pp_hor";
```

Catalog export for `pp_hor` was completed:

```text
1c_products.csv rows=20678
folders_in_products=517
products_or_folders_with_parent=20668
1c_products.csv header includes:
row_no;external_ref;code;name;deletion_mark;is_group;product_group_ref;product_group_code;product_group_name
```

Operational export for `pp_hor` was completed:

```text
stock_balances rows=2890
reserved_stock_balances rows=0
counterparty_settlements rows=259
product_prices rows=54234
```

MESER HTTP server on port `8090` was restarted and confirmed:

```text
http://127.0.0.1:8090/1c_products.csv -> 200 OK
http://192.168.0.5:8090/1c_products.csv from Ubuntu -> 200 OK
```

### Ubuntu database/import state

Window: `Вікно 1 - убунту`

Schema migrations were applied after dropping only `one_c_mirror` views, not data tables.

Enterprise columns now exist in all required tables:

```text
one_c_mirror.import_batches: enterprise_code, enterprise_name, enterprise_ref
one_c_mirror.raw_rows: enterprise_code, enterprise_name, enterprise_ref
one_c_mirror.operational_batches: enterprise_code, enterprise_name, enterprise_ref
one_c_mirror.operational_rows: enterprise_code, enterprise_name, enterprise_ref
```

Catalog import for `pp_hor` initially wrote batch metadata as `elista`. This was fixed by updating only metadata for the 19 catalog batches from `2026-06-04 11:40:14+00` through `2026-06-04 11:40:53+00`.

Fix result:

```text
batches_updated=19
raw_rows_updated=51232
```

Current product totals after fix:

```text
enterprise_code | enterprise_name    | products_total | folders_total | with_group | with_group_path | with_full_path
elista          | ЕЛІСТА             | 12013          | 330           | 11938      | 11938           | 12009
pp_hor          | ФОП Служалий З.М.  | 20678          | 517           | 20413      | 20413           | 20423
```

Operational import state:

```text
elista counterparty_settlements rows=413 amount=-86783595.06
elista product_prices rows=28424 amount=36881665.15
elista stock_balances rows=2259 quantity=1605332.027
pp_hor counterparty_settlements rows=259 amount=6922610.74
pp_hor product_prices rows=54234 amount=10393949.95
pp_hor stock_balances rows=2890 quantity=57364.000
```

Deep folder paths for `pp_hor` were verified. Example level 5-6 paths exist for products and folders:

```text
ПНЕВМАТИКА, АКСЕСУАРИ та ІНШЕ / ІНШЕ / Догляд за зброєю / Масла / Ballistol / ...
ОДЯГ І ВЗУТТЯ / НАШ ІМПОРТ / Одяг (НАШ ІМПОРТ) / ALPHA / ALPHA EUROPE / ...
```

### Viewer state

Window: `Вікно 1 - убунту`

Viewer file has build marker:

```text
VIEWER_BUILD = "2026-06-03-multi-company-enterprise-1"
```

Viewer service was restarted and confirmed active:

```bash
cd ~/SQL
sudo systemctl restart crm-1c-viewer.service
sleep 5
systemctl is-active crm-1c-viewer.service
pid=$(systemctl show -p MainPID --value crm-1c-viewer.service)
echo "MainPID=$pid"
```

Last result:

```text
active
MainPID=71682
```

## Important implementation details

- `crm_products` has `product_group_path`, `product_full_path`, and `product_group_level`.
- `crm_products` does not have `product_group_full_path`.
- `product_group_full_path` belongs to `crm_product_folders`.
- Do not use `product_group_full_path` in queries against `crm_products`.
- `curl: (23) Failure writing output to destination` after piping to `head` is not a data failure. It only means `head` closed the pipe.
- Do not delete old `elista` data. This project is additive.

## Modified files that matter

```text
D:\Codex\CRM\SQL\db\migrations\002_one_c_mirror.sql
D:\Codex\CRM\SQL\db\migrations\003_one_c_crm_ready_views.sql
D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-catalogs-http.sh
D:\Codex\CRM\SQL\scripts\ubuntu\import-1c-operational-http.sh
D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-crm-viewer.py
D:\Codex\CRM\SQL\scripts\ubuntu\run-1c-import-now.sh
D:\Codex\CRM\SQL\scripts\windows\export-1c-catalogs.ps1
D:\Codex\CRM\SQL\scripts\windows\export-1c-operational-data.ps1
D:\Codex\CRM\SQL\scripts\windows\run-1c-export-now.ps1
D:\Codex\CRM\SQL\docs\one-c-catalog-export.md
D:\Codex\CRM\SQL\docs\one-c-mirror-import.md
D:\Codex\CRM\SQL\docs\one-c-operational-export-import.md
D:\Codex\CRM\SQL\docs\crm-sql-work-log-2026-06-01.md
```

## How to enter the three windows

### Вікно 1 - убунту

Run in a normal PowerShell window:

```powershell
ssh crmadmin@192.168.0.166
cd ~/SQL
```

### Вікно 2 - месер

Run in a separate PowerShell window:

```powershell
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "192.168.0.5" -Concatenate -Force
$cred = Get-Credential "fresh\zahar"
Enter-PSSession -ComputerName 192.168.0.5 -Credential $cred
```

After connection, prompt should start with:

```text
[192.168.0.5]: PS C:\Users\zahar\Documents>
```

### Вікно 3 - локальний

Use a third PowerShell window. Verify:

```powershell
hostname
Get-Location
```

Expected hostname:

```text
ZakHP
```

## Exact next step

Continue from here. Use `Вікно 1 - убунту`.

Run the viewer health check:

```bash
pid=$(systemctl show -p MainPID --value crm-1c-viewer.service)
sudo python3 - "$pid" <<'PY'
import base64, sys, urllib.request
pid = sys.argv[1]
env = {}
with open(f"/proc/{pid}/environ", "rb") as f:
    for item in f.read().split(b"\0"):
        if b"=" in item:
            k, v = item.split(b"=", 1)
            env[k.decode("utf-8", "ignore")] = v.decode("utf-8", "ignore")
user = env.get("CRM_VIEWER_USER", "")
password = env.get("CRM_VIEWER_PASSWORD", "")
req = urllib.request.Request("http://127.0.0.1:8091/health")
token = base64.b64encode(f"{user}:{password}".encode()).decode()
req.add_header("Authorization", "Basic " + token)
print(urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace").strip())
PY
```

Expected:

```text
ok
build=2026-06-03-multi-company-enterprise-1
loading=false
```

If it says `loading=true`, wait 60 seconds and run the same command again.

## Next verification after health is OK

Use `Вікно 1 - убунту`.

```bash
pid=$(systemctl show -p MainPID --value crm-1c-viewer.service)
sudo python3 - "$pid" <<'PY'
import base64, sys, time, urllib.request
pid = sys.argv[1]
env = {}
with open(f"/proc/{pid}/environ", "rb") as f:
    for item in f.read().split(b"\0"):
        if b"=" in item:
            k, v = item.split(b"=", 1)
            env[k.decode("utf-8", "ignore")] = v.decode("utf-8", "ignore")
user = env.get("CRM_VIEWER_USER", "")
password = env.get("CRM_VIEWER_PASSWORD", "")
req = urllib.request.Request("http://127.0.0.1:8091/api/data")
token = base64.b64encode(f"{user}:{password}".encode()).decode()
req.add_header("Authorization", "Basic " + token)
started = time.time()
data = urllib.request.urlopen(req, timeout=90).read().decode("utf-8", "replace")
print("seconds", round(time.time() - started, 2))
print("bytes", len(data))
for marker in [
    "2026-06-03-multi-company-enterprise-1",
    "pp_hor",
    "ФОП Служалий З.М.",
    "elista",
    "ЕЛІСТА",
    "product_full_path",
    "product_group_path",
    "product_group_full_path",
]:
    print(marker, "YES" if marker in data else "NO")
PY
```

Expected markers should be `YES`.

## Browser check after API markers

Open:

```text
http://192.168.0.166:8091
```

Check:

- Viewer loads.
- Enterprise selector/filter is visible.
- Both companies are available: `ЕЛІСТА` and `ФОП Служалий З.М.`
- Products view can show combined total around `32691`.
- `pp_hor` products show folder path columns.
- Folder view shows `product_group_full_path`.

## Chat memory note

Exact chat memory percentage is not exposed to the assistant. Context compaction already happened once, so this handoff file and the main work log are the authoritative continuation source.
