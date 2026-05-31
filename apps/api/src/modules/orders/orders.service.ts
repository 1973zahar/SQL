import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../common/database/prisma.service.js";
import { CreateOrderDto } from "./orders.dto.js";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders() {
    const data = await this.prisma.$queryRaw`
      SELECT
        o.id::text,
        o.source_module::text AS "sourceModule",
        o.external_id AS "externalId",
        o.status::text,
        o.currency,
        o.total_amount::text AS "totalAmount",
        o.shipping_address AS "shippingAddress",
        o.payment_method AS "paymentMethod",
        o.delivery_method AS "deliveryMethod",
        o.created_at AS "createdAt",
        o.updated_at AS "updatedAt",
        c.full_name AS "customerName",
        count(oi.id)::int AS "itemsCount"
      FROM core.orders o
      LEFT JOIN core.customers c ON c.id = o.customer_id
      LEFT JOIN core.order_items oi ON oi.order_id = o.id
      GROUP BY o.id, c.full_name
      ORDER BY o.created_at DESC
      LIMIT 100
    `;

    return {
      data,
      nextCursor: null
    };
  }

  async createOrder(dto: CreateOrderDto) {
    const externalId = dto.externalId ?? `api-${randomUUID()}`;
    const payload = {
      externalId,
      customer: dto.customer,
      shippingAddress: dto.shippingAddress,
      paymentMethod: dto.paymentMethod,
      deliveryMethod: dto.deliveryMethod,
      items: dto.items,
      metadata: dto.metadata ?? {}
    };

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
        ${dto.source}::core.module_code,
        'order.created',
        ${`api-order-${externalId}`},
        'order',
        ${externalId},
        ${JSON.stringify(payload)}::jsonb
      )
      ON CONFLICT (source_module, external_event_id)
      DO UPDATE SET payload = EXCLUDED.payload, status = 'pending'::integration.event_status
      RETURNING id::text, status::text
    `;

    return {
      status: "accepted",
      inboxEvent: event
    };
  }
}
