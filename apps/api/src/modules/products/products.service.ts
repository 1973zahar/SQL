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
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM core.products
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
