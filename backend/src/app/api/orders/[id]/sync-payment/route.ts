import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { handleError } from '@/lib/errors';
import { syncOrderPayment } from '@/modules/payments/payment-reconciliation.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const permissionError = permissionMiddleware(auth.role, 'settings');
  if (permissionError) return permissionError;
  if (!auth.tenantId) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_REQUIRED', message: 'An authenticated tenant is required' } },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const result = await syncOrderPayment(auth.tenantId, id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}
