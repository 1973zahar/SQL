import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export enum ModuleCode {
  Marketplace = "marketplace",
  Website = "website",
  B2B = "b2b",
  Retail = "retail",
  OneC = "one_c"
}

export enum OutboxAckStatus {
  Processed = "processed",
  Failed = "failed",
  Ignored = "ignored"
}

export class CreateInboxEventDto {
  @IsEnum(ModuleCode)
  sourceModule!: ModuleCode;

  @IsString()
  eventType!: string;

  @IsOptional()
  @IsString()
  externalEventId?: string;

  @IsString()
  aggregateType!: string;

  @IsOptional()
  @IsString()
  aggregateExternalId?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class AckOutboxEventDto {
  @IsEnum(OutboxAckStatus)
  status!: OutboxAckStatus;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
