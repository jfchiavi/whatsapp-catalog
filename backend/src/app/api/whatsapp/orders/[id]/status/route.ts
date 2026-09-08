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

  const perm = permissionMiddleware(auth.role, 'whatsapp_orders');
  if (perm) return perm;

  const body = await req.json();
  const parsed = updateWhatsappStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const order = await updateWhatsappStatus(params.id, auth.tenantId, parsed.data.status);
  return NextResponse.json({ success: true, data: order });
}
