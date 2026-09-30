import { requireTenantId } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { getUserById, updateUser, deleteUser } from '@/modules/users/user.service';
import { handleError } from '@/lib/errors';
import { z } from 'zod';
import { Role } from '@prisma/client';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  role: z.enum(Role).optional(),
  branchId: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'users');
  if (perm) return perm;

  try {
    const { id } = await params;
    const user = await getUserById(id, requireTenantId(auth.tenantId));
    return NextResponse.json({ success: true, data: user });
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

  const perm = permissionMiddleware(auth.role, 'users');
  if (perm) return perm;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const user = await updateUser(id, requireTenantId(auth.tenantId), parsed.data);
    return NextResponse.json({ success: true, data: user });
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

  const perm = permissionMiddleware(auth.role, 'users');
  if (perm) return perm;

  try {
    const { id } = await params;
    const user = await deleteUser(id, requireTenantId(auth.tenantId));
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleError(error);
  }
}
