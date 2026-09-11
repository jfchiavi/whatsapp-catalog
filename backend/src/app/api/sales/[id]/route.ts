import { NextRequest, NextResponse } from 'next/server';
import { handleError } from '@/lib/errors';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'sales');
  if (perm) return perm;

  try {
    const { id } = await params;

    const sale = await prisma.sale.findFirst({
      where: { id, tenantId: auth.tenantId! },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        branch: true,
        user: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    return handleError(error);
  }
}
