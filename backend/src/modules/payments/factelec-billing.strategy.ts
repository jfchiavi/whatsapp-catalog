import { AppError } from '@/lib/errors';
import type { IBillingStrategy } from './payment-strategy';
import type {
  BillingProviderCredentials,
  EmitInvoiceResult,
  OrderContext,
} from './payment-types';

const FACTELEC_INVOICE_URL = 'https://api.factelec-api.com/api/v1/facturas';

type FactElecResponse = {
  error?: boolean | string;
  message?: string;
  data?: {
    cuf?: string;
    url?: string;
    pdfUrl?: string;
    pdf?: string;
  };
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const resolveDocumentType = (document: string): number =>
  /^\d{7,8}$/.test(document) ? 1 : 2; // 1 = CI, 2 = NIT

export class FactElecBillingStrategy implements IBillingStrategy {
  async emitInvoice(
    order: OrderContext,
    config: BillingProviderCredentials
  ): Promise<EmitInvoiceResult> {
    const apiToken = config.credentials.apiToken;
    if (!apiToken) {
      throw new AppError(
        'FactElec apiToken is missing in the billing config',
        500,
        'BILLING_CREDENTIALS_MISSING'
      );
    }

    if (!order.customerNit) {
      throw new AppError(
        'Customer document (NIT/CI) is required to emit a FactElec invoice',
        400,
        'BILLING_DOCUMENT_REQUIRED'
      );
    }

    const detalles = order.lines.map((line) => {
      if (!line.codigoProductoSin) {
        throw new AppError(
          `Variant ${line.sku} requires codigoProductoSin to emit a FactElec invoice`,
          400,
          'BILLING_PRODUCT_CODE_REQUIRED'
        );
      }

      return {
        codigoProductoSin: line.codigoProductoSin,
        codigoProducto: line.sku,
        descripcion: line.description,
        cantidad: line.quantity,
        precioUnitario: round2(line.unitPrice),
        subTotal: round2(line.quantity * line.unitPrice),
      };
    });

    const payload = {
      cliente: {
        nombreRazonSocial: order.customerName,
        numeroDocumento: order.customerNit,
        codigoTipoDocumento: resolveDocumentType(order.customerNit),
      },
      codigoMetodoPago: 1,
      detalles,
    };

    let response: Response;
    try {
      response = await fetch(FACTELEC_INVOICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': apiToken,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new AppError('Billing gateway is unreachable', 502, 'BILLING_GATEWAY_UNREACHABLE');
    }

    if (!response.ok) {
      throw new AppError(
        `Billing gateway responded with status ${response.status}`,
        502,
        'BILLING_GATEWAY_ERROR'
      );
    }

    const body = (await response.json()) as FactElecResponse;
    const cuf = body.data?.cuf;

    if (!cuf) {
      console.error('[factelec] invoice rejected:', body.message ?? 'missing cuf');
      throw new AppError('Billing gateway did not return a CUF', 502, 'BILLING_GATEWAY_ERROR');
    }

    return {
      invoiceId: cuf,
      invoiceUrl: body.data?.url ?? body.data?.pdfUrl ?? body.data?.pdf ?? null,
    };
  }
}
