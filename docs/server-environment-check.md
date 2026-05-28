# Перевірка сервера перед розгортанням CRM SQL

Сервер зі скріну:

- Windows Server 2012 R2 Standard
- CPU: Intel Xeon E5620 2.40 GHz
- RAM: 24 GB
- Диск C: близько 17 GB вільно
- Диск D: близько 660 GB вільно
- Домен: `fresh.local`

## Рекомендація по ізоляції

Найкращий варіант: створити окрему віртуальну машину для CRM/PostgreSQL на цьому фізичному сервері.

Так CRM не буде впливати на 1C:

- окрема ОС;
- окремі CPU/RAM ліміти;
- окремий диск або VHDX;
- окремий IP;
- окремі служби;
- окремий firewall;
- простіше робити backup і переносити систему.

Мінімальні ресурси для стартової VM:

- CPU: 2 vCPU;
- RAM: 6-8 GB;
- Disk: 100-150 GB на D:;
- OS: бажано Windows Server 2019/2022 або Linux Ubuntu Server LTS;
- PostgreSQL: 16 або 15.

Якщо VM створити неможливо, другий варіант: встановити PostgreSQL прямо на сервер, але тільки з ізоляцією:

- дані PostgreSQL зберігати на `D:\CRM\PostgreSQL\data`;
- порт використовувати не стандартний `5432`, а наприклад `55432`;
- створити окремого Windows-користувача для служби PostgreSQL;
- не використовувати користувачів 1C;
- не ставити PostgreSQL у папки 1C;
- відкрити firewall тільки для IP, яким потрібен доступ.

## Команди для перевірки сервера

Відкрити PowerShell від адміністратора.

### 1. Інформація про ОС

```powershell
systeminfo
```

Потрібно перевірити:

- версію Windows;
- дату останнього перезавантаження;
- обсяг RAM;
- домен;
- чи немає дуже старих оновлень.

### 2. CPU і RAM

```powershell
Get-WmiObject Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors
```

```powershell
Get-WmiObject Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory
```

### 3. Диски

```powershell
Get-WmiObject Win32_LogicalDisk -Filter "DriveType=3" |
Select-Object DeviceID,VolumeName,
@{Name="SizeGB";Expression={[math]::Round($_.Size/1GB,2)}},
@{Name="FreeGB";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
```

Для CRM краще використовувати диск `D:`, бо на `C:` мало місця.

### 4. Чи зайнятий порт PostgreSQL

```powershell
netstat -ano | findstr ":5432"
```

```powershell
netstat -ano | findstr ":55432"
```

Якщо порт `5432` вже зайнятий або є ризик конфлікту, для CRM краще використати `55432`.

### 5. Служби 1C і SQL

```powershell
Get-Service | Where-Object {
  $_.Name -match "1C|postgres|sql|mssql" -or $_.DisplayName -match "1C|PostgreSQL|SQL"
} | Select-Object Name,DisplayName,Status,StartType
```

Це покаже, чи вже є PostgreSQL, MSSQL або служби 1C.

### 6. Перевірити Hyper-V

```powershell
Get-WindowsFeature Hyper-V
```

Якщо `Install State` = `Installed`, можна створити окрему VM на цьому сервері.

Якщо команда не працює або Hyper-V не встановлений:

```powershell
systeminfo | findstr /i "Hyper-V"
```

### 7. Перевірити мережу

```powershell
ipconfig /all
```

Потрібно знати:

- IP сервера;
- gateway;
- DNS;
- домен;
- чи є окремий IP для майбутньої CRM VM.

### 8. Перевірити firewall

```powershell
Get-NetFirewallRule | Where-Object DisplayName -match "PostgreSQL|CRM|5432|55432"
```

Якщо `Get-NetFirewallRule` недоступний на старій системі, використати:

```powershell
netsh advfirewall firewall show rule name=all | findstr /i "PostgreSQL CRM 5432 55432"
```

## Де створювати SQL

Не створювати базу CRM всередині 1C або в папках 1C.

Рекомендовано:

```text
D:\CRM\PostgreSQL\data
D:\CRM\backups
D:\CRM\logs
```

Назва бази:

```text
crm_hub
```

Порт:

```text
55432
```

Користувач:

```text
crm_admin
```

## Що потрібно від адміністратора сервера

Перед розгортанням треба отримати:

- чи можна створити окрему VM;
- скільки RAM можна виділити під CRM;
- скільки CPU можна виділити;
- чи можна виділити 100-150 GB на диску D:;
- який IP буде у CRM-середовища;
- чи є backup цього сервера;
- які IP мають право підключатися до PostgreSQL;
- чи 1C використовує PostgreSQL, MSSQL або файлову базу.

## Мінімальне рішення для старту

Якщо треба швидко і без ризику для 1C:

1. Створити VM `CRM-SQL`.
2. Виділити 2 vCPU, 8 GB RAM, 150 GB disk на D:.
3. Встановити PostgreSQL у VM.
4. Відкрити порт `55432` тільки для потрібних IP.
5. Розгорнути базу `crm_hub`.
6. Налаштувати щоденний backup.

Це найчистіший варіант, бо 1C і CRM будуть розділені.
