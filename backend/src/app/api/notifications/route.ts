import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { requireTenantId } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { getNotifications } from '@/modules/notifications/notifications.service';
import { notificationQuerySchema } from '@/validators/notification.schema';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'notifications');
  if (perm) return perm;

  try {
    const { searchParams } = new URL(req.url);
    const parsed = notificationQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const result = await getNotifications(
      requireTenantId(auth.tenantId, 'notifications'),
      auth.userId,
      parsed.data
    );
    return NextResponse.json({ success: true, data: result.items, meta: result.meta });
  } catch (error) {
    return handleError(error);
  }
}
