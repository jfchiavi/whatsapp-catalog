import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { transferStockSchema } from '@/validators/stock.schema';
import { transferStock } from '@/modules/stock/stock.service';
import { handleError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'stock');
  if (perm) return perm;

  const body = await req.json();
  const parsed = transferStockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  if (auth.role === 'BRANCH_MANAGER' && parsed.data.fromBranchId !== auth.branchId) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Branch managers can only transfer from their own branch' } },
      { status: 403 }
    );
  }

  try {
    const movement = await transferStock(
      parsed.data.variantId,
      parsed.data.fromBranchId,
      parsed.data.toBranchId,
      parsed.data.quantity,
      auth.tenantId,
      auth.userId
    );
    return NextResponse.json({ success: true, data: movement }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
