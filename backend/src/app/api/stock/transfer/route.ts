import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { transferStockSchema } from '@/validators/stock.schema';
import { transferStock } from '@/modules/stock/stock.service';

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'stock');

  const body = await req.json();
  const parsed = transferStockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  try {
    await transferStock(
      parsed.data.productId,
      parsed.data.fromBranchId,
      parsed.data.toBranchId,
      parsed.data.quantity
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
