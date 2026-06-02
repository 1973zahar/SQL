# Діагностика експорту 1C на MESER

Ця перевірка потрібна, коли на `MESER` незрозуміло:

- які CSV уже є в `D:\CRM\Exports`;
- чи доставлені `export-1c-catalogs.ps1` і `export-1c-catalogs.vbs`;
- чи є `export_1c_catalogs_summary.csv`;
- чи не заблокований запуск відсутнім connection string;
- чи доступний 1C COM connector;
- які очевидні blockers заважають продовжити експорт.

## Якщо скрипт уже перенесений на MESER

Запуск:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'D:\CRM\Exports\check-meser-1c-export-state.ps1' -ExportDir 'D:\CRM\Exports' -RepoDir 'D:\Codex\CRM\SQL'
```

Звіт буде тут:

```text
D:\CRM\Exports\meser_1c_export_state.txt
```

Якщо PowerShell не може записати звіт у `D:\CRM\Exports`, checker автоматично запише його в:

```text
%TEMP%\meser_1c_export_state.txt
```

## Якщо скрипта ще немає на MESER

Можна виконати коротку ручну перевірку прямо в PowerShell. Вона не створює `D:\CRM\Exports`; якщо папки немає, звіт піде в `%TEMP%`.

```powershell
$ExportDir='D:\CRM\Exports'; $RepoDir='D:\Codex\CRM\SQL'; $Report=if(Test-Path $ExportDir){Join-Path $ExportDir 'meser_1c_export_state_quick.txt'}else{Join-Path $env:TEMP 'meser_1c_export_state_quick.txt'}; "Time: $(Get-Date)" | Set-Content $Report -Encoding UTF8; "Computer: $env:COMPUTERNAME" | Tee-Object $Report -Append; "User: $env:USERDOMAIN\$env:USERNAME" | Tee-Object $Report -Append; "Current: $(Get-Location)" | Tee-Object $Report -Append; "ExportDir exists: $(Test-Path $ExportDir)" | Tee-Object $Report -Append; "RepoDir exists: $(Test-Path $RepoDir)" | Tee-Object $Report -Append; "PS exporter in ExportDir: $(Test-Path (Join-Path $ExportDir 'export-1c-catalogs.ps1'))" | Tee-Object $Report -Append; "VBS exporter in ExportDir: $(Test-Path (Join-Path $ExportDir 'export-1c-catalogs.vbs'))" | Tee-Object $Report -Append; "Summary exists: $(Test-Path (Join-Path $ExportDir 'export_1c_catalogs_summary.csv'))" | Tee-Object $Report -Append; "Connection string set: $(-not [string]::IsNullOrWhiteSpace($env:CRM_1C_CONNECTION_STRING))" | Tee-Object $Report -Append; "CSV files:" | Tee-Object $Report -Append; Get-ChildItem $ExportDir -Filter '*.csv' -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize | Tee-Object $Report -Append; "Logs:" | Tee-Object $Report -Append; Get-ChildItem $ExportDir -Filter '*.log' -ErrorAction SilentlyContinue | Sort-Object Name,Length,LastWriteTime | Format-Table -AutoSize | Tee-Object $Report -Append; "Report: $Report"
```

## Як читати результат

Якщо `PS exporter in ExportDir` або `VBS exporter in ExportDir` дорівнює `False`, треба спочатку скопіювати:

```text
export-1c-catalogs.ps1
export-1c-catalogs.vbs
```

у:

```text
D:\CRM\Exports
```

Якщо `Connection string set` дорівнює `False`, треба задати:

```powershell
$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";Usr="<1C_USER>";Pwd="<1C_PASSWORD>";'
```

Якщо summary відсутній, але exporter-файли теж відсутні, це не помилка 1C. Це означає, що новий exporter ще не запускався.
