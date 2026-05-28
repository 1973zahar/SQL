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
    "unit": "pcs"
  }
}
```
