import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { AppError } from '../src/lib/errors';
import {
  getActiveBillingCredentials,
  getActivePaymentCredentials,
  saveBillingConfig,
  savePaymentConfig,
} from '../src/modules/payments/payment-config.service';
import { BillingContext, PaymentContext } from '../src/modules/payments/payment-context';
import {
  getBillingStrategy,
  getPaymentStrategy,
  registerBillingStrategy,
  registerPaymentStrategy,
  type IBillingStrategy,
  type IPaymentStrategy,
} from '../src/modules/payments/payment-strategy';
import type { OrderContext } from '../src/modules/payments/payment-types';

class FakePaymentStrategy implements IPaymentStrategy {
  createPaymentCalls: Array<{ order: OrderContext; appkey: string }> = [];
  webhookCalls: Array<{ transactionId: string | undefined; appkey: string }> = [];

  constructor(private readonly suffix: string) {}

  async createPayment(order: OrderContext, config: { gateway: string; appkey: string }) {
    this.createPaymentCalls.push({ order, appkey: config.appkey });
    return {
      gatewayTransactionId: `tx-${this.suffix}-${order.id}`,
      qrUrl: `https://qr.test/${this.suffix}/${order.id}`,
      paymentUrl: null,
      status: 'initiated' as const,
    };
  }

  async processWebhook(
    params: { query: Record<string, string> },
    config: { gateway: string; appkey: string }
  ) {
    this.webhookCalls.push({
      transactionId: params.query.transaction_id,
      appkey: config.appkey,
    });
    return {
      processed: true,
      status: 'paid' as const,
      gatewayTransactionId: params.query.transaction_id,
      invoiceId: null,
      invoiceUrl: null,
    };
  }
}

class FakeBillingStrategy implements IBillingStrategy {
  emitCalls: Array<{ orderId: string; credentials: Record<string, string> }> = [];

  async emitInvoice(order: OrderContext, config: { credentials: Record<string, string> }) {
    this.emitCalls.push({ orderId: order.id, credentials: config.credentials });
    return { invoiceId: `inv-${order.id}`, invoiceUrl: `https://pdf.test/${order.id}` };
  }
}

describe('Payment and billing strategies', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-strat-a-${suffix}`;
  const tenantBId = `test-strat-b-${suffix}`;
  const tenantCId = `test-strat-c-${suffix}`;

  const libelulaAppkey = `libelula-appkey-${suffix}`;
  const cucuAppkey = `cucu-appkey-${suffix}`;
  const factelecToken = `fct-token-${suffix}`;

  const libelulaFake = new FakePaymentStrategy('libelula');
  const cucuStub = new FakePaymentStrategy('cucu');
  const factelecFake = new FakeBillingStrategy();

  const orderFor = (tenantId: string): OrderContext => ({
    id: `order-${tenantId}`,
    tenantId,
    totalSnapshot: 250,
    customerName: 'Cliente Test',
    customerPhone: '70000000',
    customerEmail: 'cliente@test.com',
    lines: [
      { sku: `SKU-${suffix}`, description: 'Producto', quantity: 2, unitPrice: 125 },
    ],
  });

  beforeAll(async () => {
    registerPaymentStrategy('LIBELULA', libelulaFake);

    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Strat Tenant A', slug: `strat-a-${suffix}` },
        { id: tenantBId, name: 'Strat Tenant B', slug: `strat-b-${suffix}` },
        { id: tenantCId, name: 'Strat Tenant C', slug: `strat-c-${suffix}` },
      ],
    });

    await savePaymentConfig(tenantAId, { gateway: 'LIBELULA', appkey: libelulaAppkey, isActive: true });
    await saveBillingConfig(tenantAId, {
      provider: 'FACTELEC',
      isEnabled: true,
      credentials: { apiToken: factelecToken },
    });

    await savePaymentConfig(tenantBId, { gateway: 'CUCU', appkey: cucuAppkey, isActive: true });
    await saveBillingConfig(tenantBId, {
      provider: 'FACTELEC',
      isEnabled: false,
      credentials: { apiToken: 'disabled-token' },
    });

    await saveBillingConfig(tenantCId, {
      provider: 'LIBELULA_NATIVE',
      isEnabled: true,
      credentials: { nativeKey: 'native-secret' },
    });
  });

  afterAll(async () => {
    await prisma.tenantPaymentConfig.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId, tenantCId] } },
    });
    await prisma.tenantBillingConfig.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId, tenantCId] } },
    });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId, tenantCId] } } });
    await prisma.$disconnect();
  });

  it('resolves the active gateway strategy per tenant with decrypted credentials', async () => {
    const result = await PaymentContext.createPayment(tenantAId, orderFor(tenantAId));

    expect(result.gatewayTransactionId).toBe(`tx-libelula-order-${tenantAId}`);
    expect(result.qrUrl).toBe(`https://qr.test/libelula/order-${tenantAId}`);
    expect(result.status).toBe('initiated');

    expect(libelulaFake.createPaymentCalls).toHaveLength(1);
    expect(libelulaFake.createPaymentCalls[0].appkey).toBe(libelulaAppkey);
    expect(libelulaFake.createPaymentCalls[0].appkey).not.toContain('v1:');
  });

  it('throws PAYMENT_NOT_CONFIGURED when the tenant has no active config', async () => {
    await expect(PaymentContext.createPayment(tenantCId, orderFor(tenantCId))).rejects.toMatchObject({
      code: 'PAYMENT_NOT_CONFIGURED',
    });

    const disabled = await savePaymentConfig(tenantCId, {
      gateway: 'LIBELULA',
      appkey: `c-${libelulaAppkey}`,
      isActive: false,
    });
    expect(disabled.isActive).toBe(false);

    await expect(PaymentContext.createPayment(tenantCId, orderFor(tenantCId))).rejects.toMatchObject({
      code: 'PAYMENT_NOT_CONFIGURED',
    });
    await expect(PaymentContext.createPayment('missing-tenant', orderFor('missing-tenant'))).rejects.toBeInstanceOf(
      AppError
    );
  });

  it('registers a fictitious provider (CUCU stub) without touching the rest', async () => {
    expect(() => getPaymentStrategy('CUCU')).toThrow(AppError);

    registerPaymentStrategy('CUCU', cucuStub);
    expect(getPaymentStrategy('CUCU')).toBe(cucuStub);
    expect(getPaymentStrategy('LIBELULA')).toBe(libelulaFake);

    const result = await PaymentContext.createPayment(tenantBId, orderFor(tenantBId));
    expect(result.gatewayTransactionId).toBe(`tx-cucu-order-${tenantBId}`);
    expect(cucuStub.createPaymentCalls[0].appkey).toBe(cucuAppkey);
    expect(libelulaFake.createPaymentCalls).toHaveLength(1);
  });

  it('delegates webhooks to the tenant strategy and rejects gateway mismatches', async () => {
    const result = await PaymentContext.processWebhook(tenantAId, 'LIBELULA', {
      query: { transaction_id: 'tx-webhook-1' },
    });

    expect(result.processed).toBe(true);
    expect(result.status).toBe('paid');
    expect(result.gatewayTransactionId).toBe('tx-webhook-1');
    expect(libelulaFake.webhookCalls[0]).toEqual({
      transactionId: 'tx-webhook-1',
      appkey: libelulaAppkey,
    });

    await expect(PaymentContext.processWebhook(tenantAId, 'CUCU', { query: {} })).rejects.toMatchObject({
      code: 'PAYMENT_GATEWAY_MISMATCH',
    });
    await expect(PaymentContext.processWebhook(tenantCId, 'LIBELULA', { query: {} })).rejects.toMatchObject({
      code: 'PAYMENT_NOT_CONFIGURED',
    });
  });

  it('emits invoices through the enabled billing strategy with decrypted credentials', async () => {
    registerBillingStrategy('FACTELEC', factelecFake);

    const result = await BillingContext.emitInvoice(tenantAId, orderFor(tenantAId));

    expect(result).toEqual({
      invoiceId: `inv-order-${tenantAId}`,
      invoiceUrl: `https://pdf.test/order-${tenantAId}`,
    });
    expect(factelecFake.emitCalls[0].credentials.apiToken).toBe(factelecToken);
  });

  it('runs a no-op when billing is disabled, missing or delegated to Libélula native', async () => {
    expect(await BillingContext.emitInvoice(tenantBId, orderFor(tenantBId))).toBeNull();
    expect(await BillingContext.emitInvoice(tenantCId, orderFor(tenantCId))).toBeNull();
    expect(await BillingContext.emitInvoice('missing-tenant', orderFor('missing-tenant'))).toBeNull();
    expect(factelecFake.emitCalls).toHaveLength(1);
  });

  it('loads only decrypted credentials scoped to the tenant', async () => {
    const paymentConfig = await getActivePaymentCredentials(tenantAId);
    expect(paymentConfig).toEqual({ gateway: 'LIBELULA', appkey: libelulaAppkey });

    const billingConfig = await getActiveBillingCredentials(tenantAId);
    expect(billingConfig).toEqual({ provider: 'FACTELEC', credentials: { apiToken: factelecToken } });

    expect(await getActivePaymentCredentials(tenantCId)).toBeNull();
    expect(await getActiveBillingCredentials(tenantBId)).toBeNull();
  });

  it('throws a clear error when a gateway strategy is not registered', async () => {
    const strategy = getBillingStrategy('FACTELEC');
    expect(strategy).toBe(factelecFake);
    expect(() => getBillingStrategy('LIBELULA_NATIVE')).toThrow(AppError);
  });
});
