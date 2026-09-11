import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { cancelTransfer } from '@/modules/stock/stock.service';
import { handleError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ movementId: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'stock');
  if (perm) return perm;

  try {
    const { movementId } = await params;

    const movement = await prisma.stockMovement.findFirst({
      where: { id: movementId, tenantId: auth.tenantId, type: 'TRANSFER', status: 'PENDING' },
    });

    if (!movement) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transfer not found' } },
        { status: 404 }
      );
    }

    if (auth.role === 'BRANCH_MANAGER' && movement.fromBranchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Branch managers can only cancel transfers from their own branch' } },
        { status: 403 }
      );
    }

    const result = await cancelTransfer(movementId, auth.tenantId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}
