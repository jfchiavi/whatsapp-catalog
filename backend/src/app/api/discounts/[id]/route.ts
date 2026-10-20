import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { auditMiddleware } from '@/middlewares/audit.middleware';
import { requireTenantId } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import {
  deleteDiscount,
  getDiscountById,
  updateDiscount,
} from '@/modules/discounts/discounts.service';
import { updateDiscountSchema } from '@/validators/discount.schema';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'discounts');
  if (perm) return perm;

  try {
    const { id } = await params;
    const discount = await getDiscountById(id, requireTenantId(auth.tenantId, 'discounts'));
    return NextResponse.json({ success: true, data: discount });
  } catch (error) {
    return handleError(error);
  }
}

export const PUT = auditMiddleware('Discount')(async (req: NextRequest, { params }: RouteContext) => {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'discounts');
  if (perm) return perm;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const discount = await updateDiscount(id, requireTenantId(auth.tenantId, 'discounts'), parsed.data);
    return NextResponse.json({ success: true, data: discount });
  } catch (error) {
    return handleError(error);
  }
});

export const DELETE = auditMiddleware('Discount')(async (req: NextRequest, { params }: RouteContext) => {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'discounts');
  if (perm) return perm;

  try {
    const { id } = await params;
    const result = await deleteDiscount(id, requireTenantId(auth.tenantId, 'discounts'));
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
});
