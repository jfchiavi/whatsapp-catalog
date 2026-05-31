import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { convertWhatsappToSale } from '@/modules/whatsapp/whatsapp.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'whatsapp_orders');

  const body = await req.json();

  try {
    const sale = await convertWhatsappToSale(
      params.id,
      auth.userId,
      auth.branchId!,
      body.items
    );
    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
