import { NextRequest, NextResponse } from 'next/server';
import { handleError } from '@/lib/errors';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'sales');
  if (perm) return perm;

  const { id } = await params;
  try {
      const sale = await prisma.sale.findUnique({
        where: { id: id },
        include: {
          items: {
            include: { product: true },
          },
          branch: true,
          user: true,
        },
      });

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    return handleError(error);
  }

}
