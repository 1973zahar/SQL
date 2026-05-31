import { IsArray, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
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

  @IsOptional()
  @IsString()
  unitPrice?: string;
}

class CreateOrderCustomerDto {
  @IsOptional()
  @IsString()
  externalId?: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  taxId?: string;
}

export class CreateOrderDto {
  @IsEnum(SalesChannel)
  source!: SalesChannel;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOrderCustomerDto)
  customer?: CreateOrderCustomerDto;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  deliveryMethod?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
