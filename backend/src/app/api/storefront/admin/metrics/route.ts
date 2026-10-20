import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { handleError } from '@/lib/errors';
import { storefrontMetricsRangeSchema } from '@/validators/storefront-metrics.schema';
import { getStorefrontMetrics } from '@/modules/storefront/storefront-metrics.service';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;
  const permissionError = permissionMiddleware(auth.role, 'storefront');
  if (permissionError) return permissionError;
  if (!auth.tenantId) {
    return NextResponse.json({ success: false, error: { code: 'TENANT_REQUIRED', message: 'An authenticated tenant is required' } }, { status: 403 });
  }

  try {
    const parsed = storefrontMetricsRangeSchema.safeParse({ days: new URL(req.url).searchParams.get('days') ?? undefined });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
    }
    const today = new Date();
    const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - parsed.data.days + 1);
    const metrics = await getStorefrontMetrics(auth.tenantId, from, to);
    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    return handleError(error);
  }
}