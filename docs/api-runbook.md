# CRM API runbook

Поточний перший варіант: запускати API на Ubuntu VM `crm-sql` поруч із PostgreSQL `crm_hub`.

Імена:

- Ubuntu host: `crm-sql`, IP `192.168.0.166`
- Linux user: `crmadmin`
- PostgreSQL database: `crm_hub`
- PostgreSQL user: `crm_admin`
- API port: `3000`

## 1. Перевірити Node.js

На Ubuntu:

```bash
node --version
npm --version
```

Потрібен Node.js `20+`. Якщо Node.js немає:

```bash
sudo apt update
sudo apt install -y nodejs npm
node --version
npm --version
```

Якщо версія Node.js нижча за `20`, API не запускати, спочатку оновити Node.js.

## 2. Підготувати код

```bash
cd ~/SQL
git pull --ff-only
npm install
```

## 3. Створити `.env`

```bash
cp .env.crm-sql.example .env
nano .env
```

Для API на тому самому Ubuntu host використати:

```env
DATABASE_URL=postgresql://crm_admin:<real_password>@127.0.0.1:5432/crm_hub?schema=core
API_PORT=3000
WEB_ORIGIN=http://192.168.0.166:8080
INTEGRATION_WORKER_ENABLED=true
INTEGRATION_WORKER_INTERVAL_MS=10000
```

Якщо пароль має спецсимволи `@`, `#`, `%`, `:`, `/`, його потрібно URL-encode у `DATABASE_URL`.

## 4. Згенерувати Prisma client і зібрати API

```bash
npm run prisma:generate
npm run build --workspace @crm/api
```

## 5. Перший ручний запуск

```bash
npm run start --workspace @crm/api
```

В іншому терміналі перевірити:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/products
curl http://127.0.0.1:3000/integrations/status
```

Очікувано `/health` має повернути `status: "ok"` і `database: "crm_hub"`.

Зупинити ручний запуск через `Ctrl+C`.

## 6. Systemd service

Створити env-файл тільки для сервісу:

```bash
sudo install -d -m 750 -o root -g root /etc/crm-api
sudo cp .env /etc/crm-api/api.env
sudo chmod 600 /etc/crm-api/api.env
```

Створити service:

```bash
sudo tee /etc/systemd/system/crm-api.service >/dev/null <<'EOF'
[Unit]
Description=CRM NestJS API
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=crmadmin
WorkingDirectory=/home/crmadmin/SQL
EnvironmentFile=/etc/crm-api/api.env
ExecStart=/usr/bin/npm run start --workspace @crm/api
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

Увімкнути:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now crm-api.service
sudo systemctl status crm-api.service --no-pager
```

Логи:

```bash
journalctl -u crm-api.service -n 100 --no-pager
```

## 7. Відкрити порт API у firewall Ubuntu

Якщо `ufw` активний:

```bash
sudo ufw status
sudo ufw allow from 192.168.0.0/24 to any port 3000 proto tcp
```

Перевірка з Windows або іншого комп'ютера LAN/VPN:

```text
http://192.168.0.166:3000/health
```

## 8. Основні endpoint-и

```http
GET /health
GET /products
GET /customers
GET /orders
GET /integrations/status
POST /integrations/inbox
POST /integrations/process?limit=25
GET /integrations/outbox/one_c?limit=25
POST /integrations/outbox/{id}/ack
```

`POST /orders` створює `integration.inbox_events` з `event_type = order.created`; фоновий worker потім обробляє подію і створює `core.orders`.
