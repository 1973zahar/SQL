import { Controller, Get } from "@nestjs/common";

@Controller("products")
export class ProductsController {
  @Get()
  listProducts() {
    return {
      data: [],
      nextCursor: null
    };
  }
}
