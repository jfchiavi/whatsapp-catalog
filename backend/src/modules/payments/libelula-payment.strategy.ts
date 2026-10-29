import { AppError } from '@/lib/errors';
import type { IPaymentStrategy } from './payment-strategy';
import type {
  CreatePaymentResult,
  OrderContext,
  PaymentGatewayCredentials,
  WebhookParams,
  WebhookProcessResult,
} from './payment-types';

const LIBELULA_REGISTER_URL = 'https://api.libelula.bo/rest/deuda/registrar';

type LibelulaRegisterResponse = {
  error?: boolean;
  mensaje?: string;
  id_transaccion?: string;
  url_pasarela_pagos?: string;
  qr_simple_url?: string;
};

const getCallbackUrl = (): string => {
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    throw new AppError(
      'APP_BASE_URL is not configured',
      500,
      'APP_BASE_URL_MISSING'
    );
  }
  return `${baseUrl.replace(/\/$/, '')}/api/webhooks/payments/libelula`;
};

export class LibelulaPaymentStrategy implements IPaymentStrategy {
  async createPayment(
    order: OrderContext,
    config: PaymentGatewayCredentials
  ): Promise<CreatePaymentResult> {
    if (!order.customerEmail) {
      throw new AppError(
        'customerEmail is required to register a debt with Libélula',
        400,
        'CUSTOMER_EMAIL_REQUIRED'
      );
    }

    const payload = {
      appkey: config.appkey,
      email_cliente: order.customerEmail,
      identificador_deuda: order.id,
      callback_url: getCallbackUrl(),
      nombre_cliente: order.customerName,
      moneda: 'BOB',
      ...(order.customerNit ? { nit: order.customerNit, razon_social: order.customerName } : {}),
      lineas_detalle_deuda: order.lines.map((line) => ({
        concepto: line.description,
        cantidad: line.quantity,
        costo_unitario: line.unitPrice,
      })),
    };

    let response: Response;
    try {
      response = await fetch(LIBELULA_REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new AppError('Payment gateway is unreachable', 502, 'GATEWAY_UNREACHABLE');
    }

    if (!response.ok) {
      throw new AppError(
        `Payment gateway responded with status ${response.status}`,
        502,
        'GATEWAY_ERROR'
      );
    }

    const data = (await response.json()) as LibelulaRegisterResponse;

    if (data.error === true || !data.id_transaccion) {
      console.error('[libelula] payment registration rejected:', data.mensaje ?? 'unknown error');
      throw new AppError('Payment gateway rejected the registration', 502, 'GATEWAY_ERROR');
    }

    return {
      gatewayTransactionId: data.id_transaccion,
      qrUrl: data.qr_simple_url ?? null,
      paymentUrl: data.url_pasarela_pagos ?? null,
      status: 'initiated',
    };
  }

  async processWebhook(params: WebhookParams): Promise<WebhookProcessResult> {
    const transactionId = params.query.transaction_id;

    if (!transactionId) {
      return { processed: false, status: 'failed' };
    }

    return {
      processed: true,
      status: 'paid',
      gatewayTransactionId: transactionId,
      invoiceId: params.query.invoice_id ?? null,
      invoiceUrl: params.query.invoice_url ?? null,
    };
  }
}
