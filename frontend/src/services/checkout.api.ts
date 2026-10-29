import { isAxiosError } from 'axios';
import { api } from './api';

export interface CheckoutPaymentResult {
  orderId: string;
  customerEmail: string;
  gatewayTransactionId: string;
  qrUrl: string | null;
  paymentUrl: string | null;
  gatewayStatus: string;
}

export interface CheckoutStatus {
  orderId: string;
  status: string;
  gatewayStatus: string | null;
  qrUrl: string | null;
  paymentUrl: string | null;
  billingInvoiceId: string | null;
  billingInvoiceUrl: string | null;
}

export const initiatePayment = async (
  tenantId: string,
  orderId: string,
  customerEmail: string,
  customerNit?: string
): Promise<CheckoutPaymentResult> => {
  const { data } = await api.post(
    '/checkout',
    { orderId, customerEmail, ...(customerNit ? { customerNit } : {}) },
    { headers: { 'X-Tenant-ID': tenantId }, timeout: 20000 }
  );
  return data;
};

export const getCheckoutStatus = async (
  tenantId: string,
  orderId: string
): Promise<CheckoutStatus> => {
  const { data } = await api.get(`/checkout/${orderId}`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  return data;
};

const ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_NOT_CONFIGURED:
    'Esta tienda todavía no tiene pagos en línea habilitados. Coordiná tu pedido por WhatsApp.',
  ORDER_NOT_PAYABLE: 'Este pedido no está disponible para pago en línea.',
  ORDER_ALREADY_PAID: 'Este pedido ya fue pagado.',
  ORDER_NOT_FOUND: 'No encontramos el pedido. Volvé a intentarlo.',
  CUSTOMER_EMAIL_REQUIRED: 'Ingresá un correo electrónico válido para pagar en línea.',
  GATEWAY_ERROR: 'La pasarela de pagos rechazó la operación. Intentá nuevamente.',
  GATEWAY_UNREACHABLE: 'La pasarela de pagos no responde en este momento. Intentá nuevamente.',
  VALIDATION_ERROR: 'Revisá los datos del formulario.',
};

export const describeCheckoutError = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'La pasarela tardó demasiado en responder. Intentá nuevamente.';
    }
    const code = error.response?.data?.error?.code as string | undefined;
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
    if (error.response) return ERROR_MESSAGES.VALIDATION_ERROR;
    return 'No se pudo conectar con el servidor de pagos. Verificá tu conexión.';
  }
  return 'No se pudo iniciar el pago. Intentá nuevamente.';
};
