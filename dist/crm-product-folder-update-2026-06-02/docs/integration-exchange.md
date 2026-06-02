# Автоматизований обмін

API тепер має модуль `integrations`, який автоматизує обмін між каналами продажу, CRM і 1C.

## Потік

1. Сайт, marketplace, B2B або retail відправляє подію в `POST /integrations/inbox`.
2. API записує подію в `integration.inbox_events`.
3. Фоновий worker кожні 10 секунд бере pending-події.
4. Якщо це замовлення, worker створює або оновлює `core.customers`, `core.orders`, `core.order_items`.
5. Після обробки створюється outbox-подія `order.ready_for_1c`.
6. 1C забирає pending-події через `GET /integrations/outbox/one_c`.
7. Після успішного імпорту 1C підтверджує подію через `POST /integrations/outbox/{id}/ack`.

Події з 1C для номенклатури, цін і залишків обробляються одразу в `core.products`, `core.product_prices`, `core.warehouses` і `core.stock_balances`. Невідомі типи подій тепер позначаються в inbox як `ignored`, а не створюють шум у outbox для 1C.

## Прийом замовлення

```http
POST /integrations/inbox
Content-Type: application/json
```

```json
{
  "sourceModule": "marketplace",
  "eventType": "order.created",
  "externalEventId": "rozetka-event-10001",
  "aggregateType": "order",
  "aggregateExternalId": "RZ-10001",
  "payload": {
    "externalId": "RZ-10001",
    "customer": {
      "externalId": "customer-777",
      "fullName": "Іван Петренко",
      "phone": "+380501112233",
      "email": "client@example.com"
    },
    "paymentMethod": "card",
    "deliveryMethod": "nova_poshta",
    "shippingAddress": "Київ, відділення 1",
    "items": [
      {
        "sku": "SKU-001",
        "quantity": "2",
        "unitPrice": "1500.00"
      }
    ]
  }
}
```

## Ручний запуск обробки

```http
POST /integrations/process?limit=25
```

Фоновий worker увімкнений за замовчуванням. Налаштування:

```env
INTEGRATION_WORKER_ENABLED=true
INTEGRATION_WORKER_INTERVAL_MS=10000
```

## Отримати події для 1C

```http
GET /integrations/outbox/one_c?limit=25
```

## Підтвердити подію після імпорту в 1C

```http
POST /integrations/outbox/{id}/ack
Content-Type: application/json
```

```json
{
  "status": "processed"
}
```

Якщо сталася помилка в 1C:

```json
{
  "status": "failed",
  "errorMessage": "Не знайдено контрагента в 1C"
}
```

## Статус обміну

```http
GET /integrations/status
```

Повертає кількість подій за статусами в inbox і outbox.

## Важлива умова

Перед обробкою замовлень товари мають бути в `core.products`. Їх можна завантажувати з 1C подіями з:

```json
{
  "sourceModule": "one_c",
  "eventType": "product.upserted",
  "aggregateType": "product",
  "aggregateExternalId": "1c-ref-001",
  "payload": {
    "ref": "1c-ref-001",
    "sku": "SKU-001",
    "name": "Тестовий товар",
    "barcode": "482000000001",
    "unit": "pcs",
    "price": {
      "priceType": "base",
      "currency": "UAH",
      "amount": "1500.00",
      "validFrom": "2026-06-01T00:00:00Z"
    },
    "stock": {
      "warehouseCode": "main",
      "warehouseName": "Основний склад",
      "quantity": "12",
      "reservedQuantity": "2"
    }
  }
}
```

Ціну можна також передати окремою подією:

```json
{
  "sourceModule": "one_c",
  "eventType": "product.price.updated",
  "externalEventId": "1c-price-001",
  "aggregateType": "product_price",
  "aggregateExternalId": "1c-ref-001",
  "payload": {
    "oneCRef": "1c-ref-001",
    "priceType": "base",
    "currency": "UAH",
    "amount": "1500.00",
    "validFrom": "2026-06-01T00:00:00Z"
  }
}
```

Залишок можна передати окремою подією:

```json
{
  "sourceModule": "one_c",
  "eventType": "stock.updated",
  "externalEventId": "1c-stock-001",
  "aggregateType": "stock_balance",
  "aggregateExternalId": "1c-ref-001",
  "payload": {
    "oneCRef": "1c-ref-001",
    "warehouseCode": "main",
    "warehouseName": "Основний склад",
    "quantity": "12",
    "reservedQuantity": "2"
  }
}
```

`GET /products` повертає товар разом з останньою активною ціною та сумарними залишками (`latestPrice`, `latestPriceCurrency`, `totalQuantity`, `availableQuantity`).

## Сире дзеркало довідників 1C

Для довідників, які поки не мають окремої бізнес-логіки в API, використовується схема `one_c_mirror`. Вона зберігає read-only CSV-експорти з 1C без змін у production-базі 1C.

Поточний імпорт завантажує такі файли з Windows HTTP-експорту `MESER`:

```text
1c_units.csv
1c_counterparties.csv
1c_counterparty_contracts.csv
1c_product_groups.csv
1c_organizations.csv
1c_currencies.csv
1c_price_types.csv
1c_product_series.csv
1c_product_characteristics.csv
1c_warehouses.csv
1c_product_kinds.csv
1c_unit_classifier.csv
1c_organization_units.csv
1c_persons.csv
1c_contact_info_types.csv
1c_bank_accounts.csv
```

`1c_manufacturers.csv` і `1c_countries.csv` поки свідомо пропущені, бо ці довідники не використовуються в поточній роботі.

Запуск на Ubuntu:

```bash
cd ~/SQL
bash scripts/ubuntu/import-1c-catalogs-http.sh
```

Детальний runbook: `docs/one-c-mirror-import.md`.

`1c_products.csv` додатково несе папку/групу товару з ієрархії 1C. У CRM-ready шарі це видно як:

```text
one_c_mirror.crm_products.product_group_code
one_c_mirror.crm_products.product_group_name
one_c_mirror.crm_products.product_group_ref
one_c_mirror.crm_product_folders
```

## Сире дзеркало залишків і взаєморозрахунків 1C

Окремо від довідників використовується операційне дзеркало `one_c_mirror.operational_rows`. Воно потрібне для знімків, де є кількості, суми, склади, договори та організації.

Поточний операційний експорт з `MESER` має створювати:

```text
1c_stock_balances.csv
1c_reserved_stock_balances.csv
1c_counterparty_settlements.csv
```

Імпорт на Ubuntu:

```bash
cd ~/SQL
bash scripts/ubuntu/import-1c-operational-http.sh
```

Результат зберігається в:

```text
one_c_mirror.operational_batches
one_c_mirror.operational_rows
one_c_mirror.latest_operational_rows
```

Важливо: знак `amount` у взаєморозрахунках не треба автоматично трактувати як дебіторку або кредиторку до перевірки на реальних даних 1C.

Детальний runbook: `docs/one-c-operational-export-import.md`.
