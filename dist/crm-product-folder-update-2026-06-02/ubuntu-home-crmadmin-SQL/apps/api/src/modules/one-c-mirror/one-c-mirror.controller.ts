import { Controller, Get, ParseIntPipe, Query } from "@nestjs/common";
import { OneCMirrorService } from "./one-c-mirror.service.js";

@Controller("one-c-mirror")
export class OneCMirrorController {
  constructor(private readonly oneCMirror: OneCMirrorService) {}

  @Get("products")
  listProducts(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listProducts(limit);
  }

  @Get("product-prices")
  listProductPrices(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listProductPrices(limit);
  }

  @Get("product-folders")
  listProductFolders(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listProductFolders(limit);
  }

  @Get("warehouses")
  listWarehouses(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listWarehouses(limit);
  }

  @Get("stock")
  listStock(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listStock(limit);
  }

  @Get("counterparties")
  listCounterparties(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listCounterparties(limit);
  }

  @Get("firms")
  listFirms(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listFirms(limit);
  }

  @Get("receivables")
  listReceivables(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listReceivables(limit);
  }

  @Get("reference-summary")
  listReferenceSummary(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listReferenceSummary(limit);
  }

  @Get("references")
  listReferences(@Query("limit", new ParseIntPipe({ optional: true })) limit = 1000) {
    return this.oneCMirror.listReferences(limit);
  }
}
