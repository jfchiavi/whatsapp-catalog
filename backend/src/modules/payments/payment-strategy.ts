import type { BillingProviderType, PaymentGatewayType } from '@prisma/client';
import { AppError } from '@/lib/errors';
import type {
  BillingProviderCredentials,
  CreatePaymentResult,
  OrderContext,
  PaymentGatewayCredentials,
  PaymentQueryRange,
  ReconciliationRecord,
  WebhookParams,
  WebhookProcessResult,
  EmitInvoiceResult,
  OrderPaymentStatus,
} from './payment-types';

export interface IPaymentStrategy {
  createPayment(
    order: OrderContext,
    config: PaymentGatewayCredentials
  ): Promise<CreatePaymentResult>;

  processWebhook(
    params: WebhookParams,
    config: PaymentGatewayCredentials
  ): Promise<WebhookProcessResult>;

  // Conciliación (Slice 11): opcional para no forzar a todos los gateways.
  queryPayments?(
    config: PaymentGatewayCredentials,
    range: PaymentQueryRange
  ): Promise<ReconciliationRecord[]>;

  queryOrderPayment?(
    config: PaymentGatewayCredentials,
    identifier: string
  ): Promise<OrderPaymentStatus>;
}

export interface IBillingStrategy {
  emitInvoice(
    order: OrderContext,
    config: BillingProviderCredentials
  ): Promise<EmitInvoiceResult>;
}

const paymentStrategies = new Map<PaymentGatewayType, IPaymentStrategy>();
const billingStrategies = new Map<BillingProviderType, IBillingStrategy>();

export const registerPaymentStrategy = (
  gateway: PaymentGatewayType,
  strategy: IPaymentStrategy
): void => {
  paymentStrategies.set(gateway, strategy);
};

export const hasPaymentStrategy = (gateway: PaymentGatewayType): boolean =>
  paymentStrategies.has(gateway);

export const getPaymentStrategy = (gateway: PaymentGatewayType): IPaymentStrategy => {
  const strategy = paymentStrategies.get(gateway);
  if (!strategy) {
    throw new AppError(
      `No payment strategy registered for gateway ${gateway}`,
      500,
      'PAYMENT_STRATEGY_NOT_REGISTERED'
    );
  }
  return strategy;
};

export const registerBillingStrategy = (
  provider: BillingProviderType,
  strategy: IBillingStrategy
): void => {
  billingStrategies.set(provider, strategy);
};

export const hasBillingStrategy = (provider: BillingProviderType): boolean =>
  billingStrategies.has(provider);

export const getBillingStrategy = (provider: BillingProviderType): IBillingStrategy => {
  const strategy = billingStrategies.get(provider);
  if (!strategy) {
    throw new AppError(
      `No billing strategy registered for provider ${provider}`,
      500,
      'BILLING_STRATEGY_NOT_REGISTERED'
    );
  }
  return strategy;
};
