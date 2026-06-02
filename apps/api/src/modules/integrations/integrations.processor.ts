import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IntegrationsService } from "./integrations.service.js";

@Injectable()
export class IntegrationsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationsProcessor.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly integrations: IntegrationsService,
    private readonly config: ConfigService
  ) {}

  onModuleInit() {
    const enabled = this.config.get<string>("INTEGRATION_WORKER_ENABLED", "true") === "true";
    if (!enabled) {
      return;
    }

    const intervalMs = Number(this.config.get<string>("INTEGRATION_WORKER_INTERVAL_MS", "10000"));
    this.timer = setInterval(() => void this.tick(), intervalMs);
    void this.tick();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async tick() {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      const result = await this.integrations.processPendingInbox(25);
      if (result.processed > 0 || result.ignored > 0 || result.failed > 0) {
        this.logger.log(
          `Processed inbox events: ${result.processed}, ignored: ${result.ignored}, failed: ${result.failed}`
        );
      }
    } catch (error) {
      this.logger.error("Integration worker failed", error);
    } finally {
      this.running = false;
    }
  }
}
