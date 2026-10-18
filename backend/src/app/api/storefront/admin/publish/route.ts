import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { handleError } from '@/lib/errors';
import { publishTenantHomeDraft } from '@/modules/storefront/storefront.service';

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const permissionError = permissionMiddleware(auth.role, 'storefront');
  if (permissionError) return permissionError;
  if (!auth.tenantId) {
    return NextResponse.json(
      { success: false, error: { code: 'TENANT_REQUIRED', message: 'An authenticated tenant is required' } },
      { status: 403 }
    );
  }

  try {
    const page = await publishTenantHomeDraft(auth.tenantId);
    return NextResponse.json({
      success: true,
      data: { publishedAt: page.publishedAt, publishedContent: page.publishedContent },
    });
  } catch (error) {
    return handleError(error);
  }
}