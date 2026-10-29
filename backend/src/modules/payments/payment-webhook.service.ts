import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { logAction } from '@/modules/audit/audit.service';
import { confirmOrder } from '@/modules/orders/order.service';
import { BillingContext } from './payment-context';
import { registerBuiltinStrategies } from './builtin-strategies';
import type { OrderContext } from './payment-types';

export type WebhookQuery = Record<string, string | undefined>;

export type WebhookOutcome =
  | {
      accepted: true;
      orderId: string;
      tenantId: string;
      alreadyPaid: boolean;
      billingTask: Promise<void>;
    }
  | {
      accepted: false;
      status: number;
      code: string;
      message: string;
    };

const normalizeGateway = (value: string): string => value.toUpperCase();

const isPaymentGateway = (value: string): boolean =>
  value === 'LIBELULA' || value === 'CUCU';

const reject = (status: number, code: string, message: string): WebhookOutcome => ({
  accepted: false,
  status,
  code,
  message,
});

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

type WebhookOrder = {
  id: string;
  tenantId: string;
  status: string;
  gatewayStatus: string | null;
  totalSnapshot: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerNit: string | null;
  representativeId: string | null;
  items: Array<{
    skuSnapshot: string;
    quantity: number;
    unitPriceSnapshot: number;
    variant: { codigoProductoSin: string | null; product: { name: string } };
  }>;
};

const toOrderContext = (order: WebhookOrder): OrderContext => ({
  id: order.id,
  tenantId: order.tenantId,
  totalSnapshot: order.totalSnapshot,
  customerName: order.customerName,
  customerPhone: order.customerPhone,
  customerEmail: order.customerEmail,
  customerNit: order.customerNit,
  lines: order.items.map((item) => ({
    sku: item.skuSnapshot,
    description: `${item.variant.product.name} (${item.skuSnapshot})`,
    quantity: item.quantity,
    unitPrice: item.unitPriceSnapshot,
    codigoProductoSin: item.variant.codigoProductoSin,
  })),
});

const logWebhookFailure = async (
  action: 'CONFIRM_FAILED' | 'BILLING_FAILED',
  tenantId: string,
  orderId: string,
  error: unknown
) => {
  const message = errorMessage(error);
  const code = error instanceof AppError ? error.code : 'UNKNOWN';
  console.error(`[webhook] ${action.toLowerCase()} for order ${orderId} (${code}):`, message);
  await logAction({
    tenantId,
    action,
    entity: 'Order',
    entityId: orderId,
    changes: { code, error: message },
  }).catch(() => undefined);
};

const noopBillingTask = Promise.resolve();

export const handlePaymentWebhook = async (
  gatewayParam: string,
  query: WebhookQuery
): Promise<WebhookOutcome> => {
  const gateway = normalizeGateway(gatewayParam);
  if (!isPaymentGateway(gateway)) {
    return reject(400, 'INVALID_GATEWAY', `Unknown payment gateway ${gatewayParam}`);
  }

  const transactionId = query.transaction_id;
  if (!transactionId) {
    return reject(400, 'INVALID_WEBHOOK_PAYLOAD', 'transaction_id is required');
  }

  const order = await prisma.order.findFirst({
    where: { gatewayTransactionId: transactionId },
    include: {
      tenant: { select: { active: true } },
      items: {
        include: { variant: { include: { product: { select: { name: true } } } } },
      },
    },
  });

  if (!order) {
    return reject(400, 'ORDER_NOT_FOUND', 'No order matches the provided transaction_id');
  }

  if (!order.tenant.active) {
    return reject(400, 'TENANT_INACTIVE', 'The tenant for this order is inactive');
  }

  if (order.gatewayStatus === 'paid') {
    return {
      accepted: true,
      orderId: order.id,
      tenantId: order.tenantId,
      alreadyPaid: true,
      billingTask: noopBillingTask,
    };
  }

  const invoiceId = query.invoice_id ?? null;
  const invoiceUrl = query.invoice_url ?? null;

  const claim = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, gatewayStatus: { not: 'paid' } },
      data: {
        gatewayStatus: 'paid',
        ...(invoiceId ? { billingInvoiceId: invoiceId } : {}),
        ...(invoiceUrl ? { billingInvoiceUrl: invoiceUrl } : {}),
      },
    });

    if (updated.count === 0) {
      return { claimed: false, nextStatus: order.status };
    }

    let nextStatus = order.status;
    if (order.status === 'pending' || order.status === 'contacted') {
      await tx.order.update({ where: { id: order.id }, data: { status: 'confirmed' } });
      nextStatus = 'confirmed';
    }

    return { claimed: true, nextStatus };
  });

  if (!claim.claimed) {
    return {
      accepted: true,
      orderId: order.id,
      tenantId: order.tenantId,
      alreadyPaid: true,
      billingTask: noopBillingTask,
    };
  }

  if (claim.nextStatus === 'confirmed') {
    try {
      await confirmOrder(order.tenantId, order.id, order.representativeId);
    } catch (error) {
      await logWebhookFailure('CONFIRM_FAILED', order.tenantId, order.id, error);
    }
  } else if (claim.nextStatus === 'cancelled') {
    await logWebhookFailure(
      'CONFIRM_FAILED',
      order.tenantId,
      order.id,
      new AppError('Order is paid but was cancelled; confirmation skipped', 400, 'ORDER_CANCELLED')
    );
  }

  const billingTask = (async () => {
    try {
      registerBuiltinStrategies();
      const invoice = await BillingContext.emitInvoice(order.tenantId, toOrderContext(order));
      if (invoice) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            billingInvoiceId: invoice.invoiceId,
            billingInvoiceUrl: invoice.invoiceUrl,
          },
        });
      }
    } catch (error) {
      await logWebhookFailure('BILLING_FAILED', order.tenantId, order.id, error);
    }
  })();

  return {
    accepted: true,
    orderId: order.id,
    tenantId: order.tenantId,
    alreadyPaid: false,
    billingTask,
  };
};
