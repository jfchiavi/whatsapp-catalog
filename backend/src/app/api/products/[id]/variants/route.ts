import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { createVariantSchema } from '@/validators/variant.schema';
import { createVariant } from '@/modules/variants/variant.service';
import { handleError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'products');
  if (perm) return perm;

  try {
    const { id: productId } = await params;
    const body = await req.json();
    const parsed = createVariantSchema.safeParse({ ...body, productId });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const variant = await createVariant({
      ...parsed.data,
      attributes: parsed.data.attributes as Prisma.InputJsonValue,
      tenantId: auth.tenantId,
    });

    return NextResponse.json({ success: true, data: variant }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
