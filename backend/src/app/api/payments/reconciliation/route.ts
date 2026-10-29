import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { handleError } from '@/lib/errors';
import { reconciliationQuerySchema } from '@/validators/reconciliation.schema';
import { getReconciliation } from '@/modules/payments/payment-reconciliation.service';

const getAuthorizedTenantId = (req: NextRequest) => {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const permissionError = permissionMiddleware(auth.role, 'reports');
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
    const parsed = reconciliationQuerySchema.safeParse({
      from: req.nextUrl.searchParams.get('from') ?? undefined,
      to: req.nextUrl.searchParams.get('to') ?? undefined,
      page: req.nextUrl.searchParams.get('page') ?? undefined,
      pageSize: req.nextUrl.searchParams.get('pageSize') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const result = await getReconciliation(tenantId, parsed.data);
    return NextResponse.json({ success: true, data: result.records, meta: result.meta });
  } catch (error) {
    return handleError(error);
  }
}
