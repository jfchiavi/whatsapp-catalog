import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getPlatformStats } from '@/modules/platform/platform.service';
import { handleError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } }, { status: 403 });
  }

  try {
    const stats = await getPlatformStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleError(error);
  }
}
