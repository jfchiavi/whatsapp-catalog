import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { updateProductSchema } from '@/validators/product.schema';
import { getProductById, updateProduct, deleteProduct } from '@/modules/products/product.service';
import { AppError, handleError } from '@/lib/errors';


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'products');

  try {
    const product = await getProductById(params.id);
    return NextResponse.json(product);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) 
    return auth;
  permissionMiddleware(auth.role, 'products');
  try {
      const body = await req.json();
      const parsed = updateProductSchema.safeParse(body);
      const parameter = await params;

      if (!parsed.success) {
        const nerror = new AppError(parsed.error.message, 400);
        return handleError(nerror);
      }

      const product = await updateProduct(parameter.id, parsed.data);
      return NextResponse.json(product);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authMiddleware(req);

  if (auth instanceof NextResponse) 
    return auth;

  permissionMiddleware(auth.role, 'products');

  try {    
    const parameter = await params;

    await deleteProduct(parameter.id);

    return NextResponse.json(
      { message: 'Product deleted successfully' }, 
      { status: 200 });

  } catch (error) {
      return handleError(error);
  }
}
