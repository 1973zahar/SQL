import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service.js";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(limit: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        id::text,
        source_module::text AS "sourceModule",
        external_id AS "externalId",
        full_name AS "fullName",
        phone,
        email,
        tax_id AS "taxId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM core.customers
      ORDER BY created_at DESC
      LIMIT ${this.clampLimit(limit)}
    `;

    return {
      data,
      nextCursor: null
    };
  }

  private clampLimit(limit: number) {
    return Math.max(1, Math.min(Number.isFinite(limit) ? limit : 50, 50000));
  }
}
