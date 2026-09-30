import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { getTenantById, updateTenant, deactivateTenant } from '@/modules/platform/platform.service';
import { handleError } from '@/lib/errors';
import { z } from 'zod';

const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } }, { status: 403 });
  }

  try {
    const { id } = await params;
    const tenant = await getTenantById(id);
    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateTenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const tenant = await updateTenant(id, parsed.data);
    return NextResponse.json({ success: true, data: tenant });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Super admin access required' } }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deactivateTenant(id);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return handleError(error);
  }
}
