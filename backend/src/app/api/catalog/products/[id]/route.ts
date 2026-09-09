import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { getCatalogProductById } from '@/modules/catalog/catalog.service';
import { handleError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await resolveTenant(req);

  if (!tenant) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_REQUIRED', message: 'Tenant ID required' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const product = await getCatalogProductById(id, tenant.tenantId);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return handleError(error);
  }
}
