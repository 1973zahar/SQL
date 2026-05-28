export enum SalesChannel {
  Marketplace = "marketplace",
  Website = "website",
  B2B = "b2b",
  Retail = "retail",
  OneC = "one_c"
}

export enum OrderStatus {
  Draft = "draft",
  New = "new",
  Confirmed = "confirmed",
  Paid = "paid",
  Packed = "packed",
  Shipped = "shipped",
  Completed = "completed",
  Cancelled = "cancelled",
  Returned = "returned"
}

export enum IntegrationEventStatus {
  Pending = "pending",
  Processing = "processing",
  Processed = "processed",
  Failed = "failed",
  Ignored = "ignored"
}
