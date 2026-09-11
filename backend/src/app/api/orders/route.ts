import { NextRequest, NextResponse } from 'next/server';
import { submitCartSchema } from '@/validators/cart.schema';
import { submitCart } from '@/modules/cart/cart.service';
import { handleError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartId, tenantId } = body;

    if (!cartId || !tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'cartId and tenantId required' } },
        { status: 400 }
      );
    }

    const parsed = submitCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const order = await submitCart(
      tenantId,
      cartId,
      parsed.data.customerName,
      parsed.data.customerPhone,
      parsed.data.customerNotes
    );

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const branchId = searchParams.get('branchId') || undefined;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'tenantId required' } },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
        branch: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    return handleError(error);
  }
}
