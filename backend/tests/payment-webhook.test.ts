import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { saveBillingConfig, savePaymentConfig } from '../src/modules/payments/payment-config.service';
import { handlePaymentWebhook } from '../src/modules/payments/payment-webhook.service';
import { FactElecBillingStrategy } from '../src/modules/payments/factelec-billing.strategy';
import { GET as webhookGET } from '../src/app/api/webhooks/payments/[gateway]/route';

describe('Payment webhook', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-webhook-a-${suffix}`;
  const tenantBId = `test-webhook-b-${suffix}`;
  const apiToken = `fct-${suffix}`;
  const customerNit = '12345678';

  let branchAId: string;
  let branchBId: string;
  let variantAId: string;
  let variantBId: string;
  let orderNativeId: string;
  let orderFactelecId: string;
  let orderFailId: string;

  const fetchMock = vi.fn();

  const createOrder = async (
    tenantId: string,
    branchId: string,
    variantId: string,
    txId: string,
    overrides: Record<string, unknown> = {}
  ) => {
    const order = await prisma.order.create({
      data: {
        tenantId,
        branchId,
        customerName: 'Cliente Webhook',
        customerPhone: '70000000',
        customerEmail: `wh-${suffix}@test.com`,
        customerNit: overrides.customerNit as string | null | undefined ?? customerNit,
        totalSnapshot: 200,
        whatsappMessage: 'msg',
        whatsappUrl: 'https://wa.me/59170000000',
        gatewayStatus: 'initiated',
        gatewayTransactionId: txId,
        ...overrides,
        items: {
          create: {
            variantId,
            quantity: 2,
            unitPriceSnapshot: 100,
            skuSnapshot: `SKU-WH-${suffix}-${variantId.slice(-4)}`,
            attributesSnapshot: {},
            tenantId,
          },
        },
      },
    });
    return order.id;
  };

  const getWebhook = (gateway: string, qs: string) =>
    webhookGET(new NextRequest(`http://localhost/api/webhooks/payments/${gateway}?${qs}`), {
      params: Promise.resolve({ gateway }),
    });

  beforeAll(async () => {
    vi.stubGlobal('fetch', fetchMock);

    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Webhook Tenant A', slug: `webhook-a-${suffix}` },
        { id: tenantBId, name: 'Webhook Tenant B', slug: `webhook-b-${suffix}` },
      ],
    });

    await savePaymentConfig(tenantAId, { gateway: 'LIBELULA', appkey: `wh-${suffix}`, isActive: true });
    await saveBillingConfig(tenantAId, {
      provider: 'FACTELEC',
      isEnabled: true,
      credentials: { apiToken },
    });

    const branchA = await prisma.branch.create({
      data: { name: 'Sucursal Webhook A', type: 'physical', tenantId: tenantAId },
    });
    const branchB = await prisma.branch.create({
      data: { name: 'Sucursal Webhook B', type: 'physical', tenantId: tenantBId },
    });
    branchAId = branchA.id;
    branchBId = branchB.id;

    const productA = await prisma.product.create({
      data: { name: 'Factura Webhook', tenantId: tenantAId },
    });
    const productB = await prisma.product.create({
      data: { name: 'Producto Native', tenantId: tenantBId },
    });

    const variantA = await prisma.variant.create({
      data: {
        productId: productA.id,
        tenantId: tenantAId,
        sku: `WH-A-${suffix}`,
        price: 100,
        cost: 40,
        codigoProductoSin: '83141',
      },
    });
    const variantB = await prisma.variant.create({
      data: { productId: productB.id, tenantId: tenantBId, sku: `WH-B-${suffix}`, price: 100, cost: 40 },
    });
    variantAId = variantA.id;
    variantBId = variantB.id;

    await prisma.stock.create({
      data: { variantId: variantAId, branchId: branchAId, tenantId: tenantAId, quantity: 10 },
    });
    await prisma.stock.create({
      data: { variantId: variantBId, branchId: branchBId, tenantId: tenantBId, quantity: 10 },
    });

    orderNativeId = await createOrder(tenantBId, branchBId, variantBId, `wh-native-${suffix}`);
    orderFactelecId = await createOrder(tenantAId, branchAId, variantAId, `wh-factelec-${suffix}`);
    orderFailId = await createOrder(tenantAId, branchAId, variantAId, `wh-fail-${suffix}`);
  });

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { cuf: `CUF-${suffix}`, url: `https://factelec.test/${suffix}.pdf` } }),
    });
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await prisma.auditLog.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.saleItem.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.sale.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.stockMovement.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.order.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.stock.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.variant.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.product.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.branch.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenantPaymentConfig.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenantBillingConfig.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await prisma.$disconnect();
  });

  it('rejects unknown gateways and unreadable payloads with 400', async () => {
    const badGateway = await getWebhook('PAYPAL', `transaction_id=abc`);
    expect(badGateway.status).toBe(400);
    expect((await badGateway.json()).error.code).toBe('INVALID_GATEWAY');

    const missingTx = await getWebhook('LIBELULA', '');
    expect(missingTx.status).toBe(400);
    expect((await missingTx.json()).error.code).toBe('INVALID_WEBHOOK_PAYLOAD');

    const unknownTx = await getWebhook('LIBELULA', 'transaction_id=does-not-exist');
    expect(unknownTx.status).toBe(400);
    expect((await unknownTx.json()).error.code).toBe('ORDER_NOT_FOUND');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('confirms the order, saves the native invoice and answers 200 OK', async () => {
    const response = await getWebhook(
      'LIBELULA',
      `transaction_id=wh-native-${suffix}&invoice_id=INV-NATIVE-${suffix}&invoice_url=https://libelula.test/inv.pdf`
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');

    const order = await prisma.order.findUnique({ where: { id: orderNativeId } });
    expect(order).toMatchObject({
      gatewayStatus: 'paid',
      billingInvoiceId: `INV-NATIVE-${suffix}`,
      billingInvoiceUrl: 'https://libelula.test/inv.pdf',
      status: 'completed',
    });

    const stock = await prisma.stock.findUnique({
      where: {
        tenantId_variantId_branchId: { tenantId: tenantBId, variantId: variantBId, branchId: branchBId },
      },
    });
    expect(stock?.quantity).toBe(8);

    const sales = await prisma.sale.findMany({ where: { tenantId: tenantBId } });
    expect(sales).toHaveLength(1);
    expect(sales[0].userId).toBeNull();

    const movements = await prisma.stockMovement.findMany({
      where: { tenantId: tenantBId, type: 'SALE' },
    });
    expect(movements).toHaveLength(1);

    const tenantBConfig = await prisma.tenantBillingConfig.count({ where: { tenantId: tenantBId } });
    expect(tenantBConfig).toBe(0);
  });

  it('is idempotent: a second delivery does not duplicate the sale or the stock', async () => {
    const response = await getWebhook(
      'LIBELULA',
      `transaction_id=wh-native-${suffix}&invoice_id=INV-NATIVE-${suffix}`
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');

    const stock = await prisma.stock.findUnique({
      where: {
        tenantId_variantId_branchId: { tenantId: tenantBId, variantId: variantBId, branchId: branchBId },
      },
    });
    expect(stock?.quantity).toBe(8);
    expect(await prisma.sale.count({ where: { tenantId: tenantBId } })).toBe(1);
    expect(await prisma.stockMovement.count({ where: { tenantId: tenantBId, type: 'SALE' } })).toBe(1);
  });

  it('emits the FactElec invoice asynchronously with decrypted credentials', async () => {
    const outcome = await handlePaymentWebhook('libelula', {
      transaction_id: `wh-factelec-${suffix}`,
    });

    expect(outcome.accepted).toBe(true);
    if (!outcome.accepted) return;
    expect(outcome.alreadyPaid).toBe(false);

    await outcome.billingTask;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.factelec-api.com/api/v1/facturas');
    expect(init.headers['x-api-token']).toBe(apiToken);

    const payload = JSON.parse(init.body);
    expect(payload).toEqual({
      cliente: {
        nombreRazonSocial: 'Cliente Webhook',
        numeroDocumento: customerNit,
        codigoTipoDocumento: 1,
      },
      codigoMetodoPago: 1,
      detalles: [
        {
          codigoProductoSin: '83141',
          codigoProducto: `SKU-WH-${suffix}-${variantAId.slice(-4)}`,
          descripcion: `Factura Webhook (SKU-WH-${suffix}-${variantAId.slice(-4)})`,
          cantidad: 2,
          precioUnitario: 100,
          subTotal: 200,
        },
      ],
    });

    const order = await prisma.order.findUnique({ where: { id: orderFactelecId } });
    expect(order).toMatchObject({
      gatewayStatus: 'paid',
      status: 'completed',
      billingInvoiceId: `CUF-${suffix}`,
      billingInvoiceUrl: `https://factelec.test/${suffix}.pdf`,
    });
  });

  it('answers 200 OK even when billing fails and records a retry state', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const response = await getWebhook('LIBELULA', `transaction_id=wh-fail-${suffix}`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');

    const order = await prisma.order.findUnique({ where: { id: orderFailId } });
    expect(order?.gatewayStatus).toBe('paid');
    expect(order?.billingInvoiceId).toBeNull();

    const audit = await vi.waitFor(
      async () => {
        const row = await prisma.auditLog.findFirst({
          where: { tenantId: tenantAId, entityId: orderFailId, action: 'BILLING_FAILED' },
        });
        if (!row) throw new Error('BILLING_FAILED audit row not found yet');
        return row;
      },
      { timeout: 3000, interval: 50 }
    );
    expect(JSON.stringify(audit.changes)).toContain('BILLING_GATEWAY_ERROR');
  });

  it('requires codigoProductoSin only when emitting with FactElec', async () => {
    const strategy = new FactElecBillingStrategy();

    await expect(
      strategy.emitInvoice(
        {
          id: 'order-x',
          tenantId: tenantAId,
          totalSnapshot: 100,
          customerName: 'Cliente',
          customerPhone: '70000000',
          customerEmail: 'a@b.com',
          customerNit,
          lines: [
            { sku: 'SKU-1', description: 'Prod', quantity: 1, unitPrice: 100, codigoProductoSin: null },
          ],
        },
        { provider: 'FACTELEC', credentials: { apiToken } }
      )
    ).rejects.toMatchObject({ code: 'BILLING_PRODUCT_CODE_REQUIRED' });

    await expect(
      strategy.emitInvoice(
        {
          id: 'order-y',
          tenantId: tenantAId,
          totalSnapshot: 100,
          customerName: 'Cliente',
          customerPhone: '70000000',
          customerEmail: 'a@b.com',
          customerNit: null,
          lines: [{ sku: 'SKU-1', description: 'Prod', quantity: 1, unitPrice: 100, codigoProductoSin: '83141' }],
        },
        { provider: 'FACTELEC', credentials: { apiToken } }
      )
    ).rejects.toMatchObject({ code: 'BILLING_DOCUMENT_REQUIRED' });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
