import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../common/database/database.module.js";
import { CustomersModule } from "./customers/customers.module.js";
import { HealthModule } from "./health/health.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { OneCMirrorModule } from "./one-c-mirror/one-c-mirror.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { ProductsModule } from "./products/products.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
    CustomersModule,
    OneCMirrorModule,
    IntegrationsModule
  ]
})
export class AppModule {}
