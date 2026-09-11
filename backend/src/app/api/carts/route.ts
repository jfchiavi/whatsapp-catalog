import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCart } from '@/modules/cart/cart.service';
import { handleError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, sessionId } = body;

    if (!tenantId || !sessionId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'tenantId and sessionId required' } },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId, active: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      );
    }

    const cart = await getOrCreateCart(tenantId, sessionId);
    return NextResponse.json({ success: true, data: cart });
  } catch (error) {
    return handleError(error);
  }
}
