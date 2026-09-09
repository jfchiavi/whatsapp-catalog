import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { updateVariantSchema } from '@/validators/variant.schema';
import { updateVariant, deleteVariant } from '@/modules/variants/variant.service';
import { handleError } from '@/lib/errors';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'products');
  if (perm) return perm;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateVariantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const variant = await updateVariant(id, auth.tenantId, {
      ...parsed.data,
      attributes: parsed.data.attributes as Prisma.InputJsonValue | undefined,
    });

    return NextResponse.json({ success: true, data: variant });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'products');
  if (perm) return perm;

  try {
    const { id } = await params;
    await deleteVariant(id, auth.tenantId);
    return NextResponse.json({ success: true, data: { message: 'Variant deleted successfully' } });
  } catch (error) {
    return handleError(error);
  }
}
