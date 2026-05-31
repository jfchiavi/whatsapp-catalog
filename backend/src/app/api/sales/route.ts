import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { createSaleSchema } from '@/validators/sale.schema';
import { createSale, getSales } from '@/modules/sales/sale.service';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'sales');

  try {
    const branchId = auth.branchId || undefined;
    const sales = await getSales(branchId);
    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'sales');

  const body = await req.json();
  console.log('BACK: Received sale creation request:', body);
  const parsed = createSaleSchema.safeParse(body);
  console.log('BACK: Validation result:', parsed);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  // FIX BUG SUPER_ADMIN: If user is SUPER_ADMIN and branchId is null in auth,
  // the system must require branchId in the request body
  if (auth.role === 'SUPER_ADMIN' && !auth.branchId) {
    if (!parsed.data.branchId) {
      return NextResponse.json(
        { message: 'SUPER_ADMIN users must specify a branchId for sales' },
        { status: 400 }
      );
    }
  }

  try {
    // Determine branchId: if user is SUPER_ADMIN and provided branchId, use it;
    // otherwise use user's own branchId (should not be null for non-SUPER_ADMIN)
    const branchIdToUse = auth.role === 'SUPER_ADMIN' && parsed.data.branchId 
      ? parsed.data.branchId 
      : auth.branchId;
    
    if (!branchIdToUse) {
      return NextResponse.json(
        { message: 'Branch ID is required' },
        { status: 400 }
      );
    }

    const sale = await createSale(
      auth.userId,
      branchIdToUse,
      parsed.data.items
    );
    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}