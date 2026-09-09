import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const slug = searchParams.get('slug');
    const headerTenantId = req.headers.get('X-Tenant-ID');

    let tenant = null;

    // Priority 1: domain
    if (domain) {
      tenant = await prisma.tenant.findUnique({
        where: { domain },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          description: true,
          whatsappNumber: true,
        },
      });
    }

    // Priority 2: slug
    if (!tenant && slug) {
      tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          description: true,
          whatsappNumber: true,
        },
      });
    }

    // Priority 3: X-Tenant-ID header (development fallback)
    if (!tenant && headerTenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: headerTenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          description: true,
          whatsappNumber: true,
        },
      });
    }

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    return handleError(error);
  }
}
