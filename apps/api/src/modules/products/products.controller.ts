import { Controller, Get, ParseIntPipe, Query } from "@nestjs/common";
import { ProductsService } from "./products.service.js";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  listProducts(@Query("limit", new ParseIntPipe({ optional: true })) limit = 50) {
    return this.products.listProducts(limit);
  }
}
