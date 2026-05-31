import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    const [database] = await this.prisma.$queryRaw<
      Array<{
        database: string;
        userName: string;
        serverAddress: string | null;
        serverPort: number | null;
      }>
    >`
      SELECT
        current_database() AS "database",
        current_user AS "userName",
        inet_server_addr()::text AS "serverAddress",
        inet_server_port() AS "serverPort"
    `;

    return {
      status: "ok",
      service: "marketplace-modular-crm-api",
      database,
      timestamp: new Date().toISOString()
    };
  }
}
