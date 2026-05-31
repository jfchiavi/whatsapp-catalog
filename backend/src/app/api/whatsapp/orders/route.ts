import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { createWhatsappOrderSchema } from '@/validators/whatsapp.schema';
import {
  createWhatsappOrder,
  getWhatsappOrders,
} from '@/modules/whatsapp/whatsapp.service';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'whatsapp_orders');

  const orders = await getWhatsappOrders();
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createWhatsappOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const order = await createWhatsappOrder(parsed.data);
  return NextResponse.json(order, { status: 201 });
}
