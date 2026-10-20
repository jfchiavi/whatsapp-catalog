import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  checkLowStock,
  createNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '../src/modules/notifications/notifications.service';
import { adjustStock } from '../src/modules/stock/stock.service';
import { AppError } from '../src/lib/errors';

describe('Notifications service', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-notif-a-${suffix}`;
  const tenantBId = `test-notif-b-${suffix}`;
  const userAId = `test-notif-user-a-${suffix}`;
  const productId = `test-notif-product-${suffix}`;
  const variantId = `test-notif-variant-${suffix}`;
  const branchId = `test-notif-branch-${suffix}`;

  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Notif Tenant A', slug: `notif-a-${suffix}` },
        { id: tenantBId, name: 'Notif Tenant B', slug: `notif-b-${suffix}` },
      ],
    });
    await prisma.user.create({
      data: {
        id: userAId,
        name: 'Notif User',
        email: `notif-${suffix}@test.com`,
        password: 'secret-hash',
        role: 'ADMIN',
        tenantId: tenantAId,
      },
    });
    await prisma.branch.create({
      data: { id: branchId, name: 'Notif Branch', type: 'physical', tenantId: tenantAId },
    });
    await prisma.product.create({
      data: { id: productId, name: 'Notif Product', tenantId: tenantAId },
    });
    await prisma.variant.create({
      data: {
        id: variantId,
        productId,
        tenantId: tenantAId,
        sku: `NOTIF-${suffix}`,
        price: 100,
        cost: 50,
      },
    });
    await prisma.stock.create({
      data: { variantId, branchId, quantity: 2, tenantId: tenantAId },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.stock.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.stockMovement.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.variant.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.product.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.branch.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.user.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await prisma.$disconnect();
  });

  it('delivers global notifications to every user of the tenant', async () => {
    await createNotification({
      tenantId: tenantAId,
      type: 'SYSTEM',
      title: 'Mantenimiento',
      message: 'El sistema se actualizará',
    });

    await createNotification({
      tenantId: tenantAId,
      userId: userAId,
      type: 'ORDER_CREATED',
      title: 'Nuevo pedido',
      message: 'Pedido #1',
    });

    const own = await getNotifications(tenantAId, userAId);
    expect(own.items).toHaveLength(2);
    expect(own.meta.unread).toBe(2);

    const otherUser = await getNotifications(tenantAId, 'other-user-id');
    expect(otherUser.items).toHaveLength(1);
    expect(otherUser.items[0].title).toBe('Mantenimiento');
  });

  it('marks notifications as read and bulk marks all', async () => {
    const { items } = await getNotifications(tenantAId, userAId, { unreadOnly: true });
    const target = items.find((item) => item.title === 'Nuevo pedido');
    expect(target).toBeDefined();

    const updated = await markAsRead(target!.id, tenantAId, userAId);
    expect(updated.read).toBe(true);

    await expect(markAsRead('missing-id', tenantAId, userAId)).rejects.toThrow(AppError);

    const result = await markAllAsRead(tenantAId, userAId);
    expect(result.updated).toBeGreaterThan(0);

    const remaining = await getNotifications(tenantAId, userAId, { unreadOnly: true });
    expect(remaining.items).toHaveLength(0);
  });

  it('creates low stock alerts after adjustments and avoids duplicates', async () => {
    await checkLowStock(tenantAId);
    const first = await getNotifications(tenantAId, userAId, { unreadOnly: true });
    const lowStock = first.items.filter((item) => item.type === 'LOW_STOCK');
    expect(lowStock).toHaveLength(1);
    expect(lowStock[0].message).toContain(`NOTIF-${suffix}`);

    await adjustStock(variantId, branchId, 0, tenantAId, userAId);
    const second = await checkLowStock(tenantAId);
    expect(second.created).toBe(0);
  });

  it('keeps low stock alerts isolated per tenant', async () => {
    const tenantB = await getNotifications(tenantBId, 'any-user');
    expect(tenantB.items).toHaveLength(0);
  });
});
