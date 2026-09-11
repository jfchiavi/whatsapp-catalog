import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { receiveTransfer } from '@/modules/stock/stock.service';
import { handleError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

const receiveSchema = z.object({
  receivedQuantity: z.number().int().min(0),
});

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
    const body = await req.json();
    const parsed = receiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const movement = await prisma.stockMovement.findFirst({
      where: { id: movementId, tenantId: auth.tenantId, type: 'TRANSFER', status: 'PENDING' },
    });

    if (!movement) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transfer not found' } },
        { status: 404 }
      );
    }

    if (auth.role === 'BRANCH_MANAGER' && movement.toBranchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Branch managers can only receive transfers into their own branch' } },
        { status: 403 }
      );
    }

    const result = await receiveTransfer(
      movementId,
      parsed.data.receivedQuantity,
      auth.tenantId,
      auth.userId
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}
