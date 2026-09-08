import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface TenantContext {
  tenantId: string;
  tenantActive: boolean;
}

export const resolveTenant = async (req: NextRequest): Promise<TenantContext | null> => {
  const headerTenantId = req.headers.get('X-Tenant-ID');

  if (!headerTenantId) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: headerTenantId },
    select: { id: true },
  });

  if (!tenant) {
    return null;
  }

  return {
    tenantId: tenant.id,
    tenantActive: true,
  };
};

export const tenantMiddleware = async (
  req: NextRequest,
  authTenantId?: string | null
): Promise<NextResponse | null> => {
  if (authTenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: authTenantId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } },
        { status: 401 }
      );
    }

    return null;
  }

  const headerTenant = await resolveTenant(req);

  if (!headerTenant) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_REQUIRED', message: 'Tenant ID required' } },
      { status: 401 }
    );
  }

  if (!headerTenant.tenantActive) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_INACTIVE', message: 'Tenant is inactive' } },
      { status: 403 }
    );
  }

  return null;
};
