import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/modules/orders/order.service';
import { handleError } from '@/lib/errors';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['pending', 'contacted', 'confirmed', 'completed', 'cancelled']),
});

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

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const order = await updateOrderStatus(tenantId, id, parsed.data.status);
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return handleError(error);
  }
}
