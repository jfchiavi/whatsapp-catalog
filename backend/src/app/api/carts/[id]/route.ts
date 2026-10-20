import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errors';
import { getCartPricing } from '@/modules/discounts/discounts.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'tenantId required' } },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findFirst({
      where: {
        id,
        tenantId,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        branch: true,
      },
    });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Cart not found' } },
        { status: 404 }
      );
    }

    const pricing = await getCartPricing(tenantId, id);

    return NextResponse.json({ success: true, data: { ...cart, pricing } });
  } catch (error) {
    return handleError(error);
  }
}
