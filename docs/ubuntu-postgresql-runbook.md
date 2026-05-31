# Ubuntu PostgreSQL runbook для CRM-SQL

Поточні імена середовища:

- Windows Server/Hyper-V host: `MESER`, IP `192.168.0.5`
- Hyper-V VM: `CRM-SQL`
- Ubuntu Server: `crm-sql`, IP `192.168.0.166`
- Ubuntu/Linux користувач: `crmadmin`
- PostgreSQL база: `crm_hub`
- PostgreSQL користувач: `crm_admin`

Не плутати `crmadmin` і `crm_admin`: перший є Linux-користувачем, другий є PostgreSQL-роллю.

Це окрема робоча SQL-база CRM. Docker Compose у цьому репозиторії лишається зручним варіантом для локальної розробки, але серверний шлях для поточного середовища - нативний PostgreSQL у VM `CRM-SQL`.

## 1. Оновити код на Ubuntu VM

На `crm-sql` під користувачем `crmadmin`:

```bash
cd ~
git clone https://github.com/1973zahar/SQL.git
cd SQL
```

Якщо репозиторій вже є:

```bash
cd ~/SQL
git pull --ff-only
```

## 2. Виправити пароль `crm_admin` і завантажити схему

Запустити з кореня репозиторію на Ubuntu:

```bash
cd ~/SQL
chmod +x scripts/ubuntu/*.sh
./scripts/ubuntu/prepare-crm-postgres.sh
```

Скрипт:

- попросить новий пароль для PostgreSQL-користувача `crm_admin`;
- створить роль `crm_admin`, якщо її немає;
- створить базу `crm_hub`, якщо її немає;
- виконає `ALTER ROLE crm_admin ... PASSWORD ...` з `scram-sha-256`;
- перевірить вхід через TCP `127.0.0.1:5432`;
- завантажить `db/init/00_extensions.sql`;
- завантажить `db/migrations/001_core_schema.sql`, якщо схема ще не створена;
- перевиставить owner CRM-об'єктів на `crm_admin`, якщо схему раніше створили під `postgres`;
- покаже перевірку основних таблиць.

Після цього перевірити вручну:

```bash
psql -h 127.0.0.1 -U crm_admin -d crm_hub
```

У `psql`:

```sql
\dn
\dt core.*
\dt integration.*
\q
```

Якщо схема вже була завантажена, скрипт не запускає `001_core_schema.sql` повторно.

## 3. Підключення майбутнього API до робочої бази

Для API або іншого runtime-хоста взяти шаблон:

```bash
cp .env.crm-sql.example .env
```

Якщо API запускається на тій самій Ubuntu VM `crm-sql`, у `.env` замінити тільки пароль і залишити `127.0.0.1`:

```env
DATABASE_URL=postgresql://crm_admin:<real_password>@127.0.0.1:5432/crm_hub?schema=core
```

Якщо API запускається з іншого сервера, тоді host у `DATABASE_URL` має бути `192.168.0.166`.

Якщо пароль містить спецсимволи на кшталт `@`, `#`, `%`, `:`, `/`, його потрібно URL-encode у `DATABASE_URL`.

## 4. Резервні копії всередині Ubuntu

Встановити щоденний systemd timer:

```bash
cd ~/SQL
sudo ./scripts/ubuntu/install-crm-backup-timer.sh
```

За замовчуванням backup створюється щодня о `02:15` у:

```text
/var/backups/crm-postgres
```

Перевірити timer:

```bash
systemctl list-timers --all crm-postgres-backup.timer
```

Запустити backup вручну:

```bash
sudo systemctl start crm-postgres-backup.service
ls -lh /var/backups/crm-postgres
```

Формат backup: PostgreSQL custom dump `pg_dump -F c`, поруч створюється `.sha256`.

Щоб Windows міг забирати backups через `scp` під користувачем `crmadmin`, цей користувач має бути в групі `crmbackup`, а файли мають мати групу `crmbackup`:

```bash
sudo groupadd --force crmbackup
sudo usermod -aG crmbackup crmadmin
sudo chgrp crmbackup /var/backups/crm-postgres /var/backups/crm-postgres/*
sudo chmod 750 /var/backups/crm-postgres
sudo chmod 640 /var/backups/crm-postgres/*
```

Після `usermod` потрібно вийти з SSH і зайти назад, щоб група застосувалась.

## 5. Копіювання backup на Windows host `D:\CRM\Backups`

Якщо на Windows Server доступні `ssh/scp`, Windows host може сам забирати backup з Ubuntu через `scp`.

На `MESER` у PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path D:\CRM\Backups
powershell -ExecutionPolicy Bypass -File .\scripts\windows\pull-crm-backups.ps1
```

Скрипт за замовчуванням бере файли з:

```text
crmadmin@192.168.0.166:/var/backups/crm-postgres/
```

і копіює їх у:

```text
D:\CRM\Backups
```

Якщо репозиторій лежить на Windows host в іншій папці, запускайте скрипт повним шляхом:

```powershell
powershell -ExecutionPolicy Bypass -File D:\CRM\SQL\scripts\windows\pull-crm-backups.ps1
```

Для Windows Server 2012 R2 `ssh/scp` і `tar` можуть бути відсутні. У такому випадку використати тимчасовий HTTP-transfer з Ubuntu.

На Ubuntu:

```bash
cd ~/SQL
chmod +x scripts/ubuntu/package-crm-backups-transfer.sh
./scripts/ubuntu/package-crm-backups-transfer.sh
python3 -m http.server 8088 --bind 0.0.0.0 --directory /tmp
```

На `MESER` у PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path D:\CRM\Backups
Invoke-WebRequest -Uri http://192.168.0.166:8088/crm_hub_backups_transfer.tar.gz -OutFile D:\CRM\Backups\crm_hub_backups_transfer.tar.gz
```

Якщо репозиторій є на Windows host, можна використати helper-скрипт:

```powershell
powershell -ExecutionPolicy Bypass -File D:\CRM\SQL\scripts\windows\fetch-crm-backup-http.ps1
```

Для перевірки архіву без `tar` на Windows Server 2012 R2:

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$in = [System.IO.File]::OpenRead("D:\CRM\Backups\crm_hub_backups_transfer.tar.gz")
$gz = New-Object System.IO.Compression.GZipStream($in, [System.IO.Compression.CompressionMode]::Decompress)
$buffer = New-Object byte[] 512
$read = $gz.Read($buffer, 0, 512)
$read
$gz.Dispose()
$in.Dispose()
```

Очікувано `$read` має бути більше `0`. Після transfer зупинити HTTP-сервер на Ubuntu через `Ctrl+C` і видалити тимчасовий файл:

```bash
rm -f /tmp/crm_hub_backups_transfer.tar.gz
```

Поточна перевірена копія на `MESER`:

```text
D:\CRM\Backups\crm_hub_backups_transfer.tar.gz
```

## 6. Варіант із змонтованою папкою Windows

Якщо на `MESER` створено SMB-share для `D:\CRM\Backups`, його можна змонтувати в Ubuntu, наприклад у `/mnt/crm-backups`, і встановити timer з копіюванням:

```bash
sudo COPY_TO_DIR=/mnt/crm-backups ./scripts/ubuntu/install-crm-backup-timer.sh
```

Облікові дані SMB не зберігати в git. Для production використовуйте файл credentials з правами `0600`.

У поточному середовищі SMB-share `CRMBackups` був створений на `MESER`, але TCP `445` з Ubuntu `crm-sql` до `192.168.0.5` давав timeout. Тому SMB-копіювання варто доробляти окремо після перевірки Hyper-V/firewall-політик, не блокуючи роботу бази й backups.

## 7. Команди діагностики

Перевірка PostgreSQL:

```bash
sudo systemctl status postgresql --no-pager
sudo -u postgres psql -d postgres -c "\du"
sudo -u postgres psql -d postgres -c "\l"
```

Перевірка TCP-входу саме під `crm_admin`:

```bash
psql -h 127.0.0.1 -U crm_admin -d crm_hub -c "select current_database(), current_user;"
```

Якщо після `ALTER ROLE` все одно є `password authentication failed`, перевірити, що local socket і TCP `5432` ведуть в один PostgreSQL-кластер:

```bash
pg_lsclusters
sudo -u postgres psql -d postgres -c "show password_encryption;"
sudo -u postgres psql -d postgres -c "select inet_server_addr(), inet_server_port(), current_setting('data_directory'), current_setting('hba_file');"
sudo ss -ltnp | grep 5432
```

Перевірка мережевого доступу з Windows вже має давати:

```text
TcpTestSucceeded : True
```
