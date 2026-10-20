import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { requireTenantId } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { getCustomerOrders } from '@/modules/customers/customers.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'customers');
  if (perm) return perm;

  try {
    const { id } = await params;
    const orders = await getCustomerOrders(id, requireTenantId(auth.tenantId, 'customers'));
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    return handleError(error);
  }
}
