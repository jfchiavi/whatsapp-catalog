import { afterAll, describe, it, expect } from 'vitest';
import { POST as loginPOST } from '../src/app/api/auth/login/route';
import { POST as refreshPOST } from '../src/app/api/auth/refresh/route';
import { POST as registerTenantPOST } from '../src/app/api/auth/tenants/route';
import { prisma } from '../src/lib/prisma';

const validCredentials = { email: 'admin@demo.com', password: '123456' };

describe('Auth API routes', () => {
  let refreshToken: string;

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: '3446d34c-deb5-58ef-8822-2b94fb6f5842',
      },
    });
    await prisma.$disconnect();
  });

  it('logs in an existing user and returns access + refresh tokens', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCredentials),
    });

    const response = await loginPOST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email: validCredentials.email,
          id: expect.any(String),
          role: expect.any(String),
        }),
      })
    );

    refreshToken = data.data.refreshToken;
  });

  it('refreshes a valid refresh token successfully', async () => {
    expect(refreshToken).toBeTruthy();

    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const response = await refreshPOST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.accessToken).toEqual(expect.any(String));
  });

  it('rejects login with invalid password', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: validCredentials.email, password: 'wrongpassword' }),
    });

    const response = await loginPOST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('Tenant registration', () => {
  const uniqueSlug = `test-tenant-${Date.now()}`;
  const uniqueEmail = `tenant-test-${Date.now()}@example.com`;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: uniqueEmail } });
    await prisma.tenant.deleteMany({ where: { slug: uniqueSlug } });
    await prisma.$disconnect();
  });

  it('registers a tenant and admin user in a transaction', async () => {
    const request = new Request('http://localhost/api/auth/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantName: 'Test Tenant',
        slug: uniqueSlug,
        adminName: 'Test Admin',
        adminEmail: uniqueEmail,
        adminPassword: 'testpassword123',
      }),
    });

    const response = await registerTenantPOST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.tenant).toEqual(expect.objectContaining({ name: 'Test Tenant' }));
    expect(data.data.admin).toEqual(
      expect.objectContaining({
        name: 'Test Admin',
        email: uniqueEmail,
        role: 'SUPER_ADMIN',
      })
    );
    expect(data.data.admin.tenantId).toBe(data.data.tenant.id);
  });

  it('rejects registration with duplicate tenant name', async () => {
    const request = new Request('http://localhost/api/auth/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantName: 'Test Tenant',
        slug: uniqueSlug,
        adminName: 'Another Admin',
        adminEmail: `another-${uniqueEmail}`,
        adminPassword: 'testpassword123',
      }),
    });

    const response = await registerTenantPOST(request);
    expect(response.status).toBe(409);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('TENANT_EXISTS');
  });
});

describe('Tenant isolation - RBAC', () => {
  it('permissionMiddleware returns 403 for SELLER accessing products', async () => {
    const { permissionMiddleware } = await import('../src/middlewares/permission.middleware');
    const result = permissionMiddleware('SELLER', 'products');
    expect(result).toBeDefined();
    expect(result?.status).toBe(403);
  });

  it('permissionMiddleware returns nothing for SUPER_ADMIN accessing products', async () => {
    const { permissionMiddleware } = await import('../src/middlewares/permission.middleware');
    const result = permissionMiddleware('SUPER_ADMIN', 'products');
    expect(result).toBeFalsy();
  });

  it('permissionMiddleware returns nothing for BRANCH_MANAGER accessing stock', async () => {
    const { permissionMiddleware } = await import('../src/middlewares/permission.middleware');
    const result = permissionMiddleware('BRANCH_MANAGER', 'stock');
    expect(result).toBeFalsy();
  });

  it('SELLER cannot access stock permission', async () => {
    const { permissionMiddleware } = await import('../src/middlewares/permission.middleware');
    const result = permissionMiddleware('SELLER', 'stock');
    expect(result).toBeDefined();
    expect(result?.status).toBe(403);
  });

  it('BRANCH_MANAGER cannot access users permission', async () => {
    const { permissionMiddleware } = await import('../src/middlewares/permission.middleware');
    const result = permissionMiddleware('BRANCH_MANAGER', 'users');
    expect(result).toBeDefined();
    expect(result?.status).toBe(403);
  });
});
