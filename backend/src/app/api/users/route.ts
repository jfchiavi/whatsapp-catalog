import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { createUserSchema } from '@/validators/user.schema';
import { createUser, getUsers } from '@/modules/users/user.service';
import { handleError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'users');
  if (perm) return perm;

  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId') || undefined;

    const users = await getUsers(auth.tenantId!, auth.role, branchId);
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'users');
  if (perm) return perm;

  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const user = await createUser({ ...parsed.data, tenantId: auth.tenantId! });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
