import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { adjustStockSchema } from '@/validators/stock.schema';
import { adjustStock } from '@/modules/stock/stock.service';
import { handleError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'stock');
  if (perm) return perm;

  const body = await req.json();
  const parsed = adjustStockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  if (auth.role === 'BRANCH_MANAGER' && parsed.data.branchId !== auth.branchId) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Branch managers can only adjust stock for their own branch' } },
      { status: 403 }
    );
  }

  try {
    const stock = await adjustStock(
      parsed.data.variantId,
      parsed.data.branchId,
      parsed.data.quantity,
      auth.tenantId,
      auth.userId
    );
    return NextResponse.json({ success: true, data: stock });
  } catch (error) {
    return handleError(error);
  }
}
