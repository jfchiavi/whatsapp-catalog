import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { adjustStockSchema } from '@/validators/stock.schema';
import { adjustStock } from '@/modules/stock/stock.service';

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'stock');

  const body = await req.json();
  const parsed = adjustStockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  try {
    const stock = await adjustStock(
      parsed.data.productId,
      parsed.data.branchId,
      parsed.data.quantity
    );
    return NextResponse.json(stock);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
