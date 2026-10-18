import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { handleError } from '@/lib/errors';
import { restoreTenantHomePublicationToDraft } from '@/modules/storefront/storefront.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ revision: string }> }
) {
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
    const { revision: revisionParam } = await params;
    const revision = Number(revisionParam);
    if (!Number.isSafeInteger(revision) || revision < 1) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Revision must be a positive integer' } },
        { status: 400 }
      );
    }

    const result = await restoreTenantHomePublicationToDraft(auth.tenantId, revision);
    return NextResponse.json({ success: true, data: { draftContent: result.draftContent } });
  } catch (error) {
    return handleError(error);
  }
}