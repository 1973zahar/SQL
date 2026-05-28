import { Controller, Get } from "@nestjs/common";

@Controller("customers")
export class CustomersController {
  @Get()
  listCustomers() {
    return {
      data: [],
      nextCursor: null
    };
  }
}
