export type ExternalOrderEvent = {
  source: "marketplace" | "website" | "b2b" | "retail";
  externalId: string;
  customerExternalId?: string;
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
