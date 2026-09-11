import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getStockHistory } from '@/modules/stock/stock.service';
import { handleError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'stock');
  if (perm) return perm;

  try {
    const { variantId } = await params;
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || undefined;

    const history = await getStockHistory(variantId, auth.tenantId, branchId);
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return handleError(error);
  }
}
