import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateOrderDto } from "./orders.dto.js";
import { OrdersService } from "./orders.service.js";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  listOrders() {
    return this.orders.listOrders();
  }

  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    return this.orders.createOrder(dto);
  }
}
