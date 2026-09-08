import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { convertWhatsappToSale } from '@/modules/whatsapp/whatsapp.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'whatsapp_orders');
  if (perm) return perm;

  const body = await req.json();

  try {
    const { id } = await params;
    const sale = await convertWhatsappToSale(
      id,
      auth.userId,
      auth.branchId!,
      auth.tenantId,
      body.items
    );
    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
