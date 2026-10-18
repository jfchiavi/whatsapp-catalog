import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { handleError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { updateTenantHomeDraftSchema } from '@/validators/tenant.schema';
import { getOrCreateTenantHomePage, saveTenantHomeDraft } from '@/modules/storefront/storefront.service';

const getAuthorizedTenantId = (req: NextRequest) => {
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

  return auth.tenantId;
};

export async function GET(req: NextRequest) {
  const tenantId = getAuthorizedTenantId(req);
  if (tenantId instanceof NextResponse) return tenantId;

  try {
    const { tenant, page, draftContent } = await getOrCreateTenantHomePage(tenantId);
    const tenantConfig = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, description: true, whatsappNumber: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        tenant: tenantConfig,
        draftContent,
        publishedAt: page.publishedAt,
        revision: page.revision,
        hasPublishedContent: page.publishedContent !== null,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  const tenantId = getAuthorizedTenantId(req);
  if (tenantId instanceof NextResponse) return tenantId;

  try {
    const parsed = updateTenantHomeDraftSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const result = await saveTenantHomeDraft(tenantId, parsed.data.content);
    return NextResponse.json({ success: true, data: { draftContent: result.draftContent } });
  } catch (error) {
    return handleError(error);
  }
}