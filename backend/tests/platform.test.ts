import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deactivateTenant,
  getPlatformStats,
} from '../src/modules/platform/platform.service';
import { AppError } from '../src/lib/errors';

describe('Platform service', () => {
  let testTenantId: string;
  const testSlug = `test-platform-${Date.now()}`;

  afterAll(async () => {
    // Cleanup
    if (testTenantId) {
      await prisma.user.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.tenant.delete({ where: { id: testTenantId } }).catch(() => {});
    }
    await prisma.tenant.deleteMany({ where: { slug: { startsWith: 'test-platform-' } } });
    await prisma.$disconnect();
  });

  it('creates a tenant', async () => {
    const tenant = await createTenant({
      name: 'Test Platform Tenant',
      slug: testSlug,
      whatsappNumber: '5491199999999',
    });

    expect(tenant).toBeDefined();
    expect(tenant.name).toBe('Test Platform Tenant');
    expect(tenant.slug).toBe(testSlug);
    testTenantId = tenant.id;
  });

  it('rejects duplicate slug', async () => {
    await expect(
      createTenant({ name: 'Another', slug: testSlug })
    ).rejects.toThrow(AppError);
  });

  it('lists all tenants', async () => {
    const tenants = await getAllTenants();
    expect(Array.isArray(tenants)).toBe(true);
    expect(tenants.some((t) => t.id === testTenantId)).toBe(true);
  });

  it('gets tenant by id', async () => {
    const tenant = await getTenantById(testTenantId);
    expect(tenant.id).toBe(testTenantId);
    expect(tenant._count).toBeDefined();
  });

  it('throws for non-existent tenant', async () => {
    await expect(getTenantById('non-existent')).rejects.toThrow(AppError);
  });

  it('updates a tenant', async () => {
    const updated = await updateTenant(testTenantId, {
      name: 'Updated Platform Tenant',
      whatsappNumber: '5491188888888',
    });

    expect(updated.name).toBe('Updated Platform Tenant');
    expect(updated.whatsappNumber).toBe('5491188888888');
  });

  it('rejects duplicate slug on update', async () => {
    const other = await createTenant({
      name: 'Other Tenant',
      slug: 'other-tenant-' + Date.now(),
    });

    await expect(
      updateTenant(other.id, { slug: testSlug })
    ).rejects.toThrow(AppError);

    await prisma.tenant.delete({ where: { id: other.id } });
  });

  it('returns platform stats', async () => {
    const stats = await getPlatformStats();
    expect(stats.tenantCount).toBeGreaterThan(0);
    expect(stats.userCount).toBeGreaterThan(0);
    expect(Array.isArray(stats.recentTenants)).toBe(true);
  });

  it('deletes a tenant', async () => {
  await deactivateTenant(testTenantId);
  await expect(getTenantById(testTenantId)).rejects.toThrow(AppError);
  testTenantId = '';
});
});
