import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { updateWhatsappStatusSchema } from '@/validators/whatsapp.schema';
import { updateWhatsappStatus } from '@/modules/whatsapp/whatsapp.service';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  permissionMiddleware(auth.role, 'whatsapp_orders');

  const body = await req.json();
  const parsed = updateWhatsappStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const order = await updateWhatsappStatus(params.id, parsed.data.status);
  return NextResponse.json(order);
}
