import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { requireTenantId } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { getCustomers } from '@/modules/customers/customers.service';
import { customerQuerySchema } from '@/validators/customer.schema';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'customers');
  if (perm) return perm;

  try {
    const { searchParams } = new URL(req.url);
    const parsed = customerQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const result = await getCustomers(requireTenantId(auth.tenantId, 'customers'), parsed.data);
    return NextResponse.json({ success: true, data: result.items, meta: result.meta });
  } catch (error) {
    return handleError(error);
  }
}
