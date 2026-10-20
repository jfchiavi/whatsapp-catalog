import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { auditMiddleware } from '@/middlewares/audit.middleware';
import { requireTenantId } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { importProducts } from '@/modules/import-export/import-export.service';
import { importCsvSchema } from '@/validators/import.schema';

export const POST = auditMiddleware('Import', { action: 'CREATE' })(async (req: NextRequest) => {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'import_export');
  if (perm) return perm;

  try {
    const body = await req.json();
    const parsed = importCsvSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const summary = await importProducts(requireTenantId(auth.tenantId, 'import products'), parsed.data.csv);
    return NextResponse.json({ success: true, data: summary }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});
