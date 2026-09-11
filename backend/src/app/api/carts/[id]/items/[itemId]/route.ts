import { NextRequest, NextResponse } from 'next/server';
import { updateCartItemSchema } from '@/validators/cart.schema';
import { updateCartItem, removeCartItem } from '@/modules/cart/cart.service';
import { handleError } from '@/lib/errors';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const body = await req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'tenantId required' } },
        { status: 400 }
      );
    }

    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const item = await updateCartItem(
      tenantId,
      id,
      itemId,
      parsed.data.quantity
    );

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'tenantId required' } },
        { status: 400 }
      );
    }

    await removeCartItem(tenantId, id, itemId);
    return NextResponse.json({ success: true, data: { message: 'Item removed' } });
  } catch (error) {
    return handleError(error);
  }
}
