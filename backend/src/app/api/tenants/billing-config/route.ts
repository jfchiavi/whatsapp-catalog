import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { handleError } from '@/lib/errors';
import { billingConfigInputSchema } from '@/validators/payment-config.schema';
import { getBillingConfigs, saveBillingConfig } from '@/modules/payments/payment-config.service';

const getAuthorizedTenantId = (req: NextRequest) => {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const permissionError = permissionMiddleware(auth.role, 'settings');
  if (permissionError) return permissionError;
  if (!auth.tenantId) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_REQUIRED', message: 'An authenticated tenant is required' } },
      { status: 403 }
    );
  }

  return auth.tenantId;
};

export async function GET(req: NextRequest) {
  const tenantId = getAuthorizedTenantId(req);
  if (tenantId instanceof NextResponse) return tenantId;

  try {
    const configs = await getBillingConfigs(tenantId);
    return NextResponse.json({ success: true, data: configs });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  const tenantId = getAuthorizedTenantId(req);
  if (tenantId instanceof NextResponse) return tenantId;

  try {
    const parsed = billingConfigInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const config = await saveBillingConfig(tenantId, parsed.data);
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    return handleError(error);
  }
}
