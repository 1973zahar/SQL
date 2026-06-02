import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service.js";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        id::text,
        sku,
        barcode,
        name,
        description,
        unit,
        is_active AS "isActive",
        one_c_ref AS "oneCRef",
        latest_price.amount AS "latestPrice",
        latest_price.currency AS "latestPriceCurrency",
        latest_price.price_type AS "latestPriceType",
        stock.total_quantity AS "totalQuantity",
        stock.available_quantity AS "availableQuantity",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM core.products
      LEFT JOIN LATERAL (
        SELECT
          pp.amount::text AS amount,
          pp.currency,
          pp.price_type
        FROM core.product_prices pp
        WHERE pp.product_id = core.products.id
          AND pp.valid_from <= now()
          AND (pp.valid_to IS NULL OR pp.valid_to > now())
        ORDER BY pp.valid_from DESC
        LIMIT 1
      ) latest_price ON true
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(sum(sb.quantity), 0)::text AS total_quantity,
          COALESCE(sum(sb.quantity - sb.reserved_quantity), 0)::text AS available_quantity
        FROM core.stock_balances sb
        WHERE sb.product_id = core.products.id
      ) stock ON true
      ORDER BY name ASC
      LIMIT ${this.clampLimit(limit)}
    `;

    return {
      data,
      nextCursor: null
    };
  }

  private clampLimit(limit: number) {
    return Math.max(1, Math.min(Number.isFinite(limit) ? limit : 50, 200));
  }
}
