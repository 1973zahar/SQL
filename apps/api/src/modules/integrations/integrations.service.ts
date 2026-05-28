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
    let failed = 0;

    for (let index = 0; index < Math.max(1, Math.min(limit, 100)); index += 1) {
      const event = await this.takeNextInboxEvent();
      if (!event) {
        break;
      }

      try {
        await this.processEvent(event);
        await this.markInboxProcessed(event.id);
        processed += 1;
      } catch (error) {
        await this.markInboxFailed(event.id, error instanceof Error ? error.message : "Unknown error");
        failed += 1;
      }
    }

    return { processed, failed };
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
          payload
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

  private async processEvent(event: InboxEventRow) {
    if (event.aggregate_type === "order" || event.event_type.startsWith("order.")) {
      await this.upsertOrderFromEvent(event);
      return;
    }

    if (event.source_module === ModuleCode.OneC && event.aggregate_type === "product") {
      await this.upsertProductFromOneC(event);
      return;
    }

    await this.createOutboxEvent("one_c", "integration.event.ignored", "integration_event", event.id, {
      reason: "No processor for event type",
      eventType: event.event_type,
      aggregateType: event.aggregate_type
    });
  }

  private async upsertProductFromOneC(event: InboxEventRow) {
    const payload = event.payload as {
      sku?: string;
      name?: string;
      barcode?: string;
      unit?: string;
      ref?: string;
      description?: string;
    };

    if (!payload.sku || !payload.name) {
      throw new Error("1C product event requires payload.sku and payload.name");
    }

    await this.prisma.$executeRaw`
      INSERT INTO core.products (sku, barcode, name, description, unit, one_c_ref, metadata)
      VALUES (
        ${payload.sku},
        ${payload.barcode ?? null},
        ${payload.name},
        ${payload.description ?? null},
        ${payload.unit ?? "pcs"},
        ${payload.ref ?? event.aggregate_external_id},
        ${JSON.stringify(event.payload)}::jsonb
      )
      ON CONFLICT (sku)
      DO UPDATE SET
        barcode = EXCLUDED.barcode,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        unit = EXCLUDED.unit,
        one_c_ref = EXCLUDED.one_c_ref,
        metadata = EXCLUDED.metadata
    `;
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
      INSERT INTO integration.outbox_events (
        target_module,
        event_type,
        aggregate_type,
        aggregate_id,
        payload
      )
      VALUES (
        ${targetModule}::core.module_code,
        ${eventType},
        ${aggregateType},
        ${aggregateId}::uuid,
        ${JSON.stringify(payload)}::jsonb
      )
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
}
