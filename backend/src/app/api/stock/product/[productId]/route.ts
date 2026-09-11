import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getStockByProduct } from '@/modules/stock/stock.service';
import { handleError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'stock');
  if (perm) return perm;

  try {
    const { productId } = await params;
    const stock = await getStockByProduct(productId, auth.tenantId);
    return NextResponse.json({ success: true, data: stock });
  } catch (error) {
    return handleError(error);
  }
}
