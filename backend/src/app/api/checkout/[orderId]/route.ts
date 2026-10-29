import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { handleError } from '@/lib/errors';
import { getCheckoutStatus } from '@/modules/payments/checkout.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const tenant = await resolveTenant(req);

  if (!tenant) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_REQUIRED', message: 'Tenant ID required' } },
      { status: 401 }
    );
  }

  try {
    const { orderId } = await params;
    const status = await getCheckoutStatus(tenant.tenantId, orderId);
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    return handleError(error);
  }
}
