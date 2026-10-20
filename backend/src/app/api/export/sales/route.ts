import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { requireTenantId } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { exportSales } from '@/modules/import-export/import-export.service';
import { exportSalesQuerySchema } from '@/validators/import.schema';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'import_export');
  if (perm) return perm;

  try {
    const { searchParams } = new URL(req.url);
    const parsed = exportSalesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const csv = await exportSales(
      requireTenantId(auth.tenantId, 'export sales'),
      parsed.data.from,
      parsed.data.to
    );
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sales.csv"',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
