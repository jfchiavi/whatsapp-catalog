import { NextRequest, NextResponse } from 'next/server';
import { addToCartSchema } from '@/validators/cart.schema';
import { addToCart } from '@/modules/cart/cart.service';
import { handleError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'tenantId required' } },
        { status: 400 }
      );
    }

    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const item = await addToCart(
      tenantId,
      id,
      parsed.data.variantId,
      parsed.data.quantity
    );

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
