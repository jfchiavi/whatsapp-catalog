import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  findOrCreateCustomer,
  getCustomerById,
  getCustomerOrders,
  getCustomers,
} from '../src/modules/customers/customers.service';
import { AppError } from '../src/lib/errors';

describe('Customers service', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-cust-a-${suffix}`;
  const tenantBId = `test-cust-b-${suffix}`;
  const branchId = `test-cust-branch-${suffix}`;

  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Cust Tenant A', slug: `cust-a-${suffix}` },
        { id: tenantBId, name: 'Cust Tenant B', slug: `cust-b-${suffix}` },
      ],
    });
    await prisma.branch.create({
      data: { id: branchId, name: 'Cust Branch', type: 'physical', tenantId: tenantAId },
    });
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.order.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.customer.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.variant.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.product.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.branch.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await prisma.$disconnect();
  });

  it('creates a customer and reuses it for the same phone in the tenant', async () => {
    const created = await findOrCreateCustomer(tenantAId, {
      name: 'Ana Perez',
      phone: '1155550001',
      email: 'ana@test.com',
    });

    expect(created.id).toBeDefined();

    const again = await findOrCreateCustomer(tenantAId, {
      name: 'Ana P.',
      phone: '1155550001',
    });

    expect(again.id).toBe(created.id);
    expect(again.name).toBe('Ana P.');

    const otherTenant = await findOrCreateCustomer(tenantBId, {
      name: 'Ana Otra',
      phone: '1155550001',
    });
    expect(otherTenant.id).not.toBe(created.id);
  });

  it('searches customers by phone and name', async () => {
    const byPhone = await getCustomers(tenantAId, { search: '1155550001' });
    expect(byPhone.items).toHaveLength(1);
    expect(byPhone.items[0].name).toBe('Ana P.');

    const byName = await getCustomers(tenantAId, { search: 'Ana' });
    expect(byName.items).toHaveLength(1);
    expect(byName.meta.total).toBe(1);

    const tenantB = await getCustomers(tenantBId, { search: 'Ana' });
    expect(tenantB.items).toHaveLength(1);
    expect(tenantB.items[0].id).not.toBe(byName.items[0].id);
  });

  it('returns customer orders and blocks cross-tenant access', async () => {
    const customer = (await getCustomers(tenantAId, { search: '1155550001' })).items[0];

    const order = await prisma.order.create({
      data: {
        tenantId: tenantAId,
        branchId,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        totalSnapshot: 150,
        whatsappMessage: 'hola',
        whatsappUrl: 'https://wa.me/123',
        items: {
          create: [
            {
              variantId: (
                await prisma.variant.create({
                  data: {
                    tenantId: tenantAId,
                    productId: (
                      await prisma.product.create({
                        data: { tenantId: tenantAId, name: 'Cust Product' },
                      })
                    ).id,
                    sku: `CUST-${suffix}`,
                    price: 150,
                    cost: 50,
                  },
                })
              ).id,
              quantity: 1,
              unitPriceSnapshot: 150,
              skuSnapshot: `CUST-${suffix}`,
              attributesSnapshot: {},
              tenantId: tenantAId,
            },
          ],
        },
      },
    });

    const orders = await getCustomerOrders(customer.id, tenantAId);
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe(order.id);

    await expect(getCustomerById(customer.id, tenantBId)).rejects.toThrow(AppError);
    await expect(getCustomerOrders(customer.id, tenantBId)).rejects.toThrow(AppError);
  });
});
