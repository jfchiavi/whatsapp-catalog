import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { updateProductSchema } from '@/validators/product.schema';
import { getProductById, updateProduct, deleteProduct } from '@/modules/products/product.service';
import { AppError, handleError } from '@/lib/errors';


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'products');
  if (perm) return perm;

  try {
    const { id } = await params;
    const product = await getProductById(id, auth.tenantId);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) 
    return auth;
  const perm2 = permissionMiddleware(auth.role, 'products');
  if (perm2) return perm2;

  try {
      const body = await req.json();
      const parsed = updateProductSchema.safeParse(body);
      const { id } = await params;

      if (!parsed.success) {
        const nerror = new AppError(parsed.error.message, 400);
        return handleError(nerror);
      }

      const product = await updateProduct(id, auth.tenantId, {
        ...parsed.data,
        baseAttributes: parsed.data.baseAttributes as Prisma.InputJsonValue | undefined,
      });
      return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);

  if (auth instanceof NextResponse) 
    return auth;

  const perm3 = permissionMiddleware(auth.role, 'products');
  if (perm3) return perm3;

  try {    
    const { id } = await params;

    await deleteProduct(id, auth.tenantId);

    return NextResponse.json(
      { success: true, data: { message: 'Product deleted successfully' } }, 
      { status: 200 });

  } catch (error) {
      return handleError(error);
  }
}
