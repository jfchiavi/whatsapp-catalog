import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { branchId: string } }) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'stock');

  try {
    const { branchId } = params;

    // Validate that branch exists and user has access
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        tenant: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { message: 'Branch not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this branch
    if (auth.role !== 'SUPER_ADMIN' && auth.branchId !== branchId) {
      return NextResponse.json(
        { message: 'Unauthorized access to branch' },
        { status: 403 }
      );
    }

    // Get stock for this branch with variant and product details
    const stockItems = await prisma.stock.findMany({
      where: {
        branchId,
        tenantId: auth.tenantId,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        variant: {
          product: {
            name: 'asc',
          },
        },
      },
    });

    // Format response
    const formattedStock = stockItems.map(item => ({
      id: item.id,
      variantId: item.variantId,
      variant: {
        id: item.variant.id,
        sku: item.variant.sku,
        price: item.variant.price,
        cost: item.variant.cost,
        attributes: item.variant.attributes,
      },
      product: {
        id: item.variant.product.id,
        name: item.variant.product.name,
        imageUrl: item.variant.product.imageUrl,
        batch: item.variant.product.batch,
        expirationDate: item.variant.product.expirationDate,
        baseAttributes: item.variant.product.baseAttributes,
        active: item.variant.product.active,
      },
      quantity: item.quantity,
    }));

    return NextResponse.json(formattedStock);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}