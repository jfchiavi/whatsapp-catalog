import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { auditMiddleware } from '@/middlewares/audit.middleware';
import { requireTenantId } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { createDiscount, getDiscounts } from '@/modules/discounts/discounts.service';
import { createDiscountSchema, discountQuerySchema } from '@/validators/discount.schema';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'discounts');
  if (perm) return perm;

  try {
    const { searchParams } = new URL(req.url);
    const parsed = discountQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const discounts = await getDiscounts(requireTenantId(auth.tenantId, 'discounts'), parsed.data.active);
    return NextResponse.json({ success: true, data: discounts });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = auditMiddleware('Discount')(async (req: NextRequest) => {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'discounts');
  if (perm) return perm;

  try {
    const body = await req.json();
    const parsed = createDiscountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const discount = await createDiscount(requireTenantId(auth.tenantId, 'discounts'), parsed.data);
    return NextResponse.json({ success: true, data: discount }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});
