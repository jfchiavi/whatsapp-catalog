import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { requireTenantId } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { markAsRead } from '@/modules/notifications/notifications.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'notifications');
  if (perm) return perm;

  try {
    const { id } = await params;
    const notification = await markAsRead(
      id,
      requireTenantId(auth.tenantId, 'notifications'),
      auth.userId
    );
    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    return handleError(error);
  }
}
