import { Controller, Get, ParseIntPipe, Query } from "@nestjs/common";
import { CustomersService } from "./customers.service.js";

@Controller("customers")
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  listCustomers(@Query("limit", new ParseIntPipe({ optional: true })) limit = 50) {
    return this.customers.listCustomers(limit);
  }
}
