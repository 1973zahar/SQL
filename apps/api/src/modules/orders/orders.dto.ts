import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

enum SalesChannel {
  Marketplace = "marketplace",
  Website = "website",
  B2B = "b2b",
  Retail = "retail"
}

class CreateOrderItemDto {
  @IsString()
  sku!: string;

  @IsString()
  quantity!: string;
}

export class CreateOrderDto {
  @IsEnum(SalesChannel)
  source!: SalesChannel;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
