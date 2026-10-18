import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { handleError } from '@/lib/errors';
import { getTenantHomePublicationHistory } from '@/modules/storefront/storefront.service';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const permissionError = permissionMiddleware(auth.role, 'storefront');
  if (permissionError) return permissionError;
  if (!auth.tenantId) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_REQUIRED', message: 'An authenticated tenant is required' } },
      { status: 403 }
    );
  }

  try {
    const history = await getTenantHomePublicationHistory(auth.tenantId);
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return handleError(error);
  }
}