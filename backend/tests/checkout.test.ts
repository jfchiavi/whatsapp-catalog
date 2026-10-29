import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { savePaymentConfig } from '../src/modules/payments/payment-config.service';
import { POST as checkoutPOST } from '../src/app/api/checkout/route';

describe('Checkout API', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-checkout-a-${suffix}`;
  const tenantBId = `test-checkout-b-${suffix}`;
  const appkey = `checkout-appkey-${suffix}`;
  const customerEmail = `cliente-${suffix}@test.com`;

  let branchAId: string;
  let branchBId: string;
  let variantAId: string;
  let variantBId: string;
  let orderMainId: string;
  let orderCancelledId: string;
  let orderPaidId: string;
  let orderBId: string;

  const fetchMock = vi.fn();
  let txCounter = 0;

  const successGatewayResponse = () => ({
    ok: true,
    json: async () => ({
      error: false,
      mensaje: 'Deuda registrada con éxito',
      id_transaccion: `tx-${suffix}-${++txCounter}`,
      url_pasarela_pagos: `https://pasarela.test/${suffix}`,
      qr_simple_url: `https://qr.test/${suffix}.png`,
    }),
  });

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
        customerName: 'Cliente Checkout',
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
            skuSnapshot: `SKU-CO-${suffix}-${variantId.slice(-4)}`,
            attributesSnapshot: {},
            tenantId,
          },
        },
      },
    });
    return order.id;
  };

  const postCheckout = (tenantId: string | null, body: unknown) =>
    checkoutPOST(
      new NextRequest('http://localhost/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        },
        body: JSON.stringify(body),
      })
    );

  beforeAll(async () => {
    process.env.APP_BASE_URL = 'http://localhost:3000';
    vi.stubGlobal('fetch', fetchMock);

    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Checkout Tenant A', slug: `checkout-a-${suffix}` },
        { id: tenantBId, name: 'Checkout Tenant B', slug: `checkout-b-${suffix}` },
      ],
    });

    await savePaymentConfig(tenantAId, { gateway: 'LIBELULA', appkey, isActive: true });

    const branchA = await prisma.branch.create({
      data: { name: 'Sucursal Checkout A', type: 'physical', tenantId: tenantAId },
    });
    const branchB = await prisma.branch.create({
      data: { name: 'Sucursal Checkout B', type: 'physical', tenantId: tenantBId },
    });
    branchAId = branchA.id;
    branchBId = branchB.id;

    const productA = await prisma.product.create({
      data: { name: 'Camisa Checkout', tenantId: tenantAId },
    });
    const productB = await prisma.product.create({
      data: { name: 'Pantalon Checkout', tenantId: tenantBId },
    });

    const variantA = await prisma.variant.create({
      data: { productId: productA.id, tenantId: tenantAId, sku: `CO-A-${suffix}`, price: 100, cost: 40 },
    });
    const variantB = await prisma.variant.create({
      data: { productId: productB.id, tenantId: tenantBId, sku: `CO-B-${suffix}`, price: 100, cost: 40 },
    });
    variantAId = variantA.id;
    variantBId = variantB.id;

    orderMainId = await createOrder(tenantAId, branchAId, variantAId);
    orderCancelledId = await createOrder(tenantAId, branchAId, variantAId, { status: 'cancelled' });
    orderPaidId = await createOrder(tenantAId, branchAId, variantAId, {
      gatewayStatus: 'paid',
      gatewayTransactionId: `paid-${suffix}`,
    });
    orderBId = await createOrder(tenantBId, branchBId, variantBId);
  });

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(successGatewayResponse());
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await prisma.order.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId] } },
    });
    await prisma.variant.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.product.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.branch.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenantPaymentConfig.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await prisma.$disconnect();
  });

  it('registers the debt with the exact Libélula payload and stores conciliation data', async () => {
    const response = await postCheckout(tenantAId, { orderId: orderMainId, customerEmail });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    const txId = body.data.gatewayTransactionId as string;
    expect(txId).toMatch(new RegExp(`^tx-${suffix}-\\d+$`));
    expect(body.data).toEqual({
      orderId: orderMainId,
      customerEmail,
      gatewayTransactionId: txId,
      qrUrl: `https://qr.test/${suffix}.png`,
      paymentUrl: `https://pasarela.test/${suffix}`,
      gatewayStatus: 'initiated',
    });
    expect(JSON.stringify(body)).not.toContain(appkey);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.libelula.bo/rest/deuda/registrar');
    expect(init.method).toBe('POST');

    const payload = JSON.parse(init.body);
    expect(payload).toEqual({
      appkey,
      email_cliente: customerEmail,
      identificador_deuda: orderMainId,
      callback_url: 'http://localhost:3000/api/webhooks/payments/libelula',
      nombre_cliente: 'Cliente Checkout',
      moneda: 'BOB',
      lineas_detalle_deuda: [
        {
          concepto: `Camisa Checkout (SKU-CO-${suffix}-${variantAId.slice(-4)})`,
          cantidad: 2,
          costo_unitario: 100,
        },
      ],
    });

    const order = await prisma.order.findUnique({ where: { id: orderMainId } });
    expect(order).toMatchObject({
      customerEmail,
      gatewayTransactionId: txId,
      gatewayStatus: 'initiated',
      gatewayQrUrl: `https://qr.test/${suffix}.png`,
      gatewayPaymentUrl: `https://pasarela.test/${suffix}`,
    });
  });

  it('returns the same data on retry without registering a second debt', async () => {
    const retryOrderId = await createOrder(tenantAId, branchAId, variantAId);

    const first = await postCheckout(tenantAId, { orderId: retryOrderId, customerEmail });
    const firstBody = await first.json();
    expect(first.status).toBe(200);

    const second = await postCheckout(tenantAId, { orderId: retryOrderId, customerEmail });
    const secondBody = await second.json();

    expect(second.status).toBe(200);
    expect(secondBody.data).toEqual(firstBody.data);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an order that belongs to another tenant without touching the gateway', async () => {
    const response = await postCheckout(tenantBId, { orderId: orderMainId, customerEmail });
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error.code).toBe('ORDER_NOT_FOUND');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects checkout without an active payment config', async () => {
    const response = await postCheckout(tenantBId, { orderId: orderBId, customerEmail });
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('PAYMENT_NOT_CONFIGURED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates the tenant header and the email', async () => {
    const noTenant = await postCheckout(null, { orderId: orderMainId, customerEmail });
    expect(noTenant.status).toBe(401);
    expect((await noTenant.json()).error.code).toBe('TENANT_REQUIRED');

    const badEmail = await postCheckout(tenantAId, { orderId: orderMainId, customerEmail: 'no-es-email' });
    expect(badEmail.status).toBe(400);
    expect((await badEmail.json()).error.code).toBe('VALIDATION_ERROR');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects orders that are not payable or already paid', async () => {
    const cancelled = await postCheckout(tenantAId, { orderId: orderCancelledId, customerEmail });
    expect(cancelled.status).toBe(400);
    expect((await cancelled.json()).error.code).toBe('ORDER_NOT_PAYABLE');

    const paid = await postCheckout(tenantAId, { orderId: orderPaidId, customerEmail });
    expect(paid.status).toBe(400);
    expect((await paid.json()).error.code).toBe('ORDER_ALREADY_PAID');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps gateway rejection to a 502 without persisting conciliation data', async () => {
    const failingOrderId = await createOrder(tenantAId, branchAId, variantAId);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ error: true, mensaje: 'appkey inválido' }),
    });

    const response = await postCheckout(tenantAId, { orderId: failingOrderId, customerEmail });
    expect(response.status).toBe(502);

    const body = await response.json();
    expect(body.error.code).toBe('GATEWAY_ERROR');
    expect(JSON.stringify(body)).not.toContain(appkey);

    const order = await prisma.order.findUnique({ where: { id: failingOrderId } });
    expect(order).toMatchObject({
      gatewayTransactionId: null,
      gatewayStatus: null,
      customerEmail: null,
    });
  });

  it('maps an unreachable gateway to 502', async () => {
    const unreachableOrderId = await createOrder(tenantAId, branchAId, variantAId);
    fetchMock.mockRejectedValue(new Error('network down'));

    const response = await postCheckout(tenantAId, { orderId: unreachableOrderId, customerEmail });
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe('GATEWAY_UNREACHABLE');

    const order = await prisma.order.findUnique({ where: { id: unreachableOrderId } });
    expect(order).toMatchObject({ gatewayStatus: null, customerEmail: null });
  });
});
