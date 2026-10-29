import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { AppError } from '../src/lib/errors';
import { generateAccessToken } from '../src/lib/auth';
import { savePaymentConfig } from '../src/modules/payments/payment-config.service';
import {
  getReconciliation,
  reconciliationToCSV,
  syncOrderPayment,
} from '../src/modules/payments/payment-reconciliation.service';
import {
  registerPaymentStrategy,
  type IPaymentStrategy,
} from '../src/modules/payments/payment-strategy';
import type {
  CreatePaymentResult,
  OrderPaymentStatus,
  OrderContext,
  PaymentGatewayCredentials,
  PaymentQueryRange,
  ReconciliationRecord,
  WebhookProcessResult,
} from '../src/modules/payments/payment-types';
import { GET as reconciliationGET } from '../src/app/api/payments/reconciliation/route';
import { POST as syncPOST } from '../src/app/api/orders/[id]/sync-payment/route';

class FakeReconciliationStrategy implements IPaymentStrategy {
  appkeysRequested: string[] = [];
  lastRange: PaymentQueryRange | null = null;
  payStatus = new Map<string, OrderPaymentStatus>();
  failWith: AppError | null = null;

  async createPayment(order: OrderContext): Promise<CreatePaymentResult> {
    return { gatewayTransactionId: `tx-fake-${order.id}`, status: 'initiated' };
  }

  async processWebhook(): Promise<WebhookProcessResult> {
    return { processed: true, status: 'paid' };
  }

  async queryPayments(
    config: PaymentGatewayCredentials,
    range: PaymentQueryRange
  ): Promise<ReconciliationRecord[]> {
    this.appkeysRequested.push(config.appkey);
    this.lastRange = range;
    if (this.failWith) throw this.failWith;

    return [
      {
        transactionId: 'tx-recon-1',
        identifier: 'order-1',
        paidAt: '2026-10-01 10:00:00',
        amountPaid: 150,
        paymentMethod: 'TARJETA DE CRÉDITO',
      },
      {
        transactionId: 'tx-recon-2',
        identifier: 'order-2',
        paidAt: '2026-10-02 11:30:00',
        amountPaid: 50,
        paymentMethod: 'TIGO MONEY',
      },
      {
        transactionId: 'tx-recon-3',
        identifier: 'order-3',
        paidAt: '2026-10-03 09:15:00',
        amountPaid: 75,
        paymentMethod: 'QR SIMPLE',
      },
    ];
  }

  async queryOrderPayment(
    config: PaymentGatewayCredentials,
    identifier: string
  ): Promise<OrderPaymentStatus> {
    this.appkeysRequested.push(config.appkey);
    if (this.failWith) throw this.failWith;
    return (
      this.payStatus.get(identifier) ?? { paid: false, paidAt: null, total: null }
    );
  }
}

class MinimalStrategy implements IPaymentStrategy {
  async createPayment(): Promise<CreatePaymentResult> {
    return { gatewayTransactionId: 'tx-minimal', status: 'initiated' };
  }

  async processWebhook(): Promise<WebhookProcessResult> {
    return { processed: false, status: 'failed' };
  }
}

describe('Payment reconciliation', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-recon-a-${suffix}`;
  const tenantBId = `test-recon-b-${suffix}`;
  const tenantCId = `test-recon-c-${suffix}`;
  const tenantDId = `test-recon-d-${suffix}`;
  const appkeyA = `appkey-a-${suffix}`;
  const appkeyB = `appkey-b-${suffix}`;
  const appkeyCucu = `appkey-cucu-${suffix}`;

  const fake = new FakeReconciliationStrategy();

  const now = Date.now();
  const validRange = { from: new Date(now - 10 * 86_400_000), to: new Date(now) };
  const tooLongRange = { from: new Date(now - 91 * 86_400_000), to: new Date(now) };

  let branchAId: string;
  let variantAId: string;
  let orderSyncId: string;
  let orderNoTxId: string;
  let orderUnpaidId: string;
  let orderBId: string;

  const createOrder = async (
    tenantId: string,
    branchId: string,
    variantId: string,
    overrides: Record<string, unknown> = {}
  ) => {
    const order = await prisma.order.create({
      data: {
        tenantId,
        branchId,
        customerName: 'Cliente Recon',
        customerPhone: '70000000',
        totalSnapshot: 200,
        whatsappMessage: 'msg',
        whatsappUrl: 'https://wa.me/59170000000',
        ...overrides,
        items: {
          create: {
            variantId,
            quantity: 2,
            unitPriceSnapshot: 100,
            skuSnapshot: `SKU-RE-${suffix}`,
            attributesSnapshot: {},
            tenantId,
          },
        },
      },
    });
    return order.id;
  };

  beforeAll(async () => {
    registerPaymentStrategy('LIBELULA', fake);

    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Recon Tenant A', slug: `recon-a-${suffix}` },
        { id: tenantBId, name: 'Recon Tenant B', slug: `recon-b-${suffix}` },
        { id: tenantCId, name: 'Recon Tenant C', slug: `recon-c-${suffix}` },
        { id: tenantDId, name: 'Recon Tenant D', slug: `recon-d-${suffix}` },
      ],
    });

    await savePaymentConfig(tenantAId, { gateway: 'LIBELULA', appkey: appkeyA, isActive: true });
    await savePaymentConfig(tenantBId, { gateway: 'LIBELULA', appkey: appkeyB, isActive: true });

    const branchA = await prisma.branch.create({
      data: { name: 'Sucursal Recon A', type: 'physical', tenantId: tenantAId },
    });
    const branchB = await prisma.branch.create({
      data: { name: 'Sucursal Recon B', type: 'physical', tenantId: tenantBId },
    });
    branchAId = branchA.id;

    const productA = await prisma.product.create({
      data: { name: 'Producto Recon', tenantId: tenantAId },
    });
    const productB = await prisma.product.create({
      data: { name: 'Producto Recon B', tenantId: tenantBId },
    });

    const variantA = await prisma.variant.create({
      data: { productId: productA.id, tenantId: tenantAId, sku: `RE-A-${suffix}`, price: 100, cost: 40 },
    });
    const variantB = await prisma.variant.create({
      data: { productId: productB.id, tenantId: tenantBId, sku: `RE-B-${suffix}`, price: 100, cost: 40 },
    });
    variantAId = variantA.id;

    await prisma.stock.create({
      data: { variantId: variantAId, branchId: branchAId, tenantId: tenantAId, quantity: 10 },
    });

    orderSyncId = await createOrder(tenantAId, branchAId, variantAId, {
      gatewayStatus: 'initiated',
      gatewayTransactionId: `sync-tx-${suffix}`,
    });
    orderNoTxId = await createOrder(tenantAId, branchAId, variantAId, {
      gatewayStatus: 'initiated',
    });
    orderUnpaidId = await createOrder(tenantAId, branchAId, variantAId, {
      gatewayStatus: 'initiated',
      gatewayTransactionId: `unpaid-tx-${suffix}`,
    });
    orderBId = await createOrder(tenantBId, branchB.id, variantB.id, {
      gatewayStatus: 'initiated',
      gatewayTransactionId: `orderb-tx-${suffix}`,
    });

    fake.payStatus.set(orderSyncId, {
      paid: true,
      paidAt: '2026-10-28 12:00:00',
      total: 200,
    });
    fake.payStatus.set(orderNoTxId, {
      paid: true,
      paidAt: '2026-10-28 12:05:00',
      total: 200,
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.saleItem.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.sale.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.stockMovement.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.order.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.stock.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.variant.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId, tenantCId, tenantDId] } } });
    await prisma.product.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId, tenantCId, tenantDId] } } });
    await prisma.branch.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId, tenantCId, tenantDId] } } });
    await prisma.tenantPaymentConfig.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId, tenantCId, tenantDId] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantAId, tenantBId, tenantCId, tenantDId] } },
    });
    await prisma.$disconnect();
  });

  it('lists tenant-scoped reconciliation with pagination and decrypted appkey', async () => {
    const page1 = await getReconciliation(tenantAId, { ...validRange, page: 1, pageSize: 2 });

    expect(page1.records).toHaveLength(2);
    expect(page1.meta).toEqual({ page: 1, pageSize: 2, total: 3 });
    expect(page1.records[0].paymentMethod).toBe('TARJETA DE CRÉDITO');
    expect(fake.appkeysRequested.at(-1)).toBe(appkeyA);

    const page2 = await getReconciliation(tenantAId, { ...validRange, page: 2, pageSize: 2 });
    expect(page2.records).toHaveLength(1);
    expect(page2.records[0].transactionId).toBe('tx-recon-3');
    expect(fake.lastRange).toEqual(validRange);
  });

  it('validates the query range (max 90 days, from before to)', async () => {
    await expect(
      getReconciliation(tenantAId, { ...tooLongRange, page: 1, pageSize: 20 })
    ).rejects.toMatchObject({ code: 'RANGE_TOO_LONG' });

    await expect(
      getReconciliation(tenantAId, { from: validRange.to, to: validRange.from, page: 1, pageSize: 20 })
    ).rejects.toMatchObject({ code: 'INVALID_RANGE' });
  });

  it('isolates tenants: each one queries the gateway with its own appkey', async () => {
    await getReconciliation(tenantBId, { ...validRange, page: 1, pageSize: 20 });
    expect(fake.appkeysRequested.at(-1)).toBe(appkeyB);
    expect(appkeyB).not.toBe(appkeyA);

    await expect(
      getReconciliation(tenantCId, { ...validRange, page: 1, pageSize: 20 })
    ).rejects.toMatchObject({ code: 'PAYMENT_NOT_CONFIGURED' });
  });

  it('rejects gateways without reconciliation support', async () => {
    registerPaymentStrategy('CUCU', new MinimalStrategy());
    await savePaymentConfig(tenantDId, { gateway: 'CUCU', appkey: appkeyCucu, isActive: true });

    await expect(
      getReconciliation(tenantDId, { ...validRange, page: 1, pageSize: 20 })
    ).rejects.toMatchObject({ code: 'RECONCILIATION_NOT_SUPPORTED' });
  });

  it('exports CSV without leaking credentials', async () => {
    const csv = await reconciliationToCSV(tenantAId, validRange);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('transactionId,identifier,paidAt,amountPaid,paymentMethod');
    expect(lines).toHaveLength(4);
    expect(csv).toContain('tx-recon-1');
    expect(csv).toContain('QR SIMPLE');
    expect(csv).not.toContain(appkeyA);
  });

  it('maps gateway failures to clear errors', async () => {
    fake.failWith = new AppError('Payment gateway responded with status 503', 502, 'GATEWAY_ERROR');
    try {
      await expect(
        getReconciliation(tenantAId, { ...validRange, page: 1, pageSize: 20 })
      ).rejects.toMatchObject({ code: 'GATEWAY_ERROR', statusCode: 502 });
    } finally {
      fake.failWith = null;
    }
  });

  it('syncs an order paid out of band through the webhook pipeline, idempotently', async () => {
    const first = await syncOrderPayment(tenantAId, orderSyncId);
    expect(first).toMatchObject({ paid: true, changed: true, gatewayStatus: 'paid' });

    const order = await prisma.order.findUnique({ where: { id: orderSyncId } });
    expect(order).toMatchObject({ gatewayStatus: 'paid', status: 'completed' });

    expect(await prisma.sale.count({ where: { tenantId: tenantAId } })).toBe(1);

    const stock = await prisma.stock.findUnique({
      where: {
        tenantId_variantId_branchId: { tenantId: tenantAId, variantId: variantAId, branchId: branchAId },
      },
    });
    expect(stock?.quantity).toBe(8);

    const second = await syncOrderPayment(tenantAId, orderSyncId);
    expect(second).toMatchObject({ paid: true, changed: false });
    expect(await prisma.sale.count({ where: { tenantId: tenantAId } })).toBe(1);
    expect(
      await prisma.stock.findUnique({
        where: {
          tenantId_variantId_branchId: { tenantId: tenantAId, variantId: variantAId, branchId: branchAId },
        },
      })
    ).toMatchObject({ quantity: 8 });
  });

  it('marks paid without transaction id but keeps the commercial status untouched', async () => {
    const result = await syncOrderPayment(tenantAId, orderNoTxId);
    expect(result).toMatchObject({ paid: true, changed: true, gatewayStatus: 'paid' });

    const order = await prisma.order.findUnique({ where: { id: orderNoTxId } });
    expect(order?.status).toBe('pending');
    expect(await prisma.sale.count({ where: { tenantId: tenantAId } })).toBe(1);
  });

  it('does nothing when the gateway reports the debt as unpaid', async () => {
    const result = await syncOrderPayment(tenantAId, orderUnpaidId);
    expect(result).toMatchObject({ paid: false, changed: false, gatewayStatus: 'initiated' });

    const order = await prisma.order.findUnique({ where: { id: orderUnpaidId } });
    expect(order?.gatewayStatus).toBe('initiated');
  });

  it('never syncs an order of another tenant', async () => {
    await expect(syncOrderPayment(tenantBId, orderSyncId)).rejects.toMatchObject({
      code: 'ORDER_NOT_FOUND',
    });
    await expect(syncOrderPayment(tenantAId, orderBId)).rejects.toMatchObject({
      code: 'ORDER_NOT_FOUND',
    });
  });

  describe('API routes', () => {
    const headersFor = (role: 'ADMIN' | 'SELLER', tenantId: string) => ({
      Authorization: `Bearer ${generateAccessToken({
        userId: `user-recon-${role}-${suffix}`,
        role,
        tenantId,
      })}`,
    });

    const qs = `from=${validRange.from.toISOString()}&to=${validRange.to.toISOString()}`;

    it('serves reconciliation for an ADMIN with the standard envelope', async () => {
      const response = await reconciliationGET(
        new NextRequest(`http://localhost/api/payments/reconciliation?${qs}&pageSize=2`, {
          headers: headersFor('ADMIN', tenantAId),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.meta).toEqual({ page: 1, pageSize: 2, total: 3 });
      expect(JSON.stringify(body)).not.toContain(appkeyA);
    });

    it('rejects roles without the reports permission', async () => {
      const response = await reconciliationGET(
        new NextRequest(`http://localhost/api/payments/reconciliation?${qs}`, {
          headers: headersFor('SELLER', tenantAId),
        })
      );
      expect(response.status).toBe(403);
    });

    it('rejects invalid ranges with 400', async () => {
      const reversed = await reconciliationGET(
        new NextRequest(
          `http://localhost/api/payments/reconciliation?from=${validRange.to.toISOString()}&to=${validRange.from.toISOString()}`,
          { headers: headersFor('ADMIN', tenantAId) }
        )
      );
      expect(reversed.status).toBe(400);
      expect((await reversed.json()).error.code).toBe('INVALID_RANGE');

      const tooLong = await reconciliationGET(
        new NextRequest(
          `http://localhost/api/payments/reconciliation?from=${tooLongRange.from.toISOString()}&to=${tooLongRange.to.toISOString()}`,
          { headers: headersFor('ADMIN', tenantAId) }
        )
      );
      expect(tooLong.status).toBe(400);
      expect((await tooLong.json()).error.code).toBe('RANGE_TOO_LONG');
    });

    it('restricts sync to the settings permission and to the JWT tenant', async () => {
      const seller = await syncPOST(
        new NextRequest(`http://localhost/api/orders/${orderSyncId}/sync-payment`, {
          method: 'POST',
          headers: headersFor('SELLER', tenantAId),
        }),
        { params: Promise.resolve({ id: orderSyncId }) }
      );
      expect(seller.status).toBe(403);

      const crossTenant = await syncPOST(
        new NextRequest(`http://localhost/api/orders/${orderSyncId}/sync-payment`, {
          method: 'POST',
          headers: headersFor('ADMIN', tenantBId),
        }),
        { params: Promise.resolve({ id: orderSyncId }) }
      );
      expect(crossTenant.status).toBe(404);
    });
  });
});
