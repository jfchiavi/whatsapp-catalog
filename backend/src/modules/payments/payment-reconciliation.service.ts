import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { toCSV } from '@/modules/import-export/import-export.service';
import { getActivePaymentCredentials } from './payment-config.service';
import { getPaymentStrategy } from './payment-strategy';
import { processPaidOrder } from './payment-webhook.service';
import type { ReconciliationRecord } from './payment-types';

const MAX_RANGE_DAYS = 90;

export type ReconciliationQuery = {
  from: Date;
  to: Date;
  page: number;
  pageSize: number;
};

export type ReconciliationResult = {
  records: ReconciliationRecord[];
  meta: { page: number; pageSize: number; total: number };
};

export type SyncPaymentResult = {
  orderId: string;
  paid: boolean;
  changed: boolean;
  gatewayStatus: string | null;
  paidAt: string | null;
};

const assertRange = (from: Date, to: Date) => {
  if (from.getTime() >= to.getTime()) {
    throw new AppError('Invalid date range: `from` must be before `to`', 400, 'INVALID_RANGE');
  }
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    throw new AppError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`, 400, 'RANGE_TOO_LONG');
  }
};

const loadReconciliationStrategy = async (tenantId: string) => {
  const config = await getActivePaymentCredentials(tenantId);
  if (!config) {
    throw new AppError(
      'No active payment configuration for this tenant',
      400,
      'PAYMENT_NOT_CONFIGURED'
    );
  }

  const strategy = getPaymentStrategy(config.gateway);
  if (!strategy.queryPayments || !strategy.queryOrderPayment) {
    throw new AppError(
      `Gateway ${config.gateway} does not support reconciliation`,
      400,
      'RECONCILIATION_NOT_SUPPORTED'
    );
  }

  return { config, strategy };
};

const withQueryPayments = async (
  tenantId: string,
  range: { from: Date; to: Date }
): Promise<ReconciliationRecord[]> => {
  assertRange(range.from, range.to);
  const { config, strategy } = await loadReconciliationStrategy(tenantId);
  return strategy.queryPayments!(config, { from: range.from, to: range.to });
};

export const getReconciliation = async (
  tenantId: string,
  query: ReconciliationQuery
): Promise<ReconciliationResult> => {
  const records = await withQueryPayments(tenantId, query);

  const total = records.length;
  const start = (query.page - 1) * query.pageSize;
  const pageRecords = records.slice(start, start + query.pageSize);

  return {
    records: pageRecords,
    meta: { page: query.page, pageSize: query.pageSize, total },
  };
};

export const reconciliationToCSV = async (
  tenantId: string,
  range: { from: Date; to: Date }
): Promise<string> => {
  const records = await withQueryPayments(tenantId, range);

  return toCSV(
    ['transactionId', 'identifier', 'paidAt', 'amountPaid', 'paymentMethod'],
    records.map((record) => [
      record.transactionId,
      record.identifier,
      record.paidAt,
      record.amountPaid,
      record.paymentMethod,
    ])
  );
};

export const syncOrderPayment = async (
  tenantId: string,
  orderId: string
): Promise<SyncPaymentResult> => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      items: {
        include: { variant: { include: { product: { select: { name: true } } } } },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  const { config, strategy } = await loadReconciliationStrategy(tenantId);
  const status = await strategy.queryOrderPayment!(config, order.id);

  if (!status.paid) {
    return {
      orderId: order.id,
      paid: false,
      changed: false,
      gatewayStatus: order.gatewayStatus,
      paidAt: null,
    };
  }

  if (order.gatewayStatus === 'paid') {
    return {
      orderId: order.id,
      paid: true,
      changed: false,
      gatewayStatus: 'paid',
      paidAt: status.paidAt,
    };
  }

  if (order.gatewayTransactionId) {
    // Mismo pipeline que el webhook: claim idempotente + confirmación + billing.
    const result = await processPaidOrder(order, null, null);
    if (result.claimed) {
      await result.billingTask;
    }
    return {
      orderId: order.id,
      paid: true,
      changed: result.claimed,
      gatewayStatus: 'paid',
      paidAt: status.paidAt,
    };
  }

  // Caso borde: la pasarela conoce la deuda pero la orden quedó sin
  // transacción registrada; se marca pagado sin pipeline (requiere revisión).
  const claimed = await prisma.order.updateMany({
    where: { id: order.id, gatewayStatus: { not: 'paid' } },
    data: { gatewayStatus: 'paid' },
  });

  return {
    orderId: order.id,
    paid: true,
    changed: claimed.count > 0,
    gatewayStatus: 'paid',
    paidAt: status.paidAt,
  };
};
