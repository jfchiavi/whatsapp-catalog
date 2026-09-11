import { NextRequest, NextResponse } from 'next/server';
import { confirmOrder } from '@/modules/orders/order.service';
import { handleError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { tenantId, userId } = body;

    if (!tenantId || !userId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'tenantId and userId required' } },
        { status: 400 }
      );
    }

    const sale = await confirmOrder(tenantId, id, userId);
    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    return handleError(error);
  }
}
