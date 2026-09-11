import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getStockByBranch } from '@/modules/stock/stock.service';
import { handleError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ branchId: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'stock');
  if (perm) return perm;

  try {
    const { branchId } = await params;

    if (auth.role !== 'SUPER_ADMIN' && auth.branchId !== branchId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized access to branch' } },
        { status: 403 }
      );
    }

    const stock = await getStockByBranch(branchId, auth.tenantId);
    return NextResponse.json({ success: true, data: stock });
  } catch (error) {
    return handleError(error);
  }
}
