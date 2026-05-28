export type ExternalOrderEvent = {
  source: "marketplace" | "website" | "b2b" | "retail";
  externalId: string;
  customerExternalId?: string;
  customer?: {
    externalId?: string;
    fullName: string;
    phone?: string;
    email?: string;
    taxId?: string;
  };
  shippingAddress?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  items: Array<{
    sku: string;
    quantity: string;
    unitPrice?: string;
  }>;
};

export type OneCProductPayload = {
  ref: string;
  sku: string;
  name: string;
  barcode?: string;
  unit?: string;
};

export type IntegrationEventEnvelope<TPayload = unknown> = {
  sourceModule: "marketplace" | "website" | "b2b" | "retail" | "one_c";
  eventType: string;
  externalEventId?: string;
  aggregateType: string;
  aggregateExternalId?: string;
  payload: TPayload;
};
