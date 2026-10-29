import { AppError } from '@/lib/errors';
import type { IPaymentStrategy } from './payment-strategy';
import type {
  CreatePaymentResult,
  OrderContext,
  PaymentGatewayCredentials,
  PaymentQueryRange,
  ReconciliationRecord,
  WebhookParams,
  WebhookProcessResult,
  OrderPaymentStatus,
} from './payment-types';

const LIBELULA_REGISTER_URL = 'https://api.libelula.bo/rest/deuda/registrar';
const LIBELULA_QUERY_PAYMENTS_URL = 'https://api.libelula.bo/rest/deuda/consultar_pagos';
const LIBELULA_QUERY_DEBT_URL =
  'https://api.libelula.bo/rest/deuda/consultar_deudas/por_identificador';

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

// Libélula espera `yyyy-MM-dd HH:mm:ss`; se formatea en UTC y los límites de
// rango los aporta el servicio con la validación de 90 días.
const formatGatewayDate = (date: Date): string =>
  date.toISOString().slice(0, 19).replace('T', ' ');

const postToLibelula = async (
  url: string,
  payload: Record<string, unknown>
): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetch(url, {
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

  return response.json();
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

  async queryPayments(
    config: PaymentGatewayCredentials,
    range: PaymentQueryRange
  ): Promise<ReconciliationRecord[]> {
    const body = await postToLibelula(LIBELULA_QUERY_PAYMENTS_URL, {
      appkey: config.appkey,
      fecha_inicial: formatGatewayDate(range.from),
      fecha_final: formatGatewayDate(range.to),
    });

    const datos = Array.isArray(body)
      ? body
      : (body as { datos?: unknown } | null)?.datos;

    if (!Array.isArray(datos)) {
      throw new AppError('Unexpected response from the payment gateway', 502, 'GATEWAY_ERROR');
    }

    return datos.map((entry) => {
      const row = (entry ?? {}) as Record<string, unknown>;
      const identifier =
        row.identificador_deuda != null
          ? String(row.identificador_deuda)
          : row.identificador != null
            ? String(row.identificador)
            : null;

      return {
        transactionId: String(row.id_transaccion ?? row.transaction_id ?? row.id ?? ''),
        identifier,
        paidAt: row.fecha_pago != null ? String(row.fecha_pago) : null,
        amountPaid: Number(row.monto_pagado ?? row.valor_total ?? 0) || 0,
        paymentMethod: String(row.forma_pago ?? 'DESCONOCIDO'),
      };
    });
  }

  async queryOrderPayment(
    config: PaymentGatewayCredentials,
    identifier: string
  ): Promise<OrderPaymentStatus> {
    const body = await postToLibelula(LIBELULA_QUERY_DEBT_URL, {
      appkey: config.appkey,
      identificador: identifier,
    });

    const datos = (body as { datos?: unknown } | null)?.datos;
    const row = (Array.isArray(datos) ? datos[0] : datos) ?? body;
    const data = (row ?? {}) as Record<string, unknown>;

    if (
      data.pagado === undefined &&
      data.fecha_pago === undefined &&
      data.valor_total === undefined
    ) {
      return { paid: false, paidAt: null, total: null };
    }

    return {
      paid: Boolean(data.pagado),
      paidAt: data.fecha_pago != null ? String(data.fecha_pago) : null,
      total: data.valor_total != null ? Number(data.valor_total) : null,
    };
  }
}
