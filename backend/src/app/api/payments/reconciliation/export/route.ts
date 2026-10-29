import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { handleError } from '@/lib/errors';
import { reconciliationQuerySchema } from '@/validators/reconciliation.schema';
import { reconciliationToCSV } from '@/modules/payments/payment-reconciliation.service';

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
      page: 1,
      pageSize: 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const csv = await reconciliationToCSV(tenantId, parsed.data);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reconciliacion-pagos.csv"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
