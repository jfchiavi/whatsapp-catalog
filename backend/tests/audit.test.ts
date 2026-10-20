import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { generateAccessToken } from '../src/lib/auth';
import { getAuditLogs, logAction, redactSensitive } from '../src/modules/audit/audit.service';
import { POST as postDiscount } from '../src/app/api/discounts/route';

describe('Audit service and middleware', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-audit-a-${suffix}`;
  const tenantBId = `test-audit-b-${suffix}`;
  const userId = `test-audit-user-${suffix}`;

  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Audit Tenant A', slug: `audit-a-${suffix}` },
        { id: tenantBId, name: 'Audit Tenant B', slug: `audit-b-${suffix}` },
      ],
    });
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Audit Admin',
        email: `audit-${suffix}@test.com`,
        password: 'secret-hash',
        role: 'ADMIN',
        tenantId: tenantAId,
      },
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.discount.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.user.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await prisma.$disconnect();
  });

  it('masks sensitive fields before storing changes', () => {
    const redacted = redactSensitive({
      name: 'Admin',
      password: 'super-secret',
      nested: { token: 'abc', value: 1 },
    }) as Record<string, unknown>;

    expect(redacted.password).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).token).toBe('[REDACTED]');
    expect((redacted.nested as Record<string, unknown>).value).toBe(1);
  });

  it('records actions and filters by entity and action', async () => {
    await logAction({
      tenantId: tenantAId,
      userId,
      action: 'CREATE',
      entity: 'Product',
      entityId: 'product-1',
      changes: { name: 'Remera' },
    });

    await logAction({
      tenantId: tenantAId,
      userId,
      action: 'DELETE',
      entity: 'Product',
      entityId: 'product-1',
    });

    const logs = await getAuditLogs(tenantAId, { entity: 'Product' });
    expect(logs.items).toHaveLength(2);
    expect(logs.meta.total).toBe(2);

    const deletes = await getAuditLogs(tenantAId, { entity: 'Product', action: 'DELETE' });
    expect(deletes.items).toHaveLength(1);
    expect(deletes.items[0].entityId).toBe('product-1');
  });

  it('paginates results and keeps tenant isolation', async () => {
    for (let i = 0; i < 3; i += 1) {
      await logAction({
        tenantId: tenantAId,
        userId,
        action: 'UPDATE',
        entity: 'Stock',
        entityId: `stock-${i}`,
      });
    }

    const firstPage = await getAuditLogs(tenantAId, { entity: 'Stock', page: 1, pageSize: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.meta.total).toBe(3);

    const secondPage = await getAuditLogs(tenantAId, { entity: 'Stock', page: 2, pageSize: 2 });
    expect(secondPage.items).toHaveLength(1);

    const tenantBLogs = await getAuditLogs(tenantBId, { entity: 'Stock' });
    expect(tenantBLogs.items).toHaveLength(0);
  });

  it('audits create operations of audited routes automatically', async () => {
    const token = generateAccessToken({ userId, role: 'ADMIN', tenantId: tenantAId });
    const headers = { authorization: `Bearer ${token}` };
    const body = JSON.stringify({
      name: 'Audited discount',
      type: 'PERCENTAGE',
      value: 10,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86_400_000).toISOString(),
    });

    const response = await postDiscount(
      new NextRequest('http://localhost/api/discounts', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body,
      }),
      { params: Promise.resolve({}) }
    );

    expect(response.status).toBe(201);

    const logs = await getAuditLogs(tenantAId, { entity: 'Discount', action: 'CREATE' });
    expect(logs.items).toHaveLength(1);
    expect(logs.items[0].userId).toBe(userId);
    expect(logs.items[0].entityId).toBeTruthy();
  });
});
