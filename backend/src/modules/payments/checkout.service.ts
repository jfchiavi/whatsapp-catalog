import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { PaymentContext } from './payment-context';
import { registerBuiltinStrategies } from './builtin-strategies';
import type { OrderContext } from './payment-types';

const PAYABLE_ORDER_STATUSES = ['pending', 'contacted', 'confirmed'];

export type CheckoutResult = {
  orderId: string;
  customerEmail: string;
  gatewayTransactionId: string;
  qrUrl: string | null;
  paymentUrl: string | null;
  gatewayStatus: string;
};

const toOrderContext = (
  order: {
    id: string;
    tenantId: string;
    totalSnapshot: number;
    customerName: string;
    customerPhone: string;
    items: Array<{
      skuSnapshot: string;
      quantity: number;
      unitPriceSnapshot: number;
      variant: { product: { name: string } };
    }>;
  },
  customerEmail: string
): OrderContext => ({
  id: order.id,
  tenantId: order.tenantId,
  totalSnapshot: order.totalSnapshot,
  customerName: order.customerName,
  customerPhone: order.customerPhone,
  customerEmail,
  customerNit: null,
  lines: order.items.map((item) => ({
    sku: item.skuSnapshot,
    description: `${item.variant.product.name} (${item.skuSnapshot})`,
    quantity: item.quantity,
    unitPrice: item.unitPriceSnapshot,
  })),
});

export const initiateCheckout = async (
  tenantId: string,
  orderId: string,
  customerEmail: string
): Promise<CheckoutResult> => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      items: {
        include: { variant: { include: { product: true } } },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  if (order.gatewayStatus === 'paid') {
    throw new AppError('Order is already paid', 400, 'ORDER_ALREADY_PAID');
  }

  if (!PAYABLE_ORDER_STATUSES.includes(order.status)) {
    throw new AppError(
      'Order is not payable in its current status',
      400,
      'ORDER_NOT_PAYABLE'
    );
  }

  if (
    order.gatewayStatus === 'initiated' &&
    order.gatewayTransactionId
  ) {
    return {
      orderId: order.id,
      customerEmail,
      gatewayTransactionId: order.gatewayTransactionId,
      qrUrl: order.gatewayQrUrl ?? null,
      paymentUrl: order.gatewayPaymentUrl ?? null,
      gatewayStatus: 'initiated',
    };
  }

  registerBuiltinStrategies();

  const result = await PaymentContext.createPayment(
    tenantId,
    toOrderContext(order, customerEmail)
  );

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      customerEmail,
      gatewayTransactionId: result.gatewayTransactionId,
      gatewayStatus: 'initiated',
      gatewayQrUrl: result.qrUrl ?? null,
      gatewayPaymentUrl: result.paymentUrl ?? null,
    },
  });

  return {
    orderId: updated.id,
    customerEmail,
    gatewayTransactionId: updated.gatewayTransactionId!,
    qrUrl: updated.gatewayQrUrl ?? null,
    paymentUrl: updated.gatewayPaymentUrl ?? null,
    gatewayStatus: updated.gatewayStatus ?? 'initiated',
  };
};
