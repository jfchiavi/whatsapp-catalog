import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { permissionMiddleware } from '@/middlewares/permission.middleware';
import { createUserSchema } from '@/validators/user.schema';
import { createUser, getUsers } from '@/modules/users/user.service';

export async function GET(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm = permissionMiddleware(auth.role, 'dashboard');
  if (perm) return perm;

  const users = await getUsers(auth.tenantId, auth.role, auth.branchId);
  return NextResponse.json({ success: true, data: users });
}

export async function POST(req: NextRequest) {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  const perm2 = permissionMiddleware(auth.role, 'dashboard');
  if (perm2) return perm2;

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const user = await createUser({ ...parsed.data, tenantId: auth.tenantId });
  return NextResponse.json({ success: true, data: user }, { status: 201 });
}
