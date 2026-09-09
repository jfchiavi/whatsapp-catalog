import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { updateTenantConfigSchema } from '@/validators/tenant.schema';
import { handleError } from '@/lib/errors';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'tenants');
  if (perm) return perm;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateTenantConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.issues } },
        { status: 400 }
      );
    }

    // Verify tenant exists
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changing
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const slugTaken = await prisma.tenant.findUnique({ where: { slug: parsed.data.slug } });
      if (slugTaken) {
        return NextResponse.json(
          { success: false, error: { code: 'SLUG_TAKEN', message: 'Slug already in use' } },
          { status: 409 }
        );
      }
    }

    // Check domain uniqueness if changing
    if (parsed.data.domain !== undefined && parsed.data.domain !== existing.domain) {
      if (parsed.data.domain) {
        const domainTaken = await prisma.tenant.findUnique({ where: { domain: parsed.data.domain } });
        if (domainTaken) {
          return NextResponse.json(
            { success: false, error: { code: 'DOMAIN_TAKEN', message: 'Domain already in use' } },
            { status: 409 }
          );
        }
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logoUrl: true,
        primaryColor: true,
        description: true,
        whatsappNumber: true,
        active: true,
      },
    });

    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    return handleError(error);
  }
}
