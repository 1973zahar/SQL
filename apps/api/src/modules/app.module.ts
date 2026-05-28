import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CustomersModule } from "./customers/customers.module.js";
import { HealthModule } from "./health/health.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { ProductsModule } from "./products/products.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    ProductsModule,
    OrdersModule,
    CustomersModule
  ]
})
export class AppModule {}
