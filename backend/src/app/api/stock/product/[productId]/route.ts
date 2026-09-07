import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getStockByProduct } from '@/modules/stock/stock.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'stock');

  const { productId } = params;
  const stock = await getStockByProduct(productId);
  return NextResponse.json(stock);
}
