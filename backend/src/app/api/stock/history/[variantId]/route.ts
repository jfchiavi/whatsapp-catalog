import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ variantId: string }> }) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'stock');
  if (perm) return perm;

  try {
    const { variantId } = await params;

    // Validate that variant exists and user has access to its tenant
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
        tenant: true,
      },
    });

    if (!variant) {
      return NextResponse.json(
        { message: 'Variant not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this variant's tenant
    if (auth.role !== 'SUPER_ADMIN' && variant.tenantId !== auth.tenantId) {
      return NextResponse.json(
        { message: 'Unauthorized access to variant' },
        { status: 403 }
      );
    }

    // Get stock movements for this variant
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        variantId,
        tenantId: auth.tenantId,
      },
      include: {
        fromBranch: true,
        toBranch: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedHistory = stockMovements.map(movement => ({
      id: movement.id,
      variantId: movement.variantId,
      fromBranchId: movement.fromBranchId,
      toBranchId: movement.toBranchId,
      quantity: movement.quantity,
      type: movement.type,
      userId: movement.userId,
      user: movement.user ? {
        id: movement.user.id,
        name: movement.user.name,
        email: movement.user.email,
      } : null,
      fromBranch: movement.fromBranch ? {
        id: movement.fromBranch.id,
        name: movement.fromBranch.name,
      } : null,
      toBranch: movement.toBranch ? {
        id: movement.toBranch.id,
        name: movement.toBranch.name,
      } : null,
      createdAt: movement.createdAt,
    }));

    return NextResponse.json({ success: true, data: formattedHistory });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}