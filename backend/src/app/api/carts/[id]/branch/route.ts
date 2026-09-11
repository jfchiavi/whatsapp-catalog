import { NextRequest, NextResponse } from 'next/server';
import { setCartBranchSchema } from '@/validators/cart.schema';
import { setCartBranch } from '@/modules/cart/cart.service';
import { handleError } from '@/lib/errors';

export async function PATCH(
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

    const parsed = setCartBranchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const cart = await setCartBranch(
      tenantId,
      id,
      parsed.data.branchId
    );

    return NextResponse.json({ success: true, data: cart });
  } catch (error) {
    return handleError(error);
  }
}
