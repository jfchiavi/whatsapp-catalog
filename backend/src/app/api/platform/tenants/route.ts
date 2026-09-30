import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getAllTenants, createTenant } from '@/modules/platform/platform.service';
import { handleError } from '@/lib/errors';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  domain: z.string().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } }, { status: 403 });
  }

  try {
    const tenants = await getAllTenants();
    return NextResponse.json({ success: true, data: tenants });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createTenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const tenant = await createTenant(parsed.data);
    return NextResponse.json({ success: true, data: tenant }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
