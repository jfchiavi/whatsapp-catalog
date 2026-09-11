import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getPendingTransfers } from '@/modules/stock/stock.service';
import { handleError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'stock');
  if (perm) return perm;

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || undefined;

    const transfers = await getPendingTransfers(auth.tenantId, branchId);
    return NextResponse.json({ success: true, data: transfers });
  } catch (error) {
    return handleError(error);
  }
}
