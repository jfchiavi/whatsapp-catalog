import type { BillingProviderType, PaymentGatewayType } from '@prisma/client';

export type OrderContextLine = {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  codigoProductoSin?: string | null;
};

export type OrderContext = {
  id: string;
  tenantId: string;
  totalSnapshot: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerNit?: string | null;
  lines: OrderContextLine[];
};

export type PaymentGatewayCredentials = {
  gateway: PaymentGatewayType;
  appkey: string;
};

export type BillingProviderCredentials = {
  provider: BillingProviderType;
  credentials: Record<string, string>;
};

export type GatewayPaymentStatus = 'initiated' | 'paid' | 'failed';

export type CreatePaymentResult = {
  gatewayTransactionId: string;
  qrUrl?: string | null;
  paymentUrl?: string | null;
  status: GatewayPaymentStatus;
};

export type WebhookParams = {
  query: Record<string, string>;
  headers?: Record<string, string>;
};

export type WebhookProcessResult = {
  processed: boolean;
  status: GatewayPaymentStatus;
  gatewayTransactionId?: string;
  invoiceId?: string | null;
  invoiceUrl?: string | null;
  raw?: unknown;
};

export type EmitInvoiceResult = {
  invoiceId: string;
  invoiceUrl: string | null;
};

export type PaymentQueryRange = {
  from: Date;
  to: Date;
};

export type ReconciliationRecord = {
  transactionId: string;
  identifier: string | null;
  paidAt: string | null;
  amountPaid: number;
  paymentMethod: string;
};

export type OrderPaymentStatus = {
  paid: boolean;
  paidAt: string | null;
  total: number | null;
};
