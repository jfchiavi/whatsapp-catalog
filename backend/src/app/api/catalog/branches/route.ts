import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { getCatalogBranches } from '@/modules/catalog/catalog.service';
import { handleError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  const tenant = await resolveTenant(req);

  if (!tenant) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_REQUIRED', message: 'Tenant ID required' } },
      { status: 401 }
    );
  }

  try {
    const branches = await getCatalogBranches(tenant.tenantId);
    return NextResponse.json({ success: true, data: branches });
  } catch (error) {
    return handleError(error);
  }
}
