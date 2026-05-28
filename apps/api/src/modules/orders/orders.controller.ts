import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateOrderDto } from "./orders.dto.js";

@Controller("orders")
export class OrdersController {
  @Get()
  listOrders() {
    return {
      data: [],
      nextCursor: null
    };
  }

  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    return {
      status: "accepted",
      payload: dto
    };
  }
}
