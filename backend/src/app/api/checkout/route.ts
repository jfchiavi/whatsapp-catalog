import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/middlewares/tenant.middleware';
import { handleError } from '@/lib/errors';
import { checkoutSchema } from '@/validators/checkout.schema';
import { initiateCheckout } from '@/modules/payments/checkout.service';

export async function POST(req: NextRequest) {
  const tenant = await resolveTenant(req);

  if (!tenant) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_REQUIRED', message: 'Tenant ID required' } },
      { status: 401 }
    );
  }

  try {
    const parsed = checkoutSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const result = await initiateCheckout(
      tenant.tenantId,
      parsed.data.orderId,
      parsed.data.customerEmail
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}
