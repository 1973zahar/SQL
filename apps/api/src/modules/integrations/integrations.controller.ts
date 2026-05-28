import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { AckOutboxEventDto, CreateInboxEventDto, ModuleCode } from "./dto.js";
import { IntegrationsService } from "./integrations.service.js";

@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Post("inbox")
  createInboxEvent(@Body() dto: CreateInboxEventDto) {
    return this.integrations.createInboxEvent(dto);
  }

  @Post("process")
  processPendingInbox(@Query("limit", new ParseIntPipe({ optional: true })) limit = 25) {
    return this.integrations.processPendingInbox(limit);
  }

  @Get("outbox/:targetModule")
  getOutboxEvents(
    @Param("targetModule") targetModule: ModuleCode,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 25
  ) {
    return this.integrations.getPendingOutboxEvents(targetModule, limit);
  }

  @Post("outbox/:id/ack")
  ackOutboxEvent(@Param("id") id: string, @Body() dto: AckOutboxEventDto) {
    return this.integrations.ackOutboxEvent(id, dto.status, dto.errorMessage);
  }

  @Get("status")
  getStatus() {
    return this.integrations.getStatus();
  }
}
