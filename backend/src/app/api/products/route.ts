import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { createProductSchema} from '@/validators/product.schema';
import { getProducts, createProduct } from '@/modules/products/product.service';
import { handleError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'products');
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'products');

  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }
  try {
      const product = await createProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleError(error);
  }

}
