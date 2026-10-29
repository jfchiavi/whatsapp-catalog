import type { PaymentGatewayType } from '@prisma/client';
import { AppError } from '@/lib/errors';
import {
  getActiveBillingCredentials,
  getActivePaymentCredentials,
} from './payment-config.service';
import { getBillingStrategy, getPaymentStrategy } from './payment-strategy';
import type {
  CreatePaymentResult,
  EmitInvoiceResult,
  OrderContext,
  WebhookParams,
  WebhookProcessResult,
} from './payment-types';

export const PaymentContext = {
  createPayment: async (
    tenantId: string,
    order: OrderContext
  ): Promise<CreatePaymentResult> => {
    const config = await getActivePaymentCredentials(tenantId);
    if (!config) {
      throw new AppError(
        'No active payment configuration for this tenant',
        400,
        'PAYMENT_NOT_CONFIGURED'
      );
    }

    const strategy = getPaymentStrategy(config.gateway);
    return strategy.createPayment(order, config);
  },

  processWebhook: async (
    tenantId: string,
    gateway: PaymentGatewayType,
    params: WebhookParams
  ): Promise<WebhookProcessResult> => {
    const config = await getActivePaymentCredentials(tenantId);
    if (!config) {
      throw new AppError(
        'No active payment configuration for this tenant',
        400,
        'PAYMENT_NOT_CONFIGURED'
      );
    }
    if (config.gateway !== gateway) {
      throw new AppError(
        'Active payment configuration does not match the webhook gateway',
        400,
        'PAYMENT_GATEWAY_MISMATCH'
      );
    }

    const strategy = getPaymentStrategy(config.gateway);
    return strategy.processWebhook(params, config);
  },
};

export const BillingContext = {
  emitInvoice: async (
    tenantId: string,
    order: OrderContext
  ): Promise<EmitInvoiceResult | null> => {
    const config = await getActiveBillingCredentials(tenantId);
    if (!config) return null;

    const strategy = getBillingStrategy(config.provider);
    return strategy.emitInvoice(order, config);
  },
};
