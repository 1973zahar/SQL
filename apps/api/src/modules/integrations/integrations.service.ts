import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service.js";
import { CreateInboxEventDto, ModuleCode, OutboxAckStatus } from "./dto.js";

type InboxEventRow = {
  id: string;
  source_module: ModuleCode;
  event_type: string;
  external_event_id: string | null;
  aggregate_type: string;
  aggregate_external_id: string | null;
  payload: Record<string, unknown>;
  receivedAt: Date;
};

type ProcessEventResult =
  | { status: "processed" }
  | { status: "ignored"; reason: string };

type OneCProductPayload = {
  sku?: string;
  name?: string;
  barcode?: string;
  unit?: string;
  ref?: string;
  oneCRef?: string;
  description?: string;
  prices?: OneCPricePayload[];
  price?: OneCPricePayload | string | number;
  stockBalances?: OneCStockPayload[];
  stocks?: OneCStockPayload[];
  stock?: OneCStockPayload;
};

type OneCPricePayload = {
  sku?: string;
  productSku?: string;
  ref?: string;
  oneCRef?: string;
  productRef?: string;
  priceType?: string;
  type?: string;
  currency?: string;
  amount?: string | number;
  price?: string | number;
  validFrom?: string;
  validTo?: string | null;
};

type OneCStockPayload = {
  sku?: string;
  productSku?: string;
  ref?: string;
  oneCRef?: string;
  productRef?: string;
  warehouseCode?: string;
  warehouse?: string;
  warehouseName?: string;
  quantity?: string | number;
  reservedQuantity?: string | number;
  reserved?: string | number;
};

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInboxEvent(dto: CreateInboxEventDto) {
    const [event] = await this.prisma.$queryRaw<Array<{ id: string; status: string }>>`
      INSERT INTO integration.inbox_events (
        source_module,
        event_type,
        external_event_id,
        aggregate_type,
        aggregate_external_id,
        payload
      )
      VALUES (
        ${dto.sourceModule}::core.module_code,
        ${dto.eventType},
        ${dto.externalEventId ?? null},
        ${dto.aggregateType},
        ${dto.aggregateExternalId ?? null},
        ${JSON.stringify(dto.payload)}::jsonb
      )
      ON CONFLICT (source_module, external_event_id)
      DO UPDATE SET payload = EXCLUDED.payload, status = 'pending'::integration.event_status
      RETURNING id::text, status::text
    `;

    return event;
  }

  async processPendingInbox(limit: number) {
    let processed = 0;
    let ignored = 0;
    let failed = 0;

    for (let index = 0; index < Math.max(1, Math.min(limit, 100)); index += 1) {
      const event = await this.takeNextInboxEvent();
      if (!event) {
        break;
      }

      try {
        const result = await this.processEvent(event);
        if (result.status === "ignored") {
          await this.markInboxIgnored(event.id, result.reason);
          ignored += 1;
        } else {
          await this.markInboxProcessed(event.id);
          processed += 1;
        }
      } catch (error) {
        await this.markInboxFailed(event.id, error instanceof Error ? error.message : "Unknown error");
        failed += 1;
      }
    }

    return { processed, ignored, failed };
  }

  async getPendingOutboxEvents(targetModule: ModuleCode, limit: number) {
    return this.prisma.$queryRaw`
      SELECT
        id::text,
        target_module::text AS "targetModule",
        event_type AS "eventType",
        aggregate_type AS "aggregateType",
        aggregate_id::text AS "aggregateId",
        payload,
        created_at AS "createdAt"
      FROM integration.outbox_events
      WHERE target_module = ${targetModule}::core.module_code
        AND status = 'pending'::integration.event_status
      ORDER BY created_at ASC
      LIMIT ${Math.max(1, Math.min(limit, 100))}
    `;
  }

  async ackOutboxEvent(id: string, status: OutboxAckStatus, errorMessage?: string) {
    const [event] = await this.prisma.$queryRaw<Array<{ id: string; status: string }>>`
      UPDATE integration.outbox_events
      SET
        status = ${status}::integration.event_status,
        error_message = ${errorMessage ?? null},
        processed_at = CASE
          WHEN ${status}::integration.event_status IN ('processed', 'ignored') THEN now()
          ELSE processed_at
        END
      WHERE id = ${id}::uuid
      RETURNING id::text, status::text
    `;

    return event;
  }

  async getStatus() {
    const inbox = await this.prisma.$queryRaw`
      SELECT status::text, count(*)::int
      FROM integration.inbox_events
      GROUP BY status
      ORDER BY status
    `;

    const outbox = await this.prisma.$queryRaw`
      SELECT target_module::text, status::text, count(*)::int
      FROM integration.outbox_events
      GROUP BY target_module, status
      ORDER BY target_module, status
    `;

    return { inbox, outbox };
  }

  private async takeNextInboxEvent() {
    const [event] = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<InboxEventRow[]>`
        SELECT
          id::text,
          source_module::text,
          event_type,
          external_event_id,
          aggregate_type,
          aggregate_external_id,
          payload,
          received_at AS "receivedAt"
        FROM integration.inbox_events
        WHERE status = 'pending'::integration.event_status
        ORDER BY received_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      if (!rows[0]) {
        return [];
      }

      await tx.$executeRaw`
        UPDATE integration.inbox_events
        SET status = 'processing'::integration.event_status
        WHERE id = ${rows[0].id}::uuid
      `;

      return rows;
    });

    return event;
  }

  private async processEvent(event: InboxEventRow): Promise<ProcessEventResult> {
    if (event.aggregate_type === "order" || event.event_type.startsWith("order.")) {
      await this.upsertOrderFromEvent(event);
      return { status: "processed" };
    }

    if (event.source_module === ModuleCode.OneC && this.isPriceEvent(event)) {
      await this.upsertProductPriceFromOneC(event);
      return { status: "processed" };
    }

    if (event.source_module === ModuleCode.OneC && this.isStockEvent(event)) {
      await this.upsertStockBalanceFromOneC(event);
      return { status: "processed" };
    }

    if (event.source_module === ModuleCode.OneC && this.isProductEvent(event)) {
      await this.upsertProductFromOneC(event);
      return { status: "processed" };
    }

    return {
      status: "ignored",
      reason: `No processor for event type ${event.event_type} and aggregate ${event.aggregate_type}`
    };
  }

  private isProductEvent(event: InboxEventRow) {
    return event.aggregate_type === "product" || event.event_type.startsWith("product.");
  }

  private isPriceEvent(event: InboxEventRow) {
    return (
      event.aggregate_type === "product_price" ||
      event.aggregate_type === "price" ||
      event.event_type.startsWith("product.price") ||
      event.event_type.startsWith("price.")
    );
  }

  private isStockEvent(event: InboxEventRow) {
    return (
      event.aggregate_type === "stock_balance" ||
      event.aggregate_type === "stock" ||
      event.event_type.startsWith("stock.") ||
      event.event_type.startsWith("product.stock")
    );
  }

  private async upsertProductFromOneC(event: InboxEventRow) {
    const payload = event.payload as OneCProductPayload;

    if (!payload.sku || !payload.name) {
      throw new Error("1C product event requires payload.sku and payload.name");
    }

    const [product] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO core.products (sku, barcode, name, description, unit, one_c_ref, metadata)
      VALUES (
        ${payload.sku},
        ${payload.barcode ?? null},
        ${payload.name},
        ${payload.description ?? null},
        ${payload.unit ?? "pcs"},
        ${payload.oneCRef ?? payload.ref ?? event.aggregate_external_id},
        ${JSON.stringify(event.payload)}::jsonb
      )
      ON CONFLICT (sku)
      DO UPDATE SET
        barcode = EXCLUDED.barcode,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        unit = EXCLUDED.unit,
        one_c_ref = COALESCE(EXCLUDED.one_c_ref, core.products.one_c_ref),
        metadata = EXCLUDED.metadata
      RETURNING id::text
    `;

    const prices = this.extractPricePayloads(payload);
    for (const price of prices) {
      await this.upsertProductPricePayload(
        {
          ...price,
          sku: price.sku ?? payload.sku,
          oneCRef: price.oneCRef ?? price.ref ?? payload.oneCRef ?? payload.ref ?? event.aggregate_external_id ?? undefined
        },
        event
      );
    }

    const stocks = this.extractStockPayloads(payload);
    for (const stock of stocks) {
      await this.upsertStockBalancePayload(
        {
          ...stock,
          sku: stock.sku ?? payload.sku,
          oneCRef: stock.oneCRef ?? stock.ref ?? payload.oneCRef ?? payload.ref ?? event.aggregate_external_id ?? undefined
        },
        event
      );
    }

    return product.id;
  }

  private async upsertProductPriceFromOneC(event: InboxEventRow) {
    const payload = event.payload as OneCPricePayload;
    await this.upsertProductPricePayload(
      {
        ...payload,
        oneCRef: payload.oneCRef ?? payload.ref ?? payload.productRef ?? event.aggregate_external_id ?? undefined
      },
      event
    );
  }

  private async upsertStockBalanceFromOneC(event: InboxEventRow) {
    const payload = event.payload as OneCStockPayload;
    await this.upsertStockBalancePayload(
      {
        ...payload,
        oneCRef: payload.oneCRef ?? payload.ref ?? payload.productRef ?? event.aggregate_external_id ?? undefined
      },
      event
    );
  }

  private extractPricePayloads(payload: OneCProductPayload) {
    const prices = Array.isArray(payload.prices) ? [...payload.prices] : [];
    if (typeof payload.price === "string" || typeof payload.price === "number") {
      prices.push({ amount: payload.price });
    } else if (payload.price && typeof payload.price === "object") {
      prices.push(payload.price);
    }

    return prices;
  }

  private extractStockPayloads(payload: OneCProductPayload) {
    const stocks = Array.isArray(payload.stockBalances) ? [...payload.stockBalances] : [];
    if (Array.isArray(payload.stocks)) {
      stocks.push(...payload.stocks);
    }
    if (payload.stock) {
      stocks.push(payload.stock);
    }

    return stocks;
  }

  private async upsertProductPricePayload(payload: OneCPricePayload, event: InboxEventRow) {
    const product = await this.findProductForOneCPayload(payload);
    const amount = this.toDecimalText(payload.amount ?? payload.price, "price amount");
    const priceType = payload.priceType ?? payload.type ?? "base";
    const currency = this.normalizeCurrency(payload.currency);
    const validFrom = this.parseDate(payload.validFrom) ?? event.receivedAt;
    const validTo = payload.validTo === null ? null : this.parseDate(payload.validTo);

    await this.prisma.$executeRaw`
      INSERT INTO core.product_prices (
        product_id,
        price_type,
        currency,
        amount,
        valid_from,
        valid_to,
        source_module
      )
      VALUES (
        ${product.id}::uuid,
        ${priceType},
        ${currency},
        ${amount}::numeric,
        ${validFrom.toISOString()}::timestamptz,
        ${validTo ? validTo.toISOString() : null}::timestamptz,
        'one_c'::core.module_code
      )
      ON CONFLICT (product_id, price_type, currency, valid_from)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        valid_to = EXCLUDED.valid_to,
        source_module = EXCLUDED.source_module
    `;
  }

  private async upsertStockBalancePayload(payload: OneCStockPayload, event: InboxEventRow) {
    const product = await this.findProductForOneCPayload(payload);
    const quantity = this.toDecimalText(payload.quantity ?? 0, "stock quantity");
    const reservedQuantity = this.toDecimalText(payload.reservedQuantity ?? payload.reserved ?? 0, "reserved quantity");
    const warehouseCode = payload.warehouseCode ?? payload.warehouse ?? "main";
    const warehouseName = payload.warehouseName ?? warehouseCode;

    const [warehouse] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO core.warehouses (code, name, module_owner)
      VALUES (${warehouseCode}, ${warehouseName}, 'one_c'::core.module_code)
      ON CONFLICT (code)
      DO UPDATE SET
        name = EXCLUDED.name,
        module_owner = EXCLUDED.module_owner,
        is_active = true
      RETURNING id::text
    `;

    await this.prisma.$executeRaw`
      INSERT INTO core.stock_balances (
        product_id,
        warehouse_id,
        quantity,
        reserved_quantity,
        updated_at
      )
      VALUES (
        ${product.id}::uuid,
        ${warehouse.id}::uuid,
        ${quantity}::numeric,
        ${reservedQuantity}::numeric,
        ${event.receivedAt.toISOString()}::timestamptz
      )
      ON CONFLICT (product_id, warehouse_id)
      DO UPDATE SET
        quantity = EXCLUDED.quantity,
        reserved_quantity = EXCLUDED.reserved_quantity,
        updated_at = EXCLUDED.updated_at
    `;
  }

  private async findProductForOneCPayload(payload: OneCPricePayload | OneCStockPayload) {
    const sku = payload.sku ?? payload.productSku ?? null;
    const oneCRef = payload.oneCRef ?? payload.ref ?? payload.productRef ?? null;

    if (!sku && !oneCRef) {
      throw new Error("1C price/stock event requires sku or oneCRef");
    }

    const [product] = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id::text
      FROM core.products
      WHERE (${sku}::text IS NOT NULL AND sku = ${sku})
         OR (${oneCRef}::text IS NOT NULL AND one_c_ref = ${oneCRef})
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!product) {
      throw new Error(`Product not found for 1C reference ${sku ?? oneCRef}`);
    }

    return product;
  }

  private normalizeCurrency(value?: string) {
    const currency = (value ?? "UAH").trim().toUpperCase().slice(0, 3);
    return currency || "UAH";
  }

  private parseDate(value?: string | null) {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date value ${value}`);
    }

    return date;
  }

  private toDecimalText(value: string | number | undefined, fieldName: string) {
    if (value === undefined || value === null || value === "") {
      throw new Error(`1C event requires ${fieldName}`);
    }

    const text = String(value).trim().replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(text)) {
      throw new Error(`Invalid ${fieldName}: ${value}`);
    }
    if (text.startsWith("-")) {
      throw new Error(`${fieldName} cannot be negative`);
    }

    return text;
  }

  private async upsertOrderFromEvent(event: InboxEventRow) {
    const payload = event.payload as {
      externalId?: string;
      customer?: {
        externalId?: string;
        fullName?: string;
        phone?: string;
        email?: string;
        taxId?: string;
      };
      shippingAddress?: string;
      paymentMethod?: string;
      deliveryMethod?: string;
      items?: Array<{
        sku?: string;
        quantity?: string | number;
        unitPrice?: string | number;
      }>;
    };

    if (!payload.items?.length) {
      throw new Error("Order event requires payload.items");
    }

    const orderId = await this.prisma.$transaction(async (tx) => {
      let customerId: string | null = null;
      const customer = payload.customer;

      if (customer?.fullName) {
        const [customerRow] = await tx.$queryRaw<Array<{ id: string }>>`
          INSERT INTO core.customers (
            source_module,
            external_id,
            full_name,
            phone,
            email,
            tax_id,
            metadata
          )
          VALUES (
            ${event.source_module}::core.module_code,
            ${customer.externalId ?? null},
            ${customer.fullName},
            ${customer.phone ?? null},
            ${customer.email ?? null},
            ${customer.taxId ?? null},
            ${JSON.stringify(customer)}::jsonb
          )
          ON CONFLICT (source_module, external_id)
          DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            tax_id = EXCLUDED.tax_id,
            metadata = EXCLUDED.metadata
          RETURNING id::text
        `;
        customerId = customerRow.id;
      }

      const [order] = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO core.orders (
          source_module,
          external_id,
          customer_id,
          status,
          shipping_address,
          payment_method,
          delivery_method,
          metadata
        )
        VALUES (
          ${event.source_module}::core.module_code,
          ${payload.externalId ?? event.aggregate_external_id ?? event.external_event_id},
          ${customerId}::uuid,
          'new'::core.order_status,
          ${payload.shippingAddress ?? null},
          ${payload.paymentMethod ?? null},
          ${payload.deliveryMethod ?? null},
          ${JSON.stringify(event.payload)}::jsonb
        )
        ON CONFLICT (source_module, external_id)
        DO UPDATE SET
          customer_id = EXCLUDED.customer_id,
          shipping_address = EXCLUDED.shipping_address,
          payment_method = EXCLUDED.payment_method,
          delivery_method = EXCLUDED.delivery_method,
          metadata = EXCLUDED.metadata
        RETURNING id::text
      `;

      await tx.$executeRaw`DELETE FROM core.order_items WHERE order_id = ${order.id}::uuid`;

      for (const item of payload.items) {
        if (!item.sku) {
          throw new Error("Order item requires sku");
        }

        const [product] = await tx.$queryRaw<Array<{ id: string; name: string }>>`
          SELECT id::text, name
          FROM core.products
          WHERE sku = ${item.sku}
          LIMIT 1
        `;

        if (!product) {
          throw new Error(`Product SKU ${item.sku} not found`);
        }

        await tx.$executeRaw`
          INSERT INTO core.order_items (
            order_id,
            product_id,
            sku_snapshot,
            name_snapshot,
            quantity,
            unit_price
          )
          VALUES (
            ${order.id}::uuid,
            ${product.id}::uuid,
            ${item.sku},
            ${product.name},
            ${String(item.quantity ?? "1")}::numeric,
            ${String(item.unitPrice ?? "0")}::numeric
          )
        `;
      }

      await tx.$executeRaw`
        UPDATE core.orders
        SET total_amount = (
          SELECT COALESCE(sum(line_total), 0)
          FROM core.order_items
          WHERE order_id = ${order.id}::uuid
        )
        WHERE id = ${order.id}::uuid
      `;

      return order.id;
    });

    await this.createOutboxEvent("one_c", "order.ready_for_1c", "order", orderId, {
      orderId,
      sourceModule: event.source_module,
      externalId: payload.externalId ?? event.aggregate_external_id ?? event.external_event_id
    });
  }

  private async createOutboxEvent(
    targetModule: ModuleCode | "one_c",
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    payload: Record<string, unknown>
  ) {
    await this.prisma.$executeRaw`
      WITH updated AS (
        UPDATE integration.outbox_events
        SET
          payload = ${JSON.stringify(payload)}::jsonb,
          error_message = null,
          created_at = now()
        WHERE target_module = ${targetModule}::core.module_code
          AND event_type = ${eventType}
          AND aggregate_type = ${aggregateType}
          AND aggregate_id = ${aggregateId}::uuid
          AND status = 'pending'::integration.event_status
        RETURNING id
      )
      INSERT INTO integration.outbox_events (
        target_module,
        event_type,
        aggregate_type,
        aggregate_id,
        payload
      )
      SELECT
        ${targetModule}::core.module_code,
        ${eventType},
        ${aggregateType},
        ${aggregateId}::uuid,
        ${JSON.stringify(payload)}::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM updated)
    `;
  }

  private async markInboxProcessed(id: string) {
    await this.prisma.$executeRaw`
      UPDATE integration.inbox_events
      SET status = 'processed'::integration.event_status, processed_at = now(), error_message = null
      WHERE id = ${id}::uuid
    `;
  }

  private async markInboxFailed(id: string, errorMessage: string) {
    await this.prisma.$executeRaw`
      UPDATE integration.inbox_events
      SET status = 'failed'::integration.event_status, error_message = ${errorMessage}
      WHERE id = ${id}::uuid
    `;
  }

  private async markInboxIgnored(id: string, reason: string) {
    await this.prisma.$executeRaw`
      UPDATE integration.inbox_events
      SET status = 'ignored'::integration.event_status, processed_at = now(), error_message = ${reason}
      WHERE id = ${id}::uuid
    `;
  }
}
